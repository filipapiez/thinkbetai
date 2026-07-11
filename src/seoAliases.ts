/**
 * Search aliases that should remain permanent redirects.
 *
 * High-volume exact-match terms now have their own blueprint-backed landing
 * pages, so this map intentionally stays empty unless a future slug truly needs
 * consolidation instead of an indexable page.
 */
export const SEO_ALIAS_REDIRECTS: Record<string, string> = {
  "nfl-ai-picks": "/ai-nfl-picks",
  "nba-ai-picks": "/nba-ai-predictions",
  "mlb-ai-picks": "/mlb-ai-predictions",
  "nhl-ai-picks": "/nhl-ai-predictions",
  "ufc-ai-picks": "/ufc-ai-predictions",
  "soccer-ai-picks": "/soccer-ai-predictions",
  "ai-parlay-picker": "/ai-parlay-builder",
  "player-prop-predictions": "/ai-player-prop-predictions",
  "nfl-player-prop-predictions": "/ai-player-prop-predictions",
  "nba-player-prop-predictions": "/ai-player-prop-predictions",
  "betting-model": "/how-it-works",
  "methodology": "/track-record",
  "odds-analysis": "/ai-odds-comparison",
  "bankroll-management": "/tools/bankroll-calculator",
  "betting-strategy": "/positive-ev-betting",
};

export const isSeoAlias = (slug: string) => Boolean(SEO_ALIAS_REDIRECTS[slug]);
