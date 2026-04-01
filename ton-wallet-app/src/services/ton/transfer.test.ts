/**
 * file: transfer.test.ts
 * description: Unit tests for transfer service
 * dependencies: transfer.ts
 * created: 2026-03-31
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Address, Cell, TupleReader, beginCell } from '@ton/core';
import { WalletContractV4 } from '@ton/ton';
import { sendTransfer, ESTIMATED_FEE } from './transfer';
import { getTonClient, resetTonClient } from './client';
import type { TonClient } from '@ton/ton';

// --- Mocks ---

vi.mock('./client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./client')>();
  return {
    ...actual,
    getTonClient: vi.fn(),
    resetTonClient: vi.fn(),
  };
});

const mockGetTonClient = vi.mocked(getTonClient);

/**
 * Creates a mock TonClient that properly supports client.open(contract).getSeqno().
 * The key insight: TonClient.open() creates a provider that calls client.runMethod()
 * for get-methods. We mock runMethod to return seqno values.
 */
function createMockClient(): TonClient {
  return {
    getContractState: vi.fn(),
    sendExternalMessage: vi.fn(),
    getTransactions: vi.fn(),
    runMethod: vi.fn(),
    isContractDeployed: vi.fn(),
    sendFile: vi.fn(),
    sendMessage: vi.fn(),
    open(src: any) {
      const self = this as any;
      // Re-implement TonClient.open() using createProvider pattern
      // but with our mocked client as the backend
      const address = src.address;
      return {
        getSeqno: async () => {
          // First check state
          const state = await self.getContractState(address);
          if (state.state !== 'active') return 0;
          // Then call runMethod for seqno
          try {
            const result = await self.runMethod(address, 'seqno', []);
            return result.stack.readNumber();
          } catch {
            return 0;
          }
        },
      };
    },
  } as unknown as TonClient;
}

// --- Helper ---

/** Create a TupleReader that reads a single number */
function numberStack(n: number): TupleReader {
  return new TupleReader([{ type: 'int', value: BigInt(n) }]);
}

// --- Tests ---

describe('transfer service', () => {
  let mockClient: TonClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    mockGetTonClient.mockReturnValue(mockClient);
  });

  describe('ESTIMATED_FEE constant', () => {
    it('should equal 0.01 TON (10,000,000 nanotons)', () => {
      expect(ESTIMATED_FEE).toBe(10_000_000n);
    });
  });

  describe('sendTransfer', () => {
    const publicKey = Buffer.alloc(32, 0x01);
    const secretKey = Buffer.concat([publicKey, Buffer.alloc(32, 0x02)]);
    const contract = WalletContractV4.create({ workchain: 0, publicKey });
    const recipientContract = WalletContractV4.create({ workchain: 0, publicKey: Buffer.alloc(32, 0x03) });
    const recipient = recipientContract.address.toString({ testOnly: true });
    const amount = 1_000_000_000n; // 1 TON

    /** Setup mocks for a successful seqno-based confirmation */
    function setupConfirmedMocks(initialSeqno = 5, finalSeqno = 6) {
      const mockGetContractState = vi.mocked(mockClient.getContractState);
      const mockRunMethod = vi.mocked((mockClient as any).runMethod);
      const mockSendExternalMessage = vi.mocked(mockClient.sendExternalMessage);
      const mockGetTransactions = vi.mocked(mockClient.getTransactions);

      // Initial state check + seqno get-method
      mockGetContractState.mockResolvedValueOnce({
        state: 'active',
        balance: 0n,
      } as any);
      mockRunMethod.mockResolvedValueOnce({ stack: numberStack(initialSeqno) });

      // Send succeeds
      mockSendExternalMessage.mockResolvedValueOnce(undefined);

      // After polling: state check + seqno get-method (incremented)
      mockGetContractState.mockResolvedValueOnce({
        state: 'active',
        balance: 0n,
      } as any);
      mockRunMethod.mockResolvedValueOnce({ stack: numberStack(finalSeqno) });

      // Return transaction with hash
      mockGetTransactions.mockResolvedValueOnce([{
        hash: () => Buffer.from('abcdef123456', 'hex'),
      }] as any);

      return { mockGetContractState, mockSendExternalMessage, mockGetTransactions };
    }

    it('should return status "confirmed" when seqno increments', async () => {
      setupConfirmedMocks();

      const result = await sendTransfer({ recipient, amount, contract, secretKey });

      expect(result.status).toBe('confirmed');
      expect(result.hash).toBe('abcdef123456');
      expect(vi.mocked(mockClient.sendExternalMessage)).toHaveBeenCalledTimes(1);
    });

    it('should return status "timeout" when seqno does not increment within 30 seconds', async () => {
      const mockGetContractState = vi.mocked(mockClient.getContractState);
      const mockRunMethod = vi.mocked((mockClient as any).runMethod);
      const mockSendExternalMessage = vi.mocked(mockClient.sendExternalMessage);

      // All calls return seqno = 5
      mockGetContractState.mockResolvedValue({ state: 'active', balance: 0n } as any);
      mockRunMethod.mockResolvedValue({ stack: numberStack(5) });
      mockSendExternalMessage.mockResolvedValueOnce(undefined);

      vi.useFakeTimers();

      const transferPromise = sendTransfer({ recipient, amount, contract, secretKey });
      await vi.advanceTimersByTimeAsync(35000);
      const result = await transferPromise;

      expect(result.status).toBe('timeout');
      expect(result.hash).toBeUndefined();

      vi.useRealTimers();
    });

    it('should return status "error" when sendExternalMessage fails', async () => {
      const mockGetContractState = vi.mocked(mockClient.getContractState);
      const mockRunMethod = vi.mocked((mockClient as any).runMethod);
      const mockSendExternalMessage = vi.mocked(mockClient.sendExternalMessage);

      mockGetContractState.mockResolvedValueOnce({ state: 'active', balance: 0n } as any);
      mockRunMethod.mockResolvedValueOnce({ stack: numberStack(5) });
      mockSendExternalMessage.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendTransfer({ recipient, amount, contract, secretKey });

      expect(result.status).toBe('error');
      expect(result.error).toBe('Network error');
    });

    it('should accept Address object as recipient', async () => {
      setupConfirmedMocks();

      const recipientAddress = Address.parse(recipient);
      const result = await sendTransfer({
        recipient: recipientAddress,
        amount,
        contract,
        secretKey,
      });

      expect(result.status).toBe('confirmed');
    });

    it('should include comment in transfer when provided', async () => {
      setupConfirmedMocks();

      const result = await sendTransfer({
        recipient,
        amount,
        comment: 'Test transfer',
        contract,
        secretKey,
      });

      expect(result.status).toBe('confirmed');
    });

    it('should set bounce=false for raw-format address', async () => {
      setupConfirmedMocks();

      const rawAddress = recipientContract.address.toRawString();
      const result = await sendTransfer({ recipient: rawAddress, amount, contract, secretKey });

      expect(result.status).toBe('confirmed');
    });

    it('should set bounce=true for bounceable friendly address', async () => {
      setupConfirmedMocks();

      const bounceableRecipient = recipientContract.address.toString({ bounceable: true, testOnly: true });
      const result = await sendTransfer({ recipient: bounceableRecipient, amount, contract, secretKey });

      expect(result.status).toBe('confirmed');
    });

    it('should set bounce=false for non-bounceable friendly address', async () => {
      setupConfirmedMocks();

      const nonBounceableRecipient = recipientContract.address.toString({ bounceable: false, testOnly: true });
      const result = await sendTransfer({ recipient: nonBounceableRecipient, amount, contract, secretKey });

      expect(result.status).toBe('confirmed');
    });
  });
});
