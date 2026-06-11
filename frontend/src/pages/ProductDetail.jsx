const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { ArrowLeft, Sparkles, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import SentimentLine from '@/components/products/SentimentLine';
import IssuesBar from '@/components/products/IssuesBar';
import AspectTable from '@/components/products/AspectTable';
import HealthBar from '@/components/shared/HealthBar';
import SentimentBadge from '@/components/shared/SentimentBadge';
import { useI18n } from '@/lib/i18n';

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useI18n();

  const { data: products = [] } = useQuery({
    queryKey: ['product', id],
    queryFn: () => db.entities.Product.filter({ id }, null, 1),
    enabled: !!id,
    initialData: [],
  });
  const product = products[0];

  const { data: analyses = [] } = useQuery({
    queryKey: ['analyses', id],
    queryFn: () => db.entities.Analysis.filter({ product_id: id }, '-created_date', 50),
    enabled: !!id,
    initialData: [],
  });

  if (!product) return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>;

  return (
    <>
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> {t('products.back')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center shrink-0">
            <span className="font-display text-2xl font-semibold text-accent-foreground">{product.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{product.brand}{product.category ? ` · ${product.category}` : ''}</p>
          </div>
        </div>
        <Link to={`/analysis?product=${product.id}`}>
          <Button className="gap-2"><Sparkles className="w-4 h-4" /> {t('nav.analysis')}</Button>
        </Link>
      </div>

      {/* Health + stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('products.health'), value: `${product.health_score || 0}` },
          { label: t('products.sentiment'), value: `${product.sentiment_score || 0}%` },
          { label: t('products.total_reviews'), value: String(product.total_reviews || 0) },
          { label: t('products.last_update'), value: product.updated_date ? format(new Date(product.updated_date), 'MMM d, yyyy') : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card-panel border border-border rounded-xl p-4 card-shadow">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</p>
            <p className="font-display text-2xl font-semibold mt-2">{value}</p>
          </div>
        ))}
      </div>

      {product.description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-2xl">{product.description}</p>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card-panel border border-border rounded-2xl p-5 card-shadow">
          <h3 className="font-display text-base font-semibold mb-4">{t('products.sentiment_over_time')}</h3>
          <SentimentLine analyses={analyses} />
        </div>
        <div className="card-panel border border-border rounded-2xl p-5 card-shadow">
          <h3 className="font-display text-base font-semibold mb-4">{t('products.top_issues')}</h3>
          <IssuesBar analyses={analyses} />
        </div>
      </div>

      {/* Aspect breakdown */}
      <div className="card-panel border border-border rounded-2xl p-5 card-shadow mb-4">
        <h3 className="font-display text-base font-semibold mb-4">{t('products.aspect_evolution')}</h3>
        <AspectTable analyses={analyses} />
      </div>

      {/* Past analyses */}
      <div className="card-panel border border-border rounded-2xl p-5 card-shadow">
        <h3 className="font-display text-base font-semibold mb-4">{t('products.analyses_list')}</h3>
        {analyses.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <MessageSquare className="w-6 h-6 opacity-30" />{t('products.no_analyses')}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {analyses.map(a => {
              const total = (a.sentiment_positive || 0) + (a.sentiment_neutral || 0) + (a.sentiment_negative || 0);
              const dom = total > 0 && a.sentiment_positive >= a.sentiment_negative ? 'positive' : 'negative';
              return (
                <Link key={a.id} to={`/history?id=${a.id}`} className="flex items-center justify-between py-3 -mx-1 px-2 rounded-lg hover:bg-secondary transition-colors gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.summary?.slice(0, 80) || 'Analysis'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(a.created_date), 'MMM d, yyyy')} · {a.reviews_count || 0} {t('history.reviews')}</p>
                  </div>
                  <SentimentBadge sentiment={dom} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}