/**
 * file: ChangePasswordModal.test.tsx
 * description: Unit tests for ChangePasswordModal — password change with validation
 * dependencies: ChangePasswordModal.tsx, WalletService, ui-store
 * created: 2026-04-15
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('argon2-browser', () => {
  throw new Error('WASM not available');
});

vi.mock('@/crypto/password-strength', () => ({
  evaluatePassword: (pw: string) => {
    if (pw.length < 8) return { score: 0, isAcceptable: false, label: 'Weak', color: '#ff0000', warning: '', suggestions: [] };
    return { score: 3, isAcceptable: true, label: 'Strong', color: '#00ff00', warning: '', suggestions: [] };
  },
}));

vi.mock('@/components', () => ({
  PasswordInput: ({ label, value, onChange, error, placeholder }: any) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`input-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <span data-testid={`error-${label}`}>{error}</span>}
    </div>
  ),
}));

const mockAddToast = vi.fn();

vi.mock('@/store/ui-store', () => ({
  useUIStore: Object.assign(
    (selector?: (s: any) => any) => selector ? selector({ addToast: mockAddToast }) : { addToast: mockAddToast },
    { getState: () => ({ addToast: mockAddToast }) }
  ),
}));

vi.mock('@/services/wallet/WalletService', () => ({
  walletService: {
    changePassword: vi.fn(),
  },
}));

vi.mock('@/services/wallet/types', () => ({
  InvalidPasswordError: class extends Error { name = 'InvalidPasswordError'; },
  WeakPasswordError: class extends Error { name = 'WeakPasswordError'; },
  NoVaultError: class extends Error { name = 'NoVaultError'; },
}));

import { ChangePasswordModal } from './ChangePasswordModal';
import { walletService } from '@/services/wallet/WalletService';

describe('ChangePasswordModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Change Password" heading', () => {
    render(<ChangePasswordModal onClose={onClose} />);
    expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
  });

  it('renders Close button with aria-label', () => {
    render(<ChangePasswordModal onClose={onClose} />);
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('calls onClose on Close button click', () => {
    render(<ChangePasswordModal onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders Cancel button', () => {
    render(<ChangePasswordModal onClose={onClose} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose on Cancel button click', () => {
    render(<ChangePasswordModal onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders three password fields', () => {
    render(<ChangePasswordModal onClose={onClose} />);
    expect(screen.getByText('Current Password')).toBeInTheDocument();
    expect(screen.getByText('New Password')).toBeInTheDocument();
    expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
  });

  it('renders Testnet badge', () => {
    render(<ChangePasswordModal onClose={onClose} />);
    expect(screen.getByText('Testnet')).toBeInTheDocument();
  });

  it('shows validation error when fields are empty on submit', async () => {
    render(<ChangePasswordModal onClose={onClose} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    });

    expect(screen.getByTestId('error-Current Password')).toHaveTextContent('Enter your current password');
  });

  it('shows error for mismatched passwords', async () => {
    render(<ChangePasswordModal onClose={onClose} />);

    fireEvent.change(screen.getByTestId('input-Current Password'), { target: { value: 'OldPass123!' } });
    fireEvent.change(screen.getByTestId('input-New Password'), { target: { value: 'NewPass123!' } });
    fireEvent.change(screen.getByTestId('input-Confirm New Password'), { target: { value: 'DifferentPass!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    });

    expect(screen.getByTestId('error-Confirm New Password')).toHaveTextContent('Passwords do not match');
  });

  it('shows "Incorrect password" on InvalidPasswordError', async () => {
    const { InvalidPasswordError } = await import('@/services/wallet/types');
    vi.mocked(walletService.changePassword).mockRejectedValueOnce(new InvalidPasswordError());

    render(<ChangePasswordModal onClose={onClose} />);

    fireEvent.change(screen.getByTestId('input-Current Password'), { target: { value: 'WrongPass1!' } });
    fireEvent.change(screen.getByTestId('input-New Password'), { target: { value: 'NewPass12345!' } });
    fireEvent.change(screen.getByTestId('input-Confirm New Password'), { target: { value: 'NewPass12345!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    });

    expect(screen.getByTestId('error-Current Password')).toHaveTextContent('Incorrect password');
  });

  it('shows weak password error on WeakPasswordError', async () => {
    const { WeakPasswordError } = await import('@/services/wallet/types');
    vi.mocked(walletService.changePassword).mockRejectedValueOnce(new WeakPasswordError());

    render(<ChangePasswordModal onClose={onClose} />);

    fireEvent.change(screen.getByTestId('input-Current Password'), { target: { value: 'OldPass123!' } });
    fireEvent.change(screen.getByTestId('input-New Password'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByTestId('input-Confirm New Password'), { target: { value: '12345678' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    });

    expect(screen.getByTestId('error-New Password')).toHaveTextContent('Password is too weak');
  });

  it('shows success toast and calls onClose on successful change', async () => {
    vi.mocked(walletService.changePassword).mockResolvedValueOnce(undefined);

    render(<ChangePasswordModal onClose={onClose} />);

    fireEvent.change(screen.getByTestId('input-Current Password'), { target: { value: 'OldPass123!' } });
    fireEvent.change(screen.getByTestId('input-New Password'), { target: { value: 'NewStrongPass1!' } });
    fireEvent.change(screen.getByTestId('input-Confirm New Password'), { target: { value: 'NewStrongPass1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', message: 'Password changed successfully' }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('shows generic error on unknown failure', async () => {
    vi.mocked(walletService.changePassword).mockRejectedValueOnce(new Error('Unknown'));

    render(<ChangePasswordModal onClose={onClose} />);

    fireEvent.change(screen.getByTestId('input-Current Password'), { target: { value: 'OldPass123!' } });
    fireEvent.change(screen.getByTestId('input-New Password'), { target: { value: 'NewStrongPass1!' } });
    fireEvent.change(screen.getByTestId('input-Confirm New Password'), { target: { value: 'NewStrongPass1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    });

    expect(screen.getByTestId('error-Current Password')).toHaveTextContent('Failed to change password');
    expect(onClose).not.toHaveBeenCalled();
  });
});
