import { Link } from 'react-router-dom';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { Locale, getTranslations, getLocalePath } from '@/lib/i18n';

interface LocalizedFooterProps {
  locale: Exclude<Locale, 'en'>;
}

export const LocalizedFooter = ({ locale }: LocalizedFooterProps) => {
  const t = getTranslations(locale).footer;
  const lp = (path: string) => getLocalePath(locale, path);

  return (
    <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to={lp('')} className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">ThinkBetAI</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">{t.description}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">{t.platform}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/ai-sports-picks" className="hover:text-foreground transition-colors">{t.aiSportsPicks}</Link></li>
              <li><Link to="/games" className="hover:text-foreground transition-colors">{t.searchGames}</Link></li>
              <li><Link to={lp('/ai-parlay-builder')} className="hover:text-foreground transition-colors">{t.aiParlayBuilder}</Link></li>
              <li><Link to={lp('/ai-nfl-picks')} className="hover:text-foreground transition-colors">{t.aiNFLPicks}</Link></li>
              <li><Link to={lp('/free-ai-predictions')} className="hover:text-foreground transition-colors">{t.freeAIPredictions}</Link></li>
              <li><Link to={lp('/pricing')} className="hover:text-foreground transition-colors">{t.pricing}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">{t.learn}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to={lp('/best-ai-betting-app')} className="hover:text-foreground transition-colors">{t.bestAIBettingApp}</Link></li>
              <li><Link to="/blog" className="hover:text-foreground transition-colors">{t.blog}</Link></li>
              <li><Link to={lp('/faq')} className="hover:text-foreground transition-colors">{t.faq}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">{t.resources}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                  {t.gamblingHelp} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="https://www.gamblersanonymous.org/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                  {t.gaResources} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">{t.contact}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:support@thinkbetai.com" className="hover:text-foreground transition-colors">support@thinkbetai.com</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
            <p className="text-xs text-warning/90 leading-relaxed">
              {t.disclaimer}{' '}
              <a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer" className="underline">ncpgambling.org</a>
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>{t.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
            <p>{t.ageRestriction}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
