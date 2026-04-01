/**
 * file: hooks/useBalance.ts
 * description: Polling for balance updates and handling rate limit errors
 * created: 2026-04-01
 */

import { useEffect, useRef, useCallback } from 'react';
import { Address } from '@ton/core';
import { useWalletStore } from '@/store/wallet-store';
import { getBalance } from '@/services/ton/balance';
import { getTonClient, RateLimitError } from '@/services/ton/client';
import { useUIStore } from '@/store/ui-store';

const DEFAULT_POLL_INTERVAL = 10000;
const RATE_LIMIT_POLL_INTERVAL = 30000;

export function useBalance(onBalanceChange?: () => void) {
    const address = useWalletStore((state) => state.address);
    const addToast = useUIStore((state) => state.addToast);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const intervalMsRef = useRef(DEFAULT_POLL_INTERVAL);
    const onBalanceChangeRef = useRef(onBalanceChange);

    useEffect(() => {
        onBalanceChangeRef.current = onBalanceChange;
    }, [onBalanceChange]);

    const fetchBalanceAction = useCallback(async () => {
        if (!address) return;
        try {
            const [newBalance, contractState] = await Promise.all([
                getBalance(address),
                getTonClient().getContractState(Address.parseRaw(address)),
            ]);
            const currentBalance = useWalletStore.getState().balance;

            // Update activation status
            const isActive = contractState.state === 'active';
            useWalletStore.getState().setActivated(isActive);

            if (newBalance !== currentBalance) {
                useWalletStore.getState().updateBalance(newBalance);
                if (onBalanceChangeRef.current) {
                    onBalanceChangeRef.current();
                }
            }

            // Reset slow down on success
            if (intervalMsRef.current !== DEFAULT_POLL_INTERVAL) {
                intervalMsRef.current = DEFAULT_POLL_INTERVAL;
                startPollingRef.current();
            }
        } catch (err: unknown) {
            if (err instanceof RateLimitError) {
                addToast({ type: 'warning', message: 'Too many requests, wait...', duration: 3000 });
                if (intervalMsRef.current !== RATE_LIMIT_POLL_INTERVAL) {
                    intervalMsRef.current = RATE_LIMIT_POLL_INTERVAL;
                    startPollingRef.current();
                }
            } else {
                addToast({ type: 'error', message: 'Failed to fetch balance', duration: 3000 });
            }
        }
    }, [address, addToast]);

    const fetchActionRef = useRef(fetchBalanceAction);
    useEffect(() => {
        fetchActionRef.current = fetchBalanceAction;
    }, [fetchBalanceAction]);

    // Use function declaration to hoist it so fetchBalanceAction could use it, 
    // actually fetchBalanceAction calls startPolling directly, but startPolling is in scope if we hoist it... wait no, 
    // startPolling wasn't hoisted in my code above, wait.
    // Oh, wait, I can just use a ref for startPolling too.
    const startPollingRef = useRef<() => void>(() => { });

    const startPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            fetchActionRef.current();
        }, intervalMsRef.current);
    }, []);

    useEffect(() => {
        startPollingRef.current = startPolling;
    }, [startPolling]);

    // Patch fetchBalanceAction to use startPollingRef
    // Wait I should rewrite this a bit in the next step.
    useEffect(() => {
        if (address) {
            fetchActionRef.current();
            startPolling();
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [address, startPolling]);

    return { refresh: fetchBalanceAction };
}
