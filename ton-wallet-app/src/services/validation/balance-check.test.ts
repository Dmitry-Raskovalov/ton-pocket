/**
 * file: balance-check.test.ts
 * description: Unit tests for balance and fee check
 * dependencies: balance-check.ts
 * created: 2026-03-31
 */

import { describe, it, expect } from 'vitest';
import { checkBalance } from './balance-check';
import { ESTIMATED_FEE } from '../ton/transfer';

/** 0.05 TON in nanotons */


describe('checkBalance', () => {
  it('returns empty array with sufficient balance and good remainder', () => {
    // balance = 2 TON, amount = 1 TON, fee = 0.01 TON, remainder ≈ 0.99 TON
    const balance = 2_000_000_000n;
    const amount = 1_000_000_000n;
    const result = checkBalance(amount, balance);
    expect(result).toEqual([]);
  });

  // Check #7: amount > balance → error, blocking
  it('returns insufficient_balance when amount exceeds balance (#7)', () => {
    const balance = 500_000_000n; // 0.5 TON
    const amount = 1_000_000_000n; // 1 TON
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'insufficient_balance',
      message: 'Transfer amount exceeds balance.',
      severity: 'error',
      blocking: true,
    });
  });

  // Check #8: amount = balance (no fee reserve) → error, blocking
  it('returns insufficient_balance_with_fee when amount equals balance (#8)', () => {
    const balance = 1_000_000_000n; // 1 TON
    const amount = 1_000_000_000n; // 1 TON (= balance, but fee won't fit)
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'insufficient_balance_with_fee',
      message: 'Insufficient funds to cover transfer amount and fee.',
      severity: 'error',
      blocking: true,
    });
  });

  it('returns insufficient_balance_with_fee when amount + fee > balance', () => {
    // balance = 1 TON, amount = 0.995 TON, fee = 0.01 TON → total = 1.005 TON > 1 TON
    const balance = 1_000_000_000n;
    const amount = 995_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('insufficient_balance_with_fee');
    expect(result[0].severity).toBe('error');
    expect(result[0].blocking).toBe(true);
  });

  // Edge case: amount + fee = balance (exactly enough, remainder = 0)
  it('returns low_remainder when amount + fee = balance (remainder = 0)', () => {
    // balance = 1 TON, amount = 0.99 TON, fee = 0.01 TON → remainder = 0
    const balance = 1_000_000_000n;
    const amount = 990_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('low_remainder');
    expect(result[0].severity).toBe('warning');
    expect(result[0].blocking).toBe(false);
  });

  // Check #9: low remainder < 0.05 TON → warning, non-blocking
  it('returns low_remainder when remainder less than 0.05 TON (#9)', () => {
    // balance = 1 TON, amount = 0.945 TON, fee = 0.01 TON → remainder = 0.045 TON
    const balance = 1_000_000_000n;
    const amount = 945_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'low_remainder',
      message: 'After transfer, wallet balance will be less than 0.05 TON.',
      severity: 'warning',
      blocking: false,
    });
  });

  it('does not return low_remainder when remainder exactly 0.05 TON', () => {
    // balance = 1 TON, amount = 0.94 TON, fee = 0.01 TON → remainder = 0.05 TON
    const balance = 1_000_000_000n;
    const amount = 940_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toEqual([]);
  });

  it('does not return low_remainder when remainder more than 0.05 TON', () => {
    // balance = 1 TON, amount = 0.93 TON, fee = 0.01 TON → remainder = 0.06 TON
    const balance = 1_000_000_000n;
    const amount = 930_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toEqual([]);
  });

  it('returns insufficient_balance with zero balance and non-zero amount', () => {
    const result = checkBalance(1n, 0n);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('insufficient_balance');
  });

  it('returns empty array with zero amount and positive balance', () => {
    const result = checkBalance(0n, 1_000_000_000n);
    expect(result).toEqual([]);
  });

  it('correctly uses ESTIMATED_FEE from transfer.ts', () => {
    expect(ESTIMATED_FEE).toBe(10_000_000n);
  });
});
