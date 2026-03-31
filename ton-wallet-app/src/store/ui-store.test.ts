/**
 * file: store/ui-store.test.ts
 * description: Юнит-тесты для UI Store (задача 5.3)
 * dependencies: ui-store
 * created: 2026-03-31
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from './ui-store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  useUIStore.setState({
    isLoading: false,
    toasts: [],
    unlockAttempts: 0,
    lockedUntil: null,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useUIStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  // ── начальное состояние ───────────────────────────────────────────────────

  describe('начальное состояние', () => {
    it('isLoading — false, toasts — [], unlockAttempts — 0, lockedUntil — null', () => {
      const state = useUIStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.toasts).toEqual([]);
      expect(state.unlockAttempts).toBe(0);
      expect(state.lockedUntil).toBeNull();
    });
  });

  // ── setLoading ────────────────────────────────────────────────────────────

  describe('setLoading', () => {
    it('устанавливает isLoading в true', () => {
      useUIStore.getState().setLoading(true);
      expect(useUIStore.getState().isLoading).toBe(true);
    });

    it('возвращает isLoading в false', () => {
      useUIStore.getState().setLoading(true);
      useUIStore.getState().setLoading(false);
      expect(useUIStore.getState().isLoading).toBe(false);
    });
  });

  // ── addToast / removeToast ────────────────────────────────────────────────

  describe('addToast', () => {
    it('добавляет toast с уникальным id', () => {
      useUIStore.getState().addToast({ type: 'success', message: 'Готово', duration: 3000 });
      const { toasts } = useUIStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Готово');
      expect(typeof toasts[0].id).toBe('string');
      expect(toasts[0].id.length).toBeGreaterThan(0);
    });

    it('добавляет несколько toast с уникальными id', () => {
      useUIStore.getState().addToast({ type: 'info', message: 'A', duration: 1000 });
      useUIStore.getState().addToast({ type: 'error', message: 'B', duration: 0 });
      const { toasts } = useUIStore.getState();
      expect(toasts).toHaveLength(2);
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it('поддерживает все типы toast', () => {
      const types = ['success', 'error', 'warning', 'info'] as const;
      for (const type of types) {
        useUIStore.getState().addToast({ type, message: type, duration: 0 });
      }
      const { toasts } = useUIStore.getState();
      expect(toasts.map((t) => t.type)).toEqual(types);
    });
  });

  describe('removeToast', () => {
    it('удаляет toast по id', () => {
      useUIStore.getState().addToast({ type: 'info', message: 'Test', duration: 0 });
      const id = useUIStore.getState().toasts[0].id;

      useUIStore.getState().removeToast(id);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('удаляет только нужный toast, оставляя остальные', () => {
      useUIStore.getState().addToast({ type: 'info', message: 'First', duration: 0 });
      useUIStore.getState().addToast({ type: 'error', message: 'Second', duration: 0 });

      const firstId = useUIStore.getState().toasts[0].id;
      useUIStore.getState().removeToast(firstId);

      const remaining = useUIStore.getState().toasts;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].message).toBe('Second');
    });

    it('не бросает ошибку при удалении несуществующего id', () => {
      expect(() => useUIStore.getState().removeToast('nonexistent')).not.toThrow();
    });
  });

  // ── unlock attempts ───────────────────────────────────────────────────────

  describe('incrementUnlockAttempts', () => {
    it('инкрементирует счётчик при каждом вызове', () => {
      useUIStore.getState().incrementUnlockAttempts();
      expect(useUIStore.getState().unlockAttempts).toBe(1);
      useUIStore.getState().incrementUnlockAttempts();
      expect(useUIStore.getState().unlockAttempts).toBe(2);
    });

    it('на 5-й попытке устанавливает блокировку и сбрасывает счётчик', () => {
      const before = Date.now();
      for (let i = 0; i < 5; i++) {
        useUIStore.getState().incrementUnlockAttempts();
      }
      const state = useUIStore.getState();
      expect(state.unlockAttempts).toBe(0);
      expect(state.lockedUntil).not.toBeNull();
      // lockedUntil ≈ now + 5 минут (±500мс погрешности)
      expect(state.lockedUntil!).toBeGreaterThanOrEqual(before + 5 * 60 * 1000 - 500);
      expect(state.lockedUntil!).toBeLessThanOrEqual(Date.now() + 5 * 60 * 1000 + 500);
    });

    it('после блокировки счётчик обнулён и следующие попытки снова идут с нуля', () => {
      for (let i = 0; i < 5; i++) {
        useUIStore.getState().incrementUnlockAttempts();
      }
      useUIStore.setState({ lockedUntil: null }); // симуляция истечения блокировки

      useUIStore.getState().incrementUnlockAttempts();
      expect(useUIStore.getState().unlockAttempts).toBe(1);
    });
  });

  describe('resetUnlockAttempts', () => {
    it('сбрасывает счётчик в 0', () => {
      useUIStore.getState().incrementUnlockAttempts();
      useUIStore.getState().incrementUnlockAttempts();
      useUIStore.getState().resetUnlockAttempts();
      expect(useUIStore.getState().unlockAttempts).toBe(0);
    });
  });

  describe('setLockedUntil', () => {
    it('устанавливает lockedUntil', () => {
      const ts = Date.now() + 300_000;
      useUIStore.getState().setLockedUntil(ts);
      expect(useUIStore.getState().lockedUntil).toBe(ts);
    });

    it('сбрасывает lockedUntil в null', () => {
      useUIStore.getState().setLockedUntil(Date.now() + 1000);
      useUIStore.getState().setLockedUntil(null);
      expect(useUIStore.getState().lockedUntil).toBeNull();
    });
  });

  // ── persist ───────────────────────────────────────────────────────────────

  describe('persist: только lockedUntil', () => {
    it('persist сохраняет lockedUntil в localStorage', async () => {
      const ts = Date.now() + 300_000;
      useUIStore.getState().setLockedUntil(ts);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = localStorage.getItem('ton-pocket-ui');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.lockedUntil).toBe(ts);
    });

    it('persist НЕ сохраняет isLoading, toasts, unlockAttempts', async () => {
      useUIStore.getState().setLoading(true);
      useUIStore.getState().addToast({ type: 'info', message: 'x', duration: 0 });
      useUIStore.setState({ unlockAttempts: 3 });

      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = localStorage.getItem('ton-pocket-ui');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.isLoading).toBeUndefined();
      expect(parsed.state.toasts).toBeUndefined();
      expect(parsed.state.unlockAttempts).toBeUndefined();
    });
  });
});

// ── fake timers — проверка блокировки при использовании vi.useFakeTimers ────

describe('useUIStore — блокировка по времени (fake timers)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useUIStore.setState({
      isLoading: false,
      toasts: [],
      unlockAttempts: 0,
      lockedUntil: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lockedUntil в будущем означает активную блокировку', () => {
    const ts = Date.now() + 5 * 60 * 1000;
    useUIStore.getState().setLockedUntil(ts);
    expect(useUIStore.getState().lockedUntil).toBeGreaterThan(Date.now());
  });

  it('lockedUntil в прошлом означает снятую блокировку', () => {
    useUIStore.getState().setLockedUntil(Date.now() + 1000);
    vi.advanceTimersByTime(2000);
    expect(useUIStore.getState().lockedUntil!).toBeLessThan(Date.now());
  });
});
