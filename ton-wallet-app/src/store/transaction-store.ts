/**
 * file: store/transaction-store.ts
 * description: Zustand store для списка транзакций, пагинации и клиентской фильтрации/поиска
 * dependencies: zustand, store/types, services/ton/transactions
 * created: 2026-03-31
 */

import { create } from 'zustand';
import type { ParsedTransaction } from '@/services/ton/transactions';
import type { TransactionStore } from './types';

const initialState = {
  transactions: [] as ParsedTransaction[],
  isLoading: false,
  hasMore: false,
  searchQuery: '',
  directionFilter: 'all' as const,
  lastUpdateTimestamp: null,
};

export const useTransactionStore = create<TransactionStore>()((set) => ({
  ...initialState,

  setTransactions: (transactions, hasMore = false) =>
    set({ transactions, hasMore, lastUpdateTimestamp: Date.now() }),

  appendTransactions: (transactions, hasMore = false) =>
    set((state) => ({
      transactions: [...state.transactions, ...transactions],
      hasMore,
      lastUpdateTimestamp: Date.now(),
    })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setDirectionFilter: (directionFilter) => set({ directionFilter }),

  setLoading: (isLoading) => set({ isLoading }),
}));

// ─── Селектор filteredTransactions ───────────────────────────────────────────

/**
 * Возвращает отфильтрованный и найденный список транзакций.
 *
 * @param labelMap  Опциональный словарь { rawAddress → label } из адресной книги.
 *                  Если передан, поиск также матчит по метке контрагента.
 */
export function getFilteredTransactions(
  labelMap: Record<string, string> = {},
): ParsedTransaction[] {
  const { transactions, searchQuery, directionFilter } = useTransactionStore.getState();

  let result = transactions;

  // ── фильтр направления ────────────────────────────────────────────────────
  if (directionFilter !== 'all') {
    result = result.filter((tx) => tx.direction === directionFilter);
  }

  // ── текстовый поиск ───────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter((tx) => {
      const addressMatch = tx.counterpartyAddress?.toLowerCase().includes(q) ?? false;
      const commentMatch = tx.comment?.toLowerCase().includes(q) ?? false;
      const label = tx.counterpartyAddress ? (labelMap[tx.counterpartyAddress] ?? '') : '';
      const labelMatch = label.toLowerCase().includes(q);
      return addressMatch || commentMatch || labelMatch;
    });
  }

  return result;
}
