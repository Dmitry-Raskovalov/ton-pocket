/**
 * Wallet service.
 * Handles wallet creation, import, and management.
 */

import type { WalletCreateResult, WalletImportResult, WalletState } from './types';

export class WalletService {
  /**
   * Create a new wallet with random mnemonic.
   */
  async createWallet(): Promise<WalletCreateResult> {
    // TODO: Implement using @ton/crypto
    throw new Error('Not implemented');
  }

  /**
   * Import wallet from mnemonic.
   * Returns all available contract versions with their addresses.
   */
  async importFromMnemonic(_mnemonic: string[]): Promise<WalletImportResult> {
    // TODO: Implement using @ton/crypto
    throw new Error('Not implemented');
  }

  /**
   * Unlock wallet with password.
   */
  async unlock(_password: string): Promise<WalletState | null> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Export mnemonic (requires password verification).
   */
  async exportMnemonic(_password: string): Promise<string[]> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Change wallet password.
   */
  async changePassword(_oldPassword: string, _newPassword: string): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }
}

export const walletService = new WalletService();
