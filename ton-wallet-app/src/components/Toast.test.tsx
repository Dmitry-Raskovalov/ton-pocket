/**
 * file: Toast.test.tsx
 * description: Unit tests for ToastContainer — auto-dismiss and store integration
 * dependencies: Toast, store/ui-store
 * created: 2026-04-01
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastContainer } from './Toast';
import { useUIStore } from '@/store/ui-store';

function resetStore() {
  useUIStore.setState({ isLoading: false, toasts: [], unlockAttempts: 0, lockedUntil: null });
}

describe('ToastContainer', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when toasts list is empty', () => {
    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders toast messages from the store', () => {
    useUIStore.getState().addToast({ type: 'success', message: 'Transaction sent!', duration: 4000 });
    render(<ToastContainer />);
    expect(screen.getByText('Transaction sent!')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    useUIStore.getState().addToast({ type: 'success', message: 'First', duration: 4000 });
    useUIStore.getState().addToast({ type: 'error', message: 'Second', duration: 6000 });
    render(<ToastContainer />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('auto-dismisses toast after its duration', () => {
    useUIStore.getState().addToast({ type: 'info', message: 'Auto gone', duration: 3000 });
    render(<ToastContainer />);
    expect(screen.getByText('Auto gone')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('does NOT auto-dismiss when duration is 0', () => {
    useUIStore.getState().addToast({ type: 'info', message: 'Stays forever', duration: 0 });
    render(<ToastContainer />);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(useUIStore.getState().toasts).toHaveLength(1);
  });
});
