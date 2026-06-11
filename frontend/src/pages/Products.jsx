import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ProductCard from '@/components/products/ProductCard';
import ProductForm from '@/components/products/ProductForm';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { products as productsApi } from '@/lib/apiClient';

export default function Products() {
  const { t } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const { data: productsRes = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productsApi.list();
      return Array.isArray(res) ? res : (res.products ?? []);
    },
    initialData: [],
  });
  const allProducts = Array.isArray(productsRes) ? productsRes : [];
  const products = allProducts.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const create = useMutation({
    mutationFn: d => productsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setFormOpen(false);
      toast({ title: 'Produit créé', description: 'Le produit a été ajouté avec succès.' });
    },
    onError: e => { if (e.message !== '__AUTH__') toast({ title: 'Erreur', description: e.message, variant: 'destructive' }); },
  });

  const update = useMutation({
    mutationFn: ({ id, d }) => productsApi.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setFormOpen(false);
      setEditing(null);
      toast({ title: 'Produit mis à jour' });
    },
    onError: e => { if (e.message !== '__AUTH__') toast({ title: 'Erreur', description: e.message, variant: 'destructive' }); },
  });

  const remove = useMutation({
    mutationFn: id => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Produit supprimé' });
    },
    onError: e => { if (e.message !== '__AUTH__') toast({ title: 'Erreur', description: e.message, variant: 'destructive' }); },
  });

  const handleSubmit = d => editing ? update.mutate({ id: editing.id, d }) : create.mutate(d);
  const handleEdit = p => { setEditing(p); setFormOpen(true); };
  const handleDelete = p => { if (window.confirm(t('products.confirm_delete'))) remove.mutate(p.id); };

  const addBtn = (
    <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
      <Plus className="w-4 h-4" /> {t('products.add')}
    </Button>
  );

  return (
    <>
      <PageHeader title={t('products.title')} subtitle={t('products.subtitle')} action={addBtn} />

      {/* Barre de recherche */}
      {allProducts.length > 0 && (
        <div className="relative mb-5 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2].map(i => <div key={i} className="h-48 rounded-2xl card-panel border border-border animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title={t('products.title')} description={search ? 'Aucun produit correspond à votre recherche.' : t('products.empty')} action={!search ? addBtn : undefined} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i * 0.04} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <ProductForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </>
  );
}
