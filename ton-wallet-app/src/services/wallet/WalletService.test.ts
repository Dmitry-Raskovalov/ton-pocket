/**
 * file: WalletService.test.ts
 * description: Unit tests for WalletService — createWallet (task 6.1), exportMnemonic (task 6.3)
 * dependencies: WalletService.ts, crypto/vault, contract-factory
 * created: 2026-03-31
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletService } from './WalletService';
import { InvalidPasswordError, NoVaultError } from './types';

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
}));

import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';

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
