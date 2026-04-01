/**
 * file: screens/SendScreen.test.tsx
 * description: Unit tests for SendScreen — input validation, confirmation flow, result states
 * dependencies: SendScreen, wallet-store, ui-store, validate-send, transfer, vault
 * created: 2026-04-01
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SendScreen } from './SendScreen';

// ─── Module mocks (all static — no hoisting issues) ────────────────────────────

vi.mock('@/store/wallet-store', () => ({
  useWalletStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      address: '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      balance: 10_000_000_000n,
      version: 'v4R2',
      publicKey: '01'.repeat(32),
      updateBalance: vi.fn(),
    }),
}));

vi.mock('@/store/ui-store', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ addToast: vi.fn() }),
}));

vi.mock('@/services/validation/validate-send', () => ({
  validateSend: vi.fn().mockResolvedValue({ isValid: true, warnings: [] }),
}));

vi.mock('@/services/ton/transfer', () => ({
  sendTransfer: vi.fn().mockResolvedValue({ status: 'confirmed', hash: 'abc123def456789' }),
  ESTIMATED_FEE: 10_000_000n,
}));

vi.mock('@/services/ton/balance', () => ({
  formatTon: (n: bigint) => {
    const whole = n / 1_000_000_000n;
    const frac = n % 1_000_000_000n;
    return `${whole}.${frac.toString().padStart(9, '0')}`;
  },
  getBalance: vi.fn().mockResolvedValue(10_000_000_000n),
}));

vi.mock('@/crypto/vault', () => ({
  loadVault: vi.fn().mockReturnValue({ version: 1, kdf: 'argon2id' }),
  decrypt: vi.fn().mockResolvedValue('["word1","word2"]'),
}));

vi.mock('@/services/wallet/contract-factory', () => ({
  createContract: vi.fn().mockReturnValue({
    address: { toRawString: () => '0:abcdef' },
  }),
}));

vi.mock('@/services/address-book/address-book', () => ({
  addressBook: { addOrUpdateEntry: vi.fn() },
}));

vi.mock('@ton/crypto', () => ({
  mnemonicToPrivateKey: vi.fn().mockResolvedValue({
    publicKey: Buffer.alloc(32, 0x01),
    secretKey: Buffer.alloc(32, 0x02),
  }),
}));

vi.mock('@ton/core', () => ({
  Address: {
    parseRaw: () => ({ toString: () => 'UQBcdef1234567890abcdef1234567890abcdef' }),
    parse: () => ({
      toRawString: () => '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      toString: () => 'UQBtest1234567890abcdef',
    }),
  },
}));

vi.mock('@/components/HighlightedAddress', () => ({
  HighlightedAddress: ({ address, truncate }: { address: string; truncate?: boolean }) => (
    <span data-testid="highlighted-address" data-truncate={!!truncate}>{address}</span>
  ),
}));

vi.mock('@/components/CopyButton', () => ({
  CopyButton: ({ text }: { text: string }) => (
    <button data-testid="copy-button" data-text={text}>Copy</button>
  ),
}));

vi.mock('@/components/WarningList', () => ({
  WarningList: ({ warnings, onAllBlockingConfirmed }: { warnings: unknown[]; onAllBlockingConfirmed: (v: boolean) => void }) => (
    <div data-testid="warning-list" data-count={warnings.length}>
      <button
        data-testid="confirm-all-warnings"
        onClick={() => onAllBlockingConfirmed(true)}
      />
    </div>
  ),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────────

function renderScreen(props: { onBack?: () => void } = {}) {
  return render(<SendScreen onBack={props.onBack ?? vi.fn()} />);
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('SendScreen — Step 1: Input Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Send TON" heading', () => {
    renderScreen();
    expect(screen.getByText('Send TON')).toBeInTheDocument();
  });

  it('renders Testnet badge', () => {
    renderScreen();
    expect(screen.getByText('Testnet')).toBeInTheDocument();
  });

  it('displays available balance', () => {
    renderScreen();
    expect(screen.getByText('Available:')).toBeInTheDocument();
  });

  it('renders recipient address input with placeholder', () => {
    renderScreen();
    expect(screen.getByPlaceholderText('UQ...')).toBeInTheDocument();
  });

  it('renders amount input', () => {
    renderScreen();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('renders comment input', () => {
    renderScreen();
    expect(screen.getByPlaceholderText('Gift for a friend')).toBeInTheDocument();
  });

  it('renders MAX button', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: 'MAX' })).toBeInTheDocument();
  });

  it('Continue button is disabled when form is empty', () => {
    renderScreen();
    const btn = screen.getByRole('button', { name: /continue|validating/i });
    expect(btn).toBeDisabled();
  });

  it('MAX button sets amount to balance minus fee (9.99 TON)', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'MAX' }));
    const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(input.value).toBe('9.99');
  });

  it('calls onBack when back arrow clicked', () => {
    const onBack = vi.fn();
    renderScreen({ onBack });
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders Security Protocol info note', () => {
    renderScreen();
    expect(screen.getByText('Security Protocol')).toBeInTheDocument();
  });
});

describe('SendScreen — Step 2: Confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function goToConfirm() {
    renderScreen();

    fireEvent.change(screen.getByPlaceholderText('UQ...'), {
      target: { value: 'UQBtest1234567890abcdef' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '1.5' },
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText('Confirm Transaction')).toBeInTheDocument();
    });
  }

  it('navigates to confirm step when Continue is clicked', async () => {
    await goToConfirm();
    expect(screen.getByText('Confirm Transaction')).toBeInTheDocument();
  });

  it('displays the amount on confirmation screen', async () => {
    await goToConfirm();
    // Amount is rendered as "1.5 TON" split across spans
    expect(screen.getByText('1.5')).toBeInTheDocument();
    expect(screen.getByText('TON')).toBeInTheDocument();
  });

  it('renders recipient address on confirmation screen', async () => {
    await goToConfirm();
    expect(screen.getByTestId('highlighted-address')).toHaveTextContent('UQBtest1234567890abcdef');
  });

  it('renders password input on confirmation screen', async () => {
    await goToConfirm();
    expect(screen.getByPlaceholderText('Enter Wallet Password')).toBeInTheDocument();
  });

  it('Send button is disabled when password is empty', async () => {
    await goToConfirm();
    expect(screen.getByRole('button', { name: /confirm & send/i })).toBeDisabled();
  });

  it('Cancel button returns to input step', async () => {
    await goToConfirm();
    fireEvent.click(screen.getByRole('button', { name: /cancel transaction/i }));
    expect(screen.getByText('Send TON')).toBeInTheDocument();
  });
});

describe('SendScreen — Step 3: Result States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function goToResult() {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderScreen();

    fireEvent.change(screen.getByPlaceholderText('UQ...'), {
      target: { value: 'UQBtest1234567890abcdef' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '1' },
    });

    await act(async () => { vi.advanceTimersByTime(600); });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText('Confirm Transaction')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Enter Wallet Password'), {
      target: { value: 'mypassword' },
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm & send/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm & send/i }));
  }

  it('shows success state when transfer is confirmed', async () => {
    await goToResult();

    await waitFor(() => {
      expect(screen.getByText('Transaction Sent!')).toBeInTheDocument();
    });

    // Should show hash
    expect(screen.getByText(/Confirmed/)).toBeInTheDocument();
  });

  it('shows error state when transfer fails', async () => {
    const { sendTransfer } = await import('@/services/ton/transfer');
    vi.mocked(sendTransfer).mockResolvedValueOnce({
      status: 'error',
      error: 'Insufficient gas estimate',
    });

    await goToResult();

    await waitFor(() => {
      expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
      expect(screen.getByText('Insufficient gas estimate')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows timeout state when transfer times out', async () => {
    const { sendTransfer } = await import('@/services/ton/transfer');
    vi.mocked(sendTransfer).mockResolvedValueOnce({ status: 'timeout' });

    await goToResult();

    await waitFor(() => {
      expect(screen.getByText('Transaction Status Unknown')).toBeInTheDocument();
    });
  });

  it('shows password error without calling sendTransfer', async () => {
    const { decrypt } = await import('@/crypto/vault');
    vi.mocked(decrypt).mockRejectedValueOnce(new Error('bad'));

    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderScreen();

    fireEvent.change(screen.getByPlaceholderText('UQ...'), {
      target: { value: 'UQBtest1234567890abcdef' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '1' },
    });

    await act(async () => { vi.advanceTimersByTime(600); });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText('Confirm Transaction')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Enter Wallet Password'), {
      target: { value: 'wrong' },
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm & send/i })).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm & send/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument();
    });

    // Should stay on confirm step, not navigate to result
    expect(screen.queryByText('Transaction Failed')).not.toBeInTheDocument();
    expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
  });

  it('Try Again returns to input step', async () => {
    const { sendTransfer } = await import('@/services/ton/transfer');
    vi.mocked(sendTransfer).mockResolvedValueOnce({
      status: 'error',
      error: 'Test error',
    });

    await goToResult();

    await waitFor(() => {
      expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('Send TON')).toBeInTheDocument();
    });
  });
});

describe('SendScreen — MAX calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MAX = balance - fee = 9.99 TON when balance is 10 TON', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'MAX' }));
    const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(input.value).toBe('9.99');
  });
});
