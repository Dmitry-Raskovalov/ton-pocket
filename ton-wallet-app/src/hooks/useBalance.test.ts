/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * file: hooks/useBalance.test.ts
 * description: Tests for useBalance hook
 */

import { renderHook, act } from '@testing-library/react';
import { useBalance } from './useBalance';
import { useWalletStore } from '@/store/wallet-store';
import { getBalance } from '@/services/ton/balance';
import { getTonClient } from '@/services/ton/client';
import { useUIStore } from '@/store/ui-store';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@/store/wallet-store', () => ({
    useWalletStore: Object.assign(
        vi.fn(),
        {
            getState: vi.fn(),
        }
    ),
}));

vi.mock('@/services/ton/balance', () => ({
    getBalance: vi.fn(),
}));

vi.mock('@/services/ton/client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/services/ton/client')>();
    return {
        ...actual,
        getTonClient: vi.fn(),
    };
});

vi.mock('@/store/ui-store', () => ({
    useUIStore: vi.fn(),
}));

describe('useBalance', () => {
    const mockGetContractState = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers();
        // Mock useWalletStore as a selector hook
        vi.mocked(useWalletStore).mockImplementation((selector: (s: any) => any) =>
            selector({ address: '0:' + 'a'.repeat(64) })
        );

        // Mock getTonClient to return object with getContractState
        vi.mocked(getTonClient).mockReturnValue({
            getContractState: mockGetContractState,
        } as unknown as any);
        mockGetContractState.mockResolvedValue({ state: 'active' });

        // Mock UI store addToast
        vi.mocked(useUIStore).mockReturnValue(vi.fn() as unknown as any);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('fetches balance initially and starts polling', async () => {
        vi.mocked(getBalance).mockResolvedValue(200n);
        const updateBalanceMock = vi.fn();
        const setActivatedMock = vi.fn();
        vi.mocked((useWalletStore as unknown as any).getState).mockReturnValue({
            balance: 100n,
            updateBalance: updateBalanceMock,
            setActivated: setActivatedMock,
        });

        renderHook(() => useBalance());

        // Wait for the initial fetch
        await act(async () => {
            await Promise.resolve();
        });

        expect(getBalance).toHaveBeenCalledTimes(1);
        expect(updateBalanceMock).toHaveBeenCalledWith(200n);
        expect(setActivatedMock).toHaveBeenCalledWith(true);

        // Advance 10 seconds for next poll
        vi.mocked(getBalance).mockResolvedValue(300n);
        vi.mocked((useWalletStore as unknown as any).getState).mockReturnValue({
            balance: 200n,
            updateBalance: updateBalanceMock,
            setActivated: setActivatedMock,
        });

        await act(async () => {
            vi.advanceTimersByTime(10000);
            await Promise.resolve();
        });

        expect(getBalance).toHaveBeenCalledTimes(2);
        expect(updateBalanceMock).toHaveBeenCalledWith(300n);
    });

    it('calls onBalanceChange callback when balance changes', async () => {
        vi.mocked(getBalance).mockResolvedValue(200n);
        vi.mocked((useWalletStore as unknown as any).getState).mockReturnValue({
            balance: 100n,
            updateBalance: vi.fn(),
            setActivated: vi.fn(),
        });
        const cb = vi.fn();

        renderHook(() => useBalance(cb));

        await act(async () => {
            await Promise.resolve();
        });

        expect(cb).toHaveBeenCalled();
    });

    it('calls setActivated(true) when contract state is active', async () => {
        vi.mocked(getBalance).mockResolvedValue(100n);
        const setActivatedMock = vi.fn();
        vi.mocked((useWalletStore as unknown as any).getState).mockReturnValue({
            balance: 100n,
            updateBalance: vi.fn(),
            setActivated: setActivatedMock,
        });
        mockGetContractState.mockResolvedValue({ state: 'active' });

        renderHook(() => useBalance());

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(setActivatedMock).toHaveBeenCalledWith(true);
    });

    it('calls setActivated(false) when contract state is uninit', async () => {
        vi.mocked(getBalance).mockResolvedValue(100n);
        const setActivatedMock = vi.fn();
        vi.mocked((useWalletStore as unknown as any).getState).mockReturnValue({
            balance: 100n,
            updateBalance: vi.fn(),
            setActivated: setActivatedMock,
        });
        mockGetContractState.mockResolvedValue({ state: 'uninit' });

        renderHook(() => useBalance());

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(setActivatedMock).toHaveBeenCalledWith(false);
    });

    it('cleans up interval on unmount', async () => {
        vi.mocked(getBalance).mockResolvedValue(200n);
        vi.mocked((useWalletStore as unknown as any).getState).mockReturnValue({
            balance: 100n,
            updateBalance: vi.fn(),
            setActivated: vi.fn(),
        });

        const { unmount } = renderHook(() => useBalance());

        // Wait for initial fetch
        await act(async () => {
            await Promise.resolve();
        });

        unmount();

        // After unmount, advancing time should not trigger more calls
        act(() => {
            vi.advanceTimersByTime(10000);
        });

        // Only the initial fetch (1 call), no polling after unmount
        expect(getBalance).toHaveBeenCalledTimes(1);
    });
});
