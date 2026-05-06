/**
 * file: services/wallet/seed-wallet-data.test.ts
 * description: Unit tests for seedWalletData — fire-and-forget seeding of
 *   wallet/transaction stores after unlock/create/import. Covers happy path,
 *   empty-address early-return, error swallowing, and stale-address guard.
 * created: 2026-05-06
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpdateBalance = vi.fn();
const mockSetTransactions = vi.fn();
const mockGetWalletState = vi.fn();
const mockGetBalance = vi.fn();
const mockGetTransactions = vi.fn();

vi.mock('@/services/ton/balance', () => ({
  getBalance: (...args: unknown[]) => mockGetBalance(...args),
}));

vi.mock('@/services/ton/transactions', () => ({
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
}));

vi.mock('@/store/wallet-store', () => ({
  useWalletStore: {
    getState: () => mockGetWalletState(),
  },
}));

vi.mock('@/store/transaction-store', () => ({
  useTransactionStore: {
    getState: () => ({ setTransactions: mockSetTransactions }),
  },
}));

import { seedWalletData } from './seed-wallet-data';

const ADDRESS = '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

describe('seedWalletData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWalletState.mockReturnValue({
      address: ADDRESS,
      updateBalance: mockUpdateBalance,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when address is empty', () => {
    seedWalletData('');
    expect(mockGetBalance).not.toHaveBeenCalled();
    expect(mockGetTransactions).not.toHaveBeenCalled();
  });

  it('writes fetched balance into wallet store on success', async () => {
    mockGetBalance.mockResolvedValueOnce(123_456_789n);
    mockGetTransactions.mockResolvedValueOnce([]);

    seedWalletData(ADDRESS);
    await vi.waitFor(() => expect(mockUpdateBalance).toHaveBeenCalledWith(123_456_789n));
  });

  it('writes fetched transactions into transaction store on success', async () => {
    const txs = [{ hash: 'h1' }, { hash: 'h2' }] as never[];
    mockGetBalance.mockResolvedValueOnce(0n);
    mockGetTransactions.mockResolvedValueOnce(txs);

    seedWalletData(ADDRESS);
    // hasMore is true only when result fills the page (length === 20)
    await vi.waitFor(() => expect(mockSetTransactions).toHaveBeenCalledWith(txs, false));
  });

  it('marks hasMore=true when full page is returned', async () => {
    const txs = Array.from({ length: 20 }, (_, i) => ({ hash: `h${i}` })) as never[];
    mockGetBalance.mockResolvedValueOnce(0n);
    mockGetTransactions.mockResolvedValueOnce(txs);

    seedWalletData(ADDRESS);
    await vi.waitFor(() => expect(mockSetTransactions).toHaveBeenCalledWith(txs, true));
  });

  it('logs and swallows balance fetch errors without crashing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetBalance.mockRejectedValueOnce(new Error('balance boom'));
    mockGetTransactions.mockResolvedValueOnce([]);

    expect(() => seedWalletData(ADDRESS)).not.toThrow();
    await vi.waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('balance fetch failed'),
        expect.any(Error),
      ),
    );
    expect(mockUpdateBalance).not.toHaveBeenCalled();
  });

  it('logs and swallows transaction fetch errors without crashing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetBalance.mockResolvedValueOnce(0n);
    mockGetTransactions.mockRejectedValueOnce(new Error('tx boom'));

    expect(() => seedWalletData(ADDRESS)).not.toThrow();
    await vi.waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('transactions fetch failed'),
        expect.any(Error),
      ),
    );
    expect(mockSetTransactions).not.toHaveBeenCalled();
  });

  it('drops late balance result when active wallet address has changed', async () => {
    let resolveBalance!: (b: bigint) => void;
    mockGetBalance.mockReturnValueOnce(
      new Promise<bigint>((resolve) => {
        resolveBalance = resolve;
      }),
    );
    mockGetTransactions.mockResolvedValueOnce([]);

    seedWalletData(ADDRESS);

    // Simulate user resetting wallet — store address changes mid-flight.
    mockGetWalletState.mockReturnValue({
      address: '0:differentaddress',
      updateBalance: mockUpdateBalance,
    });
    resolveBalance(999n);

    // Wait one microtask cycle for the .then to run.
    await Promise.resolve();
    await Promise.resolve();
    expect(mockUpdateBalance).not.toHaveBeenCalled();
  });

  it('drops late transactions result when active wallet address has changed', async () => {
    let resolveTxs!: (t: never[]) => void;
    mockGetBalance.mockResolvedValueOnce(0n);
    mockGetTransactions.mockReturnValueOnce(
      new Promise<never[]>((resolve) => {
        resolveTxs = resolve;
      }),
    );

    seedWalletData(ADDRESS);

    mockGetWalletState.mockReturnValue({
      address: null,
      updateBalance: mockUpdateBalance,
    });
    resolveTxs([{ hash: 'late' }] as never[]);

    await Promise.resolve();
    await Promise.resolve();
    expect(mockSetTransactions).not.toHaveBeenCalled();
  });
});
