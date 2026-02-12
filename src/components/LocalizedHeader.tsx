import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Search, User, Menu, X, MessageCircle, Settings, Info, BookOpen, Layers, History } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Locale } from '@/lib/i18n';
import { getTranslations, getLocalePath } from '@/lib/i18n';

interface LocalizedHeaderProps {
  locale: Exclude<Locale, 'en'>;
}

export const LocalizedHeader = ({ locale }: LocalizedHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = getTranslations(locale).nav;
  const lp = (path: string) => getLocalePath(locale, path);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to={lp('')} className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
            ThinkBetAI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/games" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t.games}</Link>
          <Link to="/parlays" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Layers className="h-4 w-4" />{t.parlays}
          </Link>
          <Link to="/bet-history" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <History className="h-4 w-4" />{t.betHistory}
          </Link>
          <Link to="/chat" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />{t.askAI}
          </Link>
          <Link to={lp('/pricing')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t.pricing}</Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Info className="h-4 w-4" />{t.about}
          </Link>
          <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <BookOpen className="h-4 w-4" />{t.blog}
          </Link>
          <Link to="/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Settings className="h-4 w-4" />{t.settings}
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/games"><Search className="h-5 w-5" /></Link>
          </Button>
          <Button variant="glass" size="sm" asChild>
            <Link to="/account"><User className="h-4 w-4 mr-1" />{t.account}</Link>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl animate-fade-in">
          <nav className="container py-4 flex flex-col gap-3">
            {[
              { to: '/games', icon: Search, label: t.searchGames },
              { to: '/parlays', icon: Layers, label: t.parlays },
              { to: '/bet-history', icon: History, label: t.betHistory },
              { to: '/chat', icon: MessageCircle, label: t.askAI },
              { to: lp('/pricing'), icon: TrendingUp, label: t.pricing },
              { to: '/about', icon: Info, label: t.about },
              { to: '/blog', icon: BookOpen, label: t.blog },
              { to: '/settings', icon: Settings, label: t.settings },
              { to: '/account', icon: User, label: t.account },
            ].map(item => (
              <Link key={item.to + item.label} to={item.to} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
