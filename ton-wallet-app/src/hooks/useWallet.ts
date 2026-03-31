/**
 * Hook for wallet operations.
 */

import { useWalletStore, isWalletCreated, hasWallet } from '@/store';

export function useWallet() {
  const address = useWalletStore((s) => s.address);
  const version = useWalletStore((s) => s.version);
  const publicKey = useWalletStore((s) => s.publicKey);
  const balance = useWalletStore((s) => s.balance);
  const isUnlocked = useWalletStore((s) => s.isUnlocked);

  const setWallet = useWalletStore((s) => s.setWallet);
  const clearWallet = useWalletStore((s) => s.clearWallet);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const setUnlocked = useWalletStore((s) => s.setUnlocked);

  return {
    address,
    version,
    publicKey,
    balance,
    isUnlocked,
    isWalletCreated: isWalletCreated(),
    hasWallet: hasWallet(),
    setWallet,
    clearWallet,
    updateBalance,
    setUnlocked,
  };
}
