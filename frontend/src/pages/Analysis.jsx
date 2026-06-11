import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Upload, Loader2, AlertCircle, Link2,
  CheckCircle2, ExternalLink, Globe, X, FileText, MapPin, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/shared/PageHeader';
import AnalysisResults from '@/components/analysis/AnalysisResults';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { products as productsApi, analysis as analysisApi } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

const SOURCE_LABELS = {
  amazon:     { label: 'Amazon',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  sephora:    { label: 'Sephora',    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  marionnaud: { label: 'Marionnaud', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  google:     { label: 'Google',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  generic:    { label: 'Web',        color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' },
};

export default function Analysis() {
  const { t } = useI18n();
  const toast = () => {};
  const qc = useQueryClient();
  const fileRef = useRef(null);

  const defaultProduct = new URLSearchParams(window.location.search).get('product') || '';

  const [productId, setProductId]       = useState(defaultProduct);
  const [result, setResult]             = useState(null);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [error, setError]               = useState('');

  // ── CSV ──────────────────────────────────────────────────────
  const [csvReviews, setCsvReviews]     = useState([]);
  const [csvFilename, setCsvFilename]   = useState('');

  // ── URL scraping ─────────────────────────────────────────────
  const [url, setUrl]                   = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [urlPreview, setUrlPreview]     = useState(null);

  // ── Google Places ────────────────────────────────────────────
  const [googleQuery, setGoogleQuery]   = useState('');
  const [googleApiKey, setGoogleApiKey] = useState(() => localStorage.getItem('cosmoai_google_key') || '');
  const [isSearching, setIsSearching]   = useState(false);
  const [googlePlace, setGooglePlace]   = useState(null);

  // Source active : 'csv' | 'url' | 'google' | null
  const activeSource =
    googlePlace ? 'google' :
    url.trim()  ? 'url'    :
    csvReviews.length > 0 ? 'csv' : null;

  const { data: productsRes = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productsApi.list();
      return Array.isArray(res) ? res : (res.products ?? []);
    },
    initialData: [],
  });
  const products = Array.isArray(productsRes) ? productsRes : [];

  // ── Handlers CSV ─────────────────────────────────────────────
  const handleFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const data = file.name.endsWith('.csv') && lines.length > 1 ? lines.slice(1) : lines;
    setCsvReviews(data);
    setCsvFilename(file.name);
    setUrl(''); setUrlPreview(null);
    setGooglePlace(null); setGoogleQuery('');
    e.target.value = '';
    toast({ title: `${data.length} avis importés`, description: file.name, duration: 3000 });
  };

  // ── Handlers URL ─────────────────────────────────────────────
  const handleUrlPreview = async () => {
    setError(''); setUrlPreview(null);
    if (!url.trim()) return setError('Entrez une URL.');
    setIsPreviewing(true);
    try {
      const data = await analysisApi.scrapePreview(url.trim());
      setUrlPreview(data);
      setCsvReviews([]); setCsvFilename('');
      setGooglePlace(null);
    } catch (e) {
      setError(e.message || 'Impossible de scraper cette URL.');
    } finally {
      setIsPreviewing(false);
    }
  };

  // ── Handlers Google ──────────────────────────────────────────
  const handleGoogleSearch = async () => {
    setError(''); setGooglePlace(null);
    if (!googleQuery.trim()) return setError('Entrez un nom de lieu.');
    if (!googleApiKey.trim()) return setError('Entrez votre clé API Google.');
    setIsSearching(true);
    try {
      const place = await analysisApi.googleSearch(googleQuery.trim(), googleApiKey.trim());
      setGooglePlace(place);
      localStorage.setItem('cosmoai_google_key', googleApiKey.trim());
      setCsvReviews([]); setCsvFilename('');
      setUrl(''); setUrlPreview(null);
    } catch (e) {
      setError(e.message || 'Lieu introuvable.');
    } finally {
      setIsSearching(false);
    }
  };

  // ── Analyse principale ───────────────────────────────────────
  const handleAnalyze = async () => {
    setError('');
    if (!productId) return setError(t('analysis.err_no_product'));
    if (!activeSource) return setError('Choisissez une source : CSV, URL ou Google.');
    setIsAnalyzing(true); setResult(null);
    try {
      let res;
      if (activeSource === 'google') {
        res = await analysisApi.analyzeGoogle(Number(productId), googleQuery.trim(), googleApiKey.trim());
        toast({ title: 'Analyse terminée', description: `${res.google_meta?.reviews_found ?? '?'} avis Google analysés pour "${res.google_meta?.name}".`, duration: 3000 });
      } else if (activeSource === 'url') {
        res = await analysisApi.analyzeURL(Number(productId), url.trim());
        toast({ title: 'Analyse terminée', description: `${res.scrape_meta?.reviews_found ?? '?'} avis récupérés.`, duration: 3000 });
      } else {
        res = await analysisApi.analyzeJSON(Number(productId), csvReviews);
        toast({ title: 'Analyse terminée', description: `${csvReviews.length} avis analysés depuis ${csvFilename}.`, duration: 3000 });
      }
      setResult(res);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['history'] });
    } catch (e) {
      setError(e.message || "Erreur lors de l'analyse.");
      if (e.message !== '__AUTH__') toast({ title: 'Erreur', description: e.message, variant: 'destructive', duration: 3000 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cardClass = (src) => cn(
    'bg-card border rounded-2xl p-5 card-shadow space-y-3 transition-all',
    activeSource === src ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
  );

  return (
    <>
      <PageHeader title={t('analysis.title')} subtitle={t('analysis.subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Panneau gauche ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Produit */}
          <div className="bg-card border border-border rounded-2xl p-5 card-shadow space-y-2">
            <Label>{t('analysis.select_product')}</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder={t('analysis.placeholder_product')} />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name} · {p.brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Bloc Google Places ──────────────────────── */}
          <div className={cardClass('google')}>
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="w-4 h-4 text-blue-500" />
              Avis Google
              <span className="ml-auto text-[10px] font-normal text-muted-foreground">Via API officielle</span>
            </Label>

            <div className="space-y-2">
              <Input
                value={googleApiKey}
                onChange={e => setGoogleApiKey(e.target.value)}
                placeholder="AIza... (clé API Google Places)"
                className="font-mono text-xs"
                type="password"
              />
              <div className="flex gap-2">
                <Input
                  value={googleQuery}
                  onChange={e => { setGoogleQuery(e.target.value); setGooglePlace(null); }}
                  placeholder="Ex: Sephora Paris Champs-Élysées"
                  className="text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleGoogleSearch()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoogleSearch}
                  disabled={isSearching || !googleQuery.trim() || !googleApiKey.trim()}
                  className="shrink-0"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Chercher'}
                </Button>
              </div>
            </div>

            {googlePlace && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">{googlePlace.name}</span>
                  <button onClick={() => setGooglePlace(null)} className="ml-auto shrink-0 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground truncate pl-5">{googlePlace.address}</p>
                {googlePlace.rating && (
                  <div className="flex items-center gap-1 pl-5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-medium">{googlePlace.rating}</span>
                    <span className="text-xs text-muted-foreground">({googlePlace.total_ratings?.toLocaleString()} avis)</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pl-5">📋 Jusqu'à 20 avis récents récupérés via RapidAPI.</p>
              </div>
            )}

            {!googleApiKey && (
              <p className="text-xs text-muted-foreground">
                Clé gratuite sur{' '}
                <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  console.cloud.google.com
                </a>
                {' '}→ Places API
              </p>
            )}
          </div>

          {/* Séparateur */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium px-1">OU</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Bloc URL ────────────────────────────────── */}
          <div className={cardClass('url')}>
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="w-4 h-4 text-primary" />
              Importer via URL
              <span className="ml-auto text-[10px] font-normal text-muted-foreground">Amazon · Sephora · Marionnaud</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={e => { setUrl(e.target.value); setUrlPreview(null); setGooglePlace(null); }}
                placeholder="https://www.amazon.fr/dp/B0..."
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleUrlPreview}
                disabled={isPreviewing || !url.trim()}
                className="shrink-0"
              >
                {isPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tester'}
              </Button>
            </div>
            {urlPreview && (
              <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-medium">{urlPreview.total} avis trouvés</span>
                  {urlPreview.source && (
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto', SOURCE_LABELS[urlPreview.source]?.color ?? SOURCE_LABELS.generic.color)}>
                      {SOURCE_LABELS[urlPreview.source]?.label ?? urlPreview.source}
                    </span>
                  )}
                </div>
                {urlPreview.reviews?.slice(0, 2).map((r, i) => (
                  <p key={i} className="text-xs italic text-foreground/70 line-clamp-1">"{r}"</p>
                ))}
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium px-1">OU</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Bloc CSV ────────────────────────────────── */}
          <div className={cardClass('csv')}>
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="w-4 h-4 text-primary" />
              Importer un fichier CSV
              <span className="ml-auto text-[10px] font-normal text-muted-foreground">.csv ou .txt</span>
            </Label>
            {csvReviews.length === 0 ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
                <p className="text-sm font-medium">Choisir un fichier</p>
                <p className="text-xs text-muted-foreground mt-0.5">Un avis par ligne</p>
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{csvReviews.length} avis chargés</p>
                  <p className="text-xs text-emerald-600/70 truncate">{csvFilename}</p>
                </div>
                <button onClick={() => { setCsvReviews([]); setCsvFilename(''); }} className="shrink-0 p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </div>

          {/* Erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Bouton analyser */}
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !productId || !activeSource} className="w-full gap-2">
            {isAnalyzing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</>
              : <><Sparkles className="w-4 h-4" /> {t('analysis.analyze')}</>
            }
          </Button>

          {activeSource && !isAnalyzing && (
            <p className="text-xs text-center text-muted-foreground">
              Source :{' '}
              <span className="font-medium text-foreground">
                {activeSource === 'google' ? `Google — ${googlePlace?.name}` :
                 activeSource === 'url'    ? `URL scraping` :
                                             `CSV — ${csvFilename}`}
              </span>
            </p>
          )}
        </div>

        {/* ── Résultats ──────────────────────────────────── */}
        <div className="lg:col-span-3">
          {!result && !isAnalyzing && (
            <div className="h-full flex items-center justify-center py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
              <div>
                <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Les résultats apparaîtront ici</p>
                <p className="text-xs mt-1 opacity-60">Google Reviews · URL · CSV</p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-full flex items-center justify-center py-20 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  {activeSource === 'url' ? 'Scraping + analyse en cours…' :
                   activeSource === 'google' ? 'Récupération Google + analyse en cours…' :
                   'Analyse en cours…'}
                </p>
                <p className="text-xs text-muted-foreground">Quelques secondes…</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {(result.scrape_meta || result.google_meta) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-xl px-4 py-2.5">
                  {result.google_meta ? (
                    <>
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>
                        <span className="font-medium text-foreground">{result.google_meta.reviews_found}</span> avis Google
                        {' · '}<span className="font-medium text-foreground">{result.google_meta.name}</span>
                      </span>
                      {result.google_meta.rating && (
                        <div className="ml-auto flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{result.google_meta.rating}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>
                        <span className="font-medium text-foreground">{result.scrape_meta.reviews_found}</span> avis
                        {result.scrape_meta.source && (
                          <> depuis <span className={cn('font-semibold px-1.5 py-0.5 rounded-md text-xs', SOURCE_LABELS[result.scrape_meta.source]?.color ?? SOURCE_LABELS.generic.color)}>
                            {SOURCE_LABELS[result.scrape_meta.source]?.label ?? result.scrape_meta.source}
                          </span></>
                        )}
                      </span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                        <ExternalLink className="w-3.5 h-3.5 hover:text-foreground" />
                      </a>
                    </>
                  )}
                </div>
              )}
              <AnalysisResults result={result} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}