/**
 * Wallet service.
 * Handles wallet creation, import, and management.
 */

import { mnemonicNew, mnemonicToPrivateKey, mnemonicValidate } from '@ton/crypto';
import { encrypt, saveVault, loadVault, decrypt } from '@/crypto/vault';
import { createContract, detectVersions } from './contract-factory';
import type { WalletVersion, DetectVersionsResult } from './contract-factory';
import type { WalletCreateResult, WalletImportResult, WalletState } from './types';
import { InvalidPasswordError, InvalidMnemonicError, NoVaultError, WeakPasswordError } from './types';
import { evaluatePassword } from '@/crypto/password-strength';

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

    return { mnemonic, address, version, publicKey: Buffer.from(keyPair.publicKey).toString('hex') };
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
    const detection: DetectVersionsResult = await detectVersions(keyPair.publicKey);
    const detectedWallets = detection.wallets;
    const hadNetworkError = detection.hadNetworkError;

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
        hadNetworkError,
        publicKey: null,
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
      hadNetworkError,
      publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
    };
  }

  /**
   * Unlock wallet with password.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
   * Decrypts vault with current password, validates new password strength,
   * re-encrypts mnemonic with new password and overwrites vault.
   *
   * @throws {NoVaultError} if no vault is found in localStorage
   * @throws {InvalidPasswordError} if the current password is incorrect
   * @throws {WeakPasswordError} if the new password does not meet strength requirements
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // 1. Load vault
    const vault = loadVault();
    if (!vault) {
      throw new NoVaultError();
    }

    // 2. Decrypt with current password
    let plaintext: string;
    try {
      plaintext = await decrypt(vault, currentPassword);
    } catch {
      throw new InvalidPasswordError();
    }

    // 3. Validate new password strength
    const strength = evaluatePassword(newPassword);
    if (!strength.isAcceptable) {
      throw new WeakPasswordError();
    }

    // 4. Re-encrypt with new password (new salt, new IV)
    const newVault = await encrypt(plaintext, newPassword);

    // 5. Save new vault (overwrites old one)
    saveVault(newVault);
  }
}

export const walletService = new WalletService();
