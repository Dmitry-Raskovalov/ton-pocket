/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnlockModal } from './UnlockModal';
import * as vault from '@/crypto/vault';
import type { EncryptedVault } from '@/crypto/types';

// ─── Setup Mocks ─────────────────────────────────────────────────────────────

const mockSetUnlocked = vi.fn();
const mockUpdateBalance = vi.fn();
const mockSetTransactions = vi.fn();

vi.mock('@/store/wallet-store', () => ({
    useWalletStore: Object.assign(
        vi.fn((selector: (s: any) => any) => selector({
            address: 'mock_address',
            updateBalance: mockUpdateBalance,
            setUnlocked: mockSetUnlocked
        })),
        {
            getState: () => ({
                address: 'mock_address',
                updateBalance: mockUpdateBalance
            })
        }
    ),
    isWalletCreated: vi.fn()
}));

vi.mock('@/store/transaction-store', () => ({
    useTransactionStore: Object.assign(
        vi.fn(),
        {
            getState: () => ({
                setTransactions: mockSetTransactions
            })
        }
    )
}));

const mockStoreState = {
    unlockAttempts: 0,
    lockedUntil: null as number | null,
    incrementUnlockAttempts: vi.fn(),
    resetUnlockAttempts: vi.fn(),
    setLockedUntil: vi.fn(),
};

vi.mock('@/store/ui-store', () => ({
    useUIStore: vi.fn((selector) => selector(mockStoreState))
}));

vi.mock('@/services/ton/balance', () => ({
    getBalance: vi.fn().mockResolvedValue(100n)
}));
vi.mock('@/services/ton/transactions', () => ({
    getTransactions: vi.fn().mockResolvedValue([])
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('UnlockModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreState.unlockAttempts = 0;
        mockStoreState.lockedUntil = null;
    });

    it('renders standard unlock form', () => {
        render(<UnlockModal />);
        expect(screen.getByText('Unlock Wallet')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    });

    it('shows error on incorrect password and increments attempts', async () => {
        vi.spyOn(vault, 'loadVault').mockReturnValue({} as EncryptedVault);
        vi.spyOn(vault, 'decrypt').mockRejectedValue(new Error('Invalid password'));

        render(<UnlockModal />);

        // Simulate invalid password entry
        fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button', { name: /unlock/i }));

        await waitFor(() => {
            expect(screen.getByText('Incorrect password')).toBeInTheDocument();
            expect(mockStoreState.incrementUnlockAttempts).toHaveBeenCalled();
        });
    });

    it('lockout logic prevents interaction if lockedUntil is set in the future', () => {
        mockStoreState.unlockAttempts = 5;
        mockStoreState.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes out

        render(<UnlockModal />);

        // Form is replaced with lockout message
        expect(screen.getByText('Too many attempts')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Enter password')).not.toBeInTheDocument();

        // Check if the timer is formatting appropriately
        expect(screen.getByText(/Try again in 5:00/)).toBeInTheDocument();
    });

    it('unlocks and fetches initial data upon providing the correct password', async () => {
        vi.spyOn(vault, 'loadVault').mockReturnValue({} as EncryptedVault);
        vi.spyOn(vault, 'decrypt').mockResolvedValue('{"some":"data"}');

        render(<UnlockModal />);

        fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'correct' } });
        fireEvent.click(screen.getByRole('button', { name: /unlock/i }));

        await waitFor(() => {
            expect(mockStoreState.resetUnlockAttempts).toHaveBeenCalled();
            expect(mockSetUnlocked).toHaveBeenCalledWith(true);
        });
    });
});
