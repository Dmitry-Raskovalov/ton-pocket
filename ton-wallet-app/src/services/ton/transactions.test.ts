/**
 * file: transactions.test.ts
 * description: Unit tests for transaction history service
 * dependencies: transactions.ts
 * created: 2026-03-31
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address, beginCell, Dictionary } from '@ton/core';
import type { Transaction, Message } from '@ton/core';
import { getTransactions } from './transactions';

vi.mock('./client', () => ({
  getTonClient: vi.fn(),
}));

import { getTonClient } from './client';

const mockGetTransactions = vi.fn();
const mockClient = { getTransactions: mockGetTransactions };

beforeEach(() => {
  vi.mocked(getTonClient).mockReturnValue(mockClient as never);
  mockGetTransactions.mockReset();
});

// --- Helpers ---

const OWNER = Address.parseRaw('0:0000000000000000000000000000000000000000000000000000000000000000');
const OTHER = Address.parseRaw('0:1111111111111111111111111111111111111111111111111111111111111111');

/** Build a text-comment Cell (opcode 0x00000000 + string) */
function commentCell(text: string) {
  return beginCell().storeUint(0, 32).storeStringTail(text).endCell();
}

/** Build an empty body Cell */
function emptyCell() {
  return beginCell().endCell();
}

function makeHash(seed: number): Buffer {
  return Buffer.alloc(32, seed);
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  const outMessages: Dictionary<number, Message> = Dictionary.empty();

  return {
    address: BigInt('0x' + OWNER.toRawString().replace(/:/g, '').replace(/-1:/i, '')),
    lt: 1000n,
    prevTransactionHash: 0n,
    prevTransactionLt: 0n,
    now: 1700000000,
    outMessagesCount: 0,
    oldStatus: 'active',
    endStatus: 'active',
    inMessage: undefined,
    outMessages,
    totalFees: { coins: 5000000n, other: Dictionary.empty() },
    stateUpdate: { oldHash: Buffer.alloc(32), newHash: Buffer.alloc(32) },
    description: { type: 'generic' } as Transaction['description'],
    raw: emptyCell(),
    hash: () => makeHash(1),
    ...overrides,
  } as Transaction;
}

function makeInternalMessage(src: Address, dest: Address, coins: bigint, body = emptyCell()): Message {
  return {
    info: {
      type: 'internal',
      ihrDisabled: true,
      bounce: true,
      bounced: false,
      src,
      dest,
      value: { coins, other: Dictionary.empty() },
      ihrFee: 0n,
      forwardFee: 0n,
      createdLt: 0n,
      createdAt: 0,
    },
    body,
  } as Message;
}

// --- Tests ---

describe('getTransactions', () => {
  it('returns empty array when no transactions', async () => {
    mockGetTransactions.mockResolvedValue([]);
    const result = await getTransactions(OWNER.toRawString());
    expect(result).toEqual([]);
  });

  it('passes limit and pagination params to TonClient', async () => {
    mockGetTransactions.mockResolvedValue([]);
    await getTransactions(OWNER.toRawString(), 10, '999', 'abc123');
    expect(mockGetTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ toRawString: expect.any(Function) }),
      { limit: 10, lt: '999', hash: 'abc123', archival: false },
    );
  });

  it('uses default limit of 20', async () => {
    mockGetTransactions.mockResolvedValue([]);
    await getTransactions(OWNER.toRawString());
    expect(mockGetTransactions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 20 }),
    );
  });

  describe('incoming transaction', () => {
    it('parses direction as "in"', async () => {
      const inMsg = makeInternalMessage(OTHER, OWNER, 1_000_000_000n);
      const tx = makeTx({ inMessage: inMsg });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.direction).toBe('in');
    });

    it('parses amount correctly', async () => {
      const inMsg = makeInternalMessage(OTHER, OWNER, 2_500_000_000n);
      const tx = makeTx({ inMessage: inMsg });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.amount).toBe(2_500_000_000n);
    });

    it('extracts counterpartyAddress as sender raw address', async () => {
      const inMsg = makeInternalMessage(OTHER, OWNER, 1_000_000_000n);
      const tx = makeTx({ inMessage: inMsg });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.counterpartyAddress).toBe(OTHER.toRawString());
    });

    it('extracts text comment', async () => {
      const inMsg = makeInternalMessage(OTHER, OWNER, 1_000_000_000n, commentCell('hello'));
      const tx = makeTx({ inMessage: inMsg });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.comment).toBe('hello');
    });

    it('returns null comment when body is empty', async () => {
      const inMsg = makeInternalMessage(OTHER, OWNER, 1_000_000_000n, emptyCell());
      const tx = makeTx({ inMessage: inMsg });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.comment).toBeNull();
    });
  });

  describe('outgoing transaction', () => {
    it('parses direction as "out"', async () => {
      const outMsg = makeInternalMessage(OWNER, OTHER, 500_000_000n);
      const outMessages: Dictionary<number, Message> = Dictionary.empty();
      outMessages.set(0, outMsg);
      const tx = makeTx({ outMessages, outMessagesCount: 1 });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.direction).toBe('out');
    });

    it('extracts counterpartyAddress as recipient', async () => {
      const outMsg = makeInternalMessage(OWNER, OTHER, 500_000_000n);
      const outMessages: Dictionary<number, Message> = Dictionary.empty();
      outMessages.set(0, outMsg);
      const tx = makeTx({ outMessages, outMessagesCount: 1 });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.counterpartyAddress).toBe(OTHER.toRawString());
    });

    it('extracts comment from out-message', async () => {
      const outMsg = makeInternalMessage(OWNER, OTHER, 500_000_000n, commentCell('pay'));
      const outMessages: Dictionary<number, Message> = Dictionary.empty();
      outMessages.set(0, outMsg);
      const tx = makeTx({ outMessages, outMessagesCount: 1 });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.comment).toBe('pay');
    });
  });

  describe('edge cases', () => {
    it('handles deploy transaction (no inMessage, no out internal)', async () => {
      const tx = makeTx({ inMessage: undefined });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.direction).toBe('out');
      expect(parsed.amount).toBe(0n);
      expect(parsed.comment).toBeNull();
    });

    it('handles bounced inMessage — still parsed as incoming', async () => {
      const inMsg = makeInternalMessage(OTHER, OWNER, 1_000_000_000n);
      (inMsg.info as { bounced: boolean }).bounced = true;
      const tx = makeTx({ inMessage: inMsg });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.direction).toBe('in');
    });

    it('sets fee from totalFees.coins', async () => {
      const inMsg = makeInternalMessage(OTHER, OWNER, 1_000_000_000n);
      const tx = makeTx({ inMessage: inMsg, totalFees: { coins: 9_000_000n, other: Dictionary.empty() } });
      mockGetTransactions.mockResolvedValue([tx]);

      const [parsed] = await getTransactions(OWNER.toRawString());
      expect(parsed.fee).toBe(9_000_000n);
    });

    it('parses multiple transactions preserving order', async () => {
      const tx1 = makeTx({ inMessage: makeInternalMessage(OTHER, OWNER, 1n), lt: 100n, hash: () => makeHash(1) });
      const tx2 = makeTx({ inMessage: makeInternalMessage(OTHER, OWNER, 2n), lt: 200n, hash: () => makeHash(2) });
      mockGetTransactions.mockResolvedValue([tx1, tx2]);

      const result = await getTransactions(OWNER.toRawString());
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(1n);
      expect(result[1].amount).toBe(2n);
    });
  });
});
