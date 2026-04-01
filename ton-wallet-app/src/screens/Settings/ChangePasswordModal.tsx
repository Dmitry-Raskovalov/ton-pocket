/**
 * file: ChangePasswordModal.tsx
 * description: Modal for changing wallet password — 3 fields with strength indicator,
 *   error handling for invalid current password and weak new password.
 * dependencies: walletService, PasswordInput, ui-store, lucide-react
 * created: 2026-04-01
 */

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { walletService } from '@/services/wallet/WalletService';
import { InvalidPasswordError, WeakPasswordError } from '@/services/wallet/types';
import { useUIStore } from '@/store/ui-store';
import { PasswordInput } from '@/components';

export interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const addToast = useUIStore((s) => s.addToast);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const [currentError, setCurrentError] = useState('');
  const [nextError, setNextError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (isLoading) return;

    // Client-side validation
    let hasError = false;
    if (!current) { setCurrentError('Enter your current password'); hasError = true; }
    if (!next) { setNextError('Enter a new password'); hasError = true; }
    if (next && confirm && next !== confirm) {
      setConfirmError('Passwords do not match');
      hasError = true;
    }
    if (hasError) return;

    setIsLoading(true);
    setCurrentError('');
    setNextError('');
    setConfirmError('');

    try {
      await walletService.changePassword(current, next);
      addToast({ type: 'success', message: 'Password changed successfully', duration: 3000 });
      onClose();
    } catch (err) {
      if (err instanceof InvalidPasswordError) {
        setCurrentError('Incorrect password');
      } else if (err instanceof WeakPasswordError) {
        setNextError('Password is too weak. Use at least 8 characters.');
      } else {
        setCurrentError('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [current, next, confirm, isLoading, addToast, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center">
      <div className="w-full max-w-[480px] bg-[#1A1D23] rounded-t-xl md:rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">
              Change Password
            </h3>
            <span className="text-[10px] font-extrabold tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-sm uppercase">
              Testnet
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fields */}
        <div className="p-6 space-y-6">
          <PasswordInput
            label="Current Password"
            value={current}
            onChange={(v) => { setCurrent(v); setCurrentError(''); }}
            placeholder="••••••••"
            error={currentError}
            disabled={isLoading}
          />
          <PasswordInput
            label="New Password"
            value={next}
            onChange={(v) => { setNext(v); setNextError(''); }}
            placeholder="••••••••"
            showStrength
            error={nextError}
            disabled={isLoading}
          />
          <PasswordInput
            label="Confirm New Password"
            value={confirm}
            onChange={(v) => { setConfirm(v); setConfirmError(''); }}
            placeholder="••••••••"
            error={confirmError}
            disabled={isLoading}
          />
        </div>

        {/* Footer */}
        <div className="p-6 bg-surface-container-low flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors border border-white/5 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest bg-primary-container text-on-primary-container rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
