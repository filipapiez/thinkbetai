import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Search, User, Menu, X, MessageCircle, Settings, Info, BookOpen } from 'lucide-react';
import { useState } from 'react';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link to="/chat" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            Ask AI
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Info className="h-4 w-4" />
            About
          </Link>
          <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Blog
          </Link>
          <Link to="/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
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
            <Link 
              to="/games" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Search className="h-4 w-4" />
              Search Games
            </Link>
            <Link 
              to="/chat" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageCircle className="h-4 w-4" />
              Ask AI
            </Link>
            <Link 
              to="/pricing" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TrendingUp className="h-4 w-4" />
              Pricing
            </Link>
            <Link 
              to="/about" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Info className="h-4 w-4" />
              About Us
            </Link>
            <Link 
              to="/blog" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen className="h-4 w-4" />
              Blog
            </Link>
            <Link 
              to="/settings" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <Link 
              to="/account" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="h-4 w-4" />
              Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
