import React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import HealthBar from '@/components/shared/HealthBar';
import SentimentBadge from '@/components/shared/SentimentBadge';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function ProductCard({ product: p, onEdit, onDelete, delay = 0 }) {
  const { t } = useI18n();
  const score = p.sentiment_score || 0;
  const sentiment = score >= 70 ? 'positive' : score >= 40 ? 'neutral' : score > 0 ? 'negative' : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="group relative bg-card border border-border rounded-2xl p-5 card-shadow hover:card-shadow-md hover:border-primary/20 transition-all"
    >
      {/* Menu */}
      <div className="absolute top-3.5 right-3.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={e => e.preventDefault()}
              className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(p)}><Pencil className="w-3.5 h-3.5 mr-2" />{t('products.edit')}</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(p)}>
              <Trash2 className="w-3.5 h-3.5 mr-2" />{t('products.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link to={`/products/${p.id}`}>
        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mb-4">
          <span className="font-display text-lg font-semibold text-accent-foreground">{p.name?.[0]?.toUpperCase() || 'P'}</span>
        </div>

        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-base font-semibold text-foreground truncate leading-snug">{p.name}</h3>
          {sentiment && <SentimentBadge sentiment={sentiment} />}
        </div>
        <p className="text-xs text-muted-foreground truncate mb-4">{p.brand}{p.category ? ` · ${p.category}` : ''}</p>

        <HealthBar score={p.health_score || 0} size="sm" />

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          <span>{p.total_reviews || 0} {t('products.total_reviews')}</span>
          <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
            {t('products.back').includes('←') ? '' : ''}
            {p.updated_date ? format(new Date(p.updated_date), 'MMM d') : '—'}
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}