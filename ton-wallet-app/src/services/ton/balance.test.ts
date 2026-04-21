/**
 * file: balance.test.ts
 * description: Unit tests for balance service
 * dependencies: balance.ts
 * created: 2026-03-31
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBalance, formatTon } from './balance';

// Mock the client module so getTonClient() returns a controllable stub
vi.mock('./client', () => ({
  getTonClient: vi.fn(),
}));

import { getTonClient } from './client';

const mockGetBalance = vi.fn();
const mockClient = { getBalance: mockGetBalance };

beforeEach(() => {
  vi.mocked(getTonClient).mockReturnValue(mockClient as never);
  mockGetBalance.mockReset();
});

// --- getBalance ---

describe('getBalance', () => {
  it('returns balance in nanotons for an active account', async () => {
    mockGetBalance.mockResolvedValue(1_500_000_000n);
    const result = await getBalance('EQD__________________________________________0vo');
    expect(result).toBe(1_500_000_000n);
  });

  it('passes parsed Address to TonClient.getBalance', async () => {
    mockGetBalance.mockResolvedValue(0n);
    await getBalance('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
    expect(mockGetBalance).toHaveBeenCalledTimes(1);
    // First argument should be an Address object
    const arg = mockGetBalance.mock.calls[0][0];
    expect(arg).toBeDefined();
    expect(typeof arg.toRawString).toBe('function');
  });

  it('returns 0n when account is not found', async () => {
    mockGetBalance.mockRejectedValue(new Error('account not found'));
    const result = await getBalance('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
    expect(result).toBe(0n);
  });

  it('returns 0n when error message contains "not found"', async () => {
    mockGetBalance.mockRejectedValue(new Error('address not found on chain'));
    const result = await getBalance('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
    expect(result).toBe(0n);
  });

  it('re-throws unexpected errors', async () => {
    mockGetBalance.mockRejectedValue(new Error('network timeout'));
    await expect(
      getBalance('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'),
    ).rejects.toThrow('network timeout');
  });

  it('принимает адрес в raw-формате (parseToAddress)', async () => {
    mockGetBalance.mockResolvedValue(42n);
    const result = await getBalance('0:0000000000000000000000000000000000000000000000000000000000000000');
    expect(result).toBe(42n);
    const arg = mockGetBalance.mock.calls[0][0];
    expect(typeof arg.toRawString).toBe('function');
    expect(arg.toRawString()).toBe('0:0000000000000000000000000000000000000000000000000000000000000000');
  });
});

// --- formatTon ---

describe('formatTon', () => {
  it('formats 1 TON correctly', () => {
    expect(formatTon(1_000_000_000n)).toBe('1.000000000');
  });

  it('formats 0 nanotons', () => {
    expect(formatTon(0n)).toBe('0.000000000');
  });

  it('formats fractional TON', () => {
    expect(formatTon(500_000_000n)).toBe('0.500000000');
  });

  it('formats small amount (1 nanoton)', () => {
    expect(formatTon(1n)).toBe('0.000000001');
  });

  it('formats large amount', () => {
    expect(formatTon(1_234_567_890_123n)).toBe('1234.567890123');
  });

  it('formats negative value', () => {
    expect(formatTon(-1_000_000_000n)).toBe('-1.000000000');
  });

  it('pads fractional part to 9 digits', () => {
    expect(formatTon(100n)).toBe('0.000000100');
  });

  it('formatTon handles maximum practical balance (billions of TON)', () => {
    const billionsOfTon = 10_000_000_000n * 1_000_000_000n; // 10 billion TON
    expect(formatTon(billionsOfTon)).toBe('10000000000.000000000');
  });
});
