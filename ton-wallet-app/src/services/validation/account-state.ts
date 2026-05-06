/**
 * file: account-state.ts
 * description: Check recipient account state (uninit, active, frozen)
 * dependencies: client.ts, address-format.ts, types.ts
 * created: 2026-03-31
 */

import { Address } from '@ton/core';
import { getTonClient } from '../ton/client';
import { parseAddress } from './address-format';
import type { Warning } from './types';

/**
 * Checks recipient account state and returns array of warnings.
 * Returns empty array on network error — don't block transfer.
 *
 * @param recipientAddress - recipient address in any format (friendly or raw)
 */
export async function checkAccountState(recipientAddress: string): Promise<Warning[]> {
  let parsed: ReturnType<typeof parseAddress>;
  try {
    parsed = parseAddress(recipientAddress);
  } catch {
    return [];
  }

  let state: { state: string };
  try {
    const client = getTonClient();
    const address = Address.parseRaw(parsed.raw);
    state = await client.getContractState(address);
  } catch {
    // Network error — skip check
    return [];
  }

  const warnings: Warning[] = [];

  if (state.state === 'frozen') {
    warnings.push({
      type: 'account_frozen',
      message: 'Recipient account is frozen. Transfer may be lost.',
      severity: 'error',
      blocking: true,
    });
    return warnings;
  }

  if (state.state === 'uninit') {
    if (parsed.bounceable) {
      // Bounceable + uninit: funds will bounce back — error, blocking
      warnings.push({
        type: 'account_uninit',
        message: 'Recipient account is not initialized. Funds will be returned to sender.',
        severity: 'error',
        blocking: true,
      });
      warnings.push({
        type: 'bounce_risk',
        message: 'Address is bounceable — funds will be returned to sender if account is not initialized.',
        severity: 'error',
        blocking: true,
      });
    } else {
      // Non-bounceable + uninit: funds will be credited — inform, don't block
      warnings.push({
        type: 'account_uninit',
        message: 'Recipient account is not initialized. Funds will be credited, but recipient cannot use them until account activation.',
        severity: 'warning',
        blocking: false,
      });
    }
  }

  return warnings;
}
