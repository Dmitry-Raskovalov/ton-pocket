/**
 * Wallet service types.
 */

export interface WalletState {
  address: string;
  publicKey: string;
  version: 'v4' | 'v3r2';
}

export interface WalletCreateResult {
  mnemonic: string[];
  address: string;
}

export interface WalletImportResult {
  address: string;
  versions: WalletVersionInfo[];
}

export interface WalletVersionInfo {
  version: 'v4' | 'v3r2';
  address: string;
  balance: bigint;
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
