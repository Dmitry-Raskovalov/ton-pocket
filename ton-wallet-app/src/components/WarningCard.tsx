/**
 * Warning card component with severity levels.
 */

import { useState } from 'react';

export type WarningSeverity = 'error' | 'warning' | 'info';

export interface WarningCardProps {
  title: string;
  message: string;
  severity: WarningSeverity;
  showCheckbox?: boolean;
  checkboxLabel?: string;
  onCheckboxChange?: (checked: boolean) => void;
}

const severityStyles: Record<WarningSeverity, string> = {
  error: 'bg-error/10 border-error text-error',
  warning: 'bg-warning/10 border-warning text-warning',
  info: 'bg-info/10 border-info text-info',
};

export function WarningCard({
  title,
  message,
  severity,
  showCheckbox = false,
  checkboxLabel = 'I understand the risks',
  onCheckboxChange,
}: WarningCardProps) {
  const [checked, setChecked] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    setChecked(newChecked);
    onCheckboxChange?.(newChecked);
  };

  return (
    <div className={`p-4 rounded-lg border ${severityStyles[severity]}`}>
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-sm opacity-80">{message}</div>
      {showCheckbox && (
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleCheckboxChange}
            className="w-4 h-4 rounded border-current"
          />
          <span className="text-sm">{checkboxLabel}</span>
        </label>
      )}
    </div>
  );
}
