const LOCALIZED_BLUEPRINT_PATTERN = /^\/([^/]+)\/ai-betting\/([^/]+)$/;

// Search Console performance export, 2026-08-12 (last three months).
// These legacy multilingual pages earned at least one organic click, so keep
// them indexable until a later migration can evaluate each URL individually.
export const PERFORMING_LOCALIZED_BLUEPRINT_PATHS = new Set([
  "/af/ai-betting/ai-bet-analyzer",
  "/de/ai-betting/ai-sports-picks",
  "/fr/ai-betting/ai-betting-tools",
  "/fr/ai-betting/free-ai-predictions",
  "/hr/ai-betting/free-ai-predictions",
  "/id/ai-betting/ai-bet-analyzer",
  "/id/ai-betting/ai-parlay-builder",
  "/id/ai-betting/ai-sports-picks",
  "/id/ai-betting/soccer-ai-predictions",
  "/is/ai-betting/soccer-ai-predictions",
  "/it/ai-betting/soccer-ai-predictions",
  "/it/ai-betting/tennis-ai-predictions",
  "/ja/ai-betting/ai-parlay-builder",
  "/ko/ai-betting/ai-betting-app",
  "/nl/ai-betting/ai-parlay-builder",
  "/pt-br/ai-betting/soccer-ai-predictions",
  "/sv/ai-betting/sports-betting-model",
  "/sw/ai-betting/ai-bet-analyzer",
  "/sw/ai-betting/free-ai-predictions",
]);

export const isLocalizedBlueprintPath = (path: string) => LOCALIZED_BLUEPRINT_PATTERN.test(path);

export const shouldRetireLocalizedBlueprint = (path: string) =>
  isLocalizedBlueprintPath(path) && !PERFORMING_LOCALIZED_BLUEPRINT_PATHS.has(path);

export const parseLocalizedBlueprintPath = (path: string) => {
  const match = path.match(LOCALIZED_BLUEPRINT_PATTERN);
  return match ? { language: match[1], topic: match[2] } : null;
};

// Map the older blueprint vocabulary to the maintained English/localized
// landing-page topics. Topics without a close product page consolidate into
// the most relevant guide or proof page.
export const LOCALIZED_BLUEPRINT_TOPIC_TARGETS: Record<string, string> = {
  "ai-betting-app": "best-ai-betting-app",
  "ai-sports-picks": "ai-sports-picks",
  "ai-parlay-builder": "ai-parlay-builder",
  "ai-bet-analyzer": "ai-bet-analyzer",
  "free-ai-predictions": "free-ai-predictions",
  "sports-betting-model": "ai-betting-predictions",
  "closing-line-value-tracker": "track-record",
  "odds-comparison-tool": "ai-odds-comparison",
  "player-prop-ai": "ai-player-prop-predictions",
  "nfl-ai-picks": "ai-nfl-picks",
  "nba-ai-predictions": "nba-ai-predictions",
  "soccer-ai-predictions": "soccer-ai-predictions",
  "tennis-ai-predictions": "tennis-ai-predictions",
  "betting-analytics-software": "best-ai-sports-betting-tools",
  "sports-betting-education": "what-is-ai-sports-betting",
  "probability-calculator": "ai-bet-analyzer",
  "bankroll-risk-guide": "responsible-gambling",
  "public-pick-ledger": "track-record",
  "ai-betting-tools": "best-ai-sports-betting-tools",
};

export const getEnglishLocalizedBlueprintTarget = (path: string) => {
  const parsed = parseLocalizedBlueprintPath(path);
  const target = parsed ? LOCALIZED_BLUEPRINT_TOPIC_TARGETS[parsed.topic] : undefined;
  return target ? `/${target}` : "/ai-sports-betting";
};
