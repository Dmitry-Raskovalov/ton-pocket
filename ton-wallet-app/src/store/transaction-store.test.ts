/**
 * file: store/transaction-store.test.ts
 * description: Юнит-тесты для Transaction Store (задача 5.2)
 * dependencies: transaction-store
 * created: 2026-03-31
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useTransactionStore, getFilteredTransactions } from './transaction-store';
import type { ParsedTransaction } from '@/services/ton/transactions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTx(overrides: Partial<ParsedTransaction> = {}): ParsedTransaction {
  return {
    hash: `hash-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    direction: 'in',
    amount: 1_000_000_000n,
    counterpartyAddress: '0:aaaa',
    comment: null,
    fee: 5_000_000n,
    lt: '1000',
    ...overrides,
  };
}

function resetStore() {
  useTransactionStore.setState({
    transactions: [],
    isLoading: false,
    hasMore: false,
    searchQuery: '',
    directionFilter: 'all',
    lastUpdateTimestamp: null,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useTransactionStore', () => {
  beforeEach(resetStore);

  // ── начальное состояние ───────────────────────────────────────────────────

  describe('начальное состояние', () => {
    it('transactions — [], isLoading — false, hasMore — false, searchQuery — "", directionFilter — "all"', () => {
      const s = useTransactionStore.getState();
      expect(s.transactions).toEqual([]);
      expect(s.isLoading).toBe(false);
      expect(s.hasMore).toBe(false);
      expect(s.searchQuery).toBe('');
      expect(s.directionFilter).toBe('all');
      expect(s.lastUpdateTimestamp).toBeNull();
    });
  });

  // ── setTransactions ───────────────────────────────────────────────────────

  describe('setTransactions', () => {
    it('заменяет список транзакций', () => {
      const tx1 = makeTx();
      const tx2 = makeTx({ direction: 'out' });
      useTransactionStore.getState().setTransactions([tx1]);
      useTransactionStore.getState().setTransactions([tx2]);
      expect(useTransactionStore.getState().transactions).toEqual([tx2]);
    });

    it('устанавливает hasMore', () => {
      useTransactionStore.getState().setTransactions([makeTx()], true);
      expect(useTransactionStore.getState().hasMore).toBe(true);
    });

    it('hasMore по умолчанию false', () => {
      useTransactionStore.getState().setTransactions([makeTx()]);
      expect(useTransactionStore.getState().hasMore).toBe(false);
    });

    it('обновляет lastUpdateTimestamp', () => {
      const before = Date.now();
      useTransactionStore.getState().setTransactions([]);
      expect(useTransactionStore.getState().lastUpdateTimestamp).toBeGreaterThanOrEqual(before);
    });
  });

  // ── appendTransactions ────────────────────────────────────────────────────

  describe('appendTransactions', () => {
    it('добавляет транзакции к существующему списку, не перезаписывая', () => {
      const tx1 = makeTx({ lt: '1' });
      const tx2 = makeTx({ lt: '2' });
      const tx3 = makeTx({ lt: '3' });

      useTransactionStore.getState().setTransactions([tx1, tx2]);
      useTransactionStore.getState().appendTransactions([tx3]);

      const { transactions } = useTransactionStore.getState();
      expect(transactions).toHaveLength(3);
      expect(transactions[0].lt).toBe('1');
      expect(transactions[2].lt).toBe('3');
    });

    it('устанавливает hasMore при append', () => {
      useTransactionStore.getState().appendTransactions([makeTx()], true);
      expect(useTransactionStore.getState().hasMore).toBe(true);
    });

    it('обновляет lastUpdateTimestamp', () => {
      const before = Date.now();
      useTransactionStore.getState().appendTransactions([makeTx()]);
      expect(useTransactionStore.getState().lastUpdateTimestamp).toBeGreaterThanOrEqual(before);
    });
  });

  // ── setLoading ────────────────────────────────────────────────────────────

  describe('setLoading', () => {
    it('устанавливает isLoading', () => {
      useTransactionStore.getState().setLoading(true);
      expect(useTransactionStore.getState().isLoading).toBe(true);
      useTransactionStore.getState().setLoading(false);
      expect(useTransactionStore.getState().isLoading).toBe(false);
    });
  });

  // ── setSearchQuery / setDirectionFilter ───────────────────────────────────

  describe('setSearchQuery', () => {
    it('сохраняет строку поиска', () => {
      useTransactionStore.getState().setSearchQuery('0:aaaa');
      expect(useTransactionStore.getState().searchQuery).toBe('0:aaaa');
    });
  });

  describe('setDirectionFilter', () => {
    it('устанавливает фильтр направления', () => {
      useTransactionStore.getState().setDirectionFilter('in');
      expect(useTransactionStore.getState().directionFilter).toBe('in');
    });
  });
});

// ─── getFilteredTransactions ──────────────────────────────────────────────────

describe('getFilteredTransactions', () => {
  const txIn1 = makeTx({ direction: 'in', counterpartyAddress: '0:aabb', comment: 'оплата' });
  const txIn2 = makeTx({ direction: 'in', counterpartyAddress: '0:ccdd', comment: null });
  const txOut = makeTx({ direction: 'out', counterpartyAddress: '0:eeff', comment: 'возврат' });

  beforeEach(() => {
    resetStore();
    useTransactionStore.getState().setTransactions([txIn1, txIn2, txOut]);
    useTransactionStore.setState({ searchQuery: '', directionFilter: 'all' });
  });

  // ── фильтр направления ───────────────────────────────────────────────────

  describe('фильтр направления', () => {
    it('all — возвращает все транзакции', () => {
      expect(getFilteredTransactions()).toHaveLength(3);
    });

    it('in — только входящие', () => {
      useTransactionStore.getState().setDirectionFilter('in');
      const result = getFilteredTransactions();
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.direction === 'in')).toBe(true);
    });

    it('out — только исходящие', () => {
      useTransactionStore.getState().setDirectionFilter('out');
      const result = getFilteredTransactions();
      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('out');
    });
  });

  // ── текстовый поиск по адресу ─────────────────────────────────────────────

  describe('поиск по адресу контрагента', () => {
    it('находит по части адреса (lower-case)', () => {
      useTransactionStore.getState().setSearchQuery('aabb');
      expect(getFilteredTransactions()).toHaveLength(1);
      expect(getFilteredTransactions()[0].counterpartyAddress).toBe('0:aabb');
    });

    it('находит несколько совпадений', () => {
      useTransactionStore.getState().setSearchQuery('0:');
      expect(getFilteredTransactions()).toHaveLength(3);
    });

    it('не находит несуществующий адрес', () => {
      useTransactionStore.getState().setSearchQuery('0:zzzz');
      expect(getFilteredTransactions()).toHaveLength(0);
    });
  });

  // ── текстовый поиск по комментарию ────────────────────────────────────────

  describe('поиск по комментарию', () => {
    it('находит по подстроке комментария', () => {
      useTransactionStore.getState().setSearchQuery('оплат');
      expect(getFilteredTransactions()).toHaveLength(1);
      expect(getFilteredTransactions()[0].comment).toBe('оплата');
    });

    it('не находит если комментарий null', () => {
      useTransactionStore.getState().setSearchQuery('оплата');
      const result = getFilteredTransactions();
      expect(result.some((t) => t.counterpartyAddress === '0:ccdd')).toBe(false);
    });
  });

  // ── текстовый поиск по label адресной книги ───────────────────────────────

  describe('поиск по label из адресной книги', () => {
    it('находит по label контрагента', () => {
      const labelMap = { '0:ccdd': 'Биржа' };
      useTransactionStore.getState().setSearchQuery('биржа');
      const result = getFilteredTransactions(labelMap);
      expect(result).toHaveLength(1);
      expect(result[0].counterpartyAddress).toBe('0:ccdd');
    });

    it('не находит если label не совпадает', () => {
      const labelMap = { '0:ccdd': 'Биржа' };
      useTransactionStore.getState().setSearchQuery('банк');
      expect(getFilteredTransactions(labelMap)).toHaveLength(0);
    });
  });

  // ── комбинация фильтра и поиска ───────────────────────────────────────────

  describe('комбинация направления и поиска', () => {
    it('фильтр "in" + поиск по адресу', () => {
      useTransactionStore.getState().setDirectionFilter('in');
      useTransactionStore.getState().setSearchQuery('aabb');
      const result = getFilteredTransactions();
      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('in');
      expect(result[0].counterpartyAddress).toBe('0:aabb');
    });

    it('фильтр "out" + поиск не находит входящие', () => {
      useTransactionStore.getState().setDirectionFilter('out');
      useTransactionStore.getState().setSearchQuery('aabb');
      expect(getFilteredTransactions()).toHaveLength(0);
    });
  });

  // ── пустой поиск ─────────────────────────────────────────────────────────

  it('пробелы в searchQuery игнорируются (trim)', () => {
    useTransactionStore.getState().setSearchQuery('   ');
    expect(getFilteredTransactions()).toHaveLength(3);
  });
});
