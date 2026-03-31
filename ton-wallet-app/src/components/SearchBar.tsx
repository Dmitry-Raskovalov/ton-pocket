/**
 * file: SearchBar.tsx
 * description: Search field with search icon and clear button
 * dependencies: lucide-react
 * created: 2026-04-01
 */

import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search by address, label, or comment',
  className = '',
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 bg-surface-container-high border-none rounded-full pl-9 pr-9 text-xs text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
