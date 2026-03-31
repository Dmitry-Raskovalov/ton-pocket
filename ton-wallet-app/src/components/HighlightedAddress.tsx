/**
 * Highlighted address component for visual verification.
 */

export interface HighlightedAddressProps {
  address: string;
  className?: string;
}

export function HighlightedAddress({ address, className = '' }: HighlightedAddressProps) {
  // Split address into parts for highlighting
  const start = address.slice(0, 6);
  const middle = address.slice(6, -6);
  const end = address.slice(-6);

  return (
    <div className={`font-mono text-sm ${className}`}>
      <span className="text-primary font-semibold">{start}</span>
      <span className="text-text-secondary">{middle}</span>
      <span className="text-primary font-semibold">{end}</span>
    </div>
  );
}
