/**
 * file: wallet-roundtrip.test.ts
 * description: Integration tests for wallet round-trip flows
 *               create → export, import → validate → export, change password → export
 * dependencies: WalletService, crypto/vault
 * created: 2026-04-15
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletService } from '@/services/wallet/WalletService';

// Mock argon2-browser with a fast SHA-256-based stub so KDF doesn't block tests
vi.mock('argon2-browser', () => ({
  hash: async ({ pass, salt }: { pass: string; salt: Uint8Array }) => {
    const enc = new TextEncoder();
    const combined = new Uint8Array([...enc.encode(pass), ...salt]);
    const buf = await crypto.subtle.digest('SHA-256', combined);
    const hashHex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return { hashHex };
  },
}));

// Mock @ton/crypto
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

// Mock contract-factory — keep createContract from actual module
vi.mock('@/services/wallet/contract-factory', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/wallet/contract-factory')>();
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

const MNEMONIC = [
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'art',
];
const PASSWORD = 'Strong-Roundtrip-Password!99';
const NEW_PASSWORD = 'New-Strong-Password!2026';

describe('Integration: Wallet Round-Trip Flows', () => {
  let service: WalletService;

  beforeEach(() => {
    service = new WalletService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  // PBKDF2 with 600k iterations is slow — increase timeout
  const SLOW_TEST_TIMEOUT = 30000;

  describe('Create → Export round-trip', () => {
    it('mnemonic created via createWallet can be exported with same password', async () => {
      // Step 1: Create wallet
      const createResult = await service.createWallet(PASSWORD);

      // Verify wallet was created
      expect(createResult.mnemonic).toHaveLength(24);
      expect(createResult.address).toMatch(/^0:[0-9a-f]{64}$/);
      expect(createResult.version).toBe('v4R2');

      // Step 2: Export mnemonic with same password
      const exported = await service.exportMnemonic(PASSWORD);

      // Step 3: Compare — exported mnemonic matches created mnemonic
      expect(exported).toEqual(createResult.mnemonic);
      expect(exported).toHaveLength(24);
    });

    it('export fails with wrong password after create', async () => {
      await service.createWallet(PASSWORD);

      await expect(service.exportMnemonic('wrong-password'))
        .rejects.toThrow();
    });
  });

  describe('Import → Export round-trip', () => {
    it('mnemonic imported via importFromMnemonic can be exported with same password', async () => {
      // Step 1: Import wallet with mnemonic
      const importResult = await service.importFromMnemonic(MNEMONIC, PASSWORD);

      // Verify import succeeded
      expect(importResult.needsVersionChoice).toBe(false);
      expect(importResult.address).toMatch(/^0:[0-9a-f]{64}$/);

      // Step 2: Export mnemonic
      const exported = await service.exportMnemonic(PASSWORD);

      // Step 3: Compare — exported matches original imported mnemonic
      expect(exported).toEqual(MNEMONIC);
    });

    it('imported mnemonic is byte-for-byte identical after round-trip', async () => {
      await service.importFromMnemonic(MNEMONIC, PASSWORD);

      const exported = await service.exportMnemonic(PASSWORD);

      for (let i = 0; i < MNEMONIC.length; i++) {
        expect(exported[i]).toBe(MNEMONIC[i]);
      }
    });

    it('different password on import → export with that password works', async () => {
      const anotherPassword = 'Another-Strong-Pw!42';

      await service.importFromMnemonic(MNEMONIC, anotherPassword);

      const exported = await service.exportMnemonic(anotherPassword);
      expect(exported).toEqual(MNEMONIC);
    });
  });

  describe('Create → Change Password → Export round-trip', () => {
    it('after password change, mnemonic can be exported with new password', async () => {
      // Step 1: Create wallet
      const createResult = await service.createWallet(PASSWORD);

      // Step 2: Change password
      await service.changePassword(PASSWORD, NEW_PASSWORD);

      // Step 3: Export with new password
      const exported = await service.exportMnemonic(NEW_PASSWORD);

      // Step 4: Mnemonic unchanged
      expect(exported).toEqual(createResult.mnemonic);
    }, SLOW_TEST_TIMEOUT);

    it('after password change, old password no longer works for export', async () => {
      await service.createWallet(PASSWORD);
      await service.changePassword(PASSWORD, NEW_PASSWORD);

      await expect(service.exportMnemonic(PASSWORD))
        .rejects.toThrow();
    }, SLOW_TEST_TIMEOUT);

    it('multiple password changes preserve mnemonic integrity', async () => {
      const createResult = await service.createWallet(PASSWORD);

      const pw2 = 'Second-Password!22';
      const pw3 = 'Third-Password!33';

      await service.changePassword(PASSWORD, pw2);
      await service.changePassword(pw2, pw3);

      const exported = await service.exportMnemonic(pw3);
      expect(exported).toEqual(createResult.mnemonic);
    }, SLOW_TEST_TIMEOUT);
  });

  describe('Create → Validate Mnemonic round-trip', () => {
    it('created mnemonic passes validation', async () => {
      const createResult = await service.createWallet(PASSWORD);

      const isValid = await service.validateMnemonic(createResult.mnemonic);
      expect(isValid).toBe(true);
    });

    it('modified mnemonic fails validation', async () => {
      const createResult = await service.createWallet(PASSWORD);

      const modified = [...createResult.mnemonic];
      modified[0] = 'zebra';

      const { mnemonicValidate } = await import('@ton/crypto');
      vi.mocked(mnemonicValidate).mockResolvedValueOnce(false);

      const isValid = await service.validateMnemonic(modified);
      expect(isValid).toBe(false);
    });
  });

  describe('Vault integrity after operations', () => {
    it('vault persists correctly across localStorage save/load cycle', async () => {
      await service.createWallet(PASSWORD);

      // Load vault directly from localStorage
      const { loadVault, decrypt } = await import('@/crypto/vault');
      const vault = loadVault();

      expect(vault).not.toBeNull();
      expect(vault!.version).toBe(1);
      expect(vault!.cipher).toBe('AES-256-GCM');

      // Decrypt and verify
      const plaintext = await decrypt(vault!, PASSWORD);
      const stored: string[] = JSON.parse(plaintext);
      expect(stored).toHaveLength(24);
    });

    it('create → clear (remove vault) → create again works', async () => {
      // First wallet
      const result1 = await service.createWallet(PASSWORD);
      expect(result1.mnemonic).toHaveLength(24);

      // Clear vault
      const { clearVault, hasVault } = await import('@/crypto/vault');
      clearVault();
      expect(hasVault()).toBe(false);

      // Second wallet
      const result2 = await service.createWallet(PASSWORD);
      expect(result2.mnemonic).toHaveLength(24);

      // Both wallets should export correctly (only second one exists now)
      const exported = await service.exportMnemonic(PASSWORD);
      expect(exported).toEqual(result2.mnemonic);
    });
  });
});
