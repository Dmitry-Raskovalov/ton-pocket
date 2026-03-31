/**
 * TON service types.
 */

export interface TonApiConfig {
  endpoint: string;
  apiKey?: string;
}

export interface WalletInfo {
  address: string;
  balance: bigint;
  lastActivity?: number;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: bigint;
  timestamp: number;
  fee: bigint;
  status: 'pending' | 'confirmed' | 'failed';
  message?: string;
}
