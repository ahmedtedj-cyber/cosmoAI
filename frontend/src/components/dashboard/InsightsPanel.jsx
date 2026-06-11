import React from 'react';
import { Lightbulb, TrendingUp, AlertCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

const iconMap = [Star, TrendingUp, AlertCircle, Lightbulb];
const colorMap = [
  'bg-primary/10 text-primary',
  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400',
];

export default function InsightsPanel({ insights = [] }) {
  const { t } = useI18n();

  return (
    <div className="bg-card border border-border rounded-2xl p-5 card-shadow">
      <h3 className="font-display text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        {t('dashboard.key_insights')}
      </h3>
      {insights.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{t('dashboard.no_insights')}</p>
      ) : (
        <div className="space-y-2.5">
          {insights.map((insight, i) => {
            const Icon = iconMap[i % iconMap.length];
            const colorClass = colorMap[i % colorMap.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{insight}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}