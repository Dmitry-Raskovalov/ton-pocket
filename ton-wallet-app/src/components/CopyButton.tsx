/**
 * Copy button component.
 */

import { useState } from 'react';

export interface CopyButtonProps {
  text: string;
  label?: string;
  onCopy?: () => void;
}

export function CopyButton({ text, label = 'Copy', onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-sm bg-surface border border-border rounded-md hover:bg-surface-hover transition-colors"
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
}
