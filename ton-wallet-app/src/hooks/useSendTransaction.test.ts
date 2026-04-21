/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * file: hooks/useSendTransaction.test.ts
 * description: Unit tests for useSendTransaction hook — pre-send failures, result states, reset
 * dependencies: useSendTransaction, vault, session, transfer, wallet-store, ui-store
 * created: 2026-04-21
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSendTransaction } from './useSendTransaction';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAddToast = vi.fn();
const mockUpdateBalance = vi.fn();

const mockWalletState = {
  address: '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  version: 'v4R2' as const,
  publicKey: '01'.repeat(32),
  updateBalance: mockUpdateBalance,
};

vi.mock('@/store/wallet-store', () => ({
  useWalletStore: (selector: (s: any) => any) => selector(mockWalletState),
}));

vi.mock('@/store/ui-store', () => ({
  useUIStore: (selector: (s: any) => any) => selector({ addToast: mockAddToast }),
}));

vi.mock('@/crypto/session', () => ({
  getSessionPassword: vi.fn().mockReturnValue('mypassword'),
}));

vi.mock('@/crypto/vault', () => ({
  loadVault: vi.fn().mockReturnValue({
    version: 1, ciphertext: 'abc', iv: 'def', kdfParams: {},
  }),
  decrypt: vi.fn().mockResolvedValue('["word1","word2","word3"]'),
}));

vi.mock('@ton/crypto', () => ({
  mnemonicToPrivateKey: vi.fn().mockResolvedValue({
    publicKey: Buffer.alloc(32, 0x01),
    secretKey: Buffer.alloc(64, 0x02),
  }),
}));

vi.mock('@/services/wallet/contract-factory', () => ({
  createContract: vi.fn().mockReturnValue({
    address: { toRawString: () => '0:abcdef' },
  }),
}));

vi.mock('@/services/ton/transfer', () => ({
  sendTransfer: vi.fn().mockResolvedValue({ status: 'confirmed', hash: 'abc123' }),
  ESTIMATED_FEE: 10_000_000n,
}));

vi.mock('@/services/ton/balance', () => ({
  getBalance: vi.fn().mockResolvedValue(5_000_000_000n),
}));

vi.mock('@/services/address-book/address-book', () => ({
  addressBook: { addOrUpdateEntry: vi.fn() },
}));

import * as vaultModule from '@/crypto/vault';
import * as sessionModule from '@/crypto/session';
import * as transferModule from '@/services/ton/transfer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEND_PARAMS = {
  recipient: 'UQBtest1234567890abcdef',
  amount: 1_000_000_000n,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSendTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vaultModule.loadVault).mockReturnValue({
      version: 1, ciphertext: 'abc', iv: 'def', kdfParams: {},
    } as any);
    vi.mocked(vaultModule.decrypt).mockResolvedValue('["word1","word2","word3"]');
    vi.mocked(sessionModule.getSessionPassword).mockReturnValue('mypassword');
    vi.mocked(transferModule.sendTransfer).mockResolvedValue({ status: 'confirmed', hash: 'abc123' });
  });

  // ── Pre-send failures: should return false and show toast ────────────────────

  describe('возврат false при ошибке до отправки', () => {
    it('возвращает false и показывает toast если vault не найден', async () => {
      vi.mocked(vaultModule.loadVault).mockReturnValue(null);

      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Wallet vault not found' })
      );
    });

    it('возвращает false если нет сессионного пароля', async () => {
      vi.mocked(sessionModule.getSessionPassword).mockReturnValue(null);

      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(false);
      expect(mockAddToast).not.toHaveBeenCalled();
    });

    it('возвращает false и показывает toast если decrypt выбрасывает ошибку', async () => {
      vi.mocked(vaultModule.decrypt).mockRejectedValue(new Error('Wrong password'));

      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Wrong password' })
      );
    });

    it('возвращает false если мнемоника — невалидный JSON', async () => {
      vi.mocked(vaultModule.decrypt).mockResolvedValue('not valid json{');

      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('возвращает false если мнемоника не массив', async () => {
      vi.mocked(vaultModule.decrypt).mockResolvedValue('{"words":"nope"}');

      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Invalid mnemonic data in vault' })
      );
    });

    it('возвращает false если массив мнемоники содержит не строки', async () => {
      vi.mocked(vaultModule.decrypt).mockResolvedValue('[1, 2, 3]');

      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(false);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Invalid mnemonic data in vault' })
      );
    });
  });

  // ── Successful send: should return true and update resultState ───────────────

  describe('возврат true + обновление resultState', () => {
    it('возвращает true и resultState="success" при подтверждённой транзакции', async () => {
      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(true);
      expect(result.current.resultState).toBe('success');
      expect(result.current.transferResult).toEqual({ status: 'confirmed', hash: 'abc123' });
    });

    it('возвращает true и resultState="error" при ошибке sendTransfer', async () => {
      vi.mocked(transferModule.sendTransfer).mockResolvedValue({ status: 'error', error: 'TX rejected' });

      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(true);
      expect(result.current.resultState).toBe('error');
      expect(result.current.transferResult?.status).toBe('error');
    });

    it('возвращает true и resultState="timeout" при таймауте', async () => {
      vi.mocked(transferModule.sendTransfer).mockResolvedValue({ status: 'timeout' });

      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(true);
      expect(result.current.resultState).toBe('timeout');
    });

    it('возвращает true и resultState="error" при необработанном исключении', async () => {
      vi.mocked(transferModule.sendTransfer).mockRejectedValue(new Error('Unexpected crash'));

      const { result } = renderHook(() => useSendTransaction());
      let started!: boolean;
      await act(async () => { started = await result.current.sendTransaction(SEND_PARAMS); });

      expect(started).toBe(true);
      expect(result.current.resultState).toBe('error');
      expect(result.current.transferResult?.error).toBe('Unexpected crash');
    });
  });

  // ── resetResult ──────────────────────────────────────────────────────────────

  describe('resetResult', () => {
    it('сбрасывает resultState в "pending" и transferResult в null', async () => {
      const { result } = renderHook(() => useSendTransaction());

      await act(async () => { await result.current.sendTransaction(SEND_PARAMS); });
      expect(result.current.resultState).toBe('success');

      act(() => { result.current.resetResult(); });

      expect(result.current.resultState).toBe('pending');
      expect(result.current.transferResult).toBeNull();
    });

    it('корректно работает при вызове до первой отправки', () => {
      const { result } = renderHook(() => useSendTransaction());

      expect(() => act(() => { result.current.resetResult(); })).not.toThrow();
      expect(result.current.resultState).toBe('pending');
      expect(result.current.transferResult).toBeNull();
    });
  });

  // ── isSending flag ───────────────────────────────────────────────────────────

  describe('isSending', () => {
    it('isSending=false после завершения отправки', async () => {
      const { result } = renderHook(() => useSendTransaction());

      await act(async () => { await result.current.sendTransaction(SEND_PARAMS); });

      expect(result.current.isSending).toBe(false);
    });

    it('isSending=false после провала расшифровки', async () => {
      vi.mocked(vaultModule.decrypt).mockRejectedValue(new Error('Bad password'));

      const { result } = renderHook(() => useSendTransaction());

      await act(async () => { await result.current.sendTransaction(SEND_PARAMS); });

      expect(result.current.isSending).toBe(false);
    });
  });
});
