/**
 * file: components/UnlockModal.tsx
 * description: Full-screen unlock modal — password input, attempt counter (5),
 *   lockout timer (5 min). Uses UIStore for attempts/lockout and vault.decrypt for verification.
 * dependencies: crypto/vault, store/ui-store, store/wallet-store, lucide-react
 * created: 2026-04-01
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, AlertTriangle, Eye, EyeOff, Settings, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { loadVault, decrypt, clearVault } from '@/crypto/vault';
import { setSessionPassword } from '@/crypto/session';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';
import { seedWalletData } from '@/services/wallet/seed-wallet-data';

const MAX_ATTEMPTS = 5;

export function UnlockModal() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [, setLocation] = useLocation();
  const setUnlocked = useWalletStore((s) => s.setUnlocked);
  const clearWallet = useWalletStore((s) => s.clearWallet);
  const unlockAttempts = useUIStore((s) => s.unlockAttempts);
  const lockedUntil = useUIStore((s) => s.lockedUntil);
  const incrementUnlockAttempts = useUIStore((s) => s.incrementUnlockAttempts);
  const resetUnlockAttempts = useUIStore((s) => s.resetUnlockAttempts);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  function handleDeleteWallet() {
    clearVault();
    clearWallet();
    resetUnlockAttempts();
    setLocation('/');
  }

  const attemptsLeft = MAX_ATTEMPTS - unlockAttempts;
  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLocked || lockedUntil === null) {
      setRemainingSeconds(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setRemainingSeconds(remaining);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isLocked, lockedUntil]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isLocked || !password) return;

    setError('');
    setIsSubmitting(true);

    try {
      const vault = loadVault();
      if (!vault) {
        setError('Wallet data not found');
        return;
      }

      await decrypt(vault, password);

      // Success — unlock wallet
      resetUnlockAttempts();
      setUnlocked(true);
      setSessionPassword(password);

      // Load initial data
      const { address } = useWalletStore.getState();
      if (address) seedWalletData(address);
    } catch {
      setError('Incorrect password');
      incrementUnlockAttempts();
    } finally {
      setIsSubmitting(false);
    }
  }, [password, isSubmitting, isLocked, setUnlocked, resetUnlockAttempts, incrementUnlockAttempts]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const formatCountdown = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center px-6">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Top bar — gear aligned to content width */}
      <div className="relative z-20 w-full max-w-[400px] flex justify-end py-4">
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Wallet options"
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <Settings size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-surface-container rounded-xl shadow-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-error hover:bg-error/10 transition-colors"
              >
                <Trash2 size={16} />
                Delete Wallet
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center flex-1 justify-center pb-16">
        {/* Lock icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
          <div className="relative w-20 h-20 rounded-full bg-surface-container border border-white/5 flex items-center justify-center">
            <Lock size={32} className="text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold tracking-tight text-on-surface mb-2">
          Unlock Wallet
        </h1>
        <p className="text-on-surface-variant text-sm text-center mb-8 max-w-[280px] leading-relaxed">
          Enter your password to access your wallet
        </p>

        {/* Lockout message */}
        {isLocked && remainingSeconds > 0 && (
          <div className="w-full bg-error-container/10 border border-error/20 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle size={18} className="text-error shrink-0" />
            <div>
              <p className="text-xs font-bold text-error uppercase tracking-wider">
                Too many attempts
              </p>
              <p className="text-sm text-error/80">
                Try again in {formatCountdown(remainingSeconds)}
              </p>
            </div>
          </div>
        )}

        {/* Password field */}
        {!isLocked && (
          <div className="w-full space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock size={16} className="text-on-surface-variant" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                disabled={isSubmitting}
                autoFocus
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-12 text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-error px-1">{error}</p>
            )}

            {/* Attempts remaining */}
            {attemptsLeft > 0 && attemptsLeft < MAX_ATTEMPTS && (
              <p className="text-xs text-on-surface-variant px-1">
                {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
              </p>
            )}

            {/* Submit button */}
            <button
              onClick={() => void handleSubmit()}
              disabled={!password || isSubmitting}
              className="w-full py-4 rounded-xl font-bold text-on-primary-fixed active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{ background: 'linear-gradient(135deg, #a0caff 0%, #4f94dd 100%)' }}
            >
              {isSubmitting ? (
                <span className="animate-spin inline-block w-5 h-5 border-2 border-on-primary-fixed/30 border-t-on-primary-fixed rounded-full" />
              ) : (
                'Unlock'
              )}
            </button>
          </div>
        )}

        {/* Testnet badge */}
        <div className="mt-8">
          <span className="text-[10px] font-extrabold tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-sm uppercase">
            Testnet
          </span>
        </div>
      </div>

      {/* Delete Wallet Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[480px] bg-surface-container rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-error/15 flex items-center justify-center text-error shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-lg font-bold text-on-surface">Delete Wallet</h3>
              </div>

              <div className="bg-error/10 border border-error/20 rounded-xl p-4 space-y-2">
                <p className="text-sm text-on-surface font-medium">
                  The wallet will be removed from browser storage only.
                </p>
                <p className="text-sm text-on-surface-variant">
                  Your funds remain on the blockchain. You can restore access at any time by importing your recovery phrase.
                </p>
              </div>

              <p className="text-xs text-on-surface-variant">
                Make sure your recovery phrase is saved — without it, access cannot be restored.
              </p>

              <p className="text-xs text-primary/80 bg-primary/10 rounded-lg px-3 py-2">
                After deletion you can import this wallet again, create a new one, or import a different wallet.
              </p>
            </div>

            <div className="flex border-t border-white/10">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <div className="w-px bg-white/10" />
              <button
                onClick={handleDeleteWallet}
                className="flex-1 py-4 text-sm font-bold text-error hover:bg-error/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
