/**
 * file: WalletService.test.ts
 * description: Unit tests for WalletService — createWallet (6.1), importFromMnemonic (6.2), exportMnemonic (6.3)
 * dependencies: WalletService.ts, crypto/vault, contract-factory
 * created: 2026-03-31
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletService } from './WalletService';
import { InvalidMnemonicError, InvalidPasswordError, NoVaultError, WeakPasswordError } from './types';

// Mock argon2-browser so KDF falls back to PBKDF2 in tests
vi.mock('argon2-browser', () => {
  throw new Error('WASM not available in test environment');
});

// Mock @ton/crypto — mnemonicNew/mnemonicToPrivateKey are problematic in jsdom
// due to tweetnacl type checking. We use inline literals to avoid hoisting issues.
vi.mock('@ton/crypto', () => ({
  mnemonicNew: vi.fn().mockResolvedValue([
    'abandon', 'abandon', 'abandon', 'abandon',
    'abandon', 'abandon', 'abandon', 'abandon',
    'abandon', 'abandon', 'abandon', 'abandon',
    'abandon', 'abandon', 'abandon', 'abandon',
    'abandon', 'abandon', 'abandon', 'abandon',
    'abandon', 'abandon', 'abandon', 'art',
  ]),
  mnemonicToPrivateKey: vi.fn().mockResolvedValue({
    publicKey: Buffer.alloc(32, 0xab),
    secretKey: Buffer.alloc(64),
  }),
  mnemonicValidate: vi.fn().mockResolvedValue(true),
}));

import { mnemonicNew, mnemonicToPrivateKey, mnemonicValidate } from '@ton/crypto';

// Mock contract-factory detectVersions — returns default v4R2 by default
vi.mock('./contract-factory', async () => {
  const actual = await vi.importActual<typeof import('./contract-factory')>('./contract-factory');
  return {
    ...actual,
    detectVersions: vi.fn().mockResolvedValue({
      wallets: [
        {
          version: 'v4R2',
          addressRaw: '0:' + 'ab'.repeat(32),
          addressFriendly: 'EQ' + 'ab'.repeat(32),
          balance: 0n,
          isDeployed: false,
        },
      ],
      hadNetworkError: false,
    }),
  };
});

import { detectVersions } from './contract-factory';

const MNEMONIC = [
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'art',
];
const PASSWORD = 'Strong-Export-Password!99';
const MOCK_PUBLIC_KEY = Buffer.alloc(32, 0xab);

// ─── createWallet (task 6.1) ─────────────────────────────────────────────────

describe('WalletService.createWallet', () => {
  let service: WalletService;

  beforeEach(() => {
    service = new WalletService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns 24-word mnemonic', async () => {
    const result = await service.createWallet(PASSWORD);

    expect(result.mnemonic).toHaveLength(24);
    for (const word of result.mnemonic) {
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    }
  });

  it('calls mnemonicNew to generate mnemonic', async () => {
    await service.createWallet(PASSWORD);

    expect(mnemonicNew).toHaveBeenCalledOnce();
  });

  it('calls mnemonicToPrivateKey with generated mnemonic', async () => {
    await service.createWallet(PASSWORD);

    expect(mnemonicToPrivateKey).toHaveBeenCalledWith(MNEMONIC);
  });

  it('returns address in raw format (0:...)', async () => {
    const result = await service.createWallet(PASSWORD);

    expect(result.address).toMatch(/^0:[0-9a-f]{64}$/);
  });

  it('returns version v4R2', async () => {
    const result = await service.createWallet(PASSWORD);

    expect(result.version).toBe('v4R2');
  });

  it('saves vault to localStorage', async () => {
    await service.createWallet(PASSWORD);

    const stored = localStorage.getItem('ton_wallet_vault');
    expect(stored).not.toBeNull();

    const vault = JSON.parse(stored!);
    expect(vault.version).toBe(1);
    expect(vault.cipher).toBe('AES-256-GCM');
    expect(vault.kdfParams).toBeDefined();
    expect(vault.iv).toBeDefined();
    expect(vault.ciphertext).toBeDefined();
  });

  it('vault can be decrypted with the same password (round-trip)', async () => {
    const result = await service.createWallet(PASSWORD);

    const { decrypt: vaultDecrypt, loadVault } = await import('@/crypto/vault');
    const vault = loadVault();
    expect(vault).not.toBeNull();

    const plaintext = await vaultDecrypt(vault!, PASSWORD);
    const decryptedMnemonic: string[] = JSON.parse(plaintext);

    expect(decryptedMnemonic).toEqual(result.mnemonic);
  });

  it('vault cannot be decrypted with wrong password', async () => {
    await service.createWallet(PASSWORD);

    const { decrypt: vaultDecrypt, loadVault } = await import('@/crypto/vault');
    const vault = loadVault();

    await expect(vaultDecrypt(vault!, 'wrong-password'))
      .rejects.toThrow();
  });

  it('produces address from v4R2 contract with the derived public key', async () => {
    const result = await service.createWallet(PASSWORD);

    const { createContract } = await import('./contract-factory');
    const contract = createContract(MOCK_PUBLIC_KEY, 'v4R2');

    expect(result.address).toBe(contract.address.toRawString());
  });
});

// ─── importFromMnemonic (task 6.2) ───────────────────────────────────────────

describe('WalletService.validateMnemonic', () => {
  let service: WalletService;

  beforeEach(() => {
    service = new WalletService();
    vi.clearAllMocks();
  });

  it('returns true for valid mnemonic', async () => {
    const result = await service.validateMnemonic(MNEMONIC);
    expect(result).toBe(true);
    expect(mnemonicValidate).toHaveBeenCalledWith(MNEMONIC);
  });

  it('returns false for invalid mnemonic', async () => {
    vi.mocked(mnemonicValidate).mockResolvedValueOnce(false);
    const result = await service.validateMnemonic(['invalid', 'words']);
    expect(result).toBe(false);
  });
});

describe('WalletService.importFromMnemonic', () => {
  let service: WalletService;

  beforeEach(() => {
    service = new WalletService();
    localStorage.clear();
    vi.clearAllMocks();
    // Default: valid mnemonic, single v4R2 detected
    vi.mocked(mnemonicValidate).mockResolvedValue(true);
  });

  it('throws InvalidMnemonicError for invalid mnemonic', async () => {
    vi.mocked(mnemonicValidate).mockResolvedValueOnce(false);

    await expect(service.importFromMnemonic(['bad'], PASSWORD))
      .rejects.toThrow(InvalidMnemonicError);
  });

  it('creates wallet with v4R2 when auto-detection returns single version', async () => {
    vi.mocked(detectVersions).mockResolvedValueOnce({
      wallets: [
        {
          version: 'v4R2',
          addressRaw: '0:' + 'ab'.repeat(32),
          addressFriendly: 'EQ' + 'ab'.repeat(32),
          balance: 0n,
          isDeployed: false,
        },
      ],
      hadNetworkError: false,
    });

    const result = await service.importFromMnemonic(MNEMONIC, PASSWORD);

    expect(result.needsVersionChoice).toBe(false);
    expect(result.version).toBe('v4R2');
    expect(result.address).toMatch(/^0:[0-9a-f]{64}$/);
  });

  it('creates wallet with v4R2 when auto-detection finds no deployed wallets', async () => {
    vi.mocked(detectVersions).mockResolvedValueOnce({
      wallets: [
        {
          version: 'v4R2',
          addressRaw: '0:' + 'ab'.repeat(32),
          addressFriendly: 'EQ' + 'ab'.repeat(32),
          balance: 0n,
          isDeployed: false,
        },
      ],
      hadNetworkError: false,
    });

    const result = await service.importFromMnemonic(MNEMONIC, PASSWORD);

    expect(result.needsVersionChoice).toBe(false);
    expect(result.version).toBe('v4R2');
  });

  it('returns needsVersionChoice=true when multiple versions found', async () => {
    vi.mocked(detectVersions).mockResolvedValueOnce({
      wallets: [
        {
          version: 'v3R2',
          addressRaw: '0:' + '11'.repeat(32),
          addressFriendly: 'EQ' + '11'.repeat(32),
          balance: 1_000_000_000n,
          isDeployed: true,
        },
        {
          version: 'v4R2',
          addressRaw: '0:' + '22'.repeat(32),
          addressFriendly: 'EQ' + '22'.repeat(32),
          balance: 2_000_000_000n,
          isDeployed: true,
        },
      ],
      hadNetworkError: false,
    });

    const result = await service.importFromMnemonic(MNEMONIC, PASSWORD);

    expect(result.needsVersionChoice).toBe(true);
    expect(result.address).toBeNull();
    expect(result.version).toBeNull();
    expect(result.detectedWallets).toHaveLength(2);
    expect(result.detectedWallets[0].version).toBe('v3R2');
    expect(result.detectedWallets[1].version).toBe('v4R2');
  });

  it('uses selectedVersion when provided (skips version choice)', async () => {
    vi.mocked(detectVersions).mockResolvedValueOnce({
      wallets: [
        {
          version: 'v3R2',
          addressRaw: '0:' + '11'.repeat(32),
          addressFriendly: 'EQ' + '11'.repeat(32),
          balance: 1n,
          isDeployed: true,
        },
        {
          version: 'v4R2',
          addressRaw: '0:' + '22'.repeat(32),
          addressFriendly: 'EQ' + '22'.repeat(32),
          balance: 2n,
          isDeployed: true,
        },
      ],
      hadNetworkError: false,
    });

    const result = await service.importFromMnemonic(MNEMONIC, PASSWORD, 'v3R2');

    expect(result.needsVersionChoice).toBe(false);
    expect(result.version).toBe('v3R2');
  });

  it('saves vault to localStorage with encrypted mnemonic', async () => {
    await service.importFromMnemonic(MNEMONIC, PASSWORD);

    const stored = localStorage.getItem('ton_wallet_vault');
    expect(stored).not.toBeNull();

    const vault = JSON.parse(stored!);
    expect(vault.version).toBe(1);
    expect(vault.cipher).toBe('AES-256-GCM');
  });

  it('vault round-trip: decrypt returns original mnemonic', async () => {
    await service.importFromMnemonic(MNEMONIC, PASSWORD);

    const { decrypt: vaultDecrypt, loadVault } = await import('@/crypto/vault');
    const vault = loadVault();
    const plaintext = await vaultDecrypt(vault!, PASSWORD);
    const decrypted: string[] = JSON.parse(plaintext);

    expect(decrypted).toEqual(MNEMONIC);
  });

  it('calls detectVersions with derived public key', async () => {
    await service.importFromMnemonic(MNEMONIC, PASSWORD);

    expect(detectVersions).toHaveBeenCalledWith(MOCK_PUBLIC_KEY);
  });

  it('does not save vault when multiple versions found', async () => {
    vi.mocked(detectVersions).mockResolvedValueOnce({
      wallets: [
        {
          version: 'v3R2',
          addressRaw: '0:' + '11'.repeat(32),
          addressFriendly: 'EQ' + '11'.repeat(32),
          balance: 0n,
          isDeployed: true,
        },
        {
          version: 'v4R2',
          addressRaw: '0:' + '22'.repeat(32),
          addressFriendly: 'EQ' + '22'.repeat(32),
          balance: 0n,
          isDeployed: true,
        },
      ],
      hadNetworkError: false,
    });

    await service.importFromMnemonic(MNEMONIC, PASSWORD);

    expect(localStorage.getItem('ton_wallet_vault')).toBeNull();
  });

  it('InvalidMnemonicError has correct name property', async () => {
    vi.mocked(mnemonicValidate).mockResolvedValueOnce(false);

    try {
      await service.importFromMnemonic(['bad'], PASSWORD);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidMnemonicError);
      expect((error as InvalidMnemonicError).name).toBe('InvalidMnemonicError');
    }
  });
});

// ─── exportMnemonic (task 6.3) ───────────────────────────────────────────────

describe('WalletService.exportMnemonic', () => {
  let service: WalletService;

  beforeEach(() => {
    service = new WalletService();
    localStorage.clear();
  });

  it('returns mnemonic words when password is correct', async () => {
    // Encrypt mnemonic and store in vault
    const { encrypt, saveVault } = await import('@/crypto/vault');
    const mnemonicJson = JSON.stringify(MNEMONIC);
    const vault = await encrypt(mnemonicJson, PASSWORD);
    saveVault(vault);

    const result = await service.exportMnemonic(PASSWORD);

    expect(result).toEqual(MNEMONIC);
    expect(result).toHaveLength(24);
  });

  it('throws InvalidPasswordError when password is wrong', async () => {
    const { encrypt, saveVault } = await import('@/crypto/vault');
    const mnemonicJson = JSON.stringify(MNEMONIC);
    const vault = await encrypt(mnemonicJson, PASSWORD);
    saveVault(vault);

    await expect(service.exportMnemonic('wrong-password'))
      .rejects.toThrow(InvalidPasswordError);
  });

  it('throws NoVaultError when no vault exists', async () => {
    await expect(service.exportMnemonic(PASSWORD))
      .rejects.toThrow(NoVaultError);
  });

  it('preserves exact word order after round-trip', async () => {
    const { encrypt, saveVault } = await import('@/crypto/vault');
    const mnemonicJson = JSON.stringify(MNEMONIC);
    const vault = await encrypt(mnemonicJson, PASSWORD);
    saveVault(vault);

    const result = await service.exportMnemonic(PASSWORD);

    for (let i = 0; i < MNEMONIC.length; i++) {
      expect(result[i]).toBe(MNEMONIC[i]);
    }
  });

  it('InvalidPasswordError has correct name property', async () => {
    const { encrypt, saveVault } = await import('@/crypto/vault');
    const mnemonicJson = JSON.stringify(MNEMONIC);
    const vault = await encrypt(mnemonicJson, PASSWORD);
    saveVault(vault);

    try {
      await service.exportMnemonic('wrong');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPasswordError);
      expect((error as InvalidPasswordError).name).toBe('InvalidPasswordError');
    }
  });

  it('NoVaultError has correct name property', async () => {
    try {
      await service.exportMnemonic('any');
    } catch (error) {
      expect(error).toBeInstanceOf(NoVaultError);
      expect((error as NoVaultError).name).toBe('NoVaultError');
    }
  });
});

// ─── changePassword (task 6.4) ───────────────────────────────────────────────

describe('WalletService.changePassword', () => {
  let service: WalletService;
  const NEW_PASSWORD = 'New-Strong-Password!2026';

  beforeEach(() => {
    service = new WalletService();
    localStorage.clear();
  });

  async function seedVault(password: string): Promise<void> {
    const { encrypt, saveVault } = await import('@/crypto/vault');
    const mnemonicJson = JSON.stringify(MNEMONIC);
    const vault = await encrypt(mnemonicJson, password);
    saveVault(vault);
  }

  it('successfully changes password — new vault can be decrypted with new password', async () => {
    await seedVault(PASSWORD);

    await service.changePassword(PASSWORD, NEW_PASSWORD);

    const { decrypt: vaultDecrypt, loadVault } = await import('@/crypto/vault');
    const vault = loadVault();
    expect(vault).not.toBeNull();

    const plaintext = await vaultDecrypt(vault!, NEW_PASSWORD);
    const decrypted: string[] = JSON.parse(plaintext);
    expect(decrypted).toEqual(MNEMONIC);
  });

  it('old password no longer works after change', async () => {
    await seedVault(PASSWORD);

    await service.changePassword(PASSWORD, NEW_PASSWORD);

    const { decrypt: vaultDecrypt, loadVault } = await import('@/crypto/vault');
    const vault = loadVault()!;

    await expect(vaultDecrypt(vault, PASSWORD)).rejects.toThrow();
  });

  it('throws InvalidPasswordError when current password is wrong', async () => {
    await seedVault(PASSWORD);

    await expect(service.changePassword('wrong-current', NEW_PASSWORD))
      .rejects.toThrow(InvalidPasswordError);
  });

  it('throws NoVaultError when no vault exists', async () => {
    await expect(service.changePassword(PASSWORD, NEW_PASSWORD))
      .rejects.toThrow(NoVaultError);
  });

  it('throws WeakPasswordError when new password is too weak', async () => {
    await seedVault(PASSWORD);

    await expect(service.changePassword(PASSWORD, '12345678'))
      .rejects.toThrow(WeakPasswordError);
  });

  it('throws WeakPasswordError when new password is too short', async () => {
    await seedVault(PASSWORD);

    await expect(service.changePassword(PASSWORD, 'X#9kP!2'))
      .rejects.toThrow(WeakPasswordError);
  });

  it('vault is not modified when current password is wrong', async () => {
    await seedVault(PASSWORD);

    const { loadVault: loadBefore } = await import('@/crypto/vault');
    const vaultBefore = loadBefore();

    await expect(service.changePassword('wrong', NEW_PASSWORD)).rejects.toThrow();

    const { loadVault: loadAfter } = await import('@/crypto/vault');
    const vaultAfter = loadAfter();

    expect(vaultAfter).not.toBeNull();
    expect(vaultAfter!.ciphertext).toBe(vaultBefore!.ciphertext);
    expect(vaultAfter!.iv).toBe(vaultBefore!.iv);
  });

  it('vault is not modified when new password is weak', async () => {
    await seedVault(PASSWORD);

    const { loadVault: loadBefore } = await import('@/crypto/vault');
    const vaultBefore = loadBefore();

    await expect(service.changePassword(PASSWORD, 'weak')).rejects.toThrow();

    const { loadVault: loadAfter } = await import('@/crypto/vault');
    const vaultAfter = loadAfter();

    expect(vaultAfter!.ciphertext).toBe(vaultBefore!.ciphertext);
  });

  it('WeakPasswordError has correct name property', async () => {
    await seedVault(PASSWORD);

    try {
      await service.changePassword(PASSWORD, '123');
    } catch (error) {
      expect(error).toBeInstanceOf(WeakPasswordError);
      expect((error as WeakPasswordError).name).toBe('WeakPasswordError');
    }
  });

  it('new vault has different salt and IV from old vault', async () => {
    await seedVault(PASSWORD);

    const { loadVault: loadBefore } = await import('@/crypto/vault');
    const oldVault = loadBefore();

    await service.changePassword(PASSWORD, NEW_PASSWORD);

    const { loadVault: loadAfter } = await import('@/crypto/vault');
    const newVault = loadAfter();

    expect(newVault!.iv).not.toBe(oldVault!.iv);
    expect(newVault!.ciphertext).not.toBe(oldVault!.ciphertext);
  });
});
