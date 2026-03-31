/**
 * Wallet store using Zustand.
 */

import { create } from 'zustand';
import type { WalletStore } from './types';

export const useWalletStore = create<WalletStore>((set) => ({
  // Initial state
  wallet: null,
  isLocked: true,
  isInitialized: false,
  balance: null,
  transactions: [],

  // Actions
  setWallet: (wallet) => set({ wallet, isInitialized: wallet !== null }),
  
  lock: () => set({ isLocked: true }),
  
  unlock: () => set({ isLocked: false }),
  
  setBalance: (balance) => set({ balance }),
  
  setTransactions: (transactions) => set({ transactions }),
  
  clear: () => set({
    wallet: null,
    isLocked: true,
    isInitialized: false,
    balance: null,
    transactions: [],
  }),
}));
