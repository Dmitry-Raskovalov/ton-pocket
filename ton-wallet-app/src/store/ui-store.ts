/**
 * file: store/ui-store.ts
 * description: Zustand store для UI-состояния: loading, toast-уведомления, блокировка unlock-попыток
 * dependencies: zustand, store/types
 * created: 2026-03-31
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIStore } from './types';

const STORE_NAME = 'ton-pocket-ui';
const MAX_UNLOCK_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 минут

import type { Toast } from './types';

const initialState = {
  isLoading: false,
  toasts: [] as Toast[],
  unlockAttempts: 0,
  lockedUntil: null as number | null,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLoading: (isLoading) => set({ isLoading }),

      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
          ],
        })),

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      incrementUnlockAttempts: () => {
        const nextAttempts = get().unlockAttempts + 1;
        if (nextAttempts >= MAX_UNLOCK_ATTEMPTS) {
          set({
            unlockAttempts: 0,
            lockedUntil: Date.now() + LOCK_DURATION_MS,
          });
        } else {
          set({ unlockAttempts: nextAttempts });
        }
      },

      resetUnlockAttempts: () => set({ unlockAttempts: 0 }),

      setLockedUntil: (lockedUntil) => set({ lockedUntil }),
    }),
    {
      name: STORE_NAME,
      // Персистируем только lockedUntil — перезагрузка не должна сбрасывать блокировку.
      // isLoading, toasts, unlockAttempts — эфемерные, сбрасываются при старте.
      partialize: (state) => ({
        lockedUntil: state.lockedUntil,
      }),
    }
  )
);
