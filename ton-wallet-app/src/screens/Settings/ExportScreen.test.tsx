/**
 * file: ExportScreen.test.tsx
 * description: Unit tests for ExportScreen — password verification then mnemonic display
 * dependencies: ExportScreen.tsx, WalletService
 * created: 2026-04-15
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('argon2-browser', () => {
  throw new Error('WASM not available');
});

vi.mock('@/crypto/password-strength', () => ({
  evaluatePassword: () => ({ score: 3, isAcceptable: true, label: 'Strong', color: '#00ff00', warning: '', suggestions: [] }),
}));

vi.mock('@/components/CopyButton', () => ({
  CopyButton: ({ label }: { label: string }) => <button>{label}</button>,
}));

vi.mock('@/components/PasswordInput', () => ({
  PasswordInput: ({ value, onChange, error, placeholder }: any) => (
    <div>
      <input
        data-testid="password-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <span data-testid="password-error">{error}</span>}
    </div>
  ),
}));

vi.mock('@/components', () => ({
  PasswordInput: ({ value, onChange, error, placeholder }: any) => (
    <div>
      <input
        data-testid="password-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <span data-testid="password-error">{error}</span>}
    </div>
  ),
  CopyButton: ({ label }: { label: string }) => <button>{label}</button>,
}));

const MNEMONIC = Array.from({ length: 24 }, (_, i) => `word${i + 1}`);

vi.mock('@/services/wallet/WalletService', () => ({
  walletService: {
    exportMnemonic: vi.fn(),
  },
}));

vi.mock('@/services/wallet/types', () => ({
  InvalidPasswordError: class extends Error { name = 'InvalidPasswordError'; },
}));

import { ExportScreen } from './ExportScreen';
import { walletService } from '@/services/wallet/WalletService';

describe('ExportScreen', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Step 1: Verify Password ─────────────────────────────────────────────────

  describe('Step 1: Verify Password', () => {
    it('renders "Export Recovery Phrase" heading', () => {
      render(<ExportScreen onClose={onClose} />);
      expect(screen.getByText('Export Recovery Phrase')).toBeInTheDocument();
    });

    it('renders Close button with aria-label', () => {
      render(<ExportScreen onClose={onClose} />);
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('calls onClose on close button click', () => {
      render(<ExportScreen onClose={onClose} />);
      fireEvent.click(screen.getByLabelText('Close'));
      expect(onClose).toHaveBeenCalled();
    });

    it('renders "View Phrase" button', () => {
      render(<ExportScreen onClose={onClose} />);
      expect(screen.getByText('View Phrase')).toBeInTheDocument();
    });

    it('View Phrase is disabled before checkbox is checked', () => {
      render(<ExportScreen onClose={onClose} />);
      expect(screen.getByText('View Phrase')).toBeDisabled();
    });

    it('renders Cancel button', () => {
      render(<ExportScreen onClose={onClose} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onClose on Cancel click', () => {
      render(<ExportScreen onClose={onClose} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();
    });

    it('shows error on wrong password', async () => {
      const { InvalidPasswordError } = await import('@/services/wallet/types');
      vi.mocked(walletService.exportMnemonic).mockRejectedValueOnce(new InvalidPasswordError());

      render(<ExportScreen onClose={onClose} />);

      // Type password
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrong' } });

      // Check "I understand" checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      await act(async () => {
        fireEvent.click(screen.getByText('View Phrase'));
      });

      expect(screen.getByTestId('password-error')).toHaveTextContent('Incorrect password');
    });

    it('shows error on generic failure', async () => {
      vi.mocked(walletService.exportMnemonic).mockRejectedValueOnce(new Error('Network error'));

      render(<ExportScreen onClose={onClose} />);

      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'pass' } });
      fireEvent.click(screen.getByRole('checkbox'));

      await act(async () => {
        fireEvent.click(screen.getByText('View Phrase'));
      });

      expect(screen.getByTestId('password-error')).toHaveTextContent('Failed to export');
    });

    it('renders security warning', () => {
      render(<ExportScreen onClose={onClose} />);
      expect(screen.getByText(/NEVER share your recovery phrase/i)).toBeInTheDocument();
    });
  });

  // ── Step 2: Show Mnemonic ───────────────────────────────────────────────────

  describe('Step 2: Show Mnemonic', () => {
    async function goToStep2() {
      vi.mocked(walletService.exportMnemonic).mockResolvedValueOnce(MNEMONIC);

      render(<ExportScreen onClose={onClose} />);

      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));

      await act(async () => {
        fireEvent.click(screen.getByText('View Phrase'));
      });
    }

    it('shows "Recovery Phrase" heading after verification', async () => {
      await goToStep2();
      expect(screen.getByText('Recovery Phrase')).toBeInTheDocument();
    });

    it('renders all 24 mnemonic words', async () => {
      await goToStep2();
      for (let i = 0; i < 24; i++) {
        expect(screen.getByText(`word${i + 1}`)).toBeInTheDocument();
      }
    });

    it('renders "Copy All" button', async () => {
      await goToStep2();
      expect(screen.getByText('Copy All')).toBeInTheDocument();
    });

    it('renders auto-hide countdown', async () => {
      await goToStep2();
      expect(screen.getByText(/Auto-hiding in 60s/)).toBeInTheDocument();
    });

    it('calls onClose when countdown reaches 0', async () => {
      await goToStep2();

      // Advance through 60 seconds — need to advance in 1s increments
      // because each tick triggers a re-render and new setTimeout
      for (let i = 0; i < 62; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose on Close button in step 2', async () => {
      await goToStep2();
      const closeButtons = screen.getAllByLabelText('Close');
      fireEvent.click(closeButtons[closeButtons.length - 1]);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
