/**
 * file: Toast.tsx
 * description: Toast notification component with auto-dismiss; ToastContainer reads from ui-store
 * dependencies: store/ui-store, store/types (Toast), lucide-react
 * created: 2026-04-01
 */

import { useEffect } from 'react';
import { AlertCircle, Check, Info } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import type { Toast as ToastItem, ToastType } from '@/store/types';

// ── Single toast item ────────────────────────────────────────────────────────

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const TOAST_CONFIG: Record<ToastType, { icon: typeof Check; iconClass: string }> = {
  success: { icon: Check, iconClass: 'text-[#22c55e]' },
  error: { icon: AlertCircle, iconClass: 'text-error' },
  warning: { icon: AlertCircle, iconClass: 'text-tertiary' },
  info: { icon: Info, iconClass: 'text-primary' },
};

function ToastItem({ toast, onDismiss }: ToastProps) {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-3 px-4 py-3 bg-surface-container-highest rounded-lg shadow-lg max-w-sm w-full animate-in slide-in-from-bottom-2 fade-in duration-200"
    >
      <Icon size={18} className={`shrink-0 ${config.iconClass}`} />
      <span className="text-sm text-on-surface flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="text-outline-variant hover:text-on-surface transition-colors shrink-0"
      >
        ×
      </button>
    </div>
  );
}

// ── Container that reads all toasts from store ───────────────────────────────

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center w-full px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
