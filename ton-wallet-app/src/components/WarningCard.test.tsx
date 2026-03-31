/**
 * file: WarningCard.test.tsx
 * description: Unit tests for WarningCard component
 * dependencies: WarningCard, services/validation/types
 * created: 2026-04-01
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WarningCard } from './WarningCard';
import type { Warning } from '@/services/validation/types';

const makeWarning = (overrides: Partial<Warning> = {}): Warning => ({
  type: 'insufficient_balance',
  message: 'Not enough funds.',
  severity: 'error',
  blocking: true,
  ...overrides,
});

describe('WarningCard', () => {
  describe('renders message and formatted type', () => {
    it('displays formatted type as title', () => {
      render(
        <WarningCard warning={makeWarning({ type: 'self_send' })} checked={false} onCheck={vi.fn()} />
      );
      expect(screen.getByText('Self Send')).toBeInTheDocument();
    });

    it('displays warning message', () => {
      render(
        <WarningCard warning={makeWarning({ message: 'Custom warning text.' })} checked={false} onCheck={vi.fn()} />
      );
      expect(screen.getByText('Custom warning text.')).toBeInTheDocument();
    });
  });

  describe('blocking checkbox', () => {
    it('shows checkbox when warning.blocking=true', () => {
      render(
        <WarningCard warning={makeWarning({ blocking: true })} checked={false} onCheck={vi.fn()} />
      );
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('does not show checkbox when warning.blocking=false', () => {
      render(
        <WarningCard warning={makeWarning({ blocking: false })} checked={false} onCheck={vi.fn()} />
      );
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('checkbox reflects controlled checked=true', () => {
      render(
        <WarningCard warning={makeWarning({ blocking: true })} checked={true} onCheck={vi.fn()} />
      );
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('checkbox reflects controlled checked=false', () => {
      render(
        <WarningCard warning={makeWarning({ blocking: true })} checked={false} onCheck={vi.fn()} />
      );
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('calls onCheck with true when checkbox is clicked', () => {
      const onCheck = vi.fn();
      render(
        <WarningCard warning={makeWarning({ blocking: true })} checked={false} onCheck={onCheck} />
      );
      fireEvent.click(screen.getByRole('checkbox'));
      expect(onCheck).toHaveBeenCalledWith(true);
    });
  });

  describe('severity styling', () => {
    it('applies error border class for error severity', () => {
      const { container } = render(
        <WarningCard warning={makeWarning({ severity: 'error' })} checked={false} onCheck={vi.fn()} />
      );
      expect(container.firstChild).toHaveClass('border-error');
    });

    it('applies tertiary border class for warning severity', () => {
      const { container } = render(
        <WarningCard warning={makeWarning({ severity: 'warning' })} checked={false} onCheck={vi.fn()} />
      );
      expect(container.firstChild).toHaveClass('border-tertiary');
    });

    it('applies primary border class for info severity', () => {
      const { container } = render(
        <WarningCard warning={makeWarning({ severity: 'info' })} checked={false} onCheck={vi.fn()} />
      );
      expect(container.firstChild).toHaveClass('border-primary');
    });
  });
});
