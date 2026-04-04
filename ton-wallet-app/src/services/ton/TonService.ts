/**
 * TON blockchain service.
 * Handles interactions with TON testnet via @ton/ton SDK.
 */

import type { TonApiConfig, WalletInfo, Transaction } from './types';

export class TonService {
  private config: TonApiConfig;

  constructor(config: TonApiConfig) {
    this.config = config;
  }

  /**
   * Get current API configuration.
   */
  getConfig(): TonApiConfig {
    return this.config;
  }

  /**
   * Get wallet balance and info.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getWalletInfo(_address: string): Promise<WalletInfo> {
    // TODO: Implement using @ton/ton
    throw new Error('Not implemented');
  }

  /**
   * Get transaction history for wallet.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTransactions(_address: string, _limit?: number): Promise<Transaction[]> {
    // TODO: Implement using @ton/ton
    throw new Error('Not implemented');
  }

  /**
   * Send TON transaction.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendTransaction(_params: {
    from: string;
    to: string;
    amount: bigint;
    message?: string;
  }): Promise<string> {
    // TODO: Implement using @ton/ton
    throw new Error('Not implemented');
  }
}
