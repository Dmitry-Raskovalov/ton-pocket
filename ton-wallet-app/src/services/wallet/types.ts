/**
 * Wallet service types.
 */

import type { WalletVersion } from './contract-factory';
import type { DetectedWallet } from './contract-factory';

export interface WalletState {
  address: string;
  publicKey: string;
  version: WalletVersion;
}

export interface WalletCreateResult {
  mnemonic: string[];
  address: string;
  version: WalletVersion;
  publicKey: string;
}

/**
 * Result of importByMnemonic.
 * If wallet was created immediately — address and version are set, needsVersionChoice = false.
 * If multiple versions found — detectedWallets is populated for user to choose.
 */
export interface WalletImportResult {
  /** Wallet created successfully */
  address: string | null;
  /** Contract version of the created wallet */
  version: WalletVersion | null;
  /** True when user needs to select from multiple detected versions */
  needsVersionChoice: boolean;
  /** Available versions for user selection (when needsVersionChoice = true) */
  detectedWallets: DetectedWallet[];
  /** True when auto-detection failed due to network issues and v4R2 was used as fallback */
  hadNetworkError?: boolean;
  /** Public key in hex format */
  publicKey: string | null;
}

/**
 * Thrown when the password provided for vault decryption is incorrect.
 */
export class InvalidPasswordError extends Error {
  constructor(message = 'Incorrect password') {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

/**
 * Thrown when no encrypted vault is found in storage.
 */
export class NoVaultError extends Error {
  constructor(message = 'No wallet found. Please create or import a wallet first.') {
    super(message);
    this.name = 'NoVaultError';
  }
}

/**
 * Thrown when the provided mnemonic phrase is invalid.
 */
export class InvalidMnemonicError extends Error {
  constructor(message = 'Invalid mnemonic phrase') {
    super(message);
    this.name = 'InvalidMnemonicError';
  }
}

/**
 * Thrown when the new password does not meet strength requirements.
 */
export class WeakPasswordError extends Error {
  constructor(message = 'New password is too weak. Use at least 8 characters with score ≥ 2.') {
    super(message);
    this.name = 'WeakPasswordError';
  }
}
