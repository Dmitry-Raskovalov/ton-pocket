/**
 * file: useWallet.test.ts
 * description: Unit tests for useWallet hook
 * dependencies: useWallet.ts, wallet-store
 * created: 2026-04-15
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock wallet-store module
const mockState = {
  address: null as string | null,
  version: null as string | null,
  publicKey: null as string | null,
  balance: 0n,
  isUnlocked: false,
  setWallet: vi.fn(),
  clearWallet: vi.fn(),
  updateBalance: vi.fn(),
  setUnlocked: vi.fn(),
};

vi.mock('@/store/wallet-store', () => ({
  useWalletStore: (selector: (s: any) => any) => selector(mockState),
  isWalletCreated: vi.fn(() => false),
  hasWallet: vi.fn(() => false),
}));

import { useWallet } from './useWallet';
import { isWalletCreated, hasWallet } from '@/store/wallet-store';

describe('useWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.address = null;
    mockState.version = null;
    mockState.publicKey = null;
    mockState.balance = 0n;
    mockState.isUnlocked = false;
  });

  it('returns address from store', () => {
    mockState.address = 'EQTest123';
    const { result } = renderHook(() => useWallet());
    expect(result.current.address).toBe('EQTest123');
  });

  it('returns version from store', () => {
    mockState.version = 'v4R2';
    const { result } = renderHook(() => useWallet());
    expect(result.current.version).toBe('v4R2');
  });

  it('returns balance from store', () => {
    mockState.balance = 5_000_000_000n;
    const { result } = renderHook(() => useWallet());
    expect(result.current.balance).toBe(5_000_000_000n);
  });

  it('returns isUnlocked from store', () => {
    mockState.isUnlocked = true;
    const { result } = renderHook(() => useWallet());
    expect(result.current.isUnlocked).toBe(true);
  });

  it('exposes store action functions', () => {
    const { result } = renderHook(() => useWallet());

    expect(typeof result.current.setWallet).toBe('function');
    expect(typeof result.current.clearWallet).toBe('function');
    expect(typeof result.current.updateBalance).toBe('function');
    expect(typeof result.current.setUnlocked).toBe('function');
  });

  it('delegates isWalletCreated to store selector', () => {
    vi.mocked(isWalletCreated).mockReturnValue(true);
    const { result } = renderHook(() => useWallet());
    expect(result.current.isWalletCreated).toBe(true);
  });

  it('delegates hasWallet to store selector', () => {
    vi.mocked(hasWallet).mockReturnValue(true);
    const { result } = renderHook(() => useWallet());
    expect(result.current.hasWallet).toBe(true);
  });

  it('returns null values by default', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.address).toBeNull();
    expect(result.current.version).toBeNull();
    expect(result.current.publicKey).toBeNull();
  });
});
