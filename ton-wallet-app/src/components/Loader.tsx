/**
 * file: Loader.tsx
 * description: Full-screen loading overlay with spinner and optional message
 * dependencies: lucide-react
 * created: 2026-04-01
 */

import { Loader2 } from 'lucide-react';

export interface LoaderProps {
  /** Optional descriptive text shown below the spinner */
  text?: string;
}

export function Loader({ text }: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={text ?? 'Loading'}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <Loader2 size={40} className="text-primary animate-spin" />
      {text && (
        <p className="mt-4 text-sm text-on-surface-variant">{text}</p>
      )}
    </div>
  );
}
