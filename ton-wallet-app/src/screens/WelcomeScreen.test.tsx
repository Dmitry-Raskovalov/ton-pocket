/**
 * file: WelcomeScreen.test.tsx
 * description: Unit tests for WelcomeScreen — entry point for create/import
 * dependencies: WelcomeScreen.tsx, wouter
 * created: 2026-04-15
 */

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['', mockSetLocation],
}));

import { WelcomeScreen } from './WelcomeScreen';

describe('WelcomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders app title "TON Testnet Wallet"', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('TON Testnet Wallet')).toBeInTheDocument();
  });

  it('renders Testnet badge', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Testnet')).toBeInTheDocument();
  });

  it('renders "Create New Wallet" button', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Create New Wallet')).toBeInTheDocument();
  });

  it('renders "Import Existing Wallet" button', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Import Existing Wallet')).toBeInTheDocument();
  });

  it('navigates to /create on "Create New Wallet" click', () => {
    render(<WelcomeScreen />);
    fireEvent.click(screen.getByText('Create New Wallet'));
    expect(mockSetLocation).toHaveBeenCalledWith('/create');
  });

  it('navigates to /import on "Import Existing Wallet" click', () => {
    render(<WelcomeScreen />);
    fireEvent.click(screen.getByText('Import Existing Wallet'));
    expect(mockSetLocation).toHaveBeenCalledWith('/import');
  });

  it('renders Testnet warning in footer', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText(/Testnet only/i)).toBeInTheDocument();
  });

  it('renders network metadata', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('testnet-v4.ton.org')).toBeInTheDocument();
  });

  it('renders protocol metadata', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('ADNL/UDP')).toBeInTheDocument();
  });
});
