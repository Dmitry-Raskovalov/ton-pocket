/**
 * file: screens/MainScreen.test.tsx
 * description: Unit tests for MainScreen — balance display, transaction list, filtering, search, pagination
 * dependencies: MainScreen, wallet-store, transaction-store, services/ton
 * created: 2026-04-01
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MainScreen } from './MainScreen';
import { useTransactionStore, getFilteredTransactions } from '@/store/transaction-store';
import type { ParsedTransaction } from '@/services/ton/transactions';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpdateBalance = vi.fn();
vi.mock('@/store/wallet-store', () => ({
  useWalletStore: () => ({
    address: '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    balance: 5_230_000_000n,
    updateBalance: mockUpdateBalance,
  }),
}));

vi.mock('@/store/transaction-store', () => ({
  useTransactionStore: vi.fn(),
  getFilteredTransactions: vi.fn(),
}));

const mockGetBalance = vi.fn().mockResolvedValue(5_230_000_000n);
vi.mock('@/services/ton/balance', () => ({
  getBalance: (...args: unknown[]) => mockGetBalance(...args),
  formatTon: (n: bigint) => {
    const whole = n / 1_000_000_000n;
    const frac = n % 1_000_000_000n;
    return `${whole}.${frac.toString().padStart(9, '0')}`;
  },
}));

const mockGetTransactions = vi.fn().mockResolvedValue([]);
vi.mock('@/services/ton/transactions', () => ({
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
}));

vi.mock('@/services/address-book', () => ({
  addressBook: { getEntries: () => [] },
}));

vi.mock('@ton/core', () => ({
  Address: {
    parseRaw: () => ({ toString: () => 'EQCmockAddress1234567890abcdef' }),
  },
}));

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const mockSetSearchQuery = vi.fn();
const mockSetDirectionFilter = vi.fn();
const mockSetTransactions = vi.fn();
const mockAppendTransactions = vi.fn();
const mockSetLoading = vi.fn();

function makeStoreState(
  overrides: Partial<ReturnType<typeof useTransactionStore>> = {}
): ReturnType<typeof useTransactionStore> {
  return {
    transactions: [],
    isLoading: false,
    hasMore: false,
    searchQuery: '',
    directionFilter: 'all',
    lastUpdateTimestamp: null,
    setTransactions: mockSetTransactions,
    appendTransactions: mockAppendTransactions,
    setSearchQuery: mockSetSearchQuery,
    setDirectionFilter: mockSetDirectionFilter,
    setLoading: mockSetLoading,
    ...overrides,
  };
}

function makeTx(overrides: Partial<ParsedTransaction> = {}): ParsedTransaction {
  return {
    hash: 'abc123',
    timestamp: Math.floor(Date.now() / 1000) - 60,
    direction: 'in',
    amount: 1_000_000_000n,
    counterpartyAddress: '0:sender1234567890abcdef',
    comment: null,
    fee: 10_000_000n,
    lt: '12345',
    ...overrides,
  };
}

const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/main', mockSetLocation],
}));

function renderScreen() {
  return render(<MainScreen />);
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('MainScreen — header and balance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTransactionStore).mockReturnValue(makeStoreState());
    vi.mocked(getFilteredTransactions).mockReturnValue([]);
  });

  it('renders Testnet badge', () => {
    renderScreen();
    expect(screen.getByText('Testnet')).toBeInTheDocument();
  });

  it('renders TON Wallet heading', () => {
    renderScreen();
    expect(screen.getByText('TON Wallet')).toBeInTheDocument();
  });

  it('renders balance amount from store (5.23 TON)', () => {
    renderScreen();
    // balance is 5_230_000_000n → formatBalance → "5.23"
    expect(screen.getByText(/5\.23/)).toBeInTheDocument();
    expect(screen.getByText('TON')).toBeInTheDocument();
  });

  it('calls onSettings when Settings button is clicked', () => {
    renderScreen();
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(mockSetLocation).toHaveBeenCalledWith('/settings');
  });

  it('calls onSend when Send button is clicked', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(mockSetLocation).toHaveBeenCalledWith('/send');
  });

  it('calls onReceive when Receive button is clicked', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: /receive/i }));
    expect(mockSetLocation).toHaveBeenCalledWith('/receive');
  });
});

describe('MainScreen — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransactions.mockResolvedValue([]);
    vi.mocked(getFilteredTransactions).mockReturnValue([]);
  });

  it('shows "No transactions yet" when list is empty and no filter active', () => {
    vi.mocked(useTransactionStore).mockReturnValue(makeStoreState());
    renderScreen();
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('shows "No matching transactions" when search query is active', () => {
    vi.mocked(useTransactionStore).mockReturnValue(
      makeStoreState({ searchQuery: 'alice' })
    );
    renderScreen();
    expect(screen.getByText('No matching transactions')).toBeInTheDocument();
  });

  it('shows "No matching transactions" when direction filter is active', () => {
    vi.mocked(useTransactionStore).mockReturnValue(
      makeStoreState({ directionFilter: 'in' })
    );
    renderScreen();
    expect(screen.getByText('No matching transactions')).toBeInTheDocument();
  });
});

describe('MainScreen — transaction list', () => {
  const txIn = makeTx({ hash: 'tx-in', direction: 'in', amount: 1_500_000_000n });
  const txOut = makeTx({ hash: 'tx-out', direction: 'out', amount: 500_000_000n });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransactions.mockResolvedValue([]);
    vi.mocked(useTransactionStore).mockReturnValue(
      makeStoreState({ transactions: [txIn, txOut] })
    );
    vi.mocked(getFilteredTransactions).mockReturnValue([txIn, txOut]);
  });

  it('renders two transaction rows', () => {
    renderScreen();
    // TransactionItem renders "from ..." or "to ..." for each counterparty address
    const froms = screen.getAllByText(/^from /i);
    expect(froms.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show "No transactions yet" when list is non-empty', () => {
    renderScreen();
    expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument();
  });
});

describe('MainScreen — filter tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransactions.mockResolvedValue([]);
    vi.mocked(useTransactionStore).mockReturnValue(makeStoreState());
    vi.mocked(getFilteredTransactions).mockReturnValue([]);
  });

  it('renders All / Incoming / Outgoing buttons', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Incoming' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outgoing' })).toBeInTheDocument();
  });

  it('calls setDirectionFilter("in") when Incoming clicked', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Incoming' }));
    expect(mockSetDirectionFilter).toHaveBeenCalledWith('in');
  });

  it('calls setDirectionFilter("out") when Outgoing clicked', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Outgoing' }));
    expect(mockSetDirectionFilter).toHaveBeenCalledWith('out');
  });

  it('calls setDirectionFilter("all") when All clicked', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(mockSetDirectionFilter).toHaveBeenCalledWith('all');
  });
});

describe('MainScreen — search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransactions.mockResolvedValue([]);
    vi.mocked(useTransactionStore).mockReturnValue(makeStoreState());
    vi.mocked(getFilteredTransactions).mockReturnValue([]);
  });

  it('calls setSearchQuery when user types in search field', () => {
    renderScreen();
    const input = screen.getByPlaceholderText('Search address or comment');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(mockSetSearchQuery).toHaveBeenCalledWith('Alice');
  });
});

describe('MainScreen — pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransactions.mockResolvedValue([]);
  });

  it('shows "Load more" button when hasMore=true', () => {
    vi.mocked(useTransactionStore).mockReturnValue(
      makeStoreState({ hasMore: true, transactions: [makeTx()] })
    );
    vi.mocked(getFilteredTransactions).mockReturnValue([makeTx()]);
    renderScreen();
    expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
  });

  it('hides "Load more" button when hasMore=false', () => {
    vi.mocked(useTransactionStore).mockReturnValue(
      makeStoreState({ hasMore: false, transactions: [makeTx()] })
    );
    vi.mocked(getFilteredTransactions).mockReturnValue([makeTx()]);
    renderScreen();
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });

  it('shows "End of History" when hasMore=false and list non-empty', () => {
    vi.mocked(useTransactionStore).mockReturnValue(
      makeStoreState({ hasMore: false, transactions: [makeTx()] })
    );
    vi.mocked(getFilteredTransactions).mockReturnValue([makeTx()]);
    renderScreen();
    expect(screen.getByText(/end of history/i)).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading=true and no transactions', () => {
    vi.mocked(useTransactionStore).mockReturnValue(
      makeStoreState({ isLoading: true, transactions: [] })
    );
    vi.mocked(getFilteredTransactions).mockReturnValue([]);
    renderScreen();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

