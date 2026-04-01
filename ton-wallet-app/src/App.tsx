/**
 * file: App.tsx
 * description: Root component with Wouter routing and navigation guards.
 *   - No vault → Onboarding routes (Welcome, Create, Import)
 *   - Vault exists + not unlocked → Unlock Modal overlay
 *   - Unlocked → Protected routes (Main, Send, Receive, Settings)
 * dependencies: wouter, store/wallet-store, store/ui-store, screens, components/UnlockModal
 * created: 2026-04-01
 */

import { Route, Switch, Redirect } from 'wouter';
import { useWalletStore, isWalletCreated } from '@/store/wallet-store';
import { UnlockModal } from '@/components';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { CreateWalletScreen } from '@/screens/CreateWalletScreen';
import { ImportMnemonicScreen } from '@/screens/ImportMnemonicScreen';
import { MainScreen } from '@/screens/MainScreen';
import { SendScreen } from '@/screens/SendScreen';
import { ReceiveScreen } from '@/screens/ReceiveScreen';
import { SettingsScreen } from '@/screens/Settings/SettingsScreen';

function App() {
  const vaultExists = isWalletCreated();
  const isUnlocked = useWalletStore((s) => s.isUnlocked);

  // ─── No vault → Onboarding flow ──────────────────────────────────────────
  if (!vaultExists) {
    return (
      <Switch>
        <Route path="/" component={WelcomeScreen} />
        <Route path="/create" component={CreateWalletScreen} />
        <Route path="/import" component={ImportMnemonicScreen} />
        <Redirect to="/" />
      </Switch>
    );
  }

  // ─── Vault exists + not unlocked → Unlock Modal ──────────────────────────
  if (!isUnlocked) {
    return <UnlockModal />;
  }

  // ─── Unlocked → Protected routes ─────────────────────────────────────────
  return (
    <Switch>
      <Route path="/main" component={MainScreen} />
      <Route path="/send" component={SendScreen} />
      <Route path="/receive" component={ReceiveScreen} />
      <Route path="/settings" component={SettingsScreen} />
      <Redirect to="/main" />
    </Switch>
  );
}

export default App;
