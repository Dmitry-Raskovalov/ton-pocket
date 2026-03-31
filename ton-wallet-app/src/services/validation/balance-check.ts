/**
 * file: balance-check.ts
 * description: Проверка достаточности баланса для суммы перевода и комиссии
 * dependencies: ton/transfer.ts (ESTIMATED_FEE), types.ts
 * created: 2026-03-31
 */

import { ESTIMATED_FEE } from '../ton/transfer';
import type { Warning } from './types';

/** 0.05 TON в нанотонах — порог для предупреждения о низком остатке */
const LOW_REMAINDER_THRESHOLD = 50_000_000n;

/**
 * Проверяет достаточность баланса для перевода указанной суммы с учётом комиссии.
 *
 * Проверки:
 * #7 — amount > balance → error, blocking
 * #8 — amount + ESTIMATED_FEE > balance → error, blocking
 * #9 — balance - amount - ESTIMATED_FEE < 0.05 TON → warning, non-blocking
 *
 * @param amount - сумма перевода в нанотонах
 * @param balance - текущий баланс в нанотонах
 */
export function checkBalance(amount: bigint, balance: bigint): Warning[] {
  const warnings: Warning[] = [];

  // Проверка #7: сумма превышает баланс
  if (amount > balance) {
    warnings.push({
      type: 'insufficient_balance',
      message: 'Сумма перевода превышает баланс.',
      severity: 'error',
      blocking: true,
    });
    return warnings;
  }

  // Проверка #8: сумма + комиссия превышают баланс
  if (amount + ESTIMATED_FEE > balance) {
    warnings.push({
      type: 'insufficient_balance_with_fee',
      message: 'Недостаточно средств для покрытия суммы перевода и комиссии.',
      severity: 'error',
      blocking: true,
    });
    return warnings;
  }

  // Проверка #9: низкий остаток после перевода
  const remainder = balance - amount - ESTIMATED_FEE;
  if (remainder < LOW_REMAINDER_THRESHOLD) {
    warnings.push({
      type: 'low_remainder',
      message: 'После перевода на кошельке останется менее 0.05 TON.',
      severity: 'warning',
      blocking: false,
    });
  }

  return warnings;
}
