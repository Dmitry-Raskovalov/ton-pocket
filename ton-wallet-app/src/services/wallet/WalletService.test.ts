/**
 * file: WalletService.test.ts
 * description: Unit tests for WalletService — exportMnemonic (task 6.3)
 * dependencies: WalletService.ts, crypto/vault
 * created: 2026-03-31
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletService } from './WalletService';
import { InvalidPasswordError, NoVaultError } from './types';

// Mock argon2-browser so KDF falls back to PBKDF2 in tests
vi.mock('argon2-browser', () => {
  throw new Error('WASM not available in test environment');
});

const MNEMONIC = [
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'art',
];
const PASSWORD = 'Strong-Export-Password!99';

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
