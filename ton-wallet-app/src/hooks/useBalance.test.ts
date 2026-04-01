/**
 * file: hooks/useBalance.test.ts
 * description: Tests for useBalance hook
 */

import { renderHook, act } from '@testing-library/react';
import { useBalance } from './useBalance';
import { useWalletStore } from '@/store/wallet-store';
import { getBalance } from '@/services/ton/balance';
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

vi.mock('@/store/ui-store', () => ({
    useUIStore: vi.fn(),
}));

describe('useBalance', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(useWalletStore).mockImplementation((selector: any) => selector({ address: 'test-address' }));
        vi.mocked((useWalletStore as any).getState).mockReturnValue({ balance: 100n, updateBalance: vi.fn() });

        // Mock UI store addToast to do nothing
        vi.mocked(useUIStore).mockReturnValue(vi.fn());
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('fetches balance initially and starts polling', async () => {
        vi.mocked(getBalance).mockResolvedValue(200n);
        const updateBalanceMock = vi.fn();
        vi.mocked((useWalletStore as any).getState).mockReturnValue({ balance: 100n, updateBalance: updateBalanceMock });

        const { result } = renderHook(() => useBalance());

        // Should fetch initially immediately on mount
        await act(async () => {
            // Wait for the initial promise loop
            await Promise.resolve();
        });

        expect(getBalance).toHaveBeenCalledWith('test-address');
        expect(updateBalanceMock).toHaveBeenCalledWith(200n);

        // Initial fetch (1)
        expect(getBalance).toHaveBeenCalledTimes(1);

        // Advance 10 seconds
        vi.mocked(getBalance).mockResolvedValue(300n);
        await act(async () => {
            vi.advanceTimersByTime(10000);
            await Promise.resolve();
        });

        // Should have polled again
        expect(getBalance).toHaveBeenCalledTimes(2);
        expect(updateBalanceMock).toHaveBeenCalledWith(300n);
    });

    it('calls onBalanceChange callback when balance changes', async () => {
        vi.mocked(getBalance).mockResolvedValue(200n);
        const cb = vi.fn();

        renderHook(() => useBalance(cb));

        await act(async () => {
            await Promise.resolve();
        });

        expect(cb).toHaveBeenCalled();
    });

    it('cleans up interval on unmount', () => {
        const { unmount } = renderHook(() => useBalance());

        unmount();

        // Changing balance and advancing time should not trigger anything
        vi.mocked(getBalance).mockResolvedValue(500n);
        act(() => {
            vi.advanceTimersByTime(10000);
        });

        expect(getBalance).toHaveBeenCalledTimes(1); // Only the initial call
    });
});
