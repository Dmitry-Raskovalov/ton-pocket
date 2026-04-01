/**
 * file: screens/MainScreen.tsx
 * description: Main wallet screen — balance, action buttons, transaction history with search and filtering
 * dependencies: wallet-store, transaction-store, components, services/ton/balance, services/ton/transactions, services/address-book
 * created: 2026-04-01
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Wallet, Settings, Send, ArrowDownToLine, Inbox } from 'lucide-react';
import { Address } from '@ton/core';
import { useWalletStore } from '@/store/wallet-store';
import { useTransactionStore, getFilteredTransactions } from '@/store/transaction-store';
import { getBalance, formatTon } from '@/services/ton/balance';
import { getTransactions } from '@/services/ton/transactions';
import { addressBook } from '@/services/address-book';
import { CopyButton, HighlightedAddress, TransactionItem, SearchBar } from '@/components';

const POLL_INTERVAL_MS = 30_000;
const PAGE_SIZE = 20;

const FILTER_TABS: { key: DirectionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in', label: 'Incoming' },
  { key: 'out', label: 'Outgoing' },
];

/** Format nanotons: max 4 decimal places, trailing zeros stripped */
function formatBalance(nanotons: bigint): string {
  const full = formatTon(nanotons);
  const [whole, frac] = full.split('.');
  const trimmed = frac.replace(/0+$/, '') || '0';
  return `${whole}.${trimmed.slice(0, 4)}`;
}

/** "Updated X sec ago" / "Updated X min ago" */
function formatUpdateAge(timestamp: number | null): string {
  if (timestamp === null) return '';
  const sec = Math.floor((Date.now() - timestamp) / 1000);
  if (sec < 60) return `Updated ${sec} sec ago`;
  return `Updated ${Math.floor(sec / 60)} min ago`;
}

/** Convert raw "0:hex" address to user-friendly EQ.../UQ... */
function toUserFriendly(raw: string): string {
  try {
    return Address.parseRaw(raw).toString({ bounceable: false });
  } catch {
    return raw;
  }
}

export function MainScreen() {
  const [, setLocation] = useLocation();
  const { address: rawAddress, balance, updateBalance } = useWalletStore();
  const {
    transactions,
    isLoading,
    hasMore,
    searchQuery,
    directionFilter,
    lastUpdateTimestamp,
    setTransactions,
    appendTransactions,
    setSearchQuery,
    setDirectionFilter,
    setLoading,
  } = useTransactionStore();

  const [updateAgeLabel, setUpdateAgeLabel] = useState('');
  const lastUpdateTimestampRef = useRef(lastUpdateTimestamp);

  const displayAddress = rawAddress ? toUserFriendly(rawAddress) : '';

  // Build label map from address book for TransactionItem labels
  const labelMap: Record<string, string> = {};
  for (const entry of addressBook.getEntries()) {
    if (entry.label) labelMap[entry.address] = entry.label;
  }

  const filteredTx = getFilteredTransactions(labelMap);

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadInitial = useCallback(async () => {
    if (!rawAddress) return;
    setLoading(true);
    try {
      const txs = await getTransactions(rawAddress, PAGE_SIZE + 1);
      setTransactions(txs.slice(0, PAGE_SIZE), txs.length > PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [rawAddress, setTransactions, setLoading]);

  const loadMore = useCallback(async () => {
    if (!rawAddress || isLoading || !hasMore || transactions.length === 0) return;
    setLoading(true);
    try {
      const last = transactions[transactions.length - 1];
      const txs = await getTransactions(rawAddress, PAGE_SIZE + 1, last.lt, last.hash);
      appendTransactions(txs.slice(0, PAGE_SIZE), txs.length > PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [rawAddress, isLoading, hasMore, transactions, appendTransactions, setLoading]);

  const refreshBalance = useCallback(async () => {
    if (!rawAddress) return;
    try {
      const bal = await getBalance(rawAddress);
      updateBalance(bal);
    } catch {
      // keep last known value on error
    }
  }, [rawAddress, updateBalance]);

  // Mount: load transactions and balance
  useEffect(() => {
    void loadInitial();
    void refreshBalance();
  }, [loadInitial, refreshBalance]);

  // Poll balance every 30 sec
  useEffect(() => {
    const id = setInterval(() => void refreshBalance(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshBalance]);

  // Keep ref in sync so the interval always reads the latest timestamp
  useEffect(() => {
    lastUpdateTimestampRef.current = lastUpdateTimestamp;
  }, [lastUpdateTimestamp]);

  // "Updated X sec ago" ticker
  useEffect(() => {
    const tick = () => setUpdateAgeLabel(formatUpdateAge(lastUpdateTimestampRef.current));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col min-h-screen items-center bg-background text-on-background">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-background flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-primary" />
            <span className="font-bold uppercase text-xs tracking-tight text-on-surface">
              TON Wallet
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-sm uppercase">
              Testnet
            </span>
            <button
              onClick={() => setLocation('/settings')}
              aria-label="Settings"
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <main className="flex-1 px-6 pt-4 pb-10 space-y-8">

          {/* Balance section */}
          <section className="flex flex-col items-center text-center space-y-5 py-4">
            {/* Address pill */}
            <div className="inline-flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-full">
              <HighlightedAddress address={displayAddress} truncate />
              <CopyButton text={displayAddress} />
            </div>

            {/* Balance */}
            <h2 className="text-5xl font-extrabold tracking-tighter text-on-surface leading-none">
              {formatBalance(balance)}{' '}
              <span className="text-primary text-3xl">TON</span>
            </h2>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2 w-full">
              <button
                onClick={() => setLocation('/receive')}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold active:scale-95 transition-transform border border-white/5"
              >
                <ArrowDownToLine size={18} />
                Receive
              </button>
              <button
                onClick={() => setLocation('/send')}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed rounded-xl font-extrabold active:scale-95 transition-transform shadow-lg shadow-primary/10"
              >
                <Send size={18} />
                Send
              </button>
            </div>
          </section>

          {/* Transactions section */}
          <section className="space-y-5">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface">
                Transactions
              </h3>
              {lastUpdateTimestamp !== null && updateAgeLabel && (
                <span className="text-[10px] font-medium text-tertiary uppercase tracking-tighter">
                  {updateAgeLabel}
                </span>
              )}
            </div>

            {/* Search & direction filters */}
            <div className="space-y-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search address or comment"
              />
              <div className="flex gap-2">
                {FILTER_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDirectionFilter(key)}
                    className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      directionFilter === key
                        ? 'bg-primary text-on-primary-fixed'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial loading spinner */}
            {isLoading && transactions.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>

            /* Empty state */
            ) : filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-8 text-center bg-surface-container rounded-xl border border-white/[0.02]">
                <div className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center mb-6">
                  <Inbox size={28} className="text-on-surface-variant" />
                </div>
                <h3 className="text-on-surface font-bold text-base mb-2">
                  {searchQuery || directionFilter !== 'all'
                    ? 'No matching transactions'
                    : 'No transactions yet'}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-[240px]">
                  {searchQuery || directionFilter !== 'all'
                    ? 'Try changing your search or filter.'
                    : 'Send or receive TON to see your transaction history.'}
                </p>
              </div>

            /* Transaction list */
            ) : (
              <div className="space-y-3 pt-2">
                {filteredTx.map((tx) => (
                  <TransactionItem
                    key={tx.hash}
                    transaction={tx}
                    label={tx.counterpartyAddress ? labelMap[tx.counterpartyAddress] : undefined}
                  />
                ))}

                {/* Load more */}
                {hasMore && (
                  <button
                    onClick={() => void loadMore()}
                    disabled={isLoading}
                    className="w-full py-3 text-xs font-bold text-primary uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Loading…' : 'Load more'}
                  </button>
                )}

                {/* End of history marker */}
                {!hasMore && (
                  <div className="py-8 flex justify-center opacity-20 select-none">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
                      End of History
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
