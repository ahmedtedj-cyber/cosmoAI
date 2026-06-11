import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellOff, Mail, Send, Loader2, CheckCircle2, Calendar, Package, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/shared/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import { products as productsApi } from '@/lib/apiClient';

const DAYS = [
  { value: 'monday',    label: 'Lundi' },
  { value: 'tuesday',   label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday',  label: 'Jeudi' },
  { value: 'friday',    label: 'Vendredi' },
  { value: 'saturday',  label: 'Samedi' },
  { value: 'sunday',    label: 'Dimanche' },
];

const STORAGE_KEY = 'cosmoai_alert_config';

export default function Alerts() {
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);

  // Config persistée en localStorage (pas d'entité backend pour les alertes)
  const loadConfig = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  };

  const [form, setForm] = useState(() => loadConfig() || {
    email: '',
    enabled: true,
    product_ids: [],
    day_of_week: 'monday',
  });

  const { data: productsRes = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productsApi.list();
      return Array.isArray(res) ? res : (res.products ?? []);
    },
    initialData: [],
  });
  const products = Array.isArray(productsRes) ? productsRes : [];

  const toggleProduct = id => {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(id)
        ? f.product_ids.filter(p => p !== id)
        : [...f.product_ids, id],
    }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    toast({ title: 'Configuration sauvegardée', description: 'Vos préférences d\'alertes ont été enregistrées.' });
  };

  const monitoredProducts = products.filter(p =>
    form.product_ids.length === 0 || form.product_ids.includes(p.id)
  );

  // Résumé des produits à risque (health_score < 60)
  const atRisk = monitoredProducts.filter(p => (p.health_score ?? 100) < 60);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Alertes hebdomadaires"
        subtitle="Configurez les notifications automatiques sur l'évolution du sentiment de vos produits."
      />

      {/* Info banner */}
      <Alert className="mb-6 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
          Les alertes email nécessitent une configuration serveur SMTP. La configuration est sauvegardée localement en attendant l'intégration email.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-4">

          {/* Enable / Email */}
          <div className="card-panel border border-border rounded-2xl p-6 card-shadow space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {form.enabled
                  ? <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Bell className="w-4 h-4 text-primary" /></div>
                  : <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><BellOff className="w-4 h-4 text-muted-foreground" /></div>
                }
                <div>
                  <p className="font-semibold text-sm text-foreground">Alertes par email</p>
                  <p className="text-xs text-muted-foreground">Activer / désactiver les envois automatiques</p>
                </div>
              </div>
              <Switch checked={form.enabled} onCheckedChange={v => setForm(f => ({ ...f, enabled: v }))} />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Adresse email</Label>
              <Input
                type="email"
                placeholder="vous@marque.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Jour d'envoi</Label>
              <Select value={form.day_of_week} onValueChange={v => setForm(f => ({ ...f, day_of_week: v }))}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product selection */}
          <div className="card-panel border border-border rounded-2xl p-6 card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm text-foreground">Produits surveillés</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {form.product_ids.length === 0 ? 'Tous les produits' : `${form.product_ids.length} sélectionné(s)`}
              </span>
            </div>

            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun produit disponible.</p>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={form.product_ids.length === 0}
                    onCheckedChange={() => setForm(f => ({ ...f, product_ids: [] }))}
                  />
                  <span className="text-sm font-medium text-foreground">Tous les produits</span>
                  <Badge variant="outline" className="ml-auto text-xs">{products.length}</Badge>
                </label>
                <div className="border-t border-border my-1" />
                {products.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors">
                    <Checkbox
                      checked={form.product_ids.includes(p.id)}
                      onCheckedChange={() => toggleProduct(p.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.brand} · Score santé: {p.health_score ?? '—'}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${(p.health_score || 0) >= 70 ? 'bg-emerald-500' : (p.health_score || 0) >= 40 ? 'bg-amber-400' : 'bg-rose-500'}`} />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Enregistrer la configuration
            </Button>
            {saved && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-emerald-600 dark:text-emerald-400">
                ✓ Sauvegardé
              </motion.span>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Statut */}
          <div className="card-panel border border-border rounded-2xl p-5 card-shadow">
            <h3 className="font-semibold text-sm text-foreground mb-4">Statut</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Alertes</span>
                <Badge variant="outline" className={form.enabled ? 'border-emerald-300 text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                  {form.enabled ? '● Actif' : '○ Inactif'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Envoi chaque</span>
                <span className="font-medium">{DAYS.find(d => d.value === form.day_of_week)?.label || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Produits surveillés</span>
                <span className="font-medium">{monitoredProducts.length}</span>
              </div>
            </div>
          </div>

          {/* Produits à risque */}
          {atRisk.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-5">
              <h3 className="font-semibold text-sm text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" /> {atRisk.length} produit(s) à risque
              </h3>
              <div className="space-y-2">
                {atRisk.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-rose-800 dark:text-rose-300 font-medium truncate">{p.name}</span>
                    <span className="text-rose-600 font-bold shrink-0 ml-2">{p.health_score ?? '—'}/100</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment ça fonctionne */}
          <div className="bg-accent/50 border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-sm text-foreground mb-3">Comment ça fonctionne</h3>
            <ol className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
              {[
                'Chaque semaine au jour choisi, vos analyses récentes sont compilées.',
                'Les changements de sentiment et nouveaux problèmes sont détectés.',
                'Un email synthétique est envoyé à votre adresse.',
                'Vous restez informé(e) sans avoir à vous connecter.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
