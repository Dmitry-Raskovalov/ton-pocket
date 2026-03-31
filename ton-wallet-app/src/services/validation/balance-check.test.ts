/**
 * file: balance-check.test.ts
 * description: Юнит-тесты для проверки баланса и комиссии
 * dependencies: balance-check.ts
 * created: 2026-03-31
 */

import { describe, it, expect } from 'vitest';
import { checkBalance } from './balance-check';
import { ESTIMATED_FEE } from '../ton/transfer';

/** 0.05 TON в нанотонах */
const LOW_THRESHOLD = 50_000_000n;

describe('checkBalance', () => {
  it('возвращает пустой массив при достаточном балансе и хорошем остатке', () => {
    // balance = 2 TON, amount = 1 TON, fee = 0.01 TON, remainder ≈ 0.99 TON
    const balance = 2_000_000_000n;
    const amount = 1_000_000_000n;
    const result = checkBalance(amount, balance);
    expect(result).toEqual([]);
  });

  // Проверка #7: amount > balance → error, blocking
  it('возвращает insufficient_balance когда сумма превышает баланс (#7)', () => {
    const balance = 500_000_000n; // 0.5 TON
    const amount = 1_000_000_000n; // 1 TON
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'insufficient_balance',
      message: 'Сумма перевода превышает баланс.',
      severity: 'error',
      blocking: true,
    });
  });

  // Проверка #8: amount = balance (нет запаса на комиссию) → error, blocking
  it('возвращает insufficient_balance_with_fee когда сумма равна балансу (#8)', () => {
    const balance = 1_000_000_000n; // 1 TON
    const amount = 1_000_000_000n; // 1 TON (= balance, но fee не влезет)
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'insufficient_balance_with_fee',
      message: 'Недостаточно средств для покрытия суммы перевода и комиссии.',
      severity: 'error',
      blocking: true,
    });
  });

  it('возвращает insufficient_balance_with_fee когда amount + fee > balance', () => {
    // balance = 1 TON, amount = 0.995 TON, fee = 0.01 TON → total = 1.005 TON > 1 TON
    const balance = 1_000_000_000n;
    const amount = 995_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('insufficient_balance_with_fee');
    expect(result[0].severity).toBe('error');
    expect(result[0].blocking).toBe(true);
  });

  // Граница: amount + fee = balance (ровно хватает, remainder = 0)
  it('возвращает low_remainder когда amount + fee = balance (остаток = 0)', () => {
    // balance = 1 TON, amount = 0.99 TON, fee = 0.01 TON → remainder = 0
    const balance = 1_000_000_000n;
    const amount = 990_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('low_remainder');
    expect(result[0].severity).toBe('warning');
    expect(result[0].blocking).toBe(false);
  });

  // Проверка #9: low remainder < 0.05 TON → warning, non-blocking
  it('возвращает low_remainder когда остаток менее 0.05 TON (#9)', () => {
    // balance = 1 TON, amount = 0.945 TON, fee = 0.01 TON → remainder = 0.045 TON
    const balance = 1_000_000_000n;
    const amount = 945_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'low_remainder',
      message: 'После перевода на кошельке останется менее 0.05 TON.',
      severity: 'warning',
      blocking: false,
    });
  });

  it('не возвращает low_remainder когда остаток ровно 0.05 TON', () => {
    // balance = 1 TON, amount = 0.94 TON, fee = 0.01 TON → remainder = 0.05 TON
    const balance = 1_000_000_000n;
    const amount = 940_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toEqual([]);
  });

  it('не возвращает low_remainder когда остаток более 0.05 TON', () => {
    // balance = 1 TON, amount = 0.93 TON, fee = 0.01 TON → remainder = 0.06 TON
    const balance = 1_000_000_000n;
    const amount = 930_000_000n;
    const result = checkBalance(amount, balance);

    expect(result).toEqual([]);
  });

  it('возвращает insufficient_balance при нулевом балансе и ненулевой сумме', () => {
    const result = checkBalance(1n, 0n);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('insufficient_balance');
  });

  it('возвращает пустой массив при нулевой сумме и положительном балансе', () => {
    const result = checkBalance(0n, 1_000_000_000n);
    expect(result).toEqual([]);
  });

  it('корректно использует ESTIMATED_FEE из transfer.ts', () => {
    expect(ESTIMATED_FEE).toBe(10_000_000n);
  });
});
