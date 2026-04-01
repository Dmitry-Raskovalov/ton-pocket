/**
 * file: SettingsScreen.tsx
 * description: Settings screen — wallet info, export recovery phrase, change password,
 *   danger zone (delete wallet placeholder). Hosts ExportScreen and ChangePasswordModal.
 * dependencies: wallet-store, ExportScreen, ChangePasswordModal, HighlightedAddress, CopyButton, lucide-react
 * created: 2026-04-01
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Shield, KeyRound, ChevronRight, Trash2 } from 'lucide-react';
import { Address } from '@ton/core';
import { useWalletStore } from '@/store/wallet-store';
import { HighlightedAddress, CopyButton } from '@/components';
import { ExportScreen } from './ExportScreen';
import { ChangePasswordModal } from './ChangePasswordModal';

function toUserFriendly(raw: string): string {
  try {
    return Address.parseRaw(raw).toString({ bounceable: false });
  } catch {
    return raw;
  }
}

export function SettingsScreen() {
  const rawAddress = useWalletStore((s) => s.address);
  const version = useWalletStore((s) => s.version);
  const [, setLocation] = useLocation();

  const [showExport, setShowExport] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const displayAddress = rawAddress ? toUserFriendly(rawAddress) : '';

  return (
    <div className="flex flex-col min-h-screen items-center bg-background text-on-background">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative pb-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-background flex justify-between items-center px-6 py-4 w-full">
          <button
            onClick={() => setLocation('/main')}
            aria-label="Go back"
            className="flex items-center text-primary hover:opacity-80 transition-opacity active:scale-95 duration-150"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="bg-tertiary-container px-2 py-0.5 rounded-sm">
            <span className="text-[10px] font-bold tracking-widest text-on-tertiary-fixed-variant uppercase">
              Testnet
            </span>
          </div>
          {/* Spacer to center the badge */}
          <div className="w-6" />
        </header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <main className="flex-1 px-6 pt-4 space-y-8">

          {/* Title */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface uppercase">Settings</h2>
          </section>

          {/* Wallet Info Card */}
          <section className="bg-surface-container rounded-xl p-5 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
                  Wallet Architecture
                </p>
                <h3 className="text-xl font-bold text-on-surface">{version ?? '—'}</h3>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
                  Network
                </p>
                <p className="text-sm font-semibold text-tertiary">TON Testnet</p>
              </div>
            </div>

            {/* Address */}
            <div className="bg-surface-container-lowest rounded-lg p-4">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium mb-2">
                Address
              </p>
              <div className="flex items-center justify-between gap-4">
                <HighlightedAddress address={displayAddress} truncate className="text-sm" />
                <CopyButton
                  text={displayAddress}
                  variant="icon-only"
                  className="text-primary hover:opacity-80 transition-opacity shrink-0"
                />
              </div>
            </div>
          </section>

          {/* Security & Access */}
          <section className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">
              Security &amp; Access
            </p>
            <div className="bg-surface-container rounded-xl overflow-hidden">
              <button
                onClick={() => setShowExport(true)}
                className="w-full flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors border-b border-white/5 active:scale-[0.98] duration-150"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                    <Shield size={18} />
                  </div>
                  <span className="font-medium text-on-surface">Export Recovery Phrase</span>
                </div>
                <ChevronRight size={18} className="text-on-surface-variant" />
              </button>

              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center justify-between p-5 hover:bg-surface-container-high transition-colors active:scale-[0.98] duration-150"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                    <KeyRound size={18} />
                  </div>
                  <span className="font-medium text-on-surface">Change Password</span>
                </div>
                <ChevronRight size={18} className="text-on-surface-variant" />
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-error font-bold ml-1">
              Danger Zone
            </p>
            <div className="bg-surface-container rounded-xl overflow-hidden border border-error/20">
              <button
                disabled
                title="Not available in this version"
                className="w-full flex items-center justify-between p-5 group cursor-not-allowed opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center text-error">
                    <Trash2 size={18} />
                  </div>
                  <span className="font-bold text-error">Delete Wallet</span>
                </div>
                <span className="text-[10px] uppercase tracking-tighter text-error/40 font-bold">
                  Unavailable
                </span>
              </button>
            </div>
          </section>

        </main>
      </div>

      {/* Modals */}
      {showExport && <ExportScreen onClose={() => setShowExport(false)} />}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}
