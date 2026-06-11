import React from 'react';
import { cn } from '@/lib/utils';

const cfg = {
  positive: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
  neutral:  { dot: 'bg-amber-400',   text: 'text-amber-700  dark:text-amber-400',  bg: 'bg-amber-50  dark:bg-amber-400/10  border-amber-200  dark:border-amber-400/20'  },
  negative: { dot: 'bg-rose-500',    text: 'text-rose-700   dark:text-rose-400',   bg: 'bg-rose-50   dark:bg-rose-500/10   border-rose-200   dark:border-rose-500/20'   },
};

export default function SentimentBadge({ sentiment, label }) {
  const s = sentiment || 'neutral';
  const c = cfg[s] || cfg.neutral;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', c.bg, c.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
      {label || s}
    </span>
  );
}