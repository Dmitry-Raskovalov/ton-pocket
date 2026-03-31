/**
 * Password input component with strength indicator.
 */

import { useState } from 'react';

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showStrength?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  disabled = false,
  showStrength = true,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 pr-12 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2 text-sm text-text-secondary">
          Password strength indicator placeholder
        </div>
      )}
    </div>
  );
}
