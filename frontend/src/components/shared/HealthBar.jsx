import React from 'react';
import { cn } from '@/lib/utils';

export default function HealthBar({ score = 0, size = 'md', showLabel = true }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? 'from-emerald-400 to-emerald-500'
    : pct >= 40 ? 'from-amber-400 to-amber-500'
    : 'from-rose-400 to-rose-500';
  const textColor = pct >= 70 ? 'text-emerald-600 dark:text-emerald-400'
    : pct >= 40 ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';

  return (
    <div className={cn('w-full', size === 'sm' ? 'space-y-1' : 'space-y-2')}>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Health</span>
          <span className={cn('text-sm font-semibold tabular-nums', textColor)}>{pct}</span>
        </div>
      )}
      <div className={cn('rounded-full bg-muted overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}