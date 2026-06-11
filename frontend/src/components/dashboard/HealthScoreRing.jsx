import React from 'react';
import { cn } from '@/lib/utils';

export default function HealthScoreRing({ score = 0 }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#f43f5e';
  const textColor = pct >= 70 ? 'text-emerald-600 dark:text-emerald-400'
    : pct >= 40 ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';
  const label = pct >= 70 ? 'Good' : pct >= 40 ? 'Fair' : 'Poor';

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-display text-3xl font-semibold leading-none', textColor)}>{pct}</span>
          <span className="text-xs text-muted-foreground mt-1 font-medium">{label}</span>
        </div>
      </div>
    </div>
  );
}