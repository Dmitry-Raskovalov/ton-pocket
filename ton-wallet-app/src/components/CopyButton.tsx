/**
 * file: CopyButton.tsx
 * description: Copy-to-clipboard button with "Copied!" feedback state
 * dependencies: lucide-react
 * created: 2026-04-01
 */

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Display variant */
  variant?: 'icon-only' | 'with-text';
  /** Label for with-text variant */
  label?: string;
  className?: string;
}

export function CopyButton({
  text,
  variant = 'icon-only',
  label = 'Copy Address',
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iconSize = variant === 'icon-only' ? 16 : 20;

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy'}
      aria-label={copied ? 'Copied!' : 'Copy'}
      className={`flex items-center gap-2 rounded-md transition-colors text-on-surface-variant hover:text-on-surface ${className}`}
    >
      {copied ? (
        <Check size={iconSize} className="text-[#22c55e]" />
      ) : (
        <Copy size={iconSize} />
      )}
      {variant === 'with-text' && (
        <span className="text-sm font-medium">{copied ? 'Copied!' : label}</span>
      )}
    </button>
  );
}
