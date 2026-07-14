import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Search, User, Menu, X, MessageCircle, Layers, History, HelpCircle, Sparkles, ArrowUpDown, ChevronDown, Info, BookOpen, Calculator, ShieldCheck, Trophy } from 'lucide-react';
import { useState, useRef } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors flex items-center gap-1",
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
  );

const mobileLinkClass = (isActive: boolean) =>
  cn(
    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
    isActive ? "text-primary bg-primary/10" : "hover:bg-secondary"
  );

const resourceGroups = [
  {
    label: 'Guides & Demos',
    links: [
      { to: '/ai-bet-analyzer', label: 'Bet Analyzer Demo', icon: Calculator },
      { to: '/ai-parlay-builder', label: 'Parlay Builder Guide', icon: Sparkles },
      { to: '/free-ai-predictions', label: 'Free Predictions Guide', icon: TrendingUp },
      { to: '/ai-sports-betting', label: 'AI Betting Guide', icon: Trophy },
      { to: '/ai-player-prop-predictions', label: 'Player Props Guide', icon: Layers },
    ],
  },
  {
    label: 'Sports Guides',
    links: [
      { to: '/nfl-ai-predictions', label: 'NFL AI Predictions', icon: Trophy },
      { to: '/nba-ai-predictions', label: 'NBA AI Predictions', icon: Trophy },
      { to: '/mlb-ai-predictions', label: 'MLB AI Predictions', icon: Trophy },
      { to: '/nhl-ai-predictions', label: 'NHL AI Predictions', icon: Trophy },
      { to: '/ufc-ai-predictions', label: 'UFC AI Predictions', icon: Trophy },
      { to: '/soccer-ai-predictions', label: 'Soccer AI Predictions', icon: Trophy },
    ],
  },
  {
    label: 'Trust & Company',
    links: [
      { to: '/proof', label: 'Live Proof', icon: ShieldCheck },
      { to: '/track-record', label: 'Track Record', icon: ShieldCheck },
      { to: '/best-ai-sports-betting-tools', label: 'Best Tools', icon: Trophy },
      { to: '/how-it-works', label: 'How It Works', icon: HelpCircle },
      { to: '/faq', label: 'FAQ', icon: HelpCircle },
      { to: '/responsible-gambling', label: 'Responsible Gambling', icon: ShieldCheck },
      { to: '/editorial-policy', label: 'Editorial Policy', icon: BookOpen },
      { to: '/blog', label: 'Blog', icon: BookOpen },
      { to: '/about', label: 'About', icon: Info },
    ],
  },
];

const resourceLinks = resourceGroups.flatMap((group) => group.links);

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const location = useLocation();

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setResourcesOpen(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setResourcesOpen(false), 150);
  };

  const isResourceActive = resourceLinks.some((r) => location.pathname.startsWith(r.to));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background md:bg-background/80 md:backdrop-blur-xl">
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
        <nav className="hidden lg:flex items-center gap-6">
          <NavLink to="/games" className={navLinkClass}>Games</NavLink>
          <NavLink to="/player-props" className={navLinkClass}>
            <Layers className="h-4 w-4" /> Props
          </NavLink>
          <NavLink to="/game-totals" className={navLinkClass}>
            <ArrowUpDown className="h-4 w-4" /> Over/Under
          </NavLink>
          <NavLink to="/parlays" className={navLinkClass}>
            <Sparkles className="h-4 w-4" /> AI Parlays
          </NavLink>
          <NavLink to="/bet-history" className={navLinkClass}>
            <History className="h-4 w-4" /> Bet History
          </NavLink>
          <NavLink to="/chat" className={navLinkClass}>
            <MessageCircle className="h-4 w-4" /> Ask AI
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass}>Pricing</NavLink>

          {/* Resources Dropdown */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className={cn(
                "text-sm font-medium transition-colors flex items-center gap-1",
                isResourceActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setResourcesOpen((v) => !v)}
            >
              Resources
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", resourcesOpen && "rotate-180")} />
            </button>

            <div
              className={cn(
                "absolute top-full right-0 mt-2 w-[min(42rem,calc(100vw-2rem))] rounded-lg border border-border/60 bg-popover/95 backdrop-blur-xl shadow-lg shadow-black/20 p-3 transition-all duration-200 origin-top-right",
                resourcesOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              )}
            >
              <div className="grid gap-3 md:grid-cols-3">
                {resourceGroups.map((group) => (
                  <div key={group.label} className="min-w-0">
                    <p className="px-2 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.links.map(({ to, label, icon: Icon }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={() => setResourcesOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                              isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                            )
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
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
          className="lg:hidden"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl animate-fade-in">
          <nav className="container py-4 flex flex-col gap-3">
            {[
              { to: '/games', label: 'Search Games', icon: Search },
              { to: '/player-props', label: 'Player Props', icon: Layers },
              { to: '/game-totals', label: 'Over/Under', icon: ArrowUpDown },
              { to: '/parlays', label: 'AI Parlays', icon: Sparkles },
              { to: '/bet-history', label: 'Bet History', icon: History },
              { to: '/chat', label: 'Ask AI', icon: MessageCircle },
              { to: '/pricing', label: 'Pricing', icon: TrendingUp },
            ].map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => mobileLinkClass(isActive)} onClick={() => setMobileMenuOpen(false)}>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}

            {/* Mobile Resources Accordion */}
            <button
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg transition-colors w-full text-left",
                isResourceActive ? "text-primary bg-primary/10" : "hover:bg-secondary"
              )}
              onClick={() => setMobileResourcesOpen((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Resources
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", mobileResourcesOpen && "rotate-180")} />
            </button>
            {mobileResourcesOpen && (
              <div className="flex flex-col gap-4 pl-3">
                {resourceGroups.map((group) => (
                  <div key={group.label} className="flex flex-col gap-1">
                    <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {group.label}
                    </p>
                    {group.links.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                            isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"
                          )
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4" /> {label}
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <NavLink to="/account" className={({ isActive }) => mobileLinkClass(isActive)} onClick={() => setMobileMenuOpen(false)}>
              <User className="h-4 w-4" /> Account
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
};
