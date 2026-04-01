/**
 * file: SendScreen.tsx
 * description: Three-step send flow — Input Form → Confirmation → Result
 *   Step 1: Recipient address, amount (MAX), comment, inline validation
 *   Step 2: Transaction summary, WarningList with blocking checkboxes
 *   Step 3: Pending / Success / Error / Timeout result states
 * dependencies: wallet-store, validate-send, transfer, vault, address-book,
 *               HighlightedAddress, CopyButton, WarningList
 * created: 2026-04-01
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft, ArrowRight, Info, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Clock,
} from 'lucide-react';
import { Address } from '@ton/core';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';
import { validateSend } from '@/services/validation/validate-send';
import type { Warning } from '@/services/validation/types';
import { sendTransfer, ESTIMATED_FEE } from '@/services/ton/transfer';
import { formatTon } from '@/services/ton/balance';
import { loadVault, decrypt } from '@/crypto/vault';
import { createContract } from '@/services/wallet/contract-factory';
import { addressBook } from '@/services/address-book/address-book';
import { HighlightedAddress, CopyButton, WarningList } from '@/components';
import type { TransferResult } from '@/services/ton/transfer';

// ─── Types ──────────────────────────────────────────────────────────────────────

type Step = 'input' | 'confirm' | 'result';

type ResultState = 'pending' | 'success' | 'error' | 'timeout';

const TON_NANO = 1_000_000_000n;
const REDIRECT_DELAY_MS = 3000;


function parseAmountTon(value: string): bigint {
  const trimmed = value.replace(/,/g, '.').trim();
  if (!trimmed) return 0n;
  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return 0n;
  return BigInt(Math.round(num * Number(TON_NANO)));
}

function formatAmountInput(nanotons: bigint): string {
  const whole = nanotons / TON_NANO;
  const frac = nanotons % TON_NANO;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(9, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function SendScreen() {
  const [, setLocation] = useLocation();
  // Store
  const rawAddress = useWalletStore((s) => s.address);
  const balance = useWalletStore((s) => s.balance);
  const version = useWalletStore((s) => s.version);
  const publicKeyHex = useWalletStore((s) => s.publicKey);
  const sessionPassword = useWalletStore((s) => s.sessionPassword);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const addToast = useUIStore((s) => s.addToast);

  // ─── Step state ───────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('input');

  // Step 1: Input
  const [recipient, setRecipient] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [comment, setComment] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Validation
  const [validationWarnings, setValidationWarnings] = useState<Warning[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  // Step 2: Confirm
  const [allBlockingConfirmed, setAllBlockingConfirmed] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Step 3: Result
  const [resultState, setResultState] = useState<ResultState>('pending');
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const amount = parseAmountTon(amountStr);
  const maxAmount = balance > ESTIMATED_FEE ? balance - ESTIMATED_FEE : 0n;

  // ─── Validation with debounce ─────────────────────────────────────────────

  const runValidation = useCallback(async (
    recipientAddr: string,
    amountNano: bigint,
  ) => {
    if (!rawAddress || !publicKeyHex) return;

    const pubKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    setIsValidating(true);
    try {
      const result = await validateSend({
        recipientAddress: recipientAddr,
        amount: amountNano,
        senderBalance: balance,
        senderPublicKey: pubKeyBuffer,
      });
      setValidationWarnings(result.warnings);
      setIsFormValid(result.isValid && amountNano > 0n);
    } catch {
      setValidationWarnings([]);
      setIsFormValid(false);
    } finally {
      setIsValidating(false);
    }
  }, [rawAddress, publicKeyHex, balance]);

  const debouncedValidate = useCallback((recipientAddr: string, amountNano: bigint) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runValidation(recipientAddr, amountNano);
    }, 500);
  }, [runValidation]);

  // Trigger validation on input changes
  useEffect(() => {
    if (!recipient && !amountStr) {
      setValidationWarnings([]);
      setIsFormValid(false);
      return;
    }
    debouncedValidate(recipient, amount);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [recipient, amountStr, amount, debouncedValidate]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleMax = () => {
    if (maxAmount <= 0n) return;
    setAmountStr(formatAmountInput(maxAmount));
  };

  const handleContinue = () => {
    setStep('confirm');
    setAllBlockingConfirmed(true);
  };

  const handleCancelConfirm = () => {
    setStep('input');
  };

  const handleSend = async () => {
    if (!rawAddress || !publicKeyHex || !version || !sessionPassword) return;
    setIsSending(true);

    try {
      // 1. Decrypt vault
      const vault = loadVault();
      if (!vault) {
        addToast({ type: 'error', message: 'Wallet vault not found', duration: 4000 });
        setIsSending(false);
        return;
      }

      const mnemonicJson = await decrypt(vault, sessionPassword);

      // 2. Derive keypair
      const { mnemonicToPrivateKey } = await import('@ton/crypto');
      const words: string[] = JSON.parse(mnemonicJson);
      const keyPair = await mnemonicToPrivateKey(words);

      // 3. Create contract & send
      const contract = createContract(keyPair.publicKey, version);
      const secretKey = Buffer.from(keyPair.secretKey);

      setStep('result');
      setResultState('pending');

      const result = await sendTransfer({
        recipient,
        amount,
        comment: comment || undefined,
        contract,
        secretKey,
      });

      setTransferResult(result);
      setResultState(result.status === 'confirmed' ? 'success' : result.status);

      if (result.status === 'confirmed') {
        // Update address book
        try {
          const recipientRaw = Address.parse(recipient).toRawString();
          addressBook.addOrUpdateEntry({
            address: recipientRaw,
            displayAddress: recipient,
            source: 'sent',
          });
        } catch {
          // Address book update is best-effort
        }

        // Refresh balance
        try {
          const { getBalance } = await import('@/services/ton/balance');
          const newBalance = await getBalance(rawAddress);
          updateBalance(newBalance);
        } catch {
          // Best effort
        }

        addToast({ type: 'success', message: 'Transaction sent successfully!', duration: 5000 });
      }
    } catch (err) {
      setResultState('error');
      setTransferResult({
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Auto-redirect after success/timeout
  useEffect(() => {
    if (resultState !== 'success' && resultState !== 'timeout') return;
    const timer = setTimeout(() => setLocation('/main'), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [resultState, setLocation]);

  const handleTryAgain = () => {
    setResultState('pending');
    setTransferResult(null);
    setStep('input');
    setValidationWarnings([]);
    setIsFormValid(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen items-center bg-surface-container-low text-on-background">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex justify-between items-center px-6 py-4 sticky top-0 z-10 bg-surface-container-low/80 backdrop-blur-md">
          <button
            onClick={step === 'input' ? () => setLocation('/main') : handleCancelConfirm}
            aria-label="Go back"
            className="flex items-center text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="bg-tertiary-container text-on-tertiary-fixed-variant px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest">
            Testnet
          </div>
        </header>

        {/* ── Progress bar (confirm/result steps) ────────────────────────── */}
        {step !== 'input' && (
          <div className="px-6 py-2 flex items-center justify-between gap-1">
            <div className={`h-1 flex-1 rounded-full ${step === 'confirm' ? 'bg-primary opacity-40' : 'bg-primary'}`} />
            <div className={`h-1 flex-1 rounded-full ${step === 'confirm' ? 'bg-primary' : 'bg-primary opacity-40'}`} />
            <div className="h-1 flex-1 bg-surface-container-highest rounded-full" />
            <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Step {step === 'confirm' ? '2' : '3'} of 3
            </span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: INPUT FORM                                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {step === 'input' && (
          <>
            <main className="flex-1 px-6 pt-2 pb-32 space-y-8">
              {/* Title & Balance */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Send TON</h1>
                <div className="flex items-center gap-2">
                  <span className="text-on-surface-variant text-sm font-medium">Available:</span>
                  <span className="text-primary font-mono text-sm font-bold">
                    {formatTon(balance).replace(/\.?0+$/, '')} TON
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-8">
                {/* Recipient Address */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant px-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="UQ..."
                    className="w-full bg-surface-container-lowest border-none rounded-xl p-4 text-on-surface font-mono placeholder:text-outline-variant focus:ring-1 focus:ring-primary focus:bg-surface-container-high transition-all outline-none"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant px-1">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-surface-container-lowest border-none rounded-xl p-4 pr-20 text-on-surface font-bold text-lg placeholder:text-outline-variant focus:ring-1 focus:ring-primary focus:bg-surface-container-high transition-all outline-none"
                    />
                    <button
                      onClick={handleMax}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-surface-container-highest px-3 py-1.5 rounded-lg text-[10px] font-bold text-primary hover:bg-primary hover:text-on-primary transition-all"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant px-1">
                    Comment (optional)
                  </label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Gift for a friend"
                    className="w-full bg-surface-container-lowest border-none rounded-xl p-4 text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary focus:bg-surface-container-high transition-all outline-none"
                  />
                  <p className="text-[10px] text-outline px-1 leading-relaxed">
                    The comment will be visible to everyone on the blockchain.
                  </p>
                </div>
              </div>

              {/* Inline Warnings */}
              {validationWarnings.length > 0 && (
                <div className="space-y-3">
                  {validationWarnings.map((w, i) => (
                    <div
                      key={`${w.type}-${i}`}
                      className={`p-3 rounded-lg flex gap-3 items-start text-xs ${
                        w.severity === 'error'
                          ? 'bg-error-container/10 text-error'
                          : w.severity === 'warning'
                            ? 'bg-tertiary-container/10 text-tertiary'
                            : 'bg-primary-container/10 text-primary'
                      }`}
                    >
                      {w.severity === 'error' ? <XCircle size={14} className="shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
                      <span>{w.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Security note */}
              <div className="p-6 rounded-xl bg-surface-container border border-white/5 relative overflow-hidden">
                <div className="flex items-start gap-4 relative z-10">
                  <Info size={18} className="text-tertiary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Security Protocol</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Ensure the destination address is on the <span className="text-tertiary">TON Testnet</span>. Sending assets to a mainnet address may result in permanent loss.
                    </p>
                  </div>
                </div>
              </div>
            </main>

            {/* Sticky Continue button */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 bg-surface-container-low/90 backdrop-blur-md">
              <button
                onClick={handleContinue}
                disabled={!isFormValid || isValidating}
                className="w-full py-4 rounded-xl font-extrabold uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] transition-transform bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isValidating ? 'Validating...' : 'Continue'}
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: CONFIRMATION                                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {step === 'confirm' && (
          <>
            <header className="px-6 py-3 flex items-center gap-4">
              <button
                onClick={handleCancelConfirm}
                className="hover:opacity-80 transition-opacity active:scale-95 text-primary"
                aria-label="Go back"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="font-bold uppercase text-xs text-white tracking-tight">
                Confirm Transaction
              </h1>
              <div className="ml-auto bg-tertiary-container text-on-tertiary-fixed-variant px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest">
                TESTNET
              </div>
            </header>

            <main className="flex-1 px-6 pt-6 pb-44 space-y-8">
              {/* Transaction Summary Card */}
              <section className="space-y-4">
                <div className="bg-surface-container rounded-xl p-5 space-y-6 border border-white/5">
                  {/* Amount */}
                  <div className="text-center space-y-1">
                    <div className="text-[32px] font-bold tracking-tight text-white">
                      {formatAmountInput(amount)} <span className="text-primary text-xl">TON</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-5">
                    {/* Recipient */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Recipient Address
                      </span>
                      <div className="bg-surface-container-lowest p-3 rounded-lg flex items-center gap-2">
                        <HighlightedAddress address={recipient} className="text-[13px] leading-relaxed" />
                        <CopyButton text={recipient} className="ml-auto shrink-0" />
                      </div>
                    </div>

                    {/* Fee + Network */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Fee (Estimated)</span>
                        <p className="text-sm font-medium text-white">
                          {formatAmountInput(ESTIMATED_FEE)} TON
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Network</span>
                        <p className="text-sm font-medium text-tertiary">TON Testnet</p>
                      </div>
                    </div>

                    {/* Comment */}
                    {comment && (
                      <div className="space-y-1 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Comment</span>
                        <p className="text-sm text-on-surface-variant italic leading-relaxed">"{comment}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-end px-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total Amount</span>
                  <span className="text-xl font-bold text-white">
                    {formatAmountInput(amount + ESTIMATED_FEE)} TON
                  </span>
                </div>
              </section>

              {/* Warnings */}
              {validationWarnings.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                    Critical Security Check
                  </h3>
                  <WarningList
                    warnings={validationWarnings}
                    onAllBlockingConfirmed={setAllBlockingConfirmed}
                  />
                </section>
              )}

            </main>

            {/* Sticky footer: Confirm + Cancel */}
            <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 bg-background/80 backdrop-blur-xl space-y-3">
              <button
                onClick={() => void handleSend()}
                disabled={!allBlockingConfirmed || isSending}
                className="w-full py-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-extrabold uppercase tracking-widest text-sm shadow-xl shadow-primary/10 active:scale-[0.98] transition-transform duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                Confirm & Send TON
              </button>
              <button
                onClick={handleCancelConfirm}
                className="w-full py-3 rounded-xl border border-outline/10 text-on-surface-variant font-bold uppercase tracking-widest text-xs hover:bg-surface-container-high transition-colors"
              >
                Cancel Transaction
              </button>
            </footer>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: RESULT                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {step === 'result' && (
          <main className="flex-1 flex flex-col items-center justify-center px-8 text-center pb-24">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
              <div className={`w-64 h-64 rounded-full blur-[100px] ${
                resultState === 'success' ? 'bg-primary' :
                resultState === 'error' ? 'bg-error' :
                'bg-tertiary'
              }`} />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full">

              {/* ── Pending ─────────────────────────────────────────────── */}
              {resultState === 'pending' && (
                <>
                  <div className="mb-10 relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-4">Sending...</h2>
                  <p className="text-on-surface-variant max-w-[280px] mx-auto text-sm leading-relaxed">
                    Please wait while your transaction is being processed.
                  </p>
                  <div className="w-full mt-16 space-y-4">
                    <div className="bg-surface-container rounded-xl p-5 text-left border border-white/5">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-primary opacity-70">Network Status</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold tracking-tight text-on-surface">Validating</span>
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                          <span className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:200ms]" />
                          <span className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:400ms]" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface-container-low rounded-xl p-4 text-left border border-white/5">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1 block">Amount</span>
                        <span className="text-lg font-bold tracking-tight text-on-surface">{formatAmountInput(amount)} TON</span>
                      </div>
                      <div className="bg-surface-container-low rounded-xl p-4 text-left border border-white/5">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1 block">Fee</span>
                        <span className="text-lg font-bold tracking-tight text-on-surface">{formatAmountInput(ESTIMATED_FEE)} TON</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── Success ─────────────────────────────────────────────── */}
              {resultState === 'success' && (
                <>
                  <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full bg-primary-container/20 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary-container/40 flex items-center justify-center">
                        <CheckCircle size={48} className="text-primary" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-background mb-2">Transaction Sent!</h2>
                  <p className="text-on-surface-variant font-medium max-w-[280px] mx-auto leading-relaxed text-sm mb-8">
                    {formatAmountInput(amount)} TON sent to{' '}
                    <span className="font-mono text-on-surface">
                      <HighlightedAddress address={recipient} truncate />
                    </span>
                  </p>

                  <div className="w-full space-y-5">
                    <div className="bg-surface-container rounded-xl p-5 space-y-4 border border-white/[0.03]">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Status</span>
                        <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded uppercase">Confirmed</span>
                      </div>
                      {transferResult?.hash && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Transaction Hash</span>
                          <div className="flex items-center justify-between bg-surface-container-lowest rounded p-3">
                            <code className="text-xs font-mono text-on-surface-variant break-all leading-tight pr-4">
                              {transferResult.hash.slice(0, 16)}...{transferResult.hash.slice(-8)}
                            </code>
                            <CopyButton text={transferResult.hash} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-5 flex justify-between items-center text-[11px] font-medium text-outline">
                      <span>Network Fee</span>
                      <span className="font-mono text-on-surface-variant">{formatAmountInput(ESTIMATED_FEE)} TON</span>
                    </div>
                  </div>

                  <div className="w-full pt-6 space-y-3">
                    <button
                      onClick={() => setLocation('/main')}
                      className="w-full py-4 px-6 bg-primary-fixed-dim hover:opacity-90 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-on-primary-fixed font-bold tracking-tight"
                    >
                      Back to Wallet
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {/* ── Error ───────────────────────────────────────────────── */}
              {resultState === 'error' && (
                <>
                  <div className="w-24 h-24 rounded-full bg-error-container/20 flex items-center justify-center border border-error/20 mb-8">
                    <XCircle size={48} className="text-error" />
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Transaction Failed</h2>
                  <p className="text-on-surface-variant text-sm font-medium mb-12">The blockchain rejected the request</p>

                  <div className="w-full space-y-4 text-left">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline px-1">Technical Details</h3>
                    <div className="bg-surface-container-lowest p-5 rounded-lg border border-white/5 space-y-4">
                      <div className="flex flex-col space-y-1.5">
                        <span className="text-[10px] text-error font-bold uppercase tracking-wider">Error</span>
                        <p className="text-sm leading-relaxed text-on-surface-variant italic">
                          {transferResult?.error ?? 'Unknown error occurred'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full mt-auto space-y-3 pt-12">
                    <button
                      onClick={handleTryAgain}
                      className="w-full py-4 bg-primary-fixed-dim text-on-primary-fixed font-bold rounded-lg active:scale-[0.98] transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-primary/5"
                    >
                      <RefreshCw size={18} />
                      Try Again
                    </button>
                    <button
                      onClick={() => setLocation('/main')}
                      className="w-full py-4 bg-transparent border border-white/10 text-on-surface font-semibold rounded-lg active:scale-[0.98] transition-all hover:bg-white/5"
                    >
                      Back to Wallet
                    </button>
                  </div>
                </>
              )}

              {/* ── Timeout ─────────────────────────────────────────────── */}
              {resultState === 'timeout' && (
                <>
                  <div className="relative mb-10">
                    <div className="absolute inset-0 bg-tertiary/10 blur-3xl rounded-full" />
                    <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-surface-container border border-tertiary/20">
                      <Clock size={48} className="text-tertiary" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-tertiary text-on-tertiary w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-on-surface uppercase mb-4">
                    Transaction Status Unknown
                  </h2>
                  <p className="text-on-surface-variant font-medium leading-relaxed max-w-[280px] mx-auto text-sm">
                    Transaction may have been sent. Please check your balance in a few moments.
                  </p>

                  <div className="mt-12 w-full space-y-3">
                    <button
                      onClick={() => setLocation('/main')}
                      className="w-full bg-primary-fixed-dim text-on-primary-fixed font-bold py-4 rounded-xl active:scale-[0.98] transition-all hover:opacity-90 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                    >
                      Back to Wallet
                    </button>
                  </div>
                </>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
