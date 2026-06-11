import React from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import SentimentBadge from '@/components/shared/SentimentBadge';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import { useI18n } from '@/lib/i18n';

export default function AnalysisResults({ result }) {
  const { t } = useI18n();
  const { summary, aspects = [], recommendations = [], key_insights = [] } = result;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4 mt-6">
      {/* Summary */}
      {summary && (
        <div className="bg-card border border-border rounded-2xl p-5 card-shadow">
          <h3 className="font-display text-base font-semibold mb-3">{t('analysis.summary')}</h3>
          <p className="text-sm text-foreground leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Key insights */}
      {key_insights.length > 0 && <InsightsPanel insights={key_insights} />}

      {/* Aspects */}
      {aspects.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 card-shadow">
          <h3 className="font-display text-base font-semibold mb-4">{t('analysis.aspects')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">{t('analysis.aspect')}</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">{t('analysis.sentiment')}</th>
                  <th className="text-right py-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">{t('analysis.mentions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {aspects.map((asp, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td className="py-3 pr-4 font-medium">{asp.aspect}</td>
                    <td className="py-3 pr-4"><SentimentBadge sentiment={asp.sentiment} label={asp.sentiment} /></td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground">{asp.mentions}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 card-shadow">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('analysis.recommendations')}
          </h3>
          <ul className="space-y-2.5">
            {recommendations.map((rec, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">{i + 1}</span>
                </span>
                {rec}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}