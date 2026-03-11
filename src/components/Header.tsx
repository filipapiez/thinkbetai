import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Search, User, Menu, X, MessageCircle, Settings, Layers, History, HelpCircle, Sparkles, ArrowUpDown, ChevronDown, Info, BookOpen } from 'lucide-react';
import { useState, useRef } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

const resourceLinks = [
  { to: '/about', label: 'About', icon: Info },
  { to: '/how-it-works', label: 'How It Works', icon: HelpCircle },
  { to: '/blog', label: 'Blog', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setResourcesOpen(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setResourcesOpen(false), 150);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
            ThinkBetAI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/games" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Games
          </Link>
          <Link to="/player-props" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Layers className="h-4 w-4" />
            Props
          </Link>
          <Link to="/game-totals" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4" />
            Over/Under
          </Link>
          <Link to="/parlays" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            AI Parlays
          </Link>
          <Link to="/bet-history" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <History className="h-4 w-4" />
            Bet History
          </Link>
          <Link to="/chat" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            Ask AI
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>

          {/* Resources Dropdown */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => setResourcesOpen((v) => !v)}
            >
              Resources
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", resourcesOpen && "rotate-180")} />
            </button>

            <div
              className={cn(
                "absolute top-full right-0 mt-2 w-44 rounded-lg border border-border/60 bg-popover/95 backdrop-blur-xl shadow-lg shadow-black/20 py-1.5 transition-all duration-200 origin-top-right",
                resourcesOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              )}
            >
              {resourceLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setResourcesOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <Link to="/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/games">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="glass" size="sm" asChild>
            <Link to="/account">
              <User className="h-4 w-4 mr-1" />
              Account
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl animate-fade-in">
          <nav className="container py-4 flex flex-col gap-3">
            <Link to="/games" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <Search className="h-4 w-4" /> Search Games
            </Link>
            <Link to="/player-props" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <Layers className="h-4 w-4" /> Player Props
            </Link>
            <Link to="/game-totals" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <ArrowUpDown className="h-4 w-4" /> Over/Under
            </Link>
            <Link to="/parlays" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <Sparkles className="h-4 w-4" /> AI Parlays
            </Link>
            <Link to="/bet-history" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <History className="h-4 w-4" /> Bet History
            </Link>
            <Link to="/chat" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <MessageCircle className="h-4 w-4" /> Ask AI
            </Link>
            <Link to="/pricing" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <TrendingUp className="h-4 w-4" /> Pricing
            </Link>

            {/* Mobile Resources Accordion */}
            <button
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary transition-colors w-full text-left"
              onClick={() => setMobileResourcesOpen((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Resources
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", mobileResourcesOpen && "rotate-180")} />
            </button>
            {mobileResourcesOpen && (
              <div className="flex flex-col gap-1 pl-6">
                {resourceLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                ))}
              </div>
            )}

            <Link to="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <Link to="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <User className="h-4 w-4" /> Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
