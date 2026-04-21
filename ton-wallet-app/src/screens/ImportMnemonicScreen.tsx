/**
 * file: ImportMnemonicScreen.tsx
 * description: Three-step wallet import screen: enter mnemonic → set password → (optional) select version.
 * dependencies: WalletService, wallet-store, ui-store, PasswordInput, wouter
 * created: 2026-04-01
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, ArrowRight, ClipboardPaste, ShieldCheck, Info } from 'lucide-react';
import { PasswordInput } from '@/components/PasswordInput';
import { walletService } from '@/services/wallet/WalletService';
import { formatTon } from '@/services/ton/balance';
import { setSessionPassword } from '@/crypto/session';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';
import type { DetectedWallet, WalletVersion } from '@/services/wallet/contract-factory';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Parse raw textarea text into an array of trimmed, lowercase words. */
function parseWords(text: string): string[] {
  return text
    .trim()
    .split(/[\s,]+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean);
}

/** Truncate a friendly address to show first 4 and last 4 chars. */

// ─── Step 1: Enter Mnemonic ────────────────────────────────────────────────────

interface StepMnemonicProps {
  onBack: () => void;
  onContinue: (words: string[]) => void;
}

function StepMnemonic({ onBack, onContinue }: StepMnemonicProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const words = parseWords(text);
  const wordCount = words.length;
  const canContinue = wordCount === 24;

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      setText(clipText);
      setError('');
    } catch {
      // Permissions API blocked — user pastes manually
    }
  };

  const handleContinue = async () => {
    setError('');
    const isValid = await walletService.validateMnemonic(words);
    if (!isValid) {
      setError('Invalid recovery phrase. Please check the words and their order.');
      return;
    }
    onContinue(words);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1E2023] flex justify-between items-center w-full max-w-[480px] mx-auto px-6 py-4">
        <button
          onClick={onBack}
          className="text-primary hover:bg-surface-container-high p-2 -ml-2 rounded-full transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold uppercase tracking-[0.05em] text-sm text-white">Import Wallet</h1>
        <span className="text-[10px] font-extrabold tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-sm uppercase">
          Testnet
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-[480px] mx-auto px-6 pt-8 pb-32">
        {/* Step label */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <p className="text-xs font-mono text-primary tracking-widest uppercase">Step 01 / 02</p>
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface leading-tight tracking-tighter mb-4">
            Recovery Phrase
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Enter your 24-word recovery phrase. The order of words is crucial for reconstructing
            your private keys.
          </p>
        </section>

        {/* Textarea block */}
        <section className="relative group mb-8">
          {/* Paste button */}
          <div className="absolute right-3 top-3 z-10">
            <button
              onClick={handlePaste}
              className="bg-surface-container-highest hover:bg-outline-variant text-primary text-xs font-bold py-1.5 px-3 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 border border-white/5"
            >
              <ClipboardPaste size={14} />
              Paste
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 min-h-[240px] border border-transparent focus-within:border-primary/30 transition-all duration-300">
            <textarea
              className="w-full min-h-[200px] bg-transparent border-none focus:ring-0 text-on-surface font-mono text-sm leading-8 resize-none placeholder:font-sans placeholder:text-outline/40 outline-none"
              placeholder="Enter words separated by spaces..."
              spellCheck={false}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError('');
              }}
            />

            {/* Footer row: security badge + word counter */}
            <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-outline" />
                <span className="text-[10px] text-outline uppercase tracking-widest font-bold">
                  Encrypted Input
                </span>
              </div>
              <span
                className={`text-[10px] font-mono ${wordCount === 24
                  ? 'text-primary'
                  : wordCount > 24
                    ? 'text-error'
                    : 'text-outline'
                  }`}
              >
                {wordCount} / 24 words
              </span>
            </div>
          </div>

          {/* Validation error */}
          {error && (
            <p className="mt-2 text-xs text-error px-1">{error}</p>
          )}
        </section>

        {/* Security info block */}
        <section className="bg-surface-container rounded-xl p-5 border-l-2 border-primary-container">
          <div className="flex gap-4">
            <Info size={18} className="text-primary-fixed-dim shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Security Protocol
              </h4>
              <p className="text-xs text-on-surface-variant leading-normal">
                Your phrase is never sent to our servers. All derivation happens locally on your
                device.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(160,202,255,0.15)] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-on-primary-fixed"
          style={{ background: 'linear-gradient(135deg, #a0caff 0%, #4f94dd 100%)' }}
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Set Password ──────────────────────────────────────────────────────

interface StepPasswordProps {
  onBack: () => void;
  onContinue: (password: string) => Promise<void>;
  isLoading: boolean;
}

function StepPassword({ onBack, onContinue, isLoading }: StepPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const passwordsMatch = password === confirm;
  const canContinue =
    !isLoading && password.length > 0 && passwordsMatch && confirm.length > 0;

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
      <header className="sticky top-0 z-50 bg-[#1E2023] flex justify-between items-center w-full max-w-[480px] mx-auto px-6 py-4">
        <button
          onClick={onBack}
          className="text-primary hover:bg-surface-container-high p-2 -ml-2 rounded-full transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold uppercase tracking-[0.05em] text-sm text-white">Import Wallet</h1>
        <span className="text-[10px] font-extrabold tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-sm uppercase">
          Testnet
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-[480px] mx-auto px-6 pt-8 pb-32">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <p className="text-xs font-mono text-primary tracking-widest uppercase">Step 02 / 02</p>
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface leading-tight tracking-tighter mb-4">
            Set Password
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Protect your imported wallet with a password.
          </p>
        </div>

        <div className="space-y-8">
          <PasswordInput
            label="New Password"
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
            error={
              confirmError ||
              (confirm.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined)
            }
          />

          <div className="bg-surface-container-low p-4 rounded-lg border-l-2 border-primary-container flex gap-3">
            <Info size={16} className="text-primary-container shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your password encrypts your private keys locally. We cannot recover it if lost. Store
              your recovery phrase safely.
            </p>
          </div>
        </div>
      </main>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(160,202,255,0.15)] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-on-primary-fixed"
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

// ─── Step 3: Select Version ────────────────────────────────────────────────────

interface StepSelectVersionProps {
  detectedWallets: DetectedWallet[];
  onBack: () => void;
  onContinue: (version: WalletVersion) => Promise<void>;
  isLoading: boolean;
}

function StepSelectVersion({
  detectedWallets,
  onBack,
  onContinue,
  isLoading,
}: StepSelectVersionProps) {
  const [selected, setSelected] = useState<WalletVersion>(detectedWallets[0]?.version ?? 'v4R2');

  const versionLabel: Record<string, string> = {
    v4R2: 'Recommended',
    v5R1: 'BETA',
  };

  const versionSubtitle: Record<string, string> = {
    v3R2: 'Legacy Version',
    v4R2: 'Standard Wallet',
    v5R1: 'W5 Smart Wallet',
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1E2023] flex justify-between items-center w-full max-w-[480px] mx-auto px-6 py-4">
        <button
          onClick={onBack}
          className="text-primary hover:bg-surface-container-high p-2 -ml-2 rounded-full transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold uppercase tracking-[0.05em] text-sm text-white">
          Select Wallet Version
        </h1>
        <span className="text-[10px] font-extrabold tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-sm uppercase">
          Testnet
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-[480px] mx-auto px-6 pt-8 pb-32">
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface mb-3">
            Found multiple wallets
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Multiple wallets found for this phrase. Select one to proceed with the import.
          </p>
        </div>

        <div className="space-y-4">
          {detectedWallets.map((wallet) => {
            const isSelected = selected === wallet.version;
            const badge = versionLabel[wallet.version];
            const subtitle = versionSubtitle[wallet.version] ?? wallet.version;

            return (
              <label key={wallet.version} className="relative block cursor-pointer group">
                <input
                  type="radio"
                  name="wallet_version"
                  value={wallet.version}
                  checked={isSelected}
                  onChange={() => setSelected(wallet.version)}
                  className="sr-only"
                />
                <div
                  className={[
                    'p-5 rounded-xl bg-surface-container border-2 transition-all duration-200 shadow-sm',
                    isSelected
                      ? 'border-primary-container bg-surface-container-high'
                      : 'border-transparent group-hover:bg-surface-container-high',
                  ].join(' ')}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-on-surface">{wallet.version}</span>
                        {badge && (
                          <span
                            className={[
                              'text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-sm',
                              wallet.version === 'v5R1'
                                ? 'bg-tertiary/10 text-tertiary'
                                : 'bg-primary/10 text-primary',
                            ].join(' ')}
                          >
                            {badge}
                          </span>
                        )}
                      </div>
                      <code className="font-mono text-xs text-on-surface-variant">
                        <span className="text-on-surface font-semibold">
                          {wallet.addressFriendly.slice(0, 4)}
                        </span>
                        ...
                        <span className="text-on-surface font-semibold">
                          {wallet.addressFriendly.slice(-4)}
                        </span>
                      </code>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold tracking-tighter text-on-surface">
                        {formatTon(wallet.balance)} TON
                      </div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                        {subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Radio dot */}
                  <div className="flex items-center justify-end">
                    <div
                      className={[
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        isSelected ? 'border-primary-container' : 'border-outline-variant',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'w-2.5 h-2.5 rounded-full bg-primary transition-opacity',
                          isSelected ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}
                      />
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </main>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 bg-gradient-to-t from-background via-background to-transparent pt-12">
        <button
          onClick={() => onContinue(selected)}
          disabled={isLoading}
          className="w-full font-bold py-4 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-primary/10 disabled:opacity-40 disabled:cursor-not-allowed text-on-primary-fixed"
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

      {/* Background glow */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-tertiary/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

type Step = 'mnemonic' | 'password' | 'version';

export function ImportMnemonicScreen() {
  const [step, setStep] = useState<Step>('mnemonic');
  const [words, setWords] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { setWallet, setUnlocked } = useWalletStore();
  const { addToast } = useUIStore();
  const [, setLocation] = useLocation();

  const handleMnemonicContinue = (validatedWords: string[]) => {
    setWords(validatedWords);
    setStep('password');
  };

  const handlePasswordContinue = async (pwd: string) => {
    setPassword(pwd);
    setIsLoading(true);
    try {
      const result = await walletService.importFromMnemonic(words, pwd);

      if (result.needsVersionChoice) {
        setDetectedWallets(result.detectedWallets);
        setStep('version');
        return;
      }

      if (result.hadNetworkError) {
        addToast({
          type: 'warning',
          message: 'Network unavailable. Using v4R2 by default. You can change the version in Settings.',
          duration: 6000,
        });
      }

      if (result.address && result.version) {
        setWallet({ address: result.address, version: result.version, publicKey: result.publicKey ?? '' });
      }
      setUnlocked(true);
      setSessionPassword(pwd);
      setLocation('/main');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to import wallet. Please try again.';
      addToast({ type: 'error', message, duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionContinue = async (selectedVersion: WalletVersion) => {
    setIsLoading(true);
    try {
      const result = await walletService.importFromMnemonic(words, password, selectedVersion);
      if (result.address && result.version) {
        setWallet({ address: result.address, version: result.version, publicKey: result.publicKey ?? '' });
      }
      setUnlocked(true);
      setSessionPassword(password);
      setLocation('/main');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to import wallet. Please try again.';
      addToast({ type: 'error', message, duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'version') {
    return (
      <StepSelectVersion
        detectedWallets={detectedWallets}
        onBack={() => setStep('password')}
        onContinue={handleVersionContinue}
        isLoading={isLoading}
      />
    );
  }

  if (step === 'password') {
    return (
      <StepPassword
        onBack={() => setStep('mnemonic')}
        onContinue={handlePasswordContinue}
        isLoading={isLoading}
      />
    );
  }

  return <StepMnemonic onBack={() => setLocation('/')} onContinue={handleMnemonicContinue} />;
}
