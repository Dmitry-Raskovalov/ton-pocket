/**
 * file: balance.ts
 * description: Balance fetching service for TON accounts
 * dependencies: client.ts, @ton/core
 * created: 2026-03-31
 */

import { Address } from '@ton/core';
import { getTonClient } from './client';

const NANOTON_PER_TON = 1_000_000_000n;

/**
 * Get account balance in nanotons.
 * Returns 0n for non-existent or uninitialised accounts.
 */
export async function getBalance(address: string): Promise<bigint> {
  const client = getTonClient();
  const parsed = Address.parse(address);

  try {
    return await client.getBalance(parsed);
  } catch (err: unknown) {
    // TonClient throws when the account doesn't exist ("account not found" / state = uninitialized)
    // Treat any such error as zero balance so callers don't need to handle it.
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('account not found') ||
      message.includes('not found') ||
      message.includes('ECONNREFUSED')
    ) {
      return 0n;
    }
    throw err;
  }
}

/**
 * Format nanotons as a human-readable TON string.
 * Examples:
 *   1_000_000_000n  → "1.000000000"
 *   500_000_000n    → "0.500000000"
 *   0n              → "0.000000000"
 */
export function formatTon(nanotons: bigint): string {
  const abs = nanotons < 0n ? -nanotons : nanotons;
  const whole = abs / NANOTON_PER_TON;
  const frac = abs % NANOTON_PER_TON;
  const fracStr = frac.toString().padStart(9, '0');
  const sign = nanotons < 0n ? '-' : '';
  return `${sign}${whole}.${fracStr}`;
}
