import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessagesSquare, TrendingUp, AlertTriangle, Zap, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import KpiCard from '@/components/dashboard/KpiCard';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import SentimentPie from '@/components/dashboard/SentimentPie';
import HealthScoreRing from '@/components/dashboard/HealthScoreRing';
import HealthBar from '@/components/shared/HealthBar';
import EmptyState from '@/components/shared/EmptyState';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { dashboard as dashboardApi, products as productsApi } from '@/lib/apiClient';

export default function Dashboard() {
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: dash, isLoading: loadingDash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        return await dashboardApi.get();
      } catch (e) {
        // Les erreurs 401 sont gérées par l'intercepteur apiClient (redirect /login)
        // On ne toast que les vraies erreurs métier
        if (e.message !== '__AUTH__') {
          toast({ title: 'Erreur dashboard', description: e.message, variant: 'destructive' });
        }
        throw e;
      }
    },
  });

  const { data: productsRes } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productsApi.list();
      return Array.isArray(res) ? res : (res.products ?? []);
    },
    initialData: [],
  });

  const products = Array.isArray(productsRes) ? productsRes : [];

  const kpis = dash?.kpis ?? {};
  const insights = dash?.insights ?? [];
  const totalReviews = kpis.total_reviews ?? 0;
  const totalAnalyses = kpis.total_analyses ?? 0;
  const avgHealth = kpis.avg_health_score ?? 0;
  const topIssue = kpis.top_issue ?? '—';
  const sentimentRatio = kpis.sentiment_ratio ?? {};
  const positiveRatio = sentimentRatio['positif'] ?? sentimentRatio['positive'] ?? 0;
  const trending = insights[0]?.text ?? '—';

  const sumAll = totalAnalyses > 0 ? totalReviews : 0;
  const pos = Math.round(sumAll * (positiveRatio / 100));
  const neg = Math.round(sumAll * ((sentimentRatio['négatif'] ?? sentimentRatio['negative'] ?? 0) / 100));
  const neu = sumAll - pos - neg;

  const formattedInsights = insights.map(i => i.text ?? i).slice(0, 5);

  if (loadingDash) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl card-panel border border-border animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 rounded-2xl card-panel border border-border animate-pulse" />
          <div className="h-64 rounded-2xl card-panel border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (!dash && !loadingDash) {
    return (
      <EmptyState
        icon={Package}
        title="Aucune donnée"
        description="Commencez par créer un produit et lancer une analyse."
        action={<Link to="/products" className="text-primary underline text-sm">Créer un produit →</Link>}
      />
    );
  }

  return (
    <>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={MessagesSquare} label={t('dashboard.total_reviews')} value={totalReviews.toLocaleString()} sub={`${totalAnalyses} analyses`} delay={0} />
        <KpiCard icon={TrendingUp} label={t('dashboard.sentiment_ratio')} value={`${positiveRatio}%`} sub={t('dashboard.positive')} tone="positive" delay={0.05} />
        <KpiCard icon={AlertTriangle} label={t('dashboard.top_issue')} value={topIssue} tone="negative" delay={0.1} />
        <KpiCard icon={Zap} label="Score moyen" value={`${avgHealth}/100`} tone="warning" delay={0.15} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 card-panel border border-border rounded-2xl p-5 card-shadow">
          <h3 className="font-display text-base font-semibold mb-5">{t('dashboard.sentiment_dist')}</h3>
          <SentimentPie positive={pos} neutral={neu} negative={neg} />
        </div>
        <div className="card-panel border border-border rounded-2xl p-5 card-shadow flex flex-col">
          <h3 className="font-display text-base font-semibold mb-1">{t('dashboard.health_score')}</h3>
          <div className="flex-1 flex items-center justify-center">
            <HealthScoreRing score={avgHealth} />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <InsightsPanel insights={formattedInsights} />
        </div>

        <div className="lg:col-span-2 card-panel border border-border rounded-2xl p-5 card-shadow">
          <h3 className="font-display text-base font-semibold mb-4">{t('dashboard.recent_products')}</h3>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('dashboard.no_data')}</p>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                  <Link to={`/products/${p.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <span className="font-display text-sm font-semibold text-accent-foreground">{p.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <div className="mt-1">
                        <HealthBar score={p.health_score || 0} size="sm" showLabel={false} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {p.updated_at ? format(new Date(p.updated_at), 'MMM d') : '—'}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
