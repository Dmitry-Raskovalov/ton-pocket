/**
 * file: store/wallet-store.test.ts
 * description: Юнит-тесты для Zustand wallet store (задача 5.1)
 * dependencies: wallet-store, crypto/vault
 * created: 2026-03-31
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWalletStore, isWalletCreated, hasWallet } from './wallet-store';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/crypto/vault', () => ({
  hasVault: vi.fn(() => false),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  useWalletStore.setState({
    address: null,
    version: null,
    balance: 0n,
    isUnlocked: false,
    publicKey: null,
    isActivated: false,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useWalletStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  describe('начальное состояние', () => {
    it('address, version, publicKey — null; balance — 0n; isUnlocked — false', () => {
      const state = useWalletStore.getState();
      expect(state.address).toBeNull();
      expect(state.version).toBeNull();
      expect(state.publicKey).toBeNull();
      expect(state.balance).toBe(0n);
      expect(state.isUnlocked).toBe(false);
    });
  });

  describe('setWallet', () => {
    it('сохраняет address, version и publicKey', () => {
      useWalletStore.getState().setWallet({
        address: 'EQTest123',
        version: 'v4R2',
        publicKey: 'aabbcc',
      });

      const state = useWalletStore.getState();
      expect(state.address).toBe('EQTest123');
      expect(state.version).toBe('v4R2');
      expect(state.publicKey).toBe('aabbcc');
    });

    it('не изменяет balance и isUnlocked', () => {
      useWalletStore.getState().setWallet({
        address: 'EQTest',
        version: 'v3R2',
        publicKey: 'pk',
      });

      const state = useWalletStore.getState();
      expect(state.balance).toBe(0n);
      expect(state.isUnlocked).toBe(false);
    });

    it('поддерживает все три версии контракта', () => {
      const versions = ['v3R2', 'v4R2', 'v5R1'] as const;
      for (const version of versions) {
        useWalletStore.getState().setWallet({ address: 'addr', version, publicKey: 'pk' });
        expect(useWalletStore.getState().version).toBe(version);
      }
    });
  });

  describe('clearWallet', () => {
    it('сбрасывает все поля к начальным значениям', () => {
      const { setWallet, updateBalance, setUnlocked, clearWallet } = useWalletStore.getState();

      setWallet({ address: 'EQ123', version: 'v4R2', publicKey: 'pk' });
      updateBalance(1_000_000_000n);
      setUnlocked(true);

      clearWallet();

      const state = useWalletStore.getState();
      expect(state.address).toBeNull();
      expect(state.version).toBeNull();
      expect(state.publicKey).toBeNull();
      expect(state.balance).toBe(0n);
      expect(state.isUnlocked).toBe(false);
    });
  });

  describe('updateBalance', () => {
    it('обновляет баланс в нанотон', () => {
      useWalletStore.getState().updateBalance(5_000_000_000n);
      expect(useWalletStore.getState().balance).toBe(5_000_000_000n);
    });

    it('принимает нулевой баланс', () => {
      useWalletStore.getState().updateBalance(0n);
      expect(useWalletStore.getState().balance).toBe(0n);
    });
  });

  describe('setUnlocked', () => {
    it('устанавливает isUnlocked в true', () => {
      useWalletStore.getState().setUnlocked(true);
      expect(useWalletStore.getState().isUnlocked).toBe(true);
    });

    it('устанавливает isUnlocked в false', () => {
      useWalletStore.getState().setUnlocked(true);
      useWalletStore.getState().setUnlocked(false);
      expect(useWalletStore.getState().isUnlocked).toBe(false);
    });
  });

  describe('setActivated', () => {
    it('устанавливает isActivated в true', () => {
      useWalletStore.getState().setActivated(true);
      expect(useWalletStore.getState().isActivated).toBe(true);
    });

    it('устанавливает isActivated в false', () => {
      useWalletStore.getState().setActivated(true);
      useWalletStore.getState().setActivated(false);
      expect(useWalletStore.getState().isActivated).toBe(false);
    });
  });

  describe('persist: только address, version, publicKey', () => {
    it('persist сохраняет address, version, publicKey в localStorage', async () => {
      useWalletStore.getState().setWallet({
        address: 'EQPersisted',
        version: 'v5R1',
        publicKey: 'pubkey123',
      });

      // Ждём завершения асинхронной записи persist
      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = localStorage.getItem('ton-pocket-wallet');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.address).toBe('EQPersisted');
      expect(parsed.state.version).toBe('v5R1');
      expect(parsed.state.publicKey).toBe('pubkey123');
    });

    it('persist НЕ сохраняет balance, isUnlocked и isActivated', async () => {
      useWalletStore.getState().setWallet({ address: 'EQ', version: 'v4R2', publicKey: 'pk' });
      useWalletStore.getState().updateBalance(999n);
      useWalletStore.getState().setUnlocked(true);
      useWalletStore.getState().setActivated(true);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = localStorage.getItem('ton-pocket-wallet');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.balance).toBeUndefined();
      expect(parsed.state.isUnlocked).toBeUndefined();
      expect(parsed.state.isActivated).toBeUndefined();
    });
  });
});

describe('isWalletCreated', () => {
  it('возвращает false если vault отсутствует', async () => {
    const { hasVault } = await import('@/crypto/vault');
    vi.mocked(hasVault).mockReturnValue(false);
    expect(isWalletCreated()).toBe(false);
  });

  it('возвращает true если vault существует', async () => {
    const { hasVault } = await import('@/crypto/vault');
    vi.mocked(hasVault).mockReturnValue(true);
    expect(isWalletCreated()).toBe(true);
  });
});

describe('hasWallet', () => {
  beforeEach(() => resetStore());

  it('возвращает false если address не установлен', () => {
    expect(hasWallet()).toBe(false);
  });

  it('возвращает true если address установлен через setWallet', () => {
    useWalletStore.getState().setWallet({ address: 'EQ1', version: 'v4R2', publicKey: 'pk' });
    expect(hasWallet()).toBe(true);
  });

  it('возвращает false после clearWallet', () => {
    useWalletStore.getState().setWallet({ address: 'EQ1', version: 'v4R2', publicKey: 'pk' });
    useWalletStore.getState().clearWallet();
    expect(hasWallet()).toBe(false);
  });
});
