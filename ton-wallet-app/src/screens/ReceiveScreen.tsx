/**
 * file: ReceiveScreen.tsx
 * description: Receive TON screen — QR code with wallet address, full address display,
 *   copy button, and testnet warning
 * dependencies: qrcode.react, wallet-store, HighlightedAddress, CopyButton, lucide-react, wouter
 * created: 2026-04-01
 */

import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { QRCodeSVG } from 'qrcode.react';
import { Address } from '@ton/core';
import { useWalletStore } from '@/store/wallet-store';
import { HighlightedAddress, CopyButton } from '@/components';

/** Convert raw "0:hex" address to user-friendly EQ.../UQ... */
function toUserFriendly(raw: string): string {
  try {
    return Address.parseRaw(raw).toString({ bounceable: false });
  } catch {
    return raw;
  }
}

export function ReceiveScreen() {
  const rawAddress = useWalletStore((s) => s.address);
  const isActivated = useWalletStore((s) => s.isActivated);
  const [, setLocation] = useLocation();
  const displayAddress = rawAddress ? toUserFriendly(rawAddress) : '';

  return (
    <div className="flex flex-col min-h-screen items-center bg-background text-on-background">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="flex justify-between items-center px-6 py-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
          <button
            onClick={() => setLocation('/main')}
            aria-label="Go back"
            className="hover:opacity-80 transition-opacity flex items-center justify-center w-10 h-10 -ml-2"
          >
            <ArrowLeft size={24} className="text-on-surface" />
          </button>
          <div className="bg-tertiary-container text-on-tertiary-fixed-variant px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant" />
            Testnet
          </div>
        </header>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <main className="flex-1 px-6 space-y-8">

          {/* Title */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Receive TON</h1>
            <p className="text-sm text-on-surface-variant">
              Your unique wallet address on the TON testnet.
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]">
              <QRCodeSVG
                value={displayAddress}
                size={200}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant px-1">
              Your Wallet Address
            </label>
            <div className="bg-surface-container-lowest p-5 rounded-lg border border-white/5 group transition-all duration-300">
              <div className="text-center">
                <HighlightedAddress address={displayAddress} className="text-sm tracking-wide" />
              </div>
            </div>
            <CopyButton
              text={displayAddress}
              variant="with-text"
              label="Copy Address"
              className="w-full justify-center gap-2 py-4 px-6 rounded-lg border border-outline/20 bg-transparent hover:bg-white/5 active:scale-[0.98] transition-all text-sm font-bold uppercase tracking-wider text-primary"
            />
          </div>

          {/* Activation info */}
          {!isActivated && (
            <div className="bg-warning/10 p-4 rounded-lg flex gap-4 items-start border border-warning/20">
              <div className="bg-warning/20 p-2 rounded-md">
                <AlertTriangle size={20} className="text-warning" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-warning">
                  Wallet Not Activated
                </p>
                <p className="text-sm text-warning/90 leading-snug">
                  Your wallet contract is not deployed yet. Funds sent to this address will be credited,
                  but you will need to make an outgoing transaction to fully activate the wallet.
                </p>
              </div>
            </div>
          )}

          {/* Testnet Warning */}
          <div className="bg-tertiary-container/10 p-4 rounded-lg flex gap-4 items-start border border-tertiary-container/20">
            <div className="bg-tertiary-container/20 p-2 rounded-md">
              <svg
                className="text-tertiary"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-tertiary">
                Important Security Note
              </p>
              <p className="text-sm text-tertiary/90 leading-snug">
                This is a testnet address. Do not send real TON here. Funds sent on mainnet to this address may be lost.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
