/**
 * Encrypted Vault module.
 * Encrypts and decrypts mnemonic using AES-256-GCM.
 */

import type { EncryptedVault, KdfParamsSerialized, Argon2Params, Pbkdf2Params } from './types';
import { deriveKey, deriveKeyWithParams } from './kdf';

const VAULT_STORAGE_KEY = 'ton_wallet_vault';

/**
 * Convert Uint8Array to base64 string.
 */
function uint8ToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert base64 string to Uint8Array.
 */
function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Serialize KDF params: convert Uint8Array salt to base64 for JSON storage.
 */
function serializeKdfParams(params: Argon2Params | Pbkdf2Params): KdfParamsSerialized {
  if ('parallelism' in params) {
    return {
      salt: uint8ToBase64(params.salt),
      memory: params.memory,
      iterations: params.iterations,
      parallelism: params.parallelism,
    };
  }
  return {
    salt: uint8ToBase64(params.salt),
    iterations: params.iterations,
    hash: params.hash,
  };
}

/**
 * Deserialize KDF params: restore Uint8Array salt from base64.
 */
function deserializeKdfParams(params: KdfParamsSerialized): Argon2Params | Pbkdf2Params {
  if ('parallelism' in params) {
    return {
      salt: base64ToUint8(params.salt),
      memory: params.memory,
      iterations: params.iterations,
      parallelism: params.parallelism,
    };
  }
  return {
    salt: base64ToUint8(params.salt),
    iterations: params.iterations,
    hash: params.hash,
  };
}

/**
 * Import raw key bytes into a CryptoKey for AES-GCM.
 */
async function importAesKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using AES-256-GCM with password-derived key.
 */
export async function encrypt(plaintext: string, password: string): Promise<EncryptedVault> {
  const { key, algorithm, params } = await deriveKey(password);

  // Generate 12-byte IV for AES-GCM
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const cryptoKey = await importAesKey(key);
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode(plaintext)
  );

  return {
    version: 1,
    kdf: algorithm,
    kdfParams: serializeKdfParams(params),
    cipher: 'AES-256-GCM',
    iv: uint8ToBase64(iv),
    ciphertext: uint8ToBase64(new Uint8Array(ciphertext)),
  };
}

/**
 * Decrypt vault using password.
 * Throws error if password is incorrect.
 */
export async function decrypt(vault: EncryptedVault, password: string): Promise<string> {
  const kdfParams = deserializeKdfParams(vault.kdfParams);
  const key = await deriveKeyWithParams(password, kdfParams);
  const cryptoKey = await importAesKey(key);

  const iv = base64ToUint8(vault.iv);
  const ciphertext = base64ToUint8(vault.ciphertext);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error('Decryption failed: incorrect password or corrupted data');
  }
}

/**
 * Save vault to localStorage.
 */
export function saveVault(vault: EncryptedVault): void {
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
}

/**
 * Load vault from localStorage.
 * Returns null if no vault exists.
 */
export function loadVault(): EncryptedVault | null {
  const stored = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as EncryptedVault;
  } catch {
    return null;
  }
}

/**
 * Check if a vault exists in localStorage.
 */
export function hasVault(): boolean {
  return localStorage.getItem(VAULT_STORAGE_KEY) !== null;
}

/**
 * Remove vault from localStorage.
 */
export function clearVault(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY);
}
