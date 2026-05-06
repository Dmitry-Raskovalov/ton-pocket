/**
 * file: hooks/useTransactions.ts
 * description: Хук для загрузки списка транзакций, пагинации и автопополнения адресной книги
 * created: 2026-04-01
 */

import { useCallback, useRef } from 'react';
import { useTransactionStore } from '@/store/transaction-store';
import { getTransactions } from '@/services/ton/transactions';
import { addressBook } from '@/services/address-book';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';
import { RateLimitError } from '@/services/ton/client';

const PAGE_SIZE = 20;
/** Skip mount-effect fetch if seeding ran within this window — avoids the
 *  double-request that previously hit toncenter rate limits on cold start. */
const SEED_FRESHNESS_MS = 5000;

export function useTransactions() {
    const address = useWalletStore((state) => state.address);
    const { setTransactions, appendTransactions, setLoading } = useTransactionStore();
    const addToast = useUIStore((state) => state.addToast);

    // Refs to avoid stale closures in loadMore without adding them to deps
    const addressRef = useRef(address);
    addressRef.current = address;

    const fetchInitial = useCallback(async () => {
        if (!addressRef.current) return;
        if (useTransactionStore.getState().isLoading) return;

        // If `seedWalletData` (called during unlock/create/import) populated
        // the store within the last few seconds, skip — the data is fresh and
        // a duplicate fetch only spends rate-limit budget for nothing.
        const seededAt = useTransactionStore.getState().lastUpdateTimestamp;
        if (seededAt !== null && Date.now() - seededAt < SEED_FRESHNESS_MS) return;

        setLoading(true);
        try {
            const txs = await getTransactions(addressRef.current, PAGE_SIZE);
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
            if (err instanceof RateLimitError) {
                addToast({ type: 'warning', message: 'Too many requests, wait...', duration: 3000 });
            } else {
                addToast({ type: 'error', message: 'Failed to load transactions', duration: 3000 });
            }
        } finally {
            setLoading(false);
        }
    }, [setTransactions, setLoading, addToast]);

    // Stable loadMore — reads live store state via getState() to avoid
    // including `transactions`/`hasMore` in deps (which would recreate the
    // function on every append and cause the IntersectionObserver to
    // reconnect, immediately re-triggering and looping infinitely).
    const loadMore = useCallback(async () => {
        const { transactions, hasMore, isLoading } = useTransactionStore.getState();
        if (!addressRef.current || !hasMore || isLoading || transactions.length === 0) return;
        setLoading(true);
        try {
            const lastTx = transactions[transactions.length - 1];
            const txs = await getTransactions(addressRef.current, PAGE_SIZE, lastTx.lt, lastTx.hash);

            // Deduplicate
            const currentTxs = useTransactionStore.getState().transactions;
            const newTxs = txs.filter((newTx) => !currentTxs.some((t) => t.hash === newTx.hash));

            // If cursor didn't advance (all fetched txs were already stored),
            // stop pagination — otherwise the next call would repeat the same page.
            appendTransactions(newTxs, newTxs.length > 0 && txs.length === PAGE_SIZE);

            newTxs.forEach((tx) => {
                if (tx.direction === 'in' && tx.counterpartyAddress) {
                    addressBook.addOrUpdateEntry({
                        address: tx.counterpartyAddress,
                        source: 'received',
                    });
                }
            });
        } catch (err) {
            // Stop pagination on error to prevent rapid retry loops.
            // User can pull-to-refresh to resume if they want more.
            appendTransactions([], false);
            if (err instanceof RateLimitError) {
                addToast({ type: 'warning', message: 'Too many requests, wait...', duration: 3000 });
            } else {
                addToast({ type: 'error', message: 'Failed to load more transactions', duration: 3000 });
            }
        } finally {
            setLoading(false);
        }
    }, [appendTransactions, setLoading, addToast]);

    return { refresh: fetchInitial, loadMore };
}
