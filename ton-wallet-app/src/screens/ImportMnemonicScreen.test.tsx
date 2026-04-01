/**
 * file: ImportMnemonicScreen.test.tsx
 * description: Unit tests for ImportMnemonicScreen (mnemonic input, validation, version selection)
 * dependencies: ImportMnemonicScreen, WalletService, wallet-store, ui-store
 * created: 2026-04-01
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportMnemonicScreen } from './ImportMnemonicScreen';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const mockValidateMnemonic = vi.fn();
const mockImportFromMnemonic = vi.fn();

vi.mock('@/services/wallet/WalletService', () => ({
  walletService: {
    validateMnemonic: (...args: unknown[]) => mockValidateMnemonic(...args),
    importFromMnemonic: (...args: unknown[]) => mockImportFromMnemonic(...args),
  },
}));

const mockSetWallet = vi.fn();
const mockSetUnlocked = vi.fn();
vi.mock('@/store/wallet-store', () => ({
  useWalletStore: () => ({ setWallet: mockSetWallet, setUnlocked: mockSetUnlocked }),
}));

const mockAddToast = vi.fn();
vi.mock('@/store/ui-store', () => ({
  useUIStore: () => ({ addToast: mockAddToast }),
}));

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_WORDS_24 = Array.from({ length: 24 }, (_, i) => `word${i + 1}`).join(' ');
const VALID_WORDS_ARR = VALID_WORDS_24.split(' ');

const DETECTED_WALLETS = [
  {
    version: 'v4R2' as const,
    addressRaw: '0:abc',
    addressFriendly: 'EQCabc123xyz456',
    balance: 5230000000n,
    isDeployed: true,
  },
  {
    version: 'v3R2' as const,
    addressRaw: '0:def',
    addressFriendly: 'EQCdef789mno012',
    balance: 0n,
    isDeployed: false,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/import', mockSetLocation],
}));

function renderScreen() {
  return render(<ImportMnemonicScreen />);
}

function fillTextarea(text: string) {
  const textarea = screen.getByRole('textbox');
  fireEvent.change(textarea, { target: { value: text } });
}

async function advanceToPassword() {
  mockValidateMnemonic.mockResolvedValueOnce(true);
  fillTextarea(VALID_WORDS_24);
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => expect(screen.getByText('Set Password')).toBeInTheDocument());
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ImportMnemonicScreen — Step 1: Enter Mnemonic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 with textarea and word counter', () => {
    renderScreen();
    expect(screen.getByText('Recovery Phrase')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('0 / 24 words')).toBeInTheDocument();
  });

  it('Continue button is disabled when fewer than 24 words', () => {
    renderScreen();
    fillTextarea('word1 word2 word3');
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it('Continue button is enabled when exactly 24 words entered', () => {
    renderScreen();
    fillTextarea(VALID_WORDS_24);
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).not.toBeDisabled();
  });

  it('Continue button is disabled when more than 24 words', () => {
    renderScreen();
    fillTextarea(VALID_WORDS_24 + ' word25');
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it('updates word count display as user types', () => {
    renderScreen();
    fillTextarea('one two three');
    expect(screen.getByText('3 / 24 words')).toBeInTheDocument();
  });

  it('shows error message on invalid mnemonic', async () => {
    mockValidateMnemonic.mockResolvedValueOnce(false);
    renderScreen();
    fillTextarea(VALID_WORDS_24);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/invalid recovery phrase/i)
      ).toBeInTheDocument()
    );
  });

  it('clears error when user modifies textarea after error', async () => {
    mockValidateMnemonic.mockResolvedValueOnce(false);
    renderScreen();
    fillTextarea(VALID_WORDS_24);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByText(/invalid recovery phrase/i)).toBeInTheDocument());

    fillTextarea(VALID_WORDS_24 + ' ');
    expect(screen.queryByText(/invalid recovery phrase/i)).not.toBeInTheDocument();
  });

  it('calls setLocation(/) when back button clicked', () => {
    renderScreen();
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(mockSetLocation).toHaveBeenCalledWith('/');
  });
});

describe('ImportMnemonicScreen — Step 2: Set Password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('advances to password step on valid mnemonic', async () => {
    await renderScreen() && advanceToPassword();
    await waitFor(() => expect(screen.getByText('Set Password')).toBeInTheDocument());
  });

  it('Continue button disabled when password fields are empty', async () => {
    renderScreen();
    await advanceToPassword();
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it('back button on password step returns to mnemonic step', async () => {
    renderScreen();
    await advanceToPassword();
    fireEvent.click(screen.getByLabelText('Go back'));
    await waitFor(() => expect(screen.getByText('Recovery Phrase')).toBeInTheDocument());
  });

  it('calls importFromMnemonic and setLocation(/main) on success (single version)', async () => {
    render(<ImportMnemonicScreen />);
    await advanceToPassword();

    mockImportFromMnemonic.mockResolvedValueOnce({
      address: '0:abc',
      version: 'v4R2',
      needsVersionChoice: false,
      detectedWallets: [],
    });

    // Fill in matching passwords with strength >= 2
    const [passwordField, confirmField] = screen.getAllByPlaceholderText(/password/i);
    fireEvent.change(passwordField, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmField, { target: { value: 'StrongPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockImportFromMnemonic).toHaveBeenCalledWith(VALID_WORDS_ARR, 'StrongPass123!');
      expect(mockSetWallet).toHaveBeenCalledWith({
        address: '0:abc',
        version: 'v4R2',
        publicKey: '',
      });
      expect(mockSetLocation).toHaveBeenCalledWith('/main');
    });
  });

  it('shows error toast on import failure', async () => {
    renderScreen();
    await advanceToPassword();

    mockImportFromMnemonic.mockRejectedValueOnce(new Error('Network error'));

    const [passwordField, confirmField] = screen.getAllByPlaceholderText(/password/i);
    fireEvent.change(passwordField, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmField, { target: { value: 'StrongPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() =>
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Network error' })
      )
    );
  });
});

describe('ImportMnemonicScreen — Step 3: Select Version', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function advanceToVersionSelect() {
    render(<ImportMnemonicScreen />);
    await advanceToPassword();

    mockImportFromMnemonic.mockResolvedValueOnce({
      address: null,
      version: null,
      needsVersionChoice: true,
      detectedWallets: DETECTED_WALLETS,
    });

    const [passwordField, confirmField] = screen.getAllByPlaceholderText(/password/i);
    fireEvent.change(passwordField, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmField, { target: { value: 'StrongPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => expect(screen.getByText('Found multiple wallets')).toBeInTheDocument());
  }

  it('shows version selection screen when needsVersionChoice=true', async () => {
    await advanceToVersionSelect();
    expect(screen.getByText('Found multiple wallets')).toBeInTheDocument();
    expect(screen.getByText('v4R2')).toBeInTheDocument();
    expect(screen.getByText('v3R2')).toBeInTheDocument();
  });

  it('displays balance for each wallet', async () => {
    await advanceToVersionSelect();
    // 5230000000n nanotons = 5.23 TON
    expect(screen.getByText(/5\.23/)).toBeInTheDocument();
    expect(screen.getByText(/0\.00/)).toBeInTheDocument();
  });

  it('back button on version step returns to password step', async () => {
    await advanceToVersionSelect();
    fireEvent.click(screen.getByLabelText('Go back'));
    await waitFor(() => expect(screen.getByText('Set Password')).toBeInTheDocument());
  });

  it('calls importFromMnemonic with selected version and completes', async () => {
    await advanceToVersionSelect();

    mockImportFromMnemonic.mockResolvedValueOnce({
      address: '0:abc',
      version: 'v4R2',
      needsVersionChoice: false,
      detectedWallets: [],
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockImportFromMnemonic).toHaveBeenCalledWith(
        VALID_WORDS_ARR,
        'StrongPass123!',
        'v4R2'
      );
      expect(mockSetLocation).toHaveBeenCalledWith('/main');
    });
  });
});
