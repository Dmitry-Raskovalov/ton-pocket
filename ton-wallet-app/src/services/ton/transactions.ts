/**
 * file: transactions.ts
 * description: Transaction history service — fetching and parsing TON transactions with pagination
 * dependencies: client.ts, @ton/core
 * created: 2026-03-31
 */

import type { Transaction } from '@ton/core';
import { Address } from '@ton/core';
import { getTonClient } from './client';

// --- Types ---

export type TransactionDirection = 'in' | 'out';

export interface ParsedTransaction {
  hash: string;
  timestamp: number;
  direction: TransactionDirection;
  amount: bigint;
  counterpartyAddress: string | null;
  comment: string | null;
  fee: bigint;
  lt: string;
}

const DEFAULT_LIMIT = 20;

// --- Comment parsing ---

/**
 * Try to extract a text comment from a message body Cell.
 * Text comment cells start with a 32-bit zero opcode (0x00000000)
 * followed by a UTF-8 string.
 */
function parseComment(body: import('@ton/core').Cell): string | null {
  try {
    const slice = body.beginParse();
    if (slice.remainingBits < 32) return null;

    const opcode = slice.loadUint(32);
    if (opcode !== 0) return null;

    if (slice.remainingBits === 0) return null;

    return slice.loadStringTail();
  } catch {
    return null;
  }
}

// --- Direction & counterparty detection ---

/**
 * Parse a single raw Transaction into ParsedTransaction.
 * Rules:
 *   - If inMessage is internal and there are no out-messages → incoming transfer
 *   - If there are out-messages with internal info → outgoing transfer
 *   - Deploy transactions (external-in, no internal inMessage) → direction 'out', amount 0n
 *   - Bounce transactions (bounced flag on inMessage) → still parsed normally
 */
function parseTransaction(tx: Transaction, ownerAddress: Address): ParsedTransaction {
  const hash = tx.hash().toString('hex');
  const timestamp = tx.now;
  const lt = tx.lt.toString();
  const fee = tx.totalFees.coins;

  const inMsg = tx.inMessage;
  const outMsgs = [...tx.outMessages.values()];

  // --- Outgoing: there are out-messages with internal info ---
  const outInternal = outMsgs.find((m) => m.info.type === 'internal');
  if (outInternal && outInternal.info.type === 'internal') {
    const info = outInternal.info;
    const amount = info.value.coins;
    const counterpartyAddress = info.dest.toRawString();
    const comment = parseComment(outInternal.body);
    return { hash, timestamp, direction: 'out', amount, counterpartyAddress, comment, fee, lt };
  }

  // --- Incoming: inMessage is internal ---
  if (inMsg && inMsg.info.type === 'internal') {
    const info = inMsg.info;
    const amount = info.value.coins;
    const counterpartyAddress = info.src.toRawString();
    const comment = parseComment(inMsg.body);
    return { hash, timestamp, direction: 'in', amount, counterpartyAddress, comment, fee, lt };
  }

  // --- Deploy / external-in / unrecognised ---
  // Treat as outgoing with zero amount, no counterparty
  const comment = inMsg ? parseComment(inMsg.body) : null;
  const counterpartyAddress = ownerAddress.toRawString();
  return {
    hash,
    timestamp,
    direction: 'out',
    amount: 0n,
    counterpartyAddress,
    comment,
    fee,
    lt,
  };
}

// --- Public API ---

/**
 * Fetch and parse transaction history for an address.
 * @param address  User-friendly or raw TON address string.
 * @param limit    Max transactions to return (default 20).
 * @param lt       Logical time of the last known transaction (for pagination).
 * @param hash     Hash of the last known transaction (for pagination).
 */
export async function getTransactions(
  address: string,
  limit: number = DEFAULT_LIMIT,
  lt?: string,
  hash?: string,
): Promise<ParsedTransaction[]> {
  const client = getTonClient();
  const parsed = address.includes(':') ? Address.parseRaw(address) : Address.parse(address);

  const rawTxs = await client.getTransactions(parsed, {
    limit,
    lt,
    hash,
    archival: false,
  });

  return rawTxs.map((tx) => parseTransaction(tx, parsed));
}
