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
