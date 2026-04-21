/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * file: screens/SendScreen.test.tsx
 * description: Unit tests for SendScreen — multi-step flow, validation, and security protocol
 * dependencies: SendScreen, wallet-store, ui-store, validate-send, transfer, vault
 * created: 2026-04-01
 */

import { vi } from 'vitest';

// ─── IntersectionObserver mock ──────────────────────────────
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn();
  unobserve = vi.fn();
}
(globalThis as unknown as any).IntersectionObserver = IntersectionObserverMock;
if (typeof window !== 'undefined') {
  (window as unknown as any).IntersectionObserver = IntersectionObserverMock;
}

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SendScreen } from './SendScreen';
import * as vaultModule from '@/crypto/vault';
import * as transferModule from '@/services/ton/transfer';

// ─── Module mocks ────────────────────────────────────────────────────────────

const mockAddToast = vi.fn();
const mockStore = {
  address: '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  balance: 12_340_000_000n,
  version: 'v4R2' as const,
  publicKey: '01'.repeat(32),
  updateBalance: vi.fn(),
};

vi.mock('@/store/wallet-store', () => ({
  useWalletStore: Object.assign(
    (selector?: (s: any) => any) => (selector ? selector(mockStore) : mockStore),
    { getState: () => mockStore }
  ),
}));

vi.mock('@/store/ui-store', () => ({
  useUIStore: Object.assign(
    (selector?: (s: any) => any) => (selector ? selector({ addToast: mockAddToast }) : { addToast: mockAddToast }),
    { getState: () => ({ addToast: mockAddToast }) }
  ),
}));

vi.mock('@/crypto/session', () => ({
  getSessionPassword: vi.fn().mockReturnValue('mypassword'),
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
    return frac === 0n ? `${whole}` : `${whole}.${frac.toString().slice(0, 2)}`;
  },
  getBalance: vi.fn().mockResolvedValue(12_340_000_000n),
}));

vi.mock('@/crypto/vault', () => ({
  loadVault: vi.fn().mockReturnValue({ version: 1, ciphertext: 'abc', iv: 'def', salt: 'ghi', kdfParams: {} }),
  decrypt: vi.fn().mockResolvedValue('["word1","word2"]'),
  encrypt: vi.fn(),
  saveVault: vi.fn(),
}));

vi.mock('@/services/wallet/contract-factory', () => ({
  createContract: vi.fn().mockReturnValue({
    address: { toRawString: () => '0:abcdef' },
  }),
}));

vi.mock('@/services/address-book', () => ({
  addressBook: {
    getEntries: () => [],
    addOrUpdateEntry: vi.fn(),
  },
}));

vi.mock('@ton/crypto', () => ({
  mnemonicToPrivateKey: vi.fn().mockResolvedValue({
    publicKey: Buffer.alloc(32, 0x01),
    secretKey: Buffer.alloc(64, 0x02),
  }),
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/send', vi.fn()],
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SendScreen UI Flow', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  async function fillFormAndContinue(amount = '1.5') {
    vi.useFakeTimers();
    render(<SendScreen />);

    fireEvent.change(screen.getByPlaceholderText('UQ...'), {
      target: { value: 'UQBtest1234567890abcdef' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: amount },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    // Restore real timers BEFORE calling async finders
    vi.useRealTimers();

    const continueBtn = await screen.findByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    await screen.findByText(/Step 2 of 3/i);
  }

  it('renders Step 1 with correct available balance', () => {
    render(<SendScreen />);
    expect(screen.getByText(/Available:/i).parentElement).toHaveTextContent(/12\.34/);
  });

  it('MAX button calculates 12.33 from 12.34', () => {
    render(<SendScreen />);
    fireEvent.click(screen.getByRole('button', { name: /max/i }));
    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(amountInput.value).toBe('12.33');
  });

  it('navigates through the 3-step flow on success', async () => {
    await fillFormAndContinue();

    // Step 2 assertions
    expect(screen.getByText('1.5')).toBeInTheDocument();
    expect(screen.getByTestId('highlighted-address')).toHaveTextContent('UQBtest1234567890abcdef');

    // Confirm & Send
    fireEvent.click(screen.getByRole('button', { name: /confirm & send/i }));

    await screen.findByText(/Transaction Sent!/i);
  });

  it('allows retrying after a transfer failure', async () => {
    vi.spyOn(transferModule, 'sendTransfer').mockResolvedValueOnce({ status: 'error', hash: 'null' });

    await fillFormAndContinue();
    fireEvent.click(screen.getByRole('button', { name: /confirm & send/i }));

    await screen.findByText(/Transaction Failed/i);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument();
  });

  it('handles vault decryption error by showing toast and staying on Step 2', async () => {
    vi.spyOn(vaultModule, 'decrypt').mockRejectedValueOnce(new Error('Incorrect master password'));

    await fillFormAndContinue();
    fireEvent.click(screen.getByRole('button', { name: /confirm & send/i }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Incorrect master password' })
      );
    });

    // Verify it stays on Step 2 (or returns to it)
    expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument();
  });

  it('handles transfer timeouts with status unknown screen', async () => {
    vi.spyOn(transferModule, 'sendTransfer').mockResolvedValueOnce({ status: 'timeout', hash: 'timeout_hash' });

    await fillFormAndContinue();
    fireEvent.click(screen.getByRole('button', { name: /confirm & send/i }));

    await screen.findByText(/Transaction Status Unknown/i);
  });

  it('back button from Step 2 returns to Step 1', async () => {
    await fillFormAndContinue();
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(screen.getByText('Send TON')).toBeInTheDocument();
  });
});

// ─── Corrupted vault handling ─────────────────────────────────────────────────

describe('SendScreen — corrupted vault handling', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  async function fillFormAndContinue() {
    vi.useFakeTimers();
    render(<SendScreen />);

    fireEvent.change(screen.getByPlaceholderText('UQ...'), {
      target: { value: 'UQBtest1234567890abcdef' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '1.0' },
    });

    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    vi.useRealTimers();

    const continueBtn = await screen.findByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);
    await screen.findByText(/Step 2 of 3/i);
  }

  it('показывает toast и остаётся на Step 2 если decrypt вернул невалидный JSON', async () => {
    vi.spyOn(vaultModule, 'decrypt').mockResolvedValueOnce('not {{ valid json');

    await fillFormAndContinue();
    fireEvent.click(screen.getByRole('button', { name: /confirm & send/i }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });
    expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument();
  });

  it('показывает "Invalid mnemonic data" если vault содержит не массив', async () => {
    vi.spyOn(vaultModule, 'decrypt').mockResolvedValueOnce('"just a string"');

    await fillFormAndContinue();
    fireEvent.click(screen.getByRole('button', { name: /confirm & send/i }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Invalid mnemonic data in vault' })
      );
    });
    expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument();
  });

  it('показывает "Invalid mnemonic data" если массив содержит не строки', async () => {
    vi.spyOn(vaultModule, 'decrypt').mockResolvedValueOnce('[1, 2, 3]');

    await fillFormAndContinue();
    fireEvent.click(screen.getByRole('button', { name: /confirm & send/i }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Invalid mnemonic data in vault' })
      );
    });
    expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument();
  });
});

// ─── debouncedValidate stability ─────────────────────────────────────────────

describe('SendScreen — debouncedValidate вызывается ровно один раз за изменение', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('validateSend вызывается ровно 1 раз после одного изменения ввода', async () => {
    const { validateSend } = await import('@/services/validation/validate-send');

    vi.useFakeTimers();
    render(<SendScreen />);

    fireEvent.change(screen.getByPlaceholderText('UQ...'), {
      target: { value: 'UQBtest1234567890abcdef' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '1' },
    });

    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    vi.useRealTimers();

    expect(vi.mocked(validateSend)).toHaveBeenCalledTimes(1);
  });

  it('debounce подавляет промежуточные вызовы при быстром вводе', async () => {
    const { validateSend } = await import('@/services/validation/validate-send');

    vi.useFakeTimers();
    render(<SendScreen />);

    const input = screen.getByPlaceholderText('0.00');
    // Быстрые последовательные изменения — должен отработать только последний
    fireEvent.change(input, { target: { value: '1' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    fireEvent.change(input, { target: { value: '2' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    fireEvent.change(input, { target: { value: '3' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });

    vi.useRealTimers();

    expect(vi.mocked(validateSend)).toHaveBeenCalledTimes(1);
  });
});
