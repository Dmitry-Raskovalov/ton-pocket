/**
 * file: balance-check.ts
 * description: Check if balance is sufficient for transfer amount and fee
 * dependencies: ton/transfer.ts (ESTIMATED_FEE), types.ts
 * created: 2026-03-31
 */

import { ESTIMATED_FEE } from '../ton/transfer';
import type { Warning } from './types';

/** 0.05 TON in nanotons — threshold for low balance warning */
const LOW_REMAINDER_THRESHOLD = 50_000_000n;

/**
 * Checks if balance is sufficient for the transfer amount including fee.
 *
 * Checks:
 * #7 — amount > balance → error, blocking
 * #8 — amount + ESTIMATED_FEE > balance → error, blocking
 * #9 — balance - amount - ESTIMATED_FEE < 0.05 TON → warning, non-blocking
 *
 * @param amount - transfer amount in nanotons
 * @param balance - current balance in nanotons
 */
export function checkBalance(amount: bigint, balance: bigint): Warning[] {
  const warnings: Warning[] = [];

  // Check #7: amount exceeds balance
  if (amount > balance) {
    warnings.push({
      type: 'insufficient_balance',
      message: 'Transfer amount exceeds balance.',
      severity: 'error',
      blocking: true,
    });
    return warnings;
  }

  // Check #8: amount + fee exceed balance
  if (amount + ESTIMATED_FEE > balance) {
    warnings.push({
      type: 'insufficient_balance_with_fee',
      message: 'Insufficient funds to cover transfer amount and fee.',
      severity: 'error',
      blocking: true,
    });
    return warnings;
  }

  // Check #9: low remainder after transfer
  const remainder = balance - amount - ESTIMATED_FEE;
  if (remainder < LOW_REMAINDER_THRESHOLD) {
    warnings.push({
      type: 'low_remainder',
      message: 'After transfer, wallet balance will be less than 0.05 TON.',
      severity: 'warning',
      blocking: false,
    });
  }

  return warnings;
}
