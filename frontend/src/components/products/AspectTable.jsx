import React from 'react';
import SentimentBadge from '@/components/shared/SentimentBadge';

export default function AspectTable({ analyses }) {
  const map = {};
  analyses.forEach(a =>
    (a.aspects || []).forEach(asp => {
      if (!map[asp.aspect]) map[asp.aspect] = { mentions: 0, pos: 0, neu: 0, neg: 0 };
      map[asp.aspect].mentions += asp.mentions || 1;
      if (asp.sentiment === 'positive') map[asp.aspect].pos += asp.mentions || 1;
      if (asp.sentiment === 'neutral')  map[asp.aspect].neu += asp.mentions || 1;
      if (asp.sentiment === 'negative') map[asp.aspect].neg += asp.mentions || 1;
    })
  );

  const rows = Object.entries(map)
    .map(([aspect, v]) => {
      const dom = v.pos >= v.neg && v.pos >= v.neu ? 'positive' : v.neg >= v.neu ? 'negative' : 'neutral';
      return { aspect, ...v, dominant: dom };
    })
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);

  if (rows.length === 0) return <div className="py-8 text-center text-sm text-muted-foreground">No aspects yet</div>;

  return (
    <div className="space-y-2">
      {rows.map(r => {
        const total = r.pos + r.neu + r.neg;
        return (
          <div key={r.aspect} className="flex items-center gap-3 py-1">
            <span className="text-sm font-medium w-32 shrink-0 truncate">{r.aspect}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
              {total > 0 && (
                <>
                  <div className="bg-emerald-500" style={{ width: `${(r.pos / total) * 100}%` }} />
                  <div className="bg-amber-400" style={{ width: `${(r.neu / total) * 100}%` }} />
                  <div className="bg-rose-500" style={{ width: `${(r.neg / total) * 100}%` }} />
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SentimentBadge sentiment={r.dominant} />
              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{r.mentions}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}