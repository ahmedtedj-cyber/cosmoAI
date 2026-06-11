import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Sparkles, GitCompare, History, Bell } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const Logo = () => (
  <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
      <Sparkles className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
    </div>
    <div>
      <p className="font-display text-[17px] font-semibold leading-none tracking-tight text-foreground">CosmoAI</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase font-medium">Intelligence</p>
    </div>
  </div>
);

export default function Sidebar() {
  const { t } = useI18n();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard'), end: true },
    { to: '/products', icon: Package, label: t('nav.products') },
    { to: '/analysis', icon: Sparkles, label: t('nav.analysis') },
    { to: '/comparison', icon: GitCompare, label: t('nav.comparison') },
    { to: '/history', icon: History, label: t('nav.history') },
    { to: '/alerts', icon: Bell, label: 'Alertes' },
  ];

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-card border-r border-border h-screen sticky top-0">
      <Logo />
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground font-display italic leading-relaxed">
          "{t('app.tagline')}"
        </p>
      </div>
    </aside>
  );
}