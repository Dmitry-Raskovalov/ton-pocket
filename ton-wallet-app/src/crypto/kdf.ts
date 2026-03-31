/**
 * Key Derivation Function module.
 * Derives 256-bit encryption key from password using Argon2id (primary) or PBKDF2 (fallback).
 */

import type { KdfResult, Argon2Params, Pbkdf2Params } from './types';

/**
 * Generate a random 16-byte salt.
 */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Check if Argon2 (WASM) is available.
 */
let argon2Available: boolean | null = null;

export async function isArgon2Available(): Promise<boolean> {
  if (argon2Available !== null) {
    return argon2Available;
  }
  
  try {
    // Dynamic import to check if argon2-browser is available
    await import('argon2-browser');
    argon2Available = true;
    return true;
  } catch {
    argon2Available = false;
    return false;
  }
}

/**
 * Derive key using Argon2id.
 */
async function deriveKeyArgon2(password: string, salt: Uint8Array): Promise<KdfResult> {
  const argon2 = await import('argon2-browser');
  
  const result = await argon2.hash({
    pass: password,
    salt: salt,
    time: 3,
    mem: 65536, // 64MB
    parallelism: 1,
    hashLen: 32, // 256 bits
    distPath: '' // Use default
  });
  
  const params: Argon2Params = {
    salt,
    memory: 65536,
    iterations: 3,
    parallelism: 1,
  };
  
  // Convert hex string to Uint8Array
  const keyHex = result.hashHex;
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = parseInt(keyHex.slice(i * 2, i * 2 + 2), 16);
  }

  return {
    key,
    algorithm: 'argon2id',
    params,
  };
}

/**
 * Derive key using PBKDF2.
 */
async function deriveKeyPbkdf2(password: string, salt: Uint8Array): Promise<KdfResult> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const keyBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: 600000,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );
  
  const params: Pbkdf2Params = {
    salt,
    iterations: 600000,
    hash: 'SHA-256',
  };
  
  return {
    key: new Uint8Array(keyBits),
    algorithm: 'pbkdf2',
    params,
  };
}

/**
 * Derive key from password using available KDF algorithm.
 * Automatically selects Argon2id if available, otherwise falls back to PBKDF2.
 */
export async function deriveKey(password: string, salt?: Uint8Array): Promise<KdfResult> {
  const actualSalt = salt ?? generateSalt();
  const useArgon2 = await isArgon2Available();
  
  if (useArgon2) {
    return deriveKeyArgon2(password, actualSalt);
  }
  
  return deriveKeyPbkdf2(password, actualSalt);
}

/**
 * Derive key using saved parameters (for decryption).
 */
export async function deriveKeyWithParams(
  password: string,
  params: Argon2Params | Pbkdf2Params
): Promise<Uint8Array> {
  if ('parallelism' in params) {
    // Argon2 params
    return (await deriveKeyArgon2(password, params.salt)).key;
  }
  
  // PBKDF2 params
  return (await deriveKeyPbkdf2(password, params.salt)).key;
}
