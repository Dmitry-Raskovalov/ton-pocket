/**
 * file: vault.test.ts
 * description: Unit tests for Encrypted Vault module (AES-256-GCM)
 * dependencies: vault.ts, kdf.ts, types.ts
 * created: 2026-03-31
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encrypt, decrypt, saveVault, loadVault, hasVault, clearVault } from './vault';
import type { EncryptedVault } from './types';

// Mock argon2-browser so all KDF calls use PBKDF2 (WASM unavailable in jsdom)
vi.mock('argon2-browser', () => {
  throw new Error('WASM not available in test environment');
});

const PLAINTEXT = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24';
const PASSWORD = 'test-password-secure';

describe('encrypt', () => {
  it('returns an EncryptedVault with correct structure', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);

    expect(vault.version).toBe(1);
    expect(vault.cipher).toBe('AES-256-GCM');
    expect(['argon2id', 'pbkdf2']).toContain(vault.kdf);
    expect(typeof vault.iv).toBe('string');
    expect(typeof vault.ciphertext).toBe('string');
    expect(vault.iv.length).toBeGreaterThan(0);
    expect(vault.ciphertext.length).toBeGreaterThan(0);
    expect(vault.kdfParams).toBeDefined();
  });

  it('generates unique IV on each call', async () => {
    const vault1 = await encrypt(PLAINTEXT, PASSWORD);
    const vault2 = await encrypt(PLAINTEXT, PASSWORD);

    expect(vault1.iv).not.toBe(vault2.iv);
  });

  it('generates unique ciphertext on each call (unique salt)', async () => {
    const vault1 = await encrypt(PLAINTEXT, PASSWORD);
    const vault2 = await encrypt(PLAINTEXT, PASSWORD);

    expect(vault1.ciphertext).not.toBe(vault2.ciphertext);
  });

  it('IV is 12 bytes (base64 length = 16)', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);
    const ivBytes = atob(vault.iv).length;
    expect(ivBytes).toBe(12);
  });
});

describe('decrypt', () => {
  it('round-trip: encrypt then decrypt returns original plaintext', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);
    const result = await decrypt(vault, PASSWORD);

    expect(result).toBe(PLAINTEXT);
  });

  it('throws on incorrect password', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);

    await expect(decrypt(vault, 'wrong-password')).rejects.toThrow(
      'Decryption failed: incorrect password or corrupted data'
    );
  });

  it('throws on tampered ciphertext', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);
    const tampered: EncryptedVault = { ...vault, ciphertext: btoa('corrupted') };

    await expect(decrypt(tampered, PASSWORD)).rejects.toThrow();
  });

  it('throws on tampered IV', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);
    const badIv = new Uint8Array(12).fill(0);
    const tampered: EncryptedVault = {
      ...vault,
      iv: btoa(String.fromCharCode(...badIv)),
    };

    await expect(decrypt(tampered, PASSWORD)).rejects.toThrow();
  });

  it('round-trip preserves unicode plaintext', async () => {
    const unicode = 'Привет мир! 🔐 TON Testnet';
    const vault = await encrypt(unicode, PASSWORD);
    const result = await decrypt(vault, PASSWORD);

    expect(result).toBe(unicode);
  });
});

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hasVault returns false when no vault is stored', () => {
    expect(hasVault()).toBe(false);
  });

  it('saveVault + hasVault returns true', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);
    saveVault(vault);

    expect(hasVault()).toBe(true);
  });

  it('loadVault returns null when nothing is stored', () => {
    expect(loadVault()).toBeNull();
  });

  it('saveVault + loadVault round-trip preserves vault structure', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);
    saveVault(vault);

    const loaded = loadVault();
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(vault.version);
    expect(loaded!.cipher).toBe(vault.cipher);
    expect(loaded!.iv).toBe(vault.iv);
    expect(loaded!.ciphertext).toBe(vault.ciphertext);
    expect(loaded!.kdf).toBe(vault.kdf);
  });

  it('loaded vault can be decrypted correctly', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);
    saveVault(vault);

    const loaded = loadVault()!;
    const result = await decrypt(loaded, PASSWORD);
    expect(result).toBe(PLAINTEXT);
  });

  it('clearVault removes vault from localStorage', async () => {
    const vault = await encrypt(PLAINTEXT, PASSWORD);
    saveVault(vault);
    clearVault();

    expect(hasVault()).toBe(false);
    expect(loadVault()).toBeNull();
  });

  it('loadVault returns null on invalid JSON in localStorage', () => {
    localStorage.setItem('ton_wallet_vault', 'not-valid-json{');
    expect(loadVault()).toBeNull();
  });
});
