/**
 * file: WarningList.tsx
 * description: List of WarningCard components that aggregates blocking checkbox state
 * dependencies: WarningCard, services/validation/types
 * created: 2026-04-01
 */

import { useState, useEffect } from 'react';
import type { Warning } from '@/services/validation/types';
import { WarningCard } from './WarningCard';

export interface WarningListProps {
  warnings: Warning[];
  /** Called whenever the "all blocking confirmed" state changes */
  onAllBlockingConfirmed: (confirmed: boolean) => void;
}

export function WarningList({ warnings, onAllBlockingConfirmed }: WarningListProps) {
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});

  // Reset checked state when the warnings set changes
  const [prevWarnings, setPrevWarnings] = useState(warnings);
  if (warnings !== prevWarnings) {
    setPrevWarnings(warnings);
    setCheckedMap({});
  }

  // Notify parent when all blocking warnings are confirmed
  useEffect(() => {
    const blockingIndices = warnings
      .map((w, i) => (w.blocking ? i : -1))
      .filter((i) => i !== -1);

    const allConfirmed =
      blockingIndices.length > 0 && blockingIndices.every((i) => !!checkedMap[i]);

    onAllBlockingConfirmed(allConfirmed);
  }, [checkedMap, warnings, onAllBlockingConfirmed]);

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-3">
      {warnings.map((warning, index) => (
        <WarningCard
          key={`${warning.type}-${index}`}
          warning={warning}
          checked={!!checkedMap[index]}
          onCheck={(checked) =>
            setCheckedMap((prev) => ({ ...prev, [index]: checked }))
          }
        />
      ))}
    </div>
  );
}
