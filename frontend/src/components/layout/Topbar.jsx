import React from 'react';
import { Moon, Sun, Globe, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';

export default function Topbar() {
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useI18n();
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : 'U';

  return (
    <header className="h-14 sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-6 justify-between">
      {/* Mobile logo */}
      <div className="flex md:hidden items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">C</span>
        </div>
        <span className="font-display text-base font-semibold">CosmoAI</span>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-1">
        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2.5 text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">{lang}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setLang('en')} className="gap-2">
              <span>🇬🇧</span> English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLang('fr')} className="gap-2">
              <span>🇫🇷</span> Français
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLang('ar')} className="gap-2">
              <span>🇸🇦</span> العربية
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggle}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <div className="w-px h-5 bg-border mx-1.5" />

        {/* User menu avec déconnexion */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-7 w-7 cursor-pointer">
              <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="truncate">{user?.username || user?.email || 'Utilisateur'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}