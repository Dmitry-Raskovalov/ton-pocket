/**
 * file: hooks/useTransactions.ts
 * description: Хук для загрузки списка транзакций, пагинации и автопополнения адресной книги
 * created: 2026-04-01
 */

import { useCallback } from 'react';
import { useTransactionStore } from '@/store/transaction-store';
import { getTransactions } from '@/services/ton/transactions';
import { addressBook } from '@/services/address-book';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';

const PAGE_SIZE = 20;

export function useTransactions() {
    const address = useWalletStore((state) => state.address);
    const { setTransactions, appendTransactions, setLoading, transactions, hasMore } = useTransactionStore();
    const addToast = useUIStore((state) => state.addToast);

    const fetchInitial = useCallback(async () => {
        if (!address) return;
        setLoading(true);
        try {
            const txs = await getTransactions(address, PAGE_SIZE);
            setTransactions(txs, txs.length === PAGE_SIZE);

            txs.forEach((tx) => {
                if (tx.direction === 'in' && tx.counterpartyAddress) {
                    addressBook.addOrUpdateEntry({
                        address: tx.counterpartyAddress,
                        source: 'received',
                    });
                }
            });
        } catch (err) {
            addToast({ type: 'error', message: 'Failed to load transactions', duration: 3000 });
        } finally {
            setLoading(false);
        }
    }, [address, setTransactions, setLoading, addToast]);

    const loadMore = useCallback(async () => {
        if (!address || !hasMore || transactions.length === 0) return;
        setLoading(true);
        try {
            const lastTx = transactions[transactions.length - 1];
            const txs = await getTransactions(address, PAGE_SIZE, lastTx.lt, lastTx.hash);

            // Deduplicate
            const newTxs = txs.filter((newTx) => !transactions.some((t) => t.hash === newTx.hash));

            appendTransactions(newTxs, txs.length === PAGE_SIZE);

            newTxs.forEach((tx) => {
                if (tx.direction === 'in' && tx.counterpartyAddress) {
                    addressBook.addOrUpdateEntry({
                        address: tx.counterpartyAddress,
                        source: 'received',
                    });
                }
            });
        } catch (err) {
            addToast({ type: 'error', message: 'Failed to load more transactions', duration: 3000 });
        } finally {
            setLoading(false);
        }
    }, [address, hasMore, transactions, appendTransactions, setLoading, addToast]);

    return { refresh: fetchInitial, loadMore };
}
