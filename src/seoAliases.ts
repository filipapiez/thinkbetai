/**
 * Search aliases consolidated into the strongest existing URL for each intent.
 *
 * Search Console already shows the canonical pages earning impressions. Keeping
 * several near-identical exact-match pages would split links, engagement and
 * crawl signals across competing URLs.
 */
export const SEO_ALIAS_REDIRECTS: Record<string, string> = {
  "ai-bet": "/ai-sports-betting",
  "ai-bets": "/ai-sports-betting",
  "ai-betting": "/ai-sports-betting",
  "bet-ai": "/ai-sports-betting",
  "betting-ai": "/ai-sports-betting",

  "ai-picks": "/ai-sports-picks",
  "ai-pick-of-the-day": "/ai-sports-picks",
  "ai-sports-picks-today": "/ai-sports-picks",
  "best-ai-betting-picks": "/ai-sports-picks",

  "ai-bets-prediction": "/free-ai-predictions",
  "ai-sports-predictor": "/free-ai-predictions",

  "parlay-maker-ai": "/ai-parlay-builder",

  "free-ai-sports-betting-app": "/best-ai-betting-app",
  "thinkbetai-reviews": "/track-record",
};

export const isSeoAlias = (slug: string) => Boolean(SEO_ALIAS_REDIRECTS[slug]);
