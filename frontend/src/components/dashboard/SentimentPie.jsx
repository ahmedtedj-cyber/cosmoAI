import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useI18n } from '@/lib/i18n';

const COLORS = { positive: '#10b981', neutral: '#f59e0b', negative: '#f43f5e' };

export default function SentimentPie({ positive = 0, neutral = 0, negative = 0 }) {
  const { t } = useI18n();
  const data = [
    { key: 'positive', name: t('dashboard.positive'), value: positive, color: COLORS.positive },
    { key: 'neutral',  name: t('dashboard.neutral'),  value: neutral,  color: COLORS.neutral  },
    { key: 'negative', name: t('dashboard.negative'), value: negative, color: COLORS.negative },
  ].filter(d => d.value > 0);

  const total = positive + neutral + negative;

  if (total === 0) {
    return <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">{t('dashboard.no_data')}</div>;
  }

  return (
    <div className="flex items-center gap-8">
      <div className="w-48 h-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value" stroke="none">
              {data.map(d => <Cell key={d.key} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-3">
        {[
          { label: t('dashboard.positive'), value: positive, color: COLORS.positive },
          { label: t('dashboard.neutral'),  value: neutral,  color: COLORS.neutral  },
          { label: t('dashboard.negative'), value: negative, color: COLORS.negative },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-sm text-foreground truncate">{label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground tabular-nums">{value}</span>
              <span className="text-sm font-semibold tabular-nums w-9 text-right">
                {total > 0 ? `${Math.round((value / total) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}