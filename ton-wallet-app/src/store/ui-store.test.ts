/**
 * file: store/ui-store.test.ts
 * description: Unit tests for UI Store (task 5.3)
 * dependencies: ui-store
 * created: 2026-03-31
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from './ui-store';

// --- Helpers ---

function resetStore() {
  useUIStore.setState({
    isLoading: false,
    toasts: [],
    unlockAttempts: 0,
    lockedUntil: null,
  });
}

// --- Tests ---

describe('useUIStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  // --- initial state ---

  describe('initial state', () => {
    it('isLoading — false, toasts — [], unlockAttempts — 0, lockedUntil — null', () => {
      const state = useUIStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.toasts).toEqual([]);
      expect(state.unlockAttempts).toBe(0);
      expect(state.lockedUntil).toBeNull();
    });
  });

  // --- setLoading ---

  describe('setLoading', () => {
    it('sets isLoading to true', () => {
      useUIStore.getState().setLoading(true);
      expect(useUIStore.getState().isLoading).toBe(true);
    });

    it('returns isLoading to false', () => {
      useUIStore.getState().setLoading(true);
      useUIStore.getState().setLoading(false);
      expect(useUIStore.getState().isLoading).toBe(false);
    });
  });

  // --- addToast / removeToast ---

  describe('addToast', () => {
    it('adds toast with unique id', () => {
      useUIStore.getState().addToast({ type: 'success', message: 'Done', duration: 3000 });
      const { toasts } = useUIStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Done');
      expect(typeof toasts[0].id).toBe('string');
      expect(toasts[0].id.length).toBeGreaterThan(0);
    });

    it('adds multiple toasts with unique ids', () => {
      useUIStore.getState().addToast({ type: 'info', message: 'A', duration: 1000 });
      useUIStore.getState().addToast({ type: 'error', message: 'B', duration: 0 });
      const { toasts } = useUIStore.getState();
      expect(toasts).toHaveLength(2);
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it('supports all toast types', () => {
      const types = ['success', 'error', 'warning', 'info'] as const;
      for (const type of types) {
        useUIStore.getState().addToast({ type, message: type, duration: 0 });
      }
      const { toasts } = useUIStore.getState();
      expect(toasts.map((t) => t.type)).toEqual(types);
    });
  });

  describe('removeToast', () => {
    it('removes toast by id', () => {
      useUIStore.getState().addToast({ type: 'info', message: 'Test', duration: 0 });
      const id = useUIStore.getState().toasts[0].id;

      useUIStore.getState().removeToast(id);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('removes only target toast, leaving others', () => {
      useUIStore.getState().addToast({ type: 'info', message: 'First', duration: 0 });
      useUIStore.getState().addToast({ type: 'error', message: 'Second', duration: 0 });

      const firstId = useUIStore.getState().toasts[0].id;
      useUIStore.getState().removeToast(firstId);

      const remaining = useUIStore.getState().toasts;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].message).toBe('Second');
    });

    it('does not throw on removing nonexistent id', () => {
      expect(() => useUIStore.getState().removeToast('nonexistent')).not.toThrow();
    });
  });

  // --- unlock attempts ---

  describe('incrementUnlockAttempts', () => {
    it('increments counter on each call', () => {
      useUIStore.getState().incrementUnlockAttempts();
      expect(useUIStore.getState().unlockAttempts).toBe(1);
      useUIStore.getState().incrementUnlockAttempts();
      expect(useUIStore.getState().unlockAttempts).toBe(2);
    });

    it('on 5th attempt sets lock and resets counter', () => {
      const before = Date.now();
      for (let i = 0; i < 5; i++) {
        useUIStore.getState().incrementUnlockAttempts();
      }
      const state = useUIStore.getState();
      expect(state.unlockAttempts).toBe(0);
      expect(state.lockedUntil).not.toBeNull();
      // lockedUntil ≈ now + 5 minutes (±500ms tolerance)
      expect(state.lockedUntil!).toBeGreaterThanOrEqual(before + 5 * 60 * 1000 - 500);
      expect(state.lockedUntil!).toBeLessThanOrEqual(Date.now() + 5 * 60 * 1000 + 500);
    });

    it('after lock counter is reset and next attempts start from zero', () => {
      for (let i = 0; i < 5; i++) {
        useUIStore.getState().incrementUnlockAttempts();
      }
      useUIStore.setState({ lockedUntil: null }); // simulate lock expiration

      useUIStore.getState().incrementUnlockAttempts();
      expect(useUIStore.getState().unlockAttempts).toBe(1);
    });
  });

  describe('resetUnlockAttempts', () => {
    it('resets counter to 0', () => {
      useUIStore.getState().incrementUnlockAttempts();
      useUIStore.getState().incrementUnlockAttempts();
      useUIStore.getState().resetUnlockAttempts();
      expect(useUIStore.getState().unlockAttempts).toBe(0);
    });
  });

  describe('setLockedUntil', () => {
    it('sets lockedUntil', () => {
      const ts = Date.now() + 300_000;
      useUIStore.getState().setLockedUntil(ts);
      expect(useUIStore.getState().lockedUntil).toBe(ts);
    });

    it('resets lockedUntil to null', () => {
      useUIStore.getState().setLockedUntil(Date.now() + 1000);
      useUIStore.getState().setLockedUntil(null);
      expect(useUIStore.getState().lockedUntil).toBeNull();
    });
  });

  // --- persist ---

  describe('persist: only lockedUntil', () => {
    it('persist saves lockedUntil to localStorage', async () => {
      const ts = Date.now() + 300_000;
      useUIStore.getState().setLockedUntil(ts);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const stored = localStorage.getItem('ton-pocket-ui');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.lockedUntil).toBe(ts);
    });

    it('persist does NOT save isLoading, toasts, unlockAttempts', async () => {
      useUIStore.getState().setLoading(true);
      useUIStore.getState().addToast({ type: 'info', message: 'test', duration: 0 });
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

// --- fake timers — check lock with vi.useFakeTimers ---

describe('useUIStore — time-based lock (fake timers)', () => {
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

  it('lockedUntil in future means active lock', () => {
    const ts = Date.now() + 5 * 60 * 1000;
    useUIStore.getState().setLockedUntil(ts);
    expect(useUIStore.getState().lockedUntil).toBeGreaterThan(Date.now());
  });

  it('lockedUntil in past means lock released', () => {
    useUIStore.getState().setLockedUntil(Date.now() + 1000);
    vi.advanceTimersByTime(2000);
    expect(useUIStore.getState().lockedUntil!).toBeLessThan(Date.now());
  });
});
