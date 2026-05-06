/**
 * file: hooks/useTransactions.test.ts
 * description: Tests for useTransactions hook
 */

import { renderHook, act } from '@testing-library/react';
import { useTransactions } from './useTransactions';
import { useTransactionStore } from '@/store/transaction-store';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';
import { addressBook } from '@/services/address-book';
import { getTransactions } from '@/services/ton/transactions';
import { RateLimitError } from '@/services/ton/client';
import type { ParsedTransaction } from '@/services/ton/transactions';
import type { WalletStore, UIStore, TransactionStore } from '@/store/types';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockAddToast = vi.hoisted(() => vi.fn());

vi.mock('@/store/wallet-store', () => ({
    useWalletStore: Object.assign(vi.fn(), { getState: vi.fn() }),
}));

vi.mock('@/store/ui-store', () => ({
    useUIStore: vi.fn((selector: (state: UIStore) => unknown) =>
        selector({ addToast: mockAddToast } as unknown as UIStore)
    ),
}));

const mockStoreState = {
    lastUpdateTimestamp: null as number | null,
    transactions: [] as ParsedTransaction[],
    hasMore: false,
    isLoading: false,
    setTransactions: vi.fn(),
    appendTransactions: vi.fn(),
    setLoading: vi.fn(),
};

vi.mock('@/store/transaction-store', () => ({
    useTransactionStore: Object.assign(vi.fn(), {
        getState: vi.fn(() => mockStoreState),
    }),
}));

vi.mock('@/services/ton/transactions', () => ({
    getTransactions: vi.fn(),
}));

vi.mock('@/services/address-book', () => ({
    addressBook: {
        addOrUpdateEntry: vi.fn(),
    },
}));

describe('useTransactions', () => {
    beforeEach(() => {
        vi.mocked(useWalletStore).mockImplementation(
            (selector: (s: WalletStore) => unknown) =>
                selector({ address: 'test-address' } as unknown as WalletStore),
        );

        mockStoreState.lastUpdateTimestamp = null;
        mockStoreState.transactions = [{ hash: 'existing_tx', lt: '1', direction: 'in' } as ParsedTransaction];
        mockStoreState.hasMore = true;
        mockStoreState.isLoading = false;

        vi.mocked(useTransactionStore).mockReturnValue({
            setTransactions: mockStoreState.setTransactions,
            appendTransactions: mockStoreState.appendTransactions,
            setLoading: mockStoreState.setLoading,
            transactions: mockStoreState.transactions,
            hasMore: mockStoreState.hasMore,
        } as unknown as TransactionStore);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('fetchInitial loads initial TX and populates address book only for inbound txs', async () => {
        vi.mocked(getTransactions).mockResolvedValue([
            { hash: 'new_tx1', counterpartyAddress: 'addr1', direction: 'in' } as ParsedTransaction,
            { hash: 'new_tx2', counterpartyAddress: 'addr2', direction: 'out' } as ParsedTransaction,
        ]);

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.refresh();
        });

        expect(getTransactions).toHaveBeenCalledWith('test-address', 20);

        // Only inbound entries should be added.
        expect(addressBook.addOrUpdateEntry).toHaveBeenCalledTimes(1);
        expect(addressBook.addOrUpdateEntry).toHaveBeenCalledWith({ address: 'addr1', source: 'received' });
    });

    it('loadMore triggers pagination logic', async () => {
        vi.mocked(getTransactions).mockResolvedValue([
            { hash: 'existing_tx', lt: '1', direction: 'in' } as ParsedTransaction,
            { hash: 'new_tx3', lt: '0', counterpartyAddress: 'addr3', direction: 'in' } as ParsedTransaction,
        ]);

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.loadMore();
        });

        expect(getTransactions).toHaveBeenCalledWith('test-address', 20, '1', 'existing_tx');
    });

    it('fetchInitial shows warning toast on RateLimitError', async () => {
        vi.mocked(getTransactions).mockRejectedValue(new RateLimitError());

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.refresh();
        });

        expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'warning' }),
        );
    });

    it('fetchInitial shows error toast on generic error', async () => {
        vi.mocked(getTransactions).mockRejectedValue(new Error('network failed'));

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.refresh();
        });

        expect(mockAddToast).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'error' }),
        );
    });

    it('fetchInitial is skipped when isLoading is true', async () => {
        mockStoreState.isLoading = true;

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.refresh();
        });

        expect(getTransactions).not.toHaveBeenCalled();
    });

    it('fetchInitial is skipped when lastUpdateTimestamp is fresh', async () => {
        mockStoreState.lastUpdateTimestamp = Date.now();

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.refresh();
        });

        expect(getTransactions).not.toHaveBeenCalled();
    });
});
