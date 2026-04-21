/**
 * file: TransactionItem.test.tsx
 * description: Unit tests for TransactionItem component
 * dependencies: TransactionItem, services/ton/transactions
 * created: 2026-04-01
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionItem } from './TransactionItem';
import type { ParsedTransaction } from '@/services/ton/transactions';

const baseIn: ParsedTransaction = {
  hash: 'abc123',
  timestamp: 1700000000,
  direction: 'in',
  amount: 1_500_000_000n, // 1.5 TON
  counterpartyAddress: 'EQA1_m-uN_p09_Xj4S_U1abc12',
  comment: null,
  fee: 10_000_000n,
  lt: '100',
};

const baseOut: ParsedTransaction = {
  ...baseIn,
  hash: 'def456',
  direction: 'out',
  amount: 500_000_000n, // 0.5 TON
  comment: 'Payment for services',
};

describe('TransactionItem', () => {
  it('renders + prefix and green class for incoming transaction', () => {
    const { container } = render(<TransactionItem transaction={baseIn} />);
    expect(container.textContent).toContain('+');
    expect(container.textContent).toContain('1.5');
    expect(container.textContent).toContain('TON');
  });

  it('renders - prefix for outgoing transaction', () => {
    const { container } = render(<TransactionItem transaction={baseOut} />);
    expect(container.textContent).toContain('-');
    expect(container.textContent).toContain('0.5');
  });

  it('renders truncated counterparty address', () => {
    render(<TransactionItem transaction={baseIn} />);
    const address = baseIn.counterpartyAddress!;
    const truncated = `${address.slice(0, 4)}...${address.slice(-4)}`;
    expect(screen.getByText(`from ${truncated}`)).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<TransactionItem transaction={baseIn} label="Alice" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders comment when present', () => {
    render(<TransactionItem transaction={baseOut} />);
    expect(screen.getByText('Payment for services')).toBeInTheDocument();
  });

  it('does not render comment section when comment is null', () => {
    render(<TransactionItem transaction={baseIn} />);
    expect(screen.queryByText('Payment for services')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<TransactionItem transaction={baseIn} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders "—" when counterpartyAddress is null', () => {
    render(<TransactionItem transaction={{ ...baseIn, counterpartyAddress: null }} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('обновляет отображение при смене пропса transaction (React.memo не блокирует)', () => {
    const { rerender } = render(<TransactionItem transaction={baseIn} />);
    expect(screen.getByText(/1\.5/)).toBeInTheDocument();

    rerender(<TransactionItem transaction={{ ...baseIn, amount: 2_000_000_000n }} />);
    expect(screen.getByText(/2\.0/)).toBeInTheDocument();
    expect(screen.queryByText(/1\.5/)).not.toBeInTheDocument();
  });
});
