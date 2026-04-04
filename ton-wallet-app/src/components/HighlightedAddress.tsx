/**
 * file: HighlightedAddress.tsx
 * description: Displays a blockchain address with the first and last 6 characters
 *   visually highlighted for tamper-detection. Supports full and truncated modes.
 * dependencies: none
 * created: 2026-04-01
 */

const HIGHLIGHT_LEN = 6;

export interface HighlightedAddressProps extends React.HTMLAttributes<HTMLSpanElement> {
  address: string;
  truncate?: boolean;
}

export function HighlightedAddress({
  address,
  truncate = false,
  className = '',
  ...props
}: HighlightedAddressProps) {
  const start = address.slice(0, HIGHLIGHT_LEN);
  const end = address.slice(-HIGHLIGHT_LEN);
  const middle = address.slice(HIGHLIGHT_LEN, -HIGHLIGHT_LEN);
  return (
    <span
      className={`font-mono text-xs break-all leading-relaxed ${className}`}
      {...props}
    >
      <span className="text-on-surface font-bold">{start}</span>
      {truncate ? (
        <span className="text-on-surface-variant/40">…</span>
      ) : (
        <span className="text-on-surface-variant/40">{middle}</span>
      )}
      <span className="text-on-surface font-bold">{end}</span>
    </span>
  );
}
