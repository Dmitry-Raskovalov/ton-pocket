/**
 * Wallet service.
 * Handles wallet creation, import, and management.
 */

import { mnemonicNew, mnemonicToPrivateKey, mnemonicValidate } from '@ton/crypto';
import { encrypt, saveVault, loadVault, decrypt } from '@/crypto/vault';
import { createContract, detectVersions } from './contract-factory';
import type { WalletVersion } from './contract-factory';
import type { WalletCreateResult, WalletImportResult, WalletState } from './types';
import { InvalidPasswordError, InvalidMnemonicError, NoVaultError } from './types';

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
   * Validate a mnemonic phrase.
   * Returns true if the mnemonic is valid.
   */
  async validateMnemonic(words: string[]): Promise<boolean> {
    return mnemonicValidate(words);
  }

  /**
   * Import wallet from mnemonic phrase.
   * Validates mnemonic, derives keypair, auto-detects contract versions,
   * encrypts and saves to vault.
   *
   * - If selectedVersion is provided — uses it directly (no network call).
   * - If exactly one version found or none — creates wallet immediately.
   * - If multiple versions found — returns list for user to choose.
   *
   * @throws {InvalidMnemonicError} if the mnemonic phrase is invalid
   */
  async importFromMnemonic(
    words: string[],
    password: string,
    selectedVersion?: WalletVersion,
  ): Promise<WalletImportResult> {
    // 1. Validate mnemonic
    const isValid = await mnemonicValidate(words);
    if (!isValid) {
      throw new InvalidMnemonicError();
    }

    // 2. Derive keypair
    const keyPair = await mnemonicToPrivateKey(words);

    // 3. Determine version
    let chosenVersion: WalletVersion;
    let detectedWallets = await detectVersions(keyPair.publicKey);

    if (selectedVersion) {
      // User already chose a version (e.g. from multi-version selection screen)
      chosenVersion = selectedVersion;
    } else if (detectedWallets.length > 1) {
      // Multiple versions found — return list for user to choose
      return {
        address: null,
        version: null,
        needsVersionChoice: true,
        detectedWallets,
      };
    } else {
      // 0 or 1 found — use the single/default entry
      chosenVersion = detectedWallets[0].version;
    }

    // 4. Create contract and get address
    const contract = createContract(keyPair.publicKey, chosenVersion);
    const address = contract.address.toRawString();

    // 5. Encrypt mnemonic and save to vault
    const mnemonicJson = JSON.stringify(words);
    const vault = await encrypt(mnemonicJson, password);
    saveVault(vault);

    return {
      address,
      version: chosenVersion,
      needsVersionChoice: false,
      detectedWallets: [],
    };
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
