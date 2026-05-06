/**
 * file: services/wallet/seed-wallet-data.ts
 * description: Best-effort seeding of wallet/transaction stores with initial
 *   balance and transaction history. Used after unlock/create/import to avoid
 *   relying on MainScreen mount-effect timing or balance-change polling
 *   (which never fires when balance is 0n and stays 0n).
 * dependencies: services/ton/balance, services/ton/transactions, store/wallet-store, store/transaction-store
 * created: 2026-05-06
 */

import { getBalance } from '@/services/ton/balance';
import { getTransactions } from '@/services/ton/transactions';
import { useWalletStore } from '@/store/wallet-store';
import { useTransactionStore } from '@/store/transaction-store';

const PAGE_SIZE = 20;

/**
 * Fetch initial balance and recent transactions for the given address and
 * push them into the corresponding Zustand stores. Errors are swallowed
 * (logged only) — MainScreen's polling/mount-effect remains a fallback.
 *
 * If the active wallet address changes (e.g. user resets wallet) before the
 * fire-and-forget fetches resolve, the late results are dropped to avoid
 * polluting the new wallet's stores with stale data.
 */
export function seedWalletData(address: string): void {
  if (!address) return;

  const isStillActive = () => useWalletStore.getState().address === address;

  getBalance(address)
    .then((b) => {
      if (isStillActive()) useWalletStore.getState().updateBalance(b);
    })
    .catch((err) => console.error('[seedWalletData] balance fetch failed', err));

  getTransactions(address, PAGE_SIZE)
    .then((txs) => {
      if (isStillActive()) {
        useTransactionStore.getState().setTransactions(txs, txs.length === PAGE_SIZE);
      }
    })
    .catch((err) => console.error('[seedWalletData] transactions fetch failed', err));
}
