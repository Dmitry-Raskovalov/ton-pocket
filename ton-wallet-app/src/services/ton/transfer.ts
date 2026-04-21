/**
 * file: transfer.ts
 * description: Transaction sending service with seqno polling and timeout
 * dependencies: client.ts, @ton/ton, @ton/core
 * created: 2026-03-31
 */

import { Address, comment as makeComment } from '@ton/core';
import type {
  WalletContractV3R2,
  WalletContractV5R1,
} from '@ton/ton';
import { internal, WalletContractV4 } from '@ton/ton';
import { getTonClient, NetworkError, RateLimitError, ApiError } from './client';

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
 * Get current seqno; returns 0 if the contract is not yet deployed.
 * Used before sending to establish the baseline seqno.
 */
async function getInitialSeqno(contract: WalletContract): Promise<number> {
  const client = getTonClient();
  try {
    const opened = client.open(contract as WalletContractV4);
    return await opened.getSeqno();
  } catch {
    return 0;
  }
}

/**
 * Get current seqno during polling — propagates errors so the caller can
 * decide whether to retry or abort.
 */
async function getSeqno(contract: WalletContract): Promise<number> {
  const client = getTonClient();
  const opened = client.open(contract as WalletContractV4);
  return await opened.getSeqno();
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

  // Parse recipient address and determine bounce flag
  let recipientAddress: Address;
  let bounce: boolean;

  if (typeof recipient === 'string') {
    if (recipient.includes(':')) {
      // Raw format "0:hex" — non-bounceable by default
      recipientAddress = Address.parseRaw(recipient);
      bounce = false;
    } else {
      // Friendly format — extract bounce flag from address encoding
      // URL-safe base64 may contain '-' and '_' instead of '+' and '/'
      const parsed = Address.parseFriendly(recipient);
      recipientAddress = parsed.address;
      bounce = parsed.isBounceable;
    }
  } else {
    // Address object — default to non-bounceable
    recipientAddress = recipient;
    bounce = false;
  }

  try {
    // Step 1: Get current seqno (0 if not yet deployed)
    const seqnoBefore = await getInitialSeqno(contract);

    // Step 2: Create transfer
    const transfer = (contract as WalletContractV4).createTransfer({
      seqno: seqnoBefore,
      secretKey,
      messages: [
        internal({
          to: recipientAddress,
          value: amount,
          bounce,
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

      try {
        const seqnoAfter = await getSeqno(contract);
        if (seqnoAfter > seqnoBefore) {
          // Transaction confirmed — fetch hash from the latest transaction
          try {
            const txs = await client.getTransactions(contract.address, { limit: 1 });
            if (txs.length > 0) {
              const hash = txs[0].hash().toString('hex');
              return { status: 'confirmed', hash };
            }
          } catch {
            return { status: 'confirmed' };
          }
        }
      } catch {
        // Transient network error during polling — continue until timeout
      }
    }

    // Timeout: seqno did not increment within 30 seconds
    return { status: 'timeout' };
  } catch (err: unknown) {
    let errorMessage: string;
    if (err instanceof RateLimitError) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (err instanceof NetworkError) {
      errorMessage = 'Network error: unable to connect to the blockchain.';
    } else if (err instanceof ApiError) {
      errorMessage = `API error (${err.statusCode ?? 'unknown'}): ${err.message}`;
    } else {
      errorMessage = err instanceof Error ? err.message : 'Unknown error';
    }
    return { status: 'error', error: errorMessage };
  }
}
