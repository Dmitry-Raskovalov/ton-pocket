/**
 * Wallet store types.
 */

import type { WalletState } from '@/services/wallet';
import type { Transaction } from '@/services/ton';

export interface WalletStore {
  // State
  wallet: WalletState | null;
  isLocked: boolean;
  isInitialized: boolean;
  balance: bigint | null;
  transactions: Transaction[];
  
  // Actions
  setWallet: (wallet: WalletState | null) => void;
  lock: () => void;
  unlock: () => void;
  setBalance: (balance: bigint) => void;
  setTransactions: (transactions: Transaction[]) => void;
  clear: () => void;
}
