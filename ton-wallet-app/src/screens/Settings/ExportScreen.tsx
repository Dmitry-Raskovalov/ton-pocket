/**
 * file: ExportScreen.tsx
 * description: Two-step export modal — password verification then 24-word mnemonic display
 *   with auto-hide countdown timer (60s).
 * dependencies: walletService, PasswordInput, CopyButton, lucide-react
 * created: 2026-04-01
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { walletService } from '@/services/wallet/WalletService';
import { InvalidPasswordError } from '@/services/wallet/types';
import { PasswordInput, CopyButton } from '@/components';

export interface ExportScreenProps {
  onClose: () => void;
}

const AUTO_HIDE_SECONDS = 60;

export function ExportScreen({ onClose }: ExportScreenProps) {
  const [step, setStep] = useState<'verify' | 'show'>('verify');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(AUTO_HIDE_SECONDS);

  // Auto-hide countdown on step 'show'
  useEffect(() => {
    if (step !== 'show') return;
    if (countdown <= 0) {
      onClose();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, countdown, onClose]);

  const handleViewPhrase = useCallback(async () => {
    if (!understood || isLoading) return;
    setPasswordError('');
    setIsLoading(true);
    try {
      const mnemonic = await walletService.exportMnemonic(password);
      setWords(mnemonic);
      setStep('show');
    } catch (err) {
      if (err instanceof InvalidPasswordError) {
        setPasswordError('Incorrect password');
      } else {
        setPasswordError('Failed to export. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [password, understood, isLoading]);

  // ── Step 1: Verify password ────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-surface-container-low rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]">
          {/* Header */}
          <div className="px-6 py-5 flex justify-between items-start">
            <h2 className="text-on-surface text-xl font-bold tracking-tight">Export Recovery Phrase</h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 pb-8 space-y-6">
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Enter your password to view the recovery phrase.
            </p>

            {/* Warning */}
            <div className="bg-error-container/20 border border-error/10 p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle size={18} className="text-error mt-0.5 shrink-0" />
              <p className="text-on-error-container text-xs font-medium leading-tight">
                NEVER share your recovery phrase with anyone. Anyone with these words can steal your funds.
              </p>
            </div>

            {/* Password + checkbox */}
            <div className="space-y-4">
              <PasswordInput
                value={password}
                onChange={(v) => { setPassword(v); setPasswordError(''); }}
                placeholder="Enter Password"
                error={passwordError}
                disabled={isLoading}
              />

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="h-4 w-4 rounded-sm bg-surface-container-high border-none text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-on-surface-variant text-sm group-hover:text-on-surface transition-colors">
                  I understand the risks
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleViewPhrase}
                disabled={!understood || isLoading}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'View Phrase'}
              </button>
              <button
                onClick={onClose}
                className="w-full text-primary font-bold py-4 rounded-lg hover:bg-surface-container-highest transition-colors active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Show mnemonic ──────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-[480px] bg-surface-container-low rounded-t-xl md:rounded-xl overflow-hidden shadow-[0_-20px_40px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-tertiary" />
            <h3 className="font-bold text-lg">Recovery Phrase</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {/* Warning */}
          <div className="bg-tertiary-container/10 border border-tertiary-container/20 rounded-lg p-4 mb-6">
            <p className="text-xs text-tertiary font-medium leading-relaxed">
              Write down these 24 words in the correct order. Do not share them with anyone.
              This phrase is the ONLY way to recover your wallet.
            </p>
          </div>

          {/* Word grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {words.map((word, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest p-3 rounded border border-white/5 flex items-center gap-3"
              >
                <span className="font-mono text-[10px] text-outline w-4 shrink-0">{i + 1}.</span>
                <span className="font-mono text-sm font-medium text-primary">{word}</span>
              </div>
            ))}
          </div>

          {/* Copy + countdown */}
          <div className="space-y-4 flex flex-col items-center">
            <CopyButton
              text={words.join(' ')}
              variant="with-text"
              label="Copy All"
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-primary text-sm font-bold"
            />
            <div className="flex items-center gap-2 text-on-surface-variant/60">
              <span className="text-[11px] font-medium tracking-wide uppercase">
                Auto-hiding in {countdown}s
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-surface-container shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-primary-fixed-dim hover:bg-primary transition-all text-on-primary-fixed font-extrabold py-4 rounded-xl shadow-lg shadow-primary/10 active:scale-95 duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
