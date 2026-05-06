/**
 * file: self-send.ts
 * description: Check if sending funds to own address (self-send)
 * dependencies: contract-factory.ts, address-format.ts, types.ts
 * created: 2026-03-31
 */

import { Address } from '@ton/core';
import { createContract } from '../wallet/contract-factory';
import type { WalletVersion } from '../wallet/contract-factory';
import type { Warning } from './types';

const ALL_VERSIONS: WalletVersion[] = ['v3R2', 'v4R2', 'v5R1'];

/**
 * Checks if user is sending funds to themselves.
 * Compares recipientRaw with wallet addresses for all contract versions.
 *
 * @param recipientRaw - recipient address in raw format (0:hex)
 * @param walletPublicKey - sender wallet public key
 * @returns Warning if match found, otherwise null
 */
export function checkSelfSend(recipientRaw: string, walletPublicKey: Buffer): Warning | null {
  const recipient = Address.parseRaw(recipientRaw);

  for (const version of ALL_VERSIONS) {
    const contract = createContract(walletPublicKey, version);

    if (contract.address.equals(recipient)) {
      return {
        type: 'self_send',
        message: 'You are sending funds to your own address.',
        severity: 'warning',
        blocking: false,
      };
    }
  }

  return null;
}
