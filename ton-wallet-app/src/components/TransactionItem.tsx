/**
 * file: TransactionItem.tsx
 * description: Single transaction row for the history list
 * dependencies: services/ton/transactions (ParsedTransaction), services/ton/balance (formatTon), lucide-react
 * created: 2026-04-01
 */

import { memo } from 'react';
import { ArrowDownLeft, ArrowUpRight, MessageSquare } from 'lucide-react';
import { formatTon } from '@/services/ton/balance';
import type { ParsedTransaction } from '@/services/ton/transactions';

export interface TransactionItemProps {
  transaction: ParsedTransaction;
  /** Optional address-book label for the counterparty */
  label?: string;
  onClick?: () => void;
}

/** Formats timestamp to HH:MM or "Yesterday" or locale date */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Truncates address: first 4 + "..." + last 4 chars */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/** Formats nanotons to compact TON string (up to 4 significant decimal places) */
function formatAmount(nanotons: bigint): string {
  const full = formatTon(nanotons); // e.g. "1.500000000"
  const [whole, frac] = full.split('.');
  const trimmed = frac.replace(/0+$/, '').slice(0, 4) || '0';
  return `${whole}.${trimmed}`;
}

export const TransactionItem = memo(function TransactionItem({ transaction, label, onClick }: TransactionItemProps) {
  const isIn = transaction.direction === 'in';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className="flex items-center justify-between p-3 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
    >
      {/* Left: icon + address info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Direction icon */}
        <div
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
            isIn ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-error/10 text-error'
          }`}
        >
          {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
        </div>

        {/* Address / label / comment */}
        <div className="min-w-0">
          {label ? (
            <p className="text-xs font-bold text-on-surface truncate">{label}</p>
          ) : null}
          <p className="text-[10px] font-mono text-outline-variant">
            {transaction.counterpartyAddress
              ? (isIn ? 'from ' : 'to ') + truncateAddress(transaction.counterpartyAddress)
              : '—'}
          </p>
          {transaction.comment && (
            <p className="text-[10px] text-on-surface-variant flex items-center gap-1 truncate max-w-[160px]">
              <MessageSquare size={10} className="shrink-0" />
              {transaction.comment}
            </p>
          )}
        </div>
      </div>

      {/* Right: amount + time */}
      <div className="text-right shrink-0 ml-2">
        <p
          className={`text-xs font-bold ${isIn ? 'text-[#22c55e]' : 'text-on-surface'}`}
        >
          {isIn ? '+' : '-'}{formatAmount(transaction.amount)} TON
        </p>
        <p className="text-[10px] text-outline-variant">
          {formatTime(transaction.timestamp)}
        </p>
      </div>
    </div>
  );
});
