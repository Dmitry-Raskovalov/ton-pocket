/**
 * file: CopyButton.test.tsx
 * description: Unit tests for CopyButton component
 * dependencies: CopyButton
 * created: 2026-04-01
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls clipboard.writeText with the provided text on click', async () => {
    render(<CopyButton text="EQA1_m3abc" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('EQA1_m3abc');
  });

  it('shows "Copied!" aria-label after click', async () => {
    render(<CopyButton text="test" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Copied!');
  });

  it('reverts aria-label to "Copy" after 2 seconds', async () => {
    render(<CopyButton text="test" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Copied!');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Copy');
  });

  it('renders with-text variant showing label text', () => {
    render(<CopyButton text="test" variant="with-text" label="Copy Address" />);
    expect(screen.getByText('Copy Address')).toBeInTheDocument();
  });

  it('shows "Copied!" text in with-text variant after click', async () => {
    render(<CopyButton text="test" variant="with-text" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});
