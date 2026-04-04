/**
 * file: hooks/useBalance.ts
 * description: Polling for balance updates and handling rate limit errors
 * created: 2026-04-01
 */

import { useEffect, useRef, useCallback, useState } from 'react';
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
    const [pollInterval, setPollInterval] = useState(DEFAULT_POLL_INTERVAL);
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
            if (pollInterval !== DEFAULT_POLL_INTERVAL) {
                setPollInterval(DEFAULT_POLL_INTERVAL);
            }
        } catch (err: unknown) {
            if (err instanceof RateLimitError) {
                addToast({ type: 'warning', message: 'Too many requests, wait...', duration: 3000 });
                if (pollInterval !== RATE_LIMIT_POLL_INTERVAL) {
                    setPollInterval(RATE_LIMIT_POLL_INTERVAL);
                }
            } else {
                addToast({ type: 'error', message: 'Failed to fetch balance', duration: 3000 });
            }
        }
    }, [address, addToast, pollInterval]);

    useEffect(() => {
        if (!address) return;

        // Perform immediate fetch
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchBalanceAction();

        // Start polling
        const id = setInterval(() => {
            fetchBalanceAction();
        }, pollInterval);

        return () => clearInterval(id);
    }, [address, pollInterval, fetchBalanceAction]);

    return { refresh: fetchBalanceAction };
}
