/**
 * file: WarningCard.tsx
 * description: Warning card with severity levels, left-border accent, and optional blocking checkbox
 * dependencies: services/validation/types, lucide-react
 * created: 2026-04-01
 */

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Warning, ValidationSeverity } from '@/services/validation/types';

export interface WarningCardProps {
  warning: Warning;
  /** Controlled checkbox state — used only when warning.blocking=true */
  checked: boolean;
  onCheck: (checked: boolean) => void;
}

interface SeverityConfig {
  border: string;
  bg: string;
  iconColor: string;
  titleColor: string;
  checkboxBg: string;
  checkboxBorder: string;
  checkboxText: string;
  Icon: typeof AlertCircle;
}

const SEVERITY_CONFIG: Record<ValidationSeverity, SeverityConfig> = {
  error: {
    border: 'border-error',
    bg: 'bg-error-container/10',
    iconColor: 'text-error',
    titleColor: 'text-error',
    checkboxBg: 'bg-error/5',
    checkboxBorder: 'border-error',
    checkboxText: 'text-error',
    Icon: AlertCircle,
  },
  warning: {
    border: 'border-tertiary',
    bg: 'bg-tertiary-container/10',
    iconColor: 'text-tertiary',
    titleColor: 'text-tertiary',
    checkboxBg: 'bg-tertiary/5',
    checkboxBorder: 'border-tertiary',
    checkboxText: 'text-tertiary',
    Icon: AlertTriangle,
  },
  info: {
    border: 'border-primary',
    bg: 'bg-primary-container/10',
    iconColor: 'text-primary',
    titleColor: 'text-primary',
    checkboxBg: 'bg-primary/5',
    checkboxBorder: 'border-primary',
    checkboxText: 'text-primary',
    Icon: Info,
  },
};

/** Converts snake_case type identifier to Title Case for display */
function formatType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function WarningCard({ warning, checked, onCheck }: WarningCardProps) {
  const config = SEVERITY_CONFIG[warning.severity];
  const { Icon } = config;

  return (
    <div className={`${config.bg} border-l-4 ${config.border} p-4 rounded-r-lg space-y-4`}>
      <div className="flex gap-3">
        <Icon className={`${config.iconColor} shrink-0 mt-0.5`} size={18} aria-hidden="true" />
        <div className="space-y-1">
          <p className={`text-sm font-bold ${config.titleColor}`}>{formatType(warning.type)}</p>
          <p className="text-xs text-on-surface-variant leading-relaxed">{warning.message}</p>
        </div>
      </div>

      {warning.blocking && (
        <label
          className={`flex items-center gap-3 ${config.checkboxBg} p-3 rounded cursor-pointer active:scale-[0.98] transition-transform`}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheck(e.target.checked)}
            className={`w-4 h-4 rounded border ${config.checkboxBorder} bg-transparent accent-current`}
          />
          <span className={`text-xs font-semibold ${config.checkboxText} uppercase tracking-wide`}>
            I understand the risk
          </span>
        </label>
      )}
    </div>
  );
}
