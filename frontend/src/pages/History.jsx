import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History as HistoryIcon, ChevronDown, ChevronUp, X, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import SentimentBadge from '@/components/shared/SentimentBadge';
import AnalysisResults from '@/components/analysis/AnalysisResults';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { products as productsApi, history as historyApi } from '@/lib/apiClient';

function AnalysisRow({ analysis, onDelete }) {
  const [open, setOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return String(params.get('id')) === String(analysis.id);
  });
  const { t } = useI18n();

  // Détecter le sentiment dominant depuis top_issue ou health_score
  const dominant = (analysis.health_score ?? 50) >= 50 ? 'positive' : 'negative';

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border rounded-2xl overflow-hidden card-panel card-shadow">
      <div className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors gap-4">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <span className="font-display text-sm font-semibold text-accent-foreground">
              {analysis.product_name?.[0]?.toUpperCase() || 'P'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{analysis.product_name || '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {analysis.created_at ? format(new Date(analysis.created_at), 'MMM d, yyyy · HH:mm') : '—'}
              {' · '}{analysis.reviews_count || 0} {t('history.reviews')}
              {analysis.health_score != null && (
                <span className={cn('ml-2 font-semibold', analysis.health_score >= 70 ? 'text-emerald-500' : analysis.health_score >= 40 ? 'text-amber-500' : 'text-rose-500')}>
                  Score: {analysis.health_score}/100
                </span>
              )}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <SentimentBadge sentiment={dominant} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(analysis.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <button onClick={() => setOpen(o => !o)} className="text-muted-foreground p-1">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <AnalysisDetail analysisId={analysis.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Charge les détails complets d'une analyse à la demande
function AnalysisDetail({ analysisId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['analysis-detail', analysisId],
    queryFn: () => historyApi.get(analysisId),
  });

  if (isLoading) {
    return <div className="px-4 pb-4 border-t border-border"><div className="h-24 rounded-xl bg-muted animate-pulse mt-4" /></div>;
  }
  if (!data) return null;

  return (
    <div className="px-4 pb-4 border-t border-border">
      <AnalysisResults result={{
        summary: data.summary,
        aspects: data.aspects || [],
        recommendations: data.recommendations || [],
        key_insights: data.key_insights || [],
      }} />
    </div>
  );
}

export default function History() {
  const { t } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filterProduct, setFilterProduct] = useState('all');
  const [search, setSearch] = useState('');

  const { data: productsRes = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productsApi.list();
      return Array.isArray(res) ? res : (res.products ?? []);
    },
    initialData: [],
  });
  const products = Array.isArray(productsRes) ? productsRes : [];

  const { data: historyRes, isLoading } = useQuery({
    queryKey: ['history', filterProduct],
    queryFn: async () => {
      const pid = filterProduct !== 'all' ? Number(filterProduct) : null;
      const res = await historyApi.list(pid);
      return Array.isArray(res) ? res : (res.analyses ?? []);
    },
    initialData: [],
  });
  const analyses = Array.isArray(historyRes) ? historyRes : [];

  const deleteMutation = useMutation({
    mutationFn: id => historyApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['history'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Analyse supprimée' });
    },
    onError: e => { if (e.message !== '__AUTH__') toast({ title: 'Erreur', description: e.message, variant: 'destructive' }); },
  });

  const handleDelete = id => {
    if (window.confirm('Supprimer cette analyse ?')) deleteMutation.mutate(id);
  };

  const filtered = analyses.filter(a =>
    !search || (a.product_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 w-48 h-9"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filtre produit */}
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t('history.filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('history.all')}</SelectItem>
            {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {(filterProduct !== 'all' || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterProduct('all'); setSearch(''); }} className="gap-1.5 text-muted-foreground">
            <X className="w-3.5 h-3.5" /> Réinitialiser
          </Button>
        )}

        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} analyse{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-20 rounded-2xl card-panel border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={HistoryIcon} title={t('history.title')} description={t('history.empty')} />
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <AnalysisRow key={a.id} analysis={a} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  );
}
