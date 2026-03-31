/**
 * file: contract-factory.test.ts
 * description: Unit tests for wallet contract factory and version detection
 * dependencies: contract-factory.ts
 * created: 2026-03-31
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletContractV3R2, WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { createContract, detectVersions, pickDefaultWallet } from './contract-factory';

vi.mock('../ton/client', () => ({
  getTonClient: vi.fn(),
}));

import { getTonClient } from '../ton/client';

const mockGetContractState = vi.fn();
const mockClient = { getContractState: mockGetContractState };

beforeEach(() => {
  vi.mocked(getTonClient).mockReturnValue(mockClient as never);
  mockGetContractState.mockReset();
});

// Deterministic 32-byte public key for tests
const PUBLIC_KEY = Buffer.alloc(32, 0xab);

// --- createContract ---

describe('createContract', () => {
  it('creates WalletContractV3R2 for v3R2', () => {
    const contract = createContract(PUBLIC_KEY, 'v3R2');
    expect(contract).toBeInstanceOf(WalletContractV3R2);
  });

  it('creates WalletContractV4 for v4R2', () => {
    const contract = createContract(PUBLIC_KEY, 'v4R2');
    expect(contract).toBeInstanceOf(WalletContractV4);
  });

  it('creates WalletContractV5R1 for v5R1', () => {
    const contract = createContract(PUBLIC_KEY, 'v5R1');
    expect(contract).toBeInstanceOf(WalletContractV5R1);
  });

  it('three versions produce three different addresses', () => {
    const v3 = createContract(PUBLIC_KEY, 'v3R2').address.toRawString();
    const v4 = createContract(PUBLIC_KEY, 'v4R2').address.toRawString();
    const v5 = createContract(PUBLIC_KEY, 'v5R1').address.toRawString();
    const addresses = new Set([v3, v4, v5]);
    expect(addresses.size).toBe(3);
  });

  it('same version and publicKey always produce the same address', () => {
    const a1 = createContract(PUBLIC_KEY, 'v4R2').address.toRawString();
    const a2 = createContract(PUBLIC_KEY, 'v4R2').address.toRawString();
    expect(a1).toBe(a2);
  });
});

// --- detectVersions ---

function makeContractState(state: 'active' | 'uninitialized' | 'frozen', balance = 0n) {
  return { balance, state, code: null, data: null, lastTransaction: null, extra_currencies: undefined };
}

describe('detectVersions', () => {
  it('returns deployed wallet when one version is active', async () => {
    mockGetContractState
      .mockResolvedValueOnce(makeContractState('uninitialized'))   // v3R2
      .mockResolvedValueOnce(makeContractState('active', 5_000_000_000n)) // v4R2
      .mockResolvedValueOnce(makeContractState('uninitialized'));   // v5R1

    const result = await detectVersions(PUBLIC_KEY);

    expect(result).toHaveLength(1);
    expect(result[0].version).toBe('v4R2');
    expect(result[0].isDeployed).toBe(true);
    expect(result[0].balance).toBe(5_000_000_000n);
  });

  it('returns all three when all versions are active', async () => {
    mockGetContractState.mockResolvedValue(makeContractState('active', 1_000_000_000n));

    const result = await detectVersions(PUBLIC_KEY);

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.version)).toEqual(['v3R2', 'v4R2', 'v5R1']);
  });

  it('returns default v4R2 (isDeployed=false) when none are found', async () => {
    mockGetContractState.mockResolvedValue(makeContractState('uninitialized'));

    const result = await detectVersions(PUBLIC_KEY);

    expect(result).toHaveLength(1);
    expect(result[0].version).toBe('v4R2');
    expect(result[0].isDeployed).toBe(false);
    expect(result[0].balance).toBe(0n);
  });

  it('ignores version when getContractState throws', async () => {
    mockGetContractState
      .mockRejectedValueOnce(new Error('network error'))  // v3R2 fails
      .mockResolvedValueOnce(makeContractState('active', 2_000_000_000n)) // v4R2 ok
      .mockRejectedValueOnce(new Error('network error'));  // v5R1 fails

    const result = await detectVersions(PUBLIC_KEY);

    expect(result).toHaveLength(1);
    expect(result[0].version).toBe('v4R2');
  });

  it('all queries run in parallel (all three calls made)', async () => {
    mockGetContractState.mockResolvedValue(makeContractState('uninitialized'));

    await detectVersions(PUBLIC_KEY);

    expect(mockGetContractState).toHaveBeenCalledTimes(3);
  });

  it('result includes addressRaw and addressFriendly', async () => {
    mockGetContractState.mockResolvedValue(makeContractState('active', 0n));

    const result = await detectVersions(PUBLIC_KEY);

    expect(result[0].addressRaw).toMatch(/^0:/);
    expect(result[0].addressFriendly).toMatch(/^[EkQ]/);
  });
});

// --- pickDefaultWallet ---

describe('pickDefaultWallet', () => {
  it('returns the first element', () => {
    const wallets = [
      { version: 'v4R2' as const, addressRaw: '0:aa', addressFriendly: 'EQ', balance: 0n, isDeployed: true },
      { version: 'v3R2' as const, addressRaw: '0:bb', addressFriendly: 'EQ', balance: 0n, isDeployed: true },
    ];
    expect(pickDefaultWallet(wallets)).toBe(wallets[0]);
  });
});
