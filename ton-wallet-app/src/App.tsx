import { useState } from 'react';
import { WelcomeScreen, CreateWalletScreen } from '@/screens';

type Screen = 'welcome' | 'create';

function App() {
  const [screen, setScreen] = useState<Screen>('welcome');

  if (screen === 'create') {
    return (
      <CreateWalletScreen
        onBack={() => setScreen('welcome')}
        onComplete={() => {/* navigate to main when ready */ }}
      />
    );
  }

  return (
    <WelcomeScreen
      onCreateWallet={() => setScreen('create')}
      onImportWallet={() => { }}
    />
  );
}

export default App;
