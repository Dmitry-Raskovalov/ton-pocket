/**
 * file: WelcomeScreen.tsx
 * description: Entry point screen for new users — create or import wallet
 * dependencies: lucide-react, crypto/vault
 * created: 2026-04-01
 */

import { Diamond, Settings, PlusCircle, Download, Wallet } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export function WelcomeScreen({ onCreateWallet, onImportWallet }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col min-h-screen items-center overflow-x-hidden bg-background">
      {/* Header */}
      <header className="w-full max-w-[480px] sticky top-0 z-50 bg-background flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-primary" />
          <span className="font-bold uppercase text-xs tracking-tight text-on-surface">
            TON Wallet
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold tracking-widest text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-sm uppercase">
            Testnet
          </span>
          <Settings
            size={20}
            className="text-outline hover:text-on-surface-variant transition-colors cursor-pointer"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[480px] flex flex-col items-center justify-center px-8 pb-40">
        {/* Logo */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
          <div className="relative flex items-center justify-center w-24 h-24 rounded-xl bg-surface-container border border-white/5 shadow-2xl">
            <Diamond size={48} className="text-primary" fill="currentColor" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            TON Testnet Wallet
          </h1>
          <p className="text-on-surface-variant font-medium text-sm leading-relaxed max-w-[280px] mx-auto">
            Self-custodial wallet for TON testnet. Your keys, your crypto, zero compromise.
          </p>
        </div>

        {/* Technical metadata */}
        <div className="mt-16 w-full grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-4 rounded-lg border-l-2 border-primary/20">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">
              Network
            </p>
            <p className="text-xs font-mono text-primary">testnet-v4.ton.org</p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg border-l-2 border-tertiary/20">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">
              Protocol
            </p>
            <p className="text-xs font-mono text-tertiary">ADNL/UDP</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 space-y-3 z-50"
        style={{ background: 'rgba(30, 32, 35, 0.85)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={onCreateWallet}
          className="w-full py-4 rounded-xl font-bold tracking-tight active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-on-primary"
          style={{ background: 'linear-gradient(135deg, #a0caff 0%, #4f94dd 100%)' }}
        >
          <PlusCircle size={20} />
          Create New Wallet
        </button>

        <button
          onClick={onImportWallet}
          className="w-full bg-surface-container-highest text-on-surface py-4 rounded-xl font-bold tracking-tight active:scale-[0.98] transition-transform flex items-center justify-center gap-2 border border-white/5 hover:bg-surface-bright transition-colors"
        >
          <Download size={20} />
          Import Existing Wallet
        </button>

        <p className="text-center text-[10px] text-on-surface-variant pt-2 font-medium uppercase tracking-tighter opacity-50">
          Testnet only — do not send real TON
        </p>
      </footer>

      {/* Decorative */}
      <div className="fixed top-1/4 -right-20 opacity-10 pointer-events-none select-none">
        <span className="text-[120px] font-black tracking-tighter text-white rotate-90 leading-none block">
          TESTNET
        </span>
      </div>
    </div>
  );
}
