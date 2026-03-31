/**
 * Main wallet screen with balance and transaction history.
 */

import { CopyButton } from '@/components';

export function MainScreen() {
  return (
    <div className="min-h-screen p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">TON Testnet Wallet</h1>
        <button className="p-2 hover:bg-surface rounded-lg">
          ⚙️ Settings
        </button>
      </header>

      <div className="bg-surface rounded-lg p-6 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">0.00 TON</div>
          <div className="text-text-secondary text-sm mb-2">
            Testnet Balance
          </div>
          <div className="flex items-center justify-center gap-2">
            <code className="text-xs bg-background px-2 py-1 rounded">
              EQ...address
            </code>
            <CopyButton text="placeholder-address" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button className="flex-1 py-3 bg-primary text-white rounded-lg font-medium">
          Send
        </button>
        <button className="flex-1 py-3 bg-surface border border-border rounded-lg font-medium">
          Receive
        </button>
      </div>

      <div className="bg-surface rounded-lg p-4">
        <h2 className="font-medium mb-4">Transaction History</h2>
        <div className="text-center text-text-secondary py-8">
          No transactions yet
        </div>
      </div>
    </div>
  );
}
