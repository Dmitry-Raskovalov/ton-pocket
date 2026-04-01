/**
 * file: SettingsScreen.test.tsx
 * description: Unit tests for SettingsScreen, ExportScreen, ChangePasswordModal
 * dependencies: SettingsScreen, ExportScreen, ChangePasswordModal, walletService, ui-store
 * created: 2026-04-01
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SettingsScreen } from './SettingsScreen';
import { ExportScreen } from './ExportScreen';
import { ChangePasswordModal } from './ChangePasswordModal';
import { InvalidPasswordError, WeakPasswordError } from '@/services/wallet/types';

// ─── Hoisted mocks (must be before vi.mock calls) ─────────────────────────────

const { mockExportMnemonic, mockChangePassword, mockAddToast, mockSetLocation } = vi.hoisted(() => ({
  mockExportMnemonic: vi.fn(),
  mockChangePassword: vi.fn(),
  mockAddToast: vi.fn(),
  mockSetLocation: vi.fn(),
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/settings', mockSetLocation],
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/store/wallet-store', () => ({
  useWalletStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      address: '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      version: 'v4R2',
    }),
}));

vi.mock('@/store/ui-store', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ addToast: mockAddToast }),
}));

vi.mock('@/services/wallet/WalletService', () => ({
  walletService: {
    exportMnemonic: mockExportMnemonic,
    changePassword: mockChangePassword,
  },
}));

vi.mock('@ton/core', () => ({
  Address: {
    parseRaw: () => ({ toString: () => 'UQBabcdef1234567890abcdef' }),
  },
}));

vi.mock('@/components/HighlightedAddress', () => ({
  HighlightedAddress: ({ address }: { address: string }) => (
    <span data-testid="highlighted-address">{address}</span>
  ),
}));

vi.mock('@/components/CopyButton', () => ({
  CopyButton: ({ text }: { text: string }) => (
    <button data-testid="copy-button" data-text={text}>Copy</button>
  ),
}));

vi.mock('@/components/PasswordInput', () => ({
  PasswordInput: ({
    value,
    onChange,
    placeholder,
    error,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
    label?: string;
    showStrength?: boolean;
    disabled?: boolean;
  }) => (
    <div>
      {label && <label>{label}</label>}
      <input
        data-testid={`password-input-${label ?? placeholder ?? 'default'}`}
        type="password"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span data-testid={`error-${label ?? placeholder ?? 'default'}`}>{error}</span>}
    </div>
  ),
}));

// ─── SettingsScreen tests ──────────────────────────────────────────────────────

describe('SettingsScreen', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders settings heading', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders wallet version', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('v4R2')).toBeInTheDocument();
  });

  it('renders TON Testnet network label', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('TON Testnet')).toBeInTheDocument();
  });

  it('renders Testnet badge', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Testnet')).toBeInTheDocument();
  });

  it('calls setLocation(/main) when back button clicked', () => {
    render(<SettingsScreen />);
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(mockSetLocation).toHaveBeenCalledWith('/main');
  });

  it('opens ExportScreen when Export Recovery Phrase clicked', () => {
    render(<SettingsScreen />);
    fireEvent.click(screen.getByText('Export Recovery Phrase'));
    expect(screen.getByText('Export Recovery Phrase', { selector: 'h2' })).toBeInTheDocument();
  });

  it('opens ChangePasswordModal when Change Password clicked', () => {
    render(<SettingsScreen />);
    fireEvent.click(screen.getByText('Change Password'));
    expect(screen.getByText('Change Password', { selector: 'h3' })).toBeInTheDocument();
  });

  it('Delete Wallet button is disabled', () => {
    render(<SettingsScreen />);
    const deleteBtn = screen.getByText('Delete Wallet').closest('button');
    expect(deleteBtn).toBeDisabled();
  });
});

// ─── ExportScreen tests ────────────────────────────────────────────────────────

describe('ExportScreen — step 1: verify password', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders modal title', () => {
    render(<ExportScreen onClose={vi.fn()} />);
    expect(screen.getByText('Export Recovery Phrase')).toBeInTheDocument();
  });

  it('View Phrase button is disabled when checkbox not checked', () => {
    render(<ExportScreen onClose={vi.fn()} />);
    expect(screen.getByText('View Phrase')).toBeDisabled();
  });

  it('View Phrase button enabled after checking "I understand"', () => {
    render(<ExportScreen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('View Phrase')).not.toBeDisabled();
  });

  it('shows error on incorrect password', async () => {
    mockExportMnemonic.mockRejectedValue(new InvalidPasswordError());
    render(<ExportScreen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByTestId('password-input-Enter Password'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByText('View Phrase'));

    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument();
    });
  });

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    render(<ExportScreen onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('ExportScreen — step 2: show mnemonic', () => {
  const mockWords = Array.from({ length: 24 }, (_, i) => `word${i + 1}`);

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportMnemonic.mockResolvedValue(mockWords);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows 24 words after correct password', async () => {
    render(<ExportScreen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByTestId('password-input-Enter Password'), {
      target: { value: 'correctpass' },
    });
    await act(async () => {
      fireEvent.click(screen.getByText('View Phrase'));
    });

    await waitFor(() => {
      expect(screen.getByText('Recovery Phrase')).toBeInTheDocument();
      expect(screen.getByText('word1')).toBeInTheDocument();
      expect(screen.getByText('word24')).toBeInTheDocument();
    });
  });

  it('shows countdown timer on step 2', async () => {
    render(<ExportScreen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByTestId('password-input-Enter Password'), {
      target: { value: 'correctpass' },
    });
    await act(async () => {
      fireEvent.click(screen.getByText('View Phrase'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Auto-hiding in/)).toBeInTheDocument();
    });
  });

  it('calls onClose after 60-second countdown', async () => {
    // Fake timers must be set BEFORE render so useEffect registers with fake setTimeout
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<ExportScreen onClose={onClose} />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByTestId('password-input-Enter Password'), {
      target: { value: 'correctpass' },
    });

    // Click View Phrase and flush the resolved promise (microtasks aren't affected by fake timers)
    await act(async () => {
      fireEvent.click(screen.getByText('View Phrase'));
      // Flush promise chain: mockResolvedValue resolves via microtask queue
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Recovery Phrase')).toBeInTheDocument();

    // Advance 60 seconds one tick at a time, flushing React updates each time
    for (let i = 0; i < 60; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    expect(onClose).toHaveBeenCalled();
  });
});

// ─── ChangePasswordModal tests ────────────────────────────────────────────────

describe('ChangePasswordModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders modal title', () => {
    render(<ChangePasswordModal onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
  });

  it('shows error when current password is incorrect', async () => {
    mockChangePassword.mockRejectedValue(new InvalidPasswordError());
    render(<ChangePasswordModal onClose={vi.fn()} />);

    fireEvent.change(screen.getByTestId('password-input-Current Password'), {
      target: { value: 'wrongcurrent' },
    });
    fireEvent.change(screen.getByTestId('password-input-New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByTestId('password-input-Confirm New Password'), {
      target: { value: 'newpassword123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Change Password', { selector: 'button' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-Current Password')).toHaveTextContent('Incorrect password');
    });
  });

  it('shows error when new password is too weak', async () => {
    mockChangePassword.mockRejectedValue(new WeakPasswordError());
    render(<ChangePasswordModal onClose={vi.fn()} />);

    fireEvent.change(screen.getByTestId('password-input-Current Password'), {
      target: { value: 'currentpass' },
    });
    fireEvent.change(screen.getByTestId('password-input-New Password'), {
      target: { value: 'weak' },
    });
    fireEvent.change(screen.getByTestId('password-input-Confirm New Password'), {
      target: { value: 'weak' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Change Password', { selector: 'button' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-New Password')).toHaveTextContent('Password is too weak');
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<ChangePasswordModal onClose={vi.fn()} />);

    fireEvent.change(screen.getByTestId('password-input-Current Password'), {
      target: { value: 'currentpass' },
    });
    fireEvent.change(screen.getByTestId('password-input-New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByTestId('password-input-Confirm New Password'), {
      target: { value: 'different123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Change Password', { selector: 'button' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-Confirm New Password')).toHaveTextContent(
        'Passwords do not match'
      );
    });
  });

  it('shows success toast and closes on success', async () => {
    mockChangePassword.mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ChangePasswordModal onClose={onClose} />);

    fireEvent.change(screen.getByTestId('password-input-Current Password'), {
      target: { value: 'currentpass' },
    });
    fireEvent.change(screen.getByTestId('password-input-New Password'), {
      target: { value: 'newstrongpass123' },
    });
    fireEvent.change(screen.getByTestId('password-input-Confirm New Password'), {
      target: { value: 'newstrongpass123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Change Password', { selector: 'button' }));
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    render(<ChangePasswordModal onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
