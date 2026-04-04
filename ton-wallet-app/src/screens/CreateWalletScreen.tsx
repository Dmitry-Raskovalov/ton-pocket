/**
 * file: CreateWalletScreen.tsx
 * description: Two-step wallet creation screen: set password → backup mnemonic.
 * dependencies: WalletService, wallet-store, ui-store, PasswordInput, CopyButton, wouter
 * created: 2026-04-01
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Settings, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { PasswordInput } from '@/components/PasswordInput';
import { CopyButton } from '@/components/CopyButton';
import { evaluatePassword } from '@/crypto/password-strength';
import { walletService } from '@/services/wallet/WalletService';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';

// ─── Step 1: Set Password ──────────────────────────────────────────────────────

interface StepPasswordProps {
  onBack: () => void;
  onContinue: (password: string) => Promise<void>;
  isLoading: boolean;
}

function StepPassword({ onBack, onContinue, isLoading }: StepPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const strength = evaluatePassword(password);
  const passwordsMatch = password === confirm;
  const canContinue =
    !isLoading && strength.isAcceptable && password.length > 0 && passwordsMatch && confirm.length > 0;

  const handleConfirmChange = (value: string) => {
    setConfirm(value);
    if (confirmError && value === password) setConfirmError('');
  };

  const handleContinue = async () => {
    if (!passwordsMatch) {
      setConfirmError('Passwords do not match');
      return;
    }
    await onContinue(password);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background flex justify-between items-center max-w-[480px] mx-auto px-6 py-4 w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="hover:opacity-80 transition-opacity active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft size={24} className="text-primary" />
          </button>
          <span className="font-bold uppercase text-xs tracking-tight text-on-surface">TON Wallet</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-sm uppercase">
            Testnet
          </span>
          <Settings size={20} className="text-primary" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-[480px] mx-auto px-6 pt-8 pb-32">
        {/* Step label & heading */}
        <div className="mb-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
            Step 1 of 2
          </span>
          <h2 className="text-3xl font-extrabold tracking-tighter text-on-surface mt-2 mb-3">
            Create New Wallet
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed max-w-[320px]">
            Set a password to protect your wallet. This password will be used to authorize
            transactions on this device.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8">
          <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter secure password"
            showStrength
          />

          <PasswordInput
            label="Confirm Password"
            value={confirm}
            onChange={handleConfirmChange}
            placeholder="Repeat your password"
            error={confirmError || (confirm.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined)}
          />

          {/* Info banner */}
          <div className="bg-surface-container p-4 rounded-xl flex gap-4 items-start border border-white/5">
            <Info size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Encryption is handled locally. Your password is never sent to our servers. If
              forgotten, your wallet can only be recovered using your recovery phrase.
            </p>
          </div>
        </div>
      </main>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full text-on-primary-fixed font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(160,202,255,0.15)] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          style={{ background: 'linear-gradient(135deg, #a0caff 0%, #4f94dd 100%)' }}
        >
          {isLoading ? (
            <span className="animate-spin inline-block w-5 h-5 border-2 border-on-primary-fixed/30 border-t-on-primary-fixed rounded-full" />
          ) : (
            <>
              Continue
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Backup Mnemonic ───────────────────────────────────────────────────

interface StepMnemonicProps {
  mnemonic: string[];
  onBack: () => void;
  onContinue: () => void;
}

function StepMnemonic({ mnemonic, onBack, onContinue }: StepMnemonicProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md flex justify-between items-center w-full max-w-[480px] mx-auto px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center p-1 hover:bg-surface-container-high rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={20} className="text-on-surface" />
        </button>
        <span className="text-[10px] font-extrabold tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-sm uppercase">
          Testnet
        </span>
      </header>

      <main className="w-full max-w-[480px] mx-auto px-6 pb-32 space-y-8">
        {/* Header section */}
        <div className="space-y-2">
          <p className="text-primary text-xs font-bold uppercase tracking-widest">Step 2 of 2</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface leading-tight">
            Back Up Recovery Phrase
          </h1>
        </div>

        {/* Warning card */}
        <div className="bg-surface-container border-l-4 border-tertiary p-5 flex gap-4 items-start shadow-lg">
          <AlertTriangle size={20} className="text-tertiary shrink-0 mt-0.5" />
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Write down these 24 words and store them safely. They are the{' '}
            <span className="text-on-surface font-bold">ONLY</span> way to recover your wallet.
          </p>
        </div>

        {/* Mnemonic grid */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-white/5">
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            {mnemonic.map((word, i) => (
              <div key={i} className="flex gap-2 items-baseline">
                <span className="text-[10px] font-mono text-outline shrink-0 w-4">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-mono text-on-surface font-medium">{word}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copy all */}
        <div className="flex justify-center">
          <CopyButton
            text={mnemonic.join(' ')}
            variant="with-text"
            label="Copy All"
            className="text-primary text-xs font-bold uppercase tracking-widest hover:opacity-80 active:scale-95 transition-all"
          />
        </div>

        {/* Checkbox */}
        <div className="space-y-8 pt-4">
          <label className="flex items-center gap-4 cursor-pointer group">
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="checkbox"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
                className="appearance-none w-6 h-6 border-2 border-outline-variant rounded-md bg-surface-container checked:bg-primary checked:border-primary transition-all cursor-pointer"
              />
              {saved && (
                <svg
                  className="absolute pointer-events-none"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M2 7l4 4 6-6"
                    stroke="#003259"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
              I have saved my recovery phrase
            </span>
          </label>
        </div>
      </main>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={onContinue}
          disabled={!saved}
          className="w-full h-14 text-on-primary-fixed font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(160,202,255,0.15)] active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          style={{ background: 'linear-gradient(135deg, #a0caff 0%, #4f94dd 100%)' }}
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Background glow decorations */}
      <div className="fixed top-[-10%] right-[-10%] w-[300px] h-[300px] bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[-10%] w-[250px] h-[250px] bg-tertiary/5 blur-[100px] -z-10 rounded-full pointer-events-none" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CreateWalletScreen() {
  const [step, setStep] = useState<'password' | 'mnemonic'>('password');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [walletData, setWalletData] = useState<{ address: string; version: string; publicKey: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionPwd, setSessionPwd] = useState('');

  const { setWallet, setUnlocked, setSessionPassword } = useWalletStore();
  const { addToast } = useUIStore();
  const [, setLocation] = useLocation();

  const handlePassword = async (password: string) => {
    setIsLoading(true);
    try {
      const result = await walletService.createWallet(password);
      setMnemonic(result.mnemonic);
      setWalletData({ address: result.address, version: result.version, publicKey: result.publicKey });
      setSessionPwd(password);
      setStep('mnemonic');
    } catch {
      addToast({ type: 'error', message: 'Failed to create wallet. Please try again.', duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (!walletData) return;
    setWallet({
      address: walletData.address,
      version: walletData.version as 'v3R2' | 'v4R2' | 'v5R1',
      publicKey: walletData.publicKey,
    });
    setUnlocked(true);
    setSessionPassword(sessionPwd);
    setLocation('/main');
  };

  if (step === 'mnemonic') {
    return (
      <StepMnemonic
        mnemonic={mnemonic}
        onBack={() => setStep('password')}
        onContinue={handleComplete}
      />
    );
  }

  return (
    <StepPassword
      onBack={() => setLocation('/')}
      onContinue={handlePassword}
      isLoading={isLoading}
    />
  );
}
