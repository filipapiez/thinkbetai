import { Link } from 'react-router-dom';
import { TrendingUp, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">ThinkBetAI</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Educational sports analytics platform. Understand odds, injuries, and matchup context.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/ai-sports-picks" className="hover:text-foreground transition-colors">AI Sports Picks</Link></li>
              <li><Link to="/games" className="hover:text-foreground transition-colors">Search Games</Link></li>
              <li><Link to="/ai-parlay-builder" className="hover:text-foreground transition-colors">AI Parlay Builder</Link></li>
              <li><Link to="/ai-nfl-picks" className="hover:text-foreground transition-colors">AI NFL Picks</Link></li>
              <li><Link to="/free-ai-predictions" className="hover:text-foreground transition-colors">Free AI Predictions</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/predictions" className="hover:text-foreground transition-colors">All Game Predictions</Link></li>
              <li><Link to="/teams" className="hover:text-foreground transition-colors">All Team Pages</Link></li>
              <li><Link to="/best" className="hover:text-foreground transition-colors">Best Picks by Sport</Link></li>
              <li><Link to="/best-ai-betting-app" className="hover:text-foreground transition-colors">Best AI Betting App 2026</Link></li>
              <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a 
                  href="https://www.ncpgambling.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Gambling Help <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.gamblersanonymous.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  GA Resources <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a 
                  href="mailto:support@thinkbetai.com"
                  className="hover:text-foreground transition-colors"
                >
                  support@thinkbetai.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-border/40">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
            <p className="text-xs text-warning/90 leading-relaxed">
              If you or someone you know has a gambling problem, please seek help at{' '}
              <a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer" className="underline">
                ncpgambling.org
              </a>{' '}
              or call 1-800-522-4700.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} ThinkBetAI. All rights reserved.</p>
            <p>21+ only where applicable. Know when to stop.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
