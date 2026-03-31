/**
 * Wallet service.
 * Handles wallet creation, import, and management.
 */

import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { encrypt, saveVault, loadVault, decrypt } from '@/crypto/vault';
import { createContract } from './contract-factory';
import type { WalletCreateResult, WalletImportResult, WalletState } from './types';
import { InvalidPasswordError, NoVaultError } from './types';

export class WalletService {
  /**
   * Create a new wallet with random mnemonic.
   * Generates 24-word mnemonic, derives keypair, creates v4R2 contract,
   * encrypts mnemonic and saves vault to localStorage.
   */
  async createWallet(password: string): Promise<WalletCreateResult> {
    const version = 'v4R2' as const;

    // 1. Generate 24-word mnemonic
    const mnemonic = await mnemonicNew();

    // 2. Derive keypair from mnemonic
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    // 3. Create v4R2 contract from public key
    const contract = createContract(keyPair.publicKey, version);
    const address = contract.address.toRawString();

    // 4. Encrypt mnemonic and save to vault
    const mnemonicJson = JSON.stringify(mnemonic);
    const vault = await encrypt(mnemonicJson, password);
    saveVault(vault);

    return { mnemonic, address, version };
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
