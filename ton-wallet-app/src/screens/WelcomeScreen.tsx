/**
 * Welcome screen - entry point for new users.
 */

export function WelcomeScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">TON Testnet Wallet</h1>
        <p className="text-text-secondary mb-8">Self-custodial wallet for TON testnet</p>
        
        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button className="w-full py-3 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors">
            Create Wallet
          </button>
          <button className="w-full py-3 px-6 bg-surface border border-border rounded-lg font-medium hover:bg-surface-hover transition-colors">
            Import Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
