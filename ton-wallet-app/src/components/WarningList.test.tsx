/**
 * file: WarningList.test.tsx
 * description: Unit tests for WarningList component
 * dependencies: WarningList, services/validation/types
 * created: 2026-04-01
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WarningList } from './WarningList';
import type { Warning } from '@/services/validation/types';

const blockingError: Warning = {
  type: 'insufficient_balance',
  message: 'Not enough funds.',
  severity: 'error',
  blocking: true,
};

const blockingWarning: Warning = {
  type: 'self_send',
  message: 'Sending to yourself.',
  severity: 'warning',
  blocking: true,
};

const nonBlocking: Warning = {
  type: 'low_remainder',
  message: 'Low balance after transfer.',
  severity: 'warning',
  blocking: false,
};

describe('WarningList', () => {
  it('renders nothing when warnings array is empty', () => {
    const { container } = render(
      <WarningList warnings={[]} onAllBlockingConfirmed={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all warning messages', () => {
    render(
      <WarningList
        warnings={[blockingError, nonBlocking]}
        onAllBlockingConfirmed={vi.fn()}
      />
    );
    expect(screen.getByText('Not enough funds.')).toBeInTheDocument();
    expect(screen.getByText('Low balance after transfer.')).toBeInTheDocument();
  });

  it('renders checkbox only for blocking warnings', () => {
    render(
      <WarningList
        warnings={[blockingError, nonBlocking]}
        onAllBlockingConfirmed={vi.fn()}
      />
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  });

  it('calls onAllBlockingConfirmed(false) initially when blocking warnings exist', () => {
    const onAllBlockingConfirmed = vi.fn();
    render(
      <WarningList warnings={[blockingError]} onAllBlockingConfirmed={onAllBlockingConfirmed} />
    );
    expect(onAllBlockingConfirmed).toHaveBeenCalledWith(false);
  });

  it('calls onAllBlockingConfirmed(true) when all blocking checkboxes are checked', () => {
    const onAllBlockingConfirmed = vi.fn();
    render(
      <WarningList
        warnings={[blockingError]}
        onAllBlockingConfirmed={onAllBlockingConfirmed}
      />
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onAllBlockingConfirmed).toHaveBeenCalledWith(true);
  });

  it('does NOT call onAllBlockingConfirmed(true) when only some blocking warnings are checked', () => {
    const onAllBlockingConfirmed = vi.fn();
    render(
      <WarningList
        warnings={[blockingError, blockingWarning]}
        onAllBlockingConfirmed={onAllBlockingConfirmed}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // only check first

    const calls = onAllBlockingConfirmed.mock.calls.map(([v]) => v);
    expect(calls).not.toContain(true);
  });

  it('calls onAllBlockingConfirmed(true) when ALL blocking warnings are checked', () => {
    const onAllBlockingConfirmed = vi.fn();
    render(
      <WarningList
        warnings={[blockingError, blockingWarning]}
        onAllBlockingConfirmed={onAllBlockingConfirmed}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    expect(onAllBlockingConfirmed).toHaveBeenLastCalledWith(true);
  });

  it('calls onAllBlockingConfirmed(true) when all warnings are non-blocking', () => {
    // No blocking warnings → nothing to confirm → automatically true
    const onAllBlockingConfirmed = vi.fn();
    render(
      <WarningList warnings={[nonBlocking]} onAllBlockingConfirmed={onAllBlockingConfirmed} />
    );
    expect(onAllBlockingConfirmed).toHaveBeenCalledWith(true);
  });
});
