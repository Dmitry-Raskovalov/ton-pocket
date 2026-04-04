/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * file: hooks/useTransactions.test.ts
 * description: Tests for useTransactions hook
 */

import { renderHook, act } from '@testing-library/react';
import { useTransactions } from './useTransactions';
import { useTransactionStore } from '@/store/transaction-store';
import { useWalletStore } from '@/store/wallet-store';
import { addressBook } from '@/services/address-book';
import { getTransactions } from '@/services/ton/transactions';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@/store/wallet-store', () => ({
    useWalletStore: Object.assign(vi.fn(), { getState: vi.fn() }),
}));

vi.mock('@/store/ui-store', () => ({
    useUIStore: vi.fn(() => vi.fn()),
}));

vi.mock('@/store/transaction-store', () => ({
    useTransactionStore: Object.assign(vi.fn(), { getState: vi.fn() }),
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
        vi.mocked(useWalletStore).mockImplementation((selector: (s: any) => any) => selector({ address: 'test-address' }));

        vi.mocked(useTransactionStore).mockReturnValue({
            setTransactions: vi.fn(),
            appendTransactions: vi.fn(),
            setLoading: vi.fn(),
            transactions: [{ hash: 'existing_tx', lt: '1', direction: 'in' }],
            hasMore: true,
        } as unknown as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('fetchInitial loads initial TX and appends address book', async () => {
        vi.mocked(getTransactions).mockResolvedValue([
            { hash: 'new_tx1', counterpartyAddress: 'addr1', direction: 'in' },
            { hash: 'new_tx2', counterpartyAddress: 'addr2', direction: 'out' },
        ] as unknown as any);

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.refresh();
        });

        expect(getTransactions).toHaveBeenCalledWith('test-address', 20);

        // Only in-bounds entries should be added.
        expect(addressBook.addOrUpdateEntry).toHaveBeenCalledTimes(1);
        expect(addressBook.addOrUpdateEntry).toHaveBeenCalledWith({ address: 'addr1', source: 'received' });
    });

    it('loadMore triggers pagination logic', async () => {
        vi.mocked(getTransactions).mockResolvedValue([
            { hash: 'existing_tx', lt: '1', direction: 'in' },
            { hash: 'new_tx3', lt: '0', counterpartyAddress: 'addr3', direction: 'in' },
        ] as unknown as any);

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
            await result.current.loadMore();
        });

        expect(getTransactions).toHaveBeenCalledWith('test-address', 20, '1', 'existing_tx');
    });
});
