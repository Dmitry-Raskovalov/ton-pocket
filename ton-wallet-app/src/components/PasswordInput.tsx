/**
 * file: PasswordInput.tsx
 * description: Password field with visibility toggle and optional strength indicator.
 *   Integrates with evaluatePassword (zxcvbn-ts) to show a 4-segment colour bar
 *   and a textual label below the input.
 * dependencies: crypto/password-strength, lucide-react
 * created: 2026-04-01
 */

import { useState } from 'react';
import { evaluatePassword, type StrengthScore } from '@/crypto/password-strength';

// TODO: replace with `import { Eye, EyeOff } from 'lucide-react'` after npm install lucide-react
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  error?: string;
  disabled?: boolean;
  label?: string;
}

// Tailwind colour classes for each score segment (active / inactive)
const SEGMENT_COLORS: Record<StrengthScore, string> = {
  0: 'bg-error',
  1: 'bg-error',
  2: 'bg-tertiary',
  3: 'bg-primary',
  4: 'bg-primary',
};

const LABEL_COLORS: Record<StrengthScore, string> = {
  0: 'text-error',
  1: 'text-error',
  2: 'text-tertiary',
  3: 'text-primary',
  4: 'text-primary',
};

export function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  showStrength = false,
  error,
  disabled = false,
  label,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = showStrength && value ? evaluatePassword(value) : null;

  const inputClasses = [
    'w-full bg-surface-container-lowest border-none rounded-lg px-4 py-3 pr-12',
    'text-sm text-on-surface placeholder:text-outline-variant',
    'focus:outline-none focus:ring-1 focus:ring-primary/40',
    'transition-all',
    error ? 'ring-1 ring-error/50 text-error' : '',
    disabled ? 'opacity-40 cursor-not-allowed' : '',
    showStrength && value ? 'pb-4' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-[10px] font-mono uppercase text-on-surface-variant">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />

        {/* Visibility toggle */}
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors disabled:pointer-events-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>

        {/* Strength bar — inside the input at the bottom */}
        {showStrength && value && strength && (
          <div className="absolute bottom-0 left-0 h-1 w-full flex gap-1 px-3 pb-1">
            {([1, 2, 3, 4] as const).map((seg) => (
              <div
                key={seg}
                className={[
                  'h-full flex-1 rounded-full transition-all duration-300',
                  strength.score >= seg
                    ? SEGMENT_COLORS[strength.score]
                    : 'bg-outline-variant/30',
                ].join(' ')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Strength label */}
      {showStrength && value && strength && (
        <p className={`text-[10px] px-1 ${LABEL_COLORS[strength.score]}`}>
          {strength.label}
          {strength.suggestions.length > 0 && (
            <span className="text-on-surface-variant"> — {strength.suggestions[0]}</span>
          )}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-[10px] text-error px-1">{error}</p>
      )}
    </div>
  );
}
