/**
 * Crypto types for KDF, encryption, and vault operations.
 */

export type KdfAlgorithm = 'argon2id' | 'pbkdf2';

export interface Argon2Params {
  salt: Uint8Array;
  memory: number;
  iterations: number;
  parallelism: number;
}

export interface Pbkdf2Params {
  salt: Uint8Array;
  iterations: number;
  hash: 'SHA-256' | 'SHA-512';
}

export type KdfParams = Argon2Params | Pbkdf2Params;

export interface KdfResult {
  key: Uint8Array;
  algorithm: KdfAlgorithm;
  params: KdfParams;
}

// Serializable versions of KDF params (salt stored as base64 for JSON persistence)
export interface Argon2ParamsSerialized {
  salt: string; // base64
  memory: number;
  iterations: number;
  parallelism: number;
}

export interface Pbkdf2ParamsSerialized {
  salt: string; // base64
  iterations: number;
  hash: 'SHA-256' | 'SHA-512';
}

export type KdfParamsSerialized = Argon2ParamsSerialized | Pbkdf2ParamsSerialized;

export interface EncryptedVault {
  version: 1;
  kdf: KdfAlgorithm;
  kdfParams: KdfParamsSerialized;
  cipher: 'AES-256-GCM';
  iv: string; // base64
  ciphertext: string; // base64
}
