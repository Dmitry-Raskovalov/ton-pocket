/**
 * Hook for wallet operations.
 */

import { useWalletStore } from '@/store';

export function useWallet() {
  const store = useWalletStore();

  return {
    wallet: store.wallet,
    isLocked: store.isLocked,
    isInitialized: store.isInitialized,
    balance: store.balance,
    transactions: store.transactions,
    
    lock: store.lock,
    unlock: store.unlock,
    setWallet: store.setWallet,
    setBalance: store.setBalance,
    setTransactions: store.setTransactions,
    clear: store.clear,
  };
}
