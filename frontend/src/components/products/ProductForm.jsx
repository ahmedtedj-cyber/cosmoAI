import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const blank = { name: '', brand: '', category: '', description: '' };

export default function ProductForm({ open, onClose, onSubmit, initial }) {
  const { t } = useI18n();
  const [form, setForm] = useState(blank);

  useEffect(() => {
    setForm(initial ? { name: initial.name || '', brand: initial.brand || '', category: initial.category || '', description: initial.description || '' } : blank);
  }, [open, initial]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim()) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? t('products.edit') : t('products.new')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>{t('products.name')} *</Label>
            <Input value={form.name} onChange={set('name')} placeholder="Hydra Glow Serum" required />
          </div>
          <div className="space-y-1.5">
            <Label>{t('products.brand')} *</Label>
            <Input value={form.brand} onChange={set('brand')} placeholder="Lumière" required />
          </div>
          <div className="space-y-1.5">
            <Label>{t('products.category')} <span className="text-muted-foreground text-xs">({t('products.optional')})</span></Label>
            <Input value={form.category} onChange={set('category')} placeholder="Skincare" />
          </div>
          <div className="space-y-1.5">
            <Label>{t('products.description')} <span className="text-muted-foreground text-xs">({t('products.optional')})</span></Label>
            <Textarea value={form.description} onChange={set('description')} rows={3} className="resize-none" />
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('products.cancel')}</Button>
            <Button type="submit">{t('products.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}