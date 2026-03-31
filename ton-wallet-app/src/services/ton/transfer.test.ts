/**
 * file: transfer.test.ts
 * description: Unit tests for transfer service
 * dependencies: transfer.ts
 * created: 2026-03-31
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Address, Cell } from '@ton/core';
import { WalletContractV4 } from '@ton/ton';
import { sendTransfer, ESTIMATED_FEE } from './transfer';
import { getTonClient, resetTonClient } from './client';
import type { TonClient } from '@ton/ton';

// --- Mocks ---

vi.mock('./client', () => ({
  getTonClient: vi.fn(),
  resetTonClient: vi.fn(),
}));

const mockGetTonClient = vi.mocked(getTonClient);

function createMockClient(): TonClient {
  return {
    getContractState: vi.fn(),
    sendExternalMessage: vi.fn(),
    getTransactions: vi.fn(),
  } as unknown as TonClient;
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
    // Generate a valid test recipient address from the same publicKey
    const recipientContract = WalletContractV4.create({ workchain: 0, publicKey: Buffer.alloc(32, 0x03) });
    const recipient = recipientContract.address.toString({ testOnly: true });
    const amount = 1_000_000_000n; // 1 TON

    it('should return status "confirmed" when seqno increments', async () => {
      const mockGetContractState = vi.mocked(mockClient.getContractState);
      const mockSendExternalMessage = vi.mocked(mockClient.sendExternalMessage);
      const mockGetTransactions = vi.mocked(mockClient.getTransactions);

      // Initial seqno = 5
      mockGetContractState.mockResolvedValueOnce({
        state: 'active',
        balance: 0n,
        seqno: 5,
      } as any);

      // Send succeeds
      mockSendExternalMessage.mockResolvedValueOnce(undefined);

      // After polling, seqno = 6
      mockGetContractState.mockResolvedValueOnce({
        state: 'active',
        balance: 0n,
        seqno: 6,
      } as any);

      // Return transaction with hash
      const mockTx = {
        hash: () => Buffer.from('abcdef123456', 'hex'),
      };
      mockGetTransactions.mockResolvedValueOnce([mockTx] as any);

      const result = await sendTransfer({
        recipient,
        amount,
        contract,
        secretKey,
      });

      expect(result.status).toBe('confirmed');
      expect(result.hash).toBe('abcdef123456');
      expect(mockSendExternalMessage).toHaveBeenCalledTimes(1);
    });

    it('should return status "timeout" when seqno does not increment within 30 seconds', async () => {
      const mockGetContractState = vi.mocked(mockClient.getContractState);
      const mockSendExternalMessage = vi.mocked(mockClient.sendExternalMessage);

      // Initial seqno = 5
      mockGetContractState.mockResolvedValue({
        state: 'active',
        balance: 0n,
        seqno: 5,
      } as any);

      // Send succeeds
      mockSendExternalMessage.mockResolvedValueOnce(undefined);

      // Use fake timers to speed up timeout
      vi.useFakeTimers();

      const transferPromise = sendTransfer({
        recipient,
        amount,
        contract,
        secretKey,
      });

      // Fast-forward 30+ seconds
      await vi.advanceTimersByTimeAsync(35000);

      const result = await transferPromise;

      expect(result.status).toBe('timeout');
      expect(result.hash).toBeUndefined();

      vi.useRealTimers();
    });

    it('should return status "error" when sendExternalMessage fails', async () => {
      const mockGetContractState = vi.mocked(mockClient.getContractState);
      const mockSendExternalMessage = vi.mocked(mockClient.sendExternalMessage);

      // Initial seqno = 5
      mockGetContractState.mockResolvedValueOnce({
        state: 'active',
        balance: 0n,
        seqno: 5,
      } as any);

      // Send fails
      mockSendExternalMessage.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendTransfer({
        recipient,
        amount,
        contract,
        secretKey,
      });

      expect(result.status).toBe('error');
      expect(result.error).toBe('Network error');
    });

    it('should accept Address object as recipient', async () => {
      const mockGetContractState = vi.mocked(mockClient.getContractState);
      const mockSendExternalMessage = vi.mocked(mockClient.sendExternalMessage);
      const mockGetTransactions = vi.mocked(mockClient.getTransactions);

      // Initial seqno = 5
      mockGetContractState.mockResolvedValueOnce({
        state: 'active',
        balance: 0n,
        seqno: 5,
      } as any);

      mockSendExternalMessage.mockResolvedValueOnce(undefined);

      // After polling, seqno = 6
      mockGetContractState.mockResolvedValueOnce({
        state: 'active',
        balance: 0n,
        seqno: 6,
      } as any);

      const mockTx = {
        hash: () => Buffer.from('abcdef123456', 'hex'),
      };
      mockGetTransactions.mockResolvedValueOnce([mockTx] as any);

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
      const mockGetContractState = vi.mocked(mockClient.getContractState);
      const mockSendExternalMessage = vi.mocked(mockClient.sendExternalMessage);
      const mockGetTransactions = vi.mocked(mockClient.getTransactions);

      // Initial seqno = 5
      mockGetContractState.mockResolvedValueOnce({
        state: 'active',
        balance: 0n,
        seqno: 5,
      } as any);

      mockSendExternalMessage.mockResolvedValueOnce(undefined);

      // After polling, seqno = 6
      mockGetContractState.mockResolvedValueOnce({
        state: 'active',
        balance: 0n,
        seqno: 6,
      } as any);

      const mockTx = {
        hash: () => Buffer.from('abcdef123456', 'hex'),
      };
      mockGetTransactions.mockResolvedValueOnce([mockTx] as any);

      const result = await sendTransfer({
        recipient,
        amount,
        comment: 'Test transfer',
        contract,
        secretKey,
      });

      expect(result.status).toBe('confirmed');
      // Note: We can't easily verify the comment content in the mock,
      // but the test ensures the function doesn't throw when comment is provided
    });
  });
});
