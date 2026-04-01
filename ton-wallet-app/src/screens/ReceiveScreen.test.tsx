/**
 * file: screens/ReceiveScreen.test.tsx
 * description: Unit tests for ReceiveScreen — QR code, address display, copy button, testnet warning
 * dependencies: ReceiveScreen, wallet-store, qrcode.react
 * created: 2026-04-01
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceiveScreen } from './ReceiveScreen';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const MOCK_RAW_ADDRESS = '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
const MOCK_FRIENDLY_ADDRESS = 'UQBCcdef1234567890abcdef1234567890abcdef1234567890abcdef12';

vi.mock('@/store/wallet-store', () => ({
  useWalletStore: (selector: (state: { address: string | null }) => unknown) =>
    selector({ address: MOCK_RAW_ADDRESS }),
}));

vi.mock('@ton/core', () => ({
  Address: {
    parseRaw: () => ({ toString: () => MOCK_FRIENDLY_ADDRESS }),
  },
}));

vi.mock('@/components/HighlightedAddress', () => ({
  HighlightedAddress: ({ address }: { address: string }) => (
    <span data-testid="highlighted-address">{address}</span>
  ),
}));

vi.mock('@/components/CopyButton', () => ({
  CopyButton: ({
    text,
    variant,
    label,
  }: {
    text: string;
    variant: string;
    label: string;
  }) => (
    <button data-testid="copy-button" data-text={text} data-variant={variant} data-label={label}>
      {label}
    </button>
  ),
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, size }: { value: string; size: number }) => (
    <svg data-testid="qr-code" data-value={value} data-size={size} />
  ),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────────

function renderScreen(props: { onBack?: () => void } = {}) {
  return render(
    <ReceiveScreen onBack={props.onBack ?? vi.fn()} />
  );
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ReceiveScreen — header', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders "Receive TON" heading', () => {
    renderScreen();
    expect(screen.getByText('Receive TON')).toBeInTheDocument();
  });

  it('renders Testnet badge', () => {
    renderScreen();
    expect(screen.getByText('Testnet')).toBeInTheDocument();
  });

  it('renders subtitle text', () => {
    renderScreen();
    expect(
      screen.getByText('Your unique wallet address on the TON testnet.')
    ).toBeInTheDocument();
  });

  it('calls onBack when Back button clicked', () => {
    const onBack = vi.fn();
    renderScreen({ onBack });
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

describe('ReceiveScreen — QR code', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders QR code SVG', () => {
    renderScreen();
    const qr = screen.getByTestId('qr-code');
    expect(qr).toBeInTheDocument();
  });

  it('QR code contains user-friendly address', () => {
    renderScreen();
    const qr = screen.getByTestId('qr-code');
    expect(qr).toHaveAttribute('data-value', MOCK_FRIENDLY_ADDRESS);
  });

  it('QR code size is 200', () => {
    renderScreen();
    const qr = screen.getByTestId('qr-code');
    expect(qr).toHaveAttribute('data-size', '200');
  });
});

describe('ReceiveScreen — address display', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders HighlightedAddress with user-friendly address', () => {
    renderScreen();
    const addr = screen.getByTestId('highlighted-address');
    expect(addr).toHaveTextContent(MOCK_FRIENDLY_ADDRESS);
  });

  it('renders "Your Wallet Address" label', () => {
    renderScreen();
    expect(screen.getByText('Your Wallet Address')).toBeInTheDocument();
  });
});

describe('ReceiveScreen — copy button', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders CopyButton with with-text variant', () => {
    renderScreen();
    const btn = screen.getByTestId('copy-button');
    expect(btn).toHaveAttribute('data-variant', 'with-text');
  });

  it('CopyButton has correct label', () => {
    renderScreen();
    const btn = screen.getByTestId('copy-button');
    expect(btn).toHaveAttribute('data-label', 'Copy Address');
  });

  it('CopyButton passes user-friendly address', () => {
    renderScreen();
    const btn = screen.getByTestId('copy-button');
    expect(btn).toHaveAttribute('data-text', MOCK_FRIENDLY_ADDRESS);
  });
});

describe('ReceiveScreen — testnet warning', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders warning title', () => {
    renderScreen();
    expect(screen.getByText('Important Security Note')).toBeInTheDocument();
  });

  it('renders warning message about testnet', () => {
    renderScreen();
    expect(
      screen.getByText(/This is a testnet address\. Do not send real TON here\./)
    ).toBeInTheDocument();
  });
});
