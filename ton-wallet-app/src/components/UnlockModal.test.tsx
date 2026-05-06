/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnlockModal } from './UnlockModal';
import * as vault from '@/crypto/vault';
import type { EncryptedVault } from '@/crypto/types';
import { getBalance } from '@/services/ton/balance';
import { getTransactions } from '@/services/ton/transactions';

// ─── Setup Mocks ─────────────────────────────────────────────────────────────

const mockSetUnlocked = vi.fn();
const mockUpdateBalance = vi.fn();
const mockSetTransactions = vi.fn();
const mockClearWallet = vi.fn();

const mockNavigate = vi.fn();
vi.mock('wouter', () => ({
    useLocation: () => ['/', mockNavigate],
}));

vi.mock('@/store/wallet-store', () => ({
    useWalletStore: Object.assign(
        vi.fn((selector: (s: any) => any) => selector({
            address: 'mock_address',
            updateBalance: mockUpdateBalance,
            setUnlocked: mockSetUnlocked,
            clearWallet: mockClearWallet,
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

vi.mock('@/crypto/session', () => ({
    setSessionPassword: vi.fn(),
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

    it('логирует ошибку в console.error если getBalance падает после анлока', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(vault, 'loadVault').mockReturnValue({} as EncryptedVault);
        vi.spyOn(vault, 'decrypt').mockResolvedValue('{"some":"data"}');
        vi.mocked(getBalance).mockRejectedValueOnce(new Error('network error'));

        render(<UnlockModal />);
        fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'correct' } });
        fireEvent.click(screen.getByRole('button', { name: /unlock/i }));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('balance fetch failed'),
                expect.any(Error),
            );
        });
        consoleSpy.mockRestore();
    });

    it('логирует ошибку в console.error если getTransactions падает после анлока', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(vault, 'loadVault').mockReturnValue({} as EncryptedVault);
        vi.spyOn(vault, 'decrypt').mockResolvedValue('{"some":"data"}');
        vi.mocked(getTransactions).mockRejectedValueOnce(new Error('tx error'));

        render(<UnlockModal />);
        fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'correct' } });
        fireEvent.click(screen.getByRole('button', { name: /unlock/i }));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('transactions fetch failed'),
                expect.any(Error),
            );
        });
        consoleSpy.mockRestore();
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

    // ─── Delete Wallet (gear menu) ──────────────────────────────────────────

    it('renders gear button', () => {
        render(<UnlockModal />);
        expect(screen.getByRole('button', { name: /wallet options/i })).toBeInTheDocument();
    });

    it('opens dropdown and shows Delete Wallet option on gear click', () => {
        render(<UnlockModal />);
        fireEvent.click(screen.getByRole('button', { name: /wallet options/i }));
        expect(screen.getByText('Delete Wallet')).toBeInTheDocument();
    });

    it('closes dropdown when clicking Delete Wallet and shows confirmation dialog', () => {
        render(<UnlockModal />);
        fireEvent.click(screen.getByRole('button', { name: /wallet options/i }));
        fireEvent.click(screen.getByText('Delete Wallet'));
        expect(screen.getByText('The wallet will be removed from browser storage only.')).toBeInTheDocument();
        expect(screen.getByText(/import this wallet again/i)).toBeInTheDocument();
    });

    it('cancel button closes confirmation dialog', () => {
        render(<UnlockModal />);
        fireEvent.click(screen.getByRole('button', { name: /wallet options/i }));
        fireEvent.click(screen.getByText('Delete Wallet'));
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(screen.queryByText('The wallet will be removed from browser storage only.')).not.toBeInTheDocument();
    });

    it('confirm delete calls clearVault, clearWallet, resetUnlockAttempts and redirects', () => {
        const clearVaultSpy = vi.spyOn(vault, 'clearVault').mockImplementation(() => {});

        render(<UnlockModal />);
        fireEvent.click(screen.getByRole('button', { name: /wallet options/i }));
        fireEvent.click(screen.getByText('Delete Wallet'));
        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

        expect(clearVaultSpy).toHaveBeenCalledOnce();
        expect(mockClearWallet).toHaveBeenCalledOnce();
        expect(mockStoreState.resetUnlockAttempts).toHaveBeenCalledOnce();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
