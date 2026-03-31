/**
 * Wallet service.
 * Handles wallet creation, import, and management.
 */

import { loadVault, decrypt } from '@/crypto/vault';
import type { WalletCreateResult, WalletImportResult, WalletState } from './types';
import { InvalidPasswordError, NoVaultError } from './types';

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
   * Export mnemonic by decrypting the vault with the provided password.
   * Returns the 24-word mnemonic phrase as an array of strings.
   *
   * @throws {NoVaultError} if no vault is found in localStorage
   * @throws {InvalidPasswordError} if the password is incorrect
   */
  async exportMnemonic(password: string): Promise<string[]> {
    const vault = loadVault();
    if (!vault) {
      throw new NoVaultError();
    }

    let plaintext: string;
    try {
      plaintext = await decrypt(vault, password);
    } catch {
      throw new InvalidPasswordError();
    }

    const words: string[] = JSON.parse(plaintext);

    if (!Array.isArray(words) || words.length === 0) {
      throw new Error('Vault contains invalid mnemonic data');
    }

    return words;
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
