import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const toneMap = {
  default: {
    card: 'kpi-card-default',
    bg: 'bg-accent',
    icon: 'text-accent-foreground',
  },
  positive: {
    card: 'kpi-card-positive',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    card: 'kpi-card-warning',
    bg: 'bg-amber-50 dark:bg-amber-400/10',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  negative: {
    card: 'kpi-card-negative',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    icon: 'text-rose-600 dark:text-rose-400',
  },
};

export default function KpiCard({ icon: Icon, label, value, sub, tone = 'default', delay = 0 }) {
  const c = toneMap[tone] || toneMap.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        c.card,
        'border border-border rounded-2xl p-5 card-shadow hover:card-shadow-md transition-shadow'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-3xl font-semibold mt-3 text-foreground leading-none truncate">
            {value ?? '—'}
          </p>
          {sub && (
            <p className="text-xs text-muted-foreground mt-2 truncate">{sub}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', c.bg)}>
            <Icon className={cn('w-4.5 h-4.5', c.icon)} size={18} />
          </div>
        )}
      </div>
    </motion.div>
  );
}