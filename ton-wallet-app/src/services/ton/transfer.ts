/**
 * file: transfer.ts
 * description: Transaction sending service with seqno polling and timeout
 * dependencies: client.ts, @ton/ton, @ton/core
 * created: 2026-03-31
 */

import { Address, Cell, comment as makeComment } from '@ton/core';
import type {
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5R1,
} from '@ton/ton';
import { internal } from '@ton/ton';
import { getTonClient } from './client';

// --- Types ---

export type WalletContract = WalletContractV3R2 | WalletContractV4 | WalletContractV5R1;

export interface TransferParams {
  /** Recipient address (user-friendly or raw format) */
  recipient: string | Address;
  /** Amount to send in nanotons */
  amount: bigint;
  /** Optional text comment */
  comment?: string;
  /** Wallet contract instance */
  contract: WalletContract;
  /** Secret key for signing (64 bytes: 32 bytes public + 32 bytes private) */
  secretKey: Buffer;
}

export type TransferStatus = 'confirmed' | 'timeout' | 'error';

export interface TransferResult {
  /** Transaction status */
  status: TransferStatus;
  /** Transaction hash (hex string) if confirmed */
  hash?: string;
  /** Error message if status is 'error' */
  error?: string;
}

// --- Constants ---

/** Estimated transfer fee: 0.01 TON (covers 95% of cases on testnet) */
export const ESTIMATED_FEE = 10_000_000n;

const SEQNO_POLL_INTERVAL_MS = 2000; // 2 seconds
const SEQNO_TIMEOUT_MS = 30000; // 30 seconds

// --- Helper ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get current seqno from the blockchain for a wallet contract.
 */
async function getSeqno(contract: WalletContract): Promise<number> {
  const client = getTonClient();
  try {
    return await client.getContractState(contract.address).then((state) => {
      if (state.state === 'active' && state.seqno !== undefined) {
        return state.seqno;
      }
      return 0;
    });
  } catch {
    // Contract not deployed yet
    return 0;
  }
}

// --- Public API ---

/**
 * Send a TON transfer transaction with seqno polling for confirmation.
 *
 * Steps:
 * 1. Get current seqno from blockchain
 * 2. Create transfer message with contract.createTransfer()
 * 3. Send via client.sendExternalMessage()
 * 4. Poll seqno every 2 seconds until increment or timeout
 *
 * @param params Transfer parameters
 * @returns TransferResult with status and optional hash
 */
export async function sendTransfer(params: TransferParams): Promise<TransferResult> {
  const { recipient, amount, comment, contract, secretKey } = params;
  const client = getTonClient();

  // Parse recipient address
  const recipientAddress = typeof recipient === 'string'
    ? (recipient.includes(':') ? Address.parseRaw(recipient) : Address.parse(recipient))
    : recipient;

  try {
    // Step 1: Get current seqno
    const seqnoBefore = await getSeqno(contract);

    // Step 2: Create transfer
    const transfer = contract.createTransfer({
      seqno: seqnoBefore,
      secretKey,
      messages: [
        internal({
          to: recipientAddress,
          value: amount,
          bounce: true,
          body: comment ? makeComment(comment) : undefined,
        }),
      ],
    });

    // Step 3: Send external message
    await client.sendExternalMessage(contract, transfer);

    // Step 4: Poll for seqno increment
    const startTime = Date.now();
    while (Date.now() - startTime < SEQNO_TIMEOUT_MS) {
      await sleep(SEQNO_POLL_INTERVAL_MS);

      const seqnoAfter = await getSeqno(contract);
      if (seqnoAfter > seqnoBefore) {
        // Transaction confirmed - get the hash from the last transaction
        try {
          const txs = await client.getTransactions(contract.address, { limit: 1 });
          if (txs.length > 0) {
            const hash = txs[0].hash().toString('hex');
            return { status: 'confirmed', hash };
          }
        } catch {
          // Failed to get transaction hash, but seqno incremented
          return { status: 'confirmed' };
        }
      }
    }

    // Timeout: seqno did not increment within 30 seconds
    return { status: 'timeout' };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { status: 'error', error: errorMessage };
  }
}
