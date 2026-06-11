const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { GitCompare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import HealthBar from '@/components/shared/HealthBar';
import SentimentBadge from '@/components/shared/SentimentBadge';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function CompareMetric({ label, a, b, unit = '' }) {
  const aVal = Number(a) || 0;
  const bVal = Number(b) || 0;
  const diff = aVal - bVal;

  return (
    <div className="grid grid-cols-3 items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="text-center">
        <p className={cn('font-display text-2xl font-semibold', aVal > bVal ? 'text-emerald-600 dark:text-emerald-400' : aVal < bVal ? 'text-rose-600 dark:text-rose-400' : 'text-foreground')}>
          {aVal}{unit}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          {diff > 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : diff < 0 ? <TrendingDown className="w-3 h-3 text-rose-500" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{diff > 0 ? `+${diff}` : diff}{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className={cn('font-display text-2xl font-semibold', bVal > aVal ? 'text-emerald-600 dark:text-emerald-400' : bVal < aVal ? 'text-rose-600 dark:text-rose-400' : 'text-foreground')}>
          {bVal}{unit}
        </p>
      </div>
    </div>
  );
}

function AspectCompare({ analysesA, analysesB }) {
  const buildMap = (analyses) => {
    const m = {};
    analyses.forEach(a => (a.aspects || []).forEach(asp => {
      if (!m[asp.aspect]) m[asp.aspect] = { pos: 0, neg: 0, neu: 0 };
      m[asp.aspect][asp.sentiment === 'positive' ? 'pos' : asp.sentiment === 'negative' ? 'neg' : 'neu'] += asp.mentions || 1;
    }));
    return m;
  };
  const mapA = buildMap(analysesA);
  const mapB = buildMap(analysesB);
  const allAspects = [...new Set([...Object.keys(mapA), ...Object.keys(mapB)])].slice(0, 8);

  if (allAspects.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">No aspect data available.</p>;

  return (
    <div className="space-y-3">
      {allAspects.map(asp => {
        const a = mapA[asp] || { pos: 0, neg: 0, neu: 0 };
        const b = mapB[asp] || { pos: 0, neg: 0, neu: 0 };
        const domA = a.pos >= a.neg && a.pos >= a.neu ? 'positive' : a.neg >= a.neu ? 'negative' : 'neutral';
        const domB = b.pos >= b.neg && b.pos >= b.neu ? 'positive' : b.neg >= b.neu ? 'negative' : 'neutral';
        return (
          <div key={asp} className="grid grid-cols-3 items-center gap-3">
            <div className="flex justify-end"><SentimentBadge sentiment={domA} /></div>
            <p className="text-sm font-medium text-center text-foreground">{asp}</p>
            <div className="flex justify-start"><SentimentBadge sentiment={domB} /></div>
          </div>
        );
      })}
    </div>
  );
}

export default function Comparison() {
  const { t } = useI18n();
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [compared, setCompared] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => db.entities.Product.list('-updated_date', 100),
    initialData: [],
  });

  const { data: analysesA = [] } = useQuery({
    queryKey: ['analyses', idA],
    queryFn: () => db.entities.Analysis.filter({ product_id: idA }, '-created_date', 50),
    enabled: !!idA && compared,
    initialData: [],
  });

  const { data: analysesB = [] } = useQuery({
    queryKey: ['analyses', idB],
    queryFn: () => db.entities.Analysis.filter({ product_id: idB }, '-created_date', 50),
    enabled: !!idB && compared,
    initialData: [],
  });

  const pA = products.find(p => p.id === idA);
  const pB = products.find(p => p.id === idB);

  const ProductSelector = ({ value, onChange, label, exclude }) => (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('comparison.select')} />
        </SelectTrigger>
        <SelectContent>
          {products.filter(p => p.id !== exclude).map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name} · {p.brand}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <PageHeader title={t('comparison.title')} subtitle={t('comparison.subtitle')} />

      {/* Selectors */}
      <div className="card-panel border border-border rounded-2xl p-5 card-shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <ProductSelector value={idA} onChange={v => { setIdA(v); setCompared(false); }} label={t('comparison.product_a')} exclude={idB} />
          <ProductSelector value={idB} onChange={v => { setIdB(v); setCompared(false); }} label={t('comparison.product_b')} exclude={idA} />
        </div>
        <Button disabled={!idA || !idB} onClick={() => setCompared(true)} className="gap-2">
          <GitCompare className="w-4 h-4" /> {t('comparison.compare')}
        </Button>
      </div>

      {!compared || !pA || !pB ? (
        <EmptyState icon={GitCompare} title={t('comparison.title')} description={t('comparison.no_data')} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          {/* Product headers */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {[pA, pB].map((p, side) => (
              <React.Fragment key={p.id}>
                {side === 1 && <div className="text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">vs</p></div>}
                <div className={cn('card-panel border border-border rounded-2xl p-4 card-shadow text-center', side === 0 ? 'order-1' : 'order-3')}>
                  <div className="w-12 h-12 rounded-xl bg-accent mx-auto flex items-center justify-center mb-3">
                    <span className="font-display text-xl font-semibold text-accent-foreground">{p.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.brand}</p>
                  <div className="mt-3"><HealthBar score={p.health_score || 0} size="sm" /></div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Metrics */}
          <div className="card-panel border border-border rounded-2xl p-5 card-shadow">
            <h3 className="font-display text-base font-semibold mb-2">Metrics</h3>
            <CompareMetric label={t('comparison.health_score')} a={pA.health_score} b={pB.health_score} />
            <CompareMetric label={t('comparison.sentiment_score')} a={pA.sentiment_score} b={pB.sentiment_score} unit="%" />
            <CompareMetric label={t('comparison.total_reviews')} a={pA.total_reviews} b={pB.total_reviews} />
          </div>

          {/* Aspect comparison */}
          <div className="card-panel border border-border rounded-2xl p-5 card-shadow">
            <h3 className="font-display text-base font-semibold mb-4">{t('comparison.top_aspects')}</h3>
            <AspectCompare analysesA={analysesA} analysesB={analysesB} />
          </div>
        </motion.div>
      )}
    </>
  );
}