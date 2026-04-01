/**
 * file: store/wallet-store.ts
 * description: Zustand store состояния кошелька с persist middleware
 * dependencies: zustand, crypto/vault (hasVault для isWalletCreated)
 * created: 2026-03-31
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { hasVault } from '@/crypto/vault';
import type { WalletStore } from './types';

const STORE_NAME = 'ton-pocket-wallet';

const initialState = {
  address: null,
  version: null,
  balance: 0n,
  isUnlocked: false,
  publicKey: null,
  isActivated: false,
  sessionPassword: null,
} as const;

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      ...initialState,

      setWallet: ({ address, version, publicKey }) =>
        set({ address, version, publicKey }),

      clearWallet: () => set({ ...initialState }),

      updateBalance: (balance) => set({ balance }),

      setUnlocked: (isUnlocked) => set({ isUnlocked }),

      setActivated: (isActivated) => set({ isActivated }),

      setSessionPassword: (sessionPassword) => set({ sessionPassword }),
    }),
    {
      name: STORE_NAME,
      // Персистируем только публичные данные; balance и isUnlocked всегда
      // начинают с дефолтных значений (0n и false) при перезагрузке страницы.
      partialize: (state) => ({
        address: state.address,
        version: state.version,
        publicKey: state.publicKey,
      }),
    }
  )
);

// ─── Селекторы ────────────────────────────────────────────────────────────────

/**
 * Проверяет наличие зашифрованного vault в localStorage.
 * Истина означает, что кошелёк был создан/импортирован.
 */
export const isWalletCreated = (): boolean => hasVault();

/**
 * Проверяет, загружены ли данные кошелька в store.
 * Может быть false если vault есть, но persist ещё не восстановил адрес.
 */
export const hasWallet = (): boolean => useWalletStore.getState().address !== null;
