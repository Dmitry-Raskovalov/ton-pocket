import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as walletStore from '@/store/wallet-store';

// Mock components to avoid rendering the full dependency tree
vi.mock('@/components', () => ({
    UnlockModal: () => <div data-testid="unlock-modal">Unlock Modal</div>,
}));
vi.mock('@/screens/WelcomeScreen', () => ({
    WelcomeScreen: () => <div data-testid="welcome-screen">Welcome Screen</div>,
}));
vi.mock('@/screens/CreateWalletScreen', () => ({
    CreateWalletScreen: () => <div data-testid="create-wallet-screen">Create Wallet Screen</div>,
}));
vi.mock('@/screens/ImportMnemonicScreen', () => ({
    ImportMnemonicScreen: () => <div data-testid="import-mnemonic-screen">Import Mnemonic Screen</div>,
}));
vi.mock('@/screens/MainScreen', () => ({
    MainScreen: () => <div data-testid="main-screen">Main Screen</div>,
}));
vi.mock('@/screens/SendScreen', () => ({
    SendScreen: () => <div data-testid="send-screen">Send Screen</div>,
}));
vi.mock('@/screens/ReceiveScreen', () => ({
    ReceiveScreen: () => <div data-testid="receive-screen">Receive Screen</div>,
}));
vi.mock('@/screens/Settings/SettingsScreen', () => ({
    SettingsScreen: () => <div data-testid="settings-screen">Settings Screen</div>,
}));

describe('App Routing Guards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders WelcomeScreen conditionally when no vault exists', () => {
        vi.spyOn(walletStore, 'isWalletCreated').mockReturnValue(false);
        vi.spyOn(walletStore, 'useWalletStore').mockImplementation((selector: any) => selector({ isUnlocked: false }));

        render(<App />);
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
    });

    it('renders UnlockModal when vault exists but not unlocked', () => {
        vi.spyOn(walletStore, 'isWalletCreated').mockReturnValue(true);
        vi.spyOn(walletStore, 'useWalletStore').mockImplementation((selector: any) => selector({ isUnlocked: false }));

        render(<App />);
        expect(screen.getByTestId('unlock-modal')).toBeInTheDocument();
    });

    it('renders MainScreen when vault exists and is unlocked', () => {
        vi.spyOn(walletStore, 'isWalletCreated').mockReturnValue(true);
        vi.spyOn(walletStore, 'useWalletStore').mockImplementation((selector: any) => selector({ isUnlocked: true }));

        // To prevent warning related to location, render App directly (it redirects / to /main)
        window.location.hash = '#/main';

        render(<App />);
        expect(screen.getByTestId('main-screen')).toBeInTheDocument();
    });
});
