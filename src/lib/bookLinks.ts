// =============================================================
// bookLinks.ts — sportsbook link resolution
// Priority: API-provided deep link (betslip/event) → book web
// fallback with your affiliate params. Drop into src/lib/.
// =============================================================

type BookConfig = {
  label: string;
  webUrl: string;               // fallback destination
  affiliateParams?: string;     // appended as query string, e.g. "wpsrc=yourtag"
};

// Fill affiliateParams as you sign each program — this is the
// monetization surface for every BET button on the site.
export const BOOKS: Record<string, BookConfig> = {
  draftkings:  { label: "DraftKings", webUrl: "https://sportsbook.draftkings.com" },
  fanduel:     { label: "FanDuel",    webUrl: "https://sportsbook.fanduel.com" },
  betmgm:      { label: "BetMGM",     webUrl: "https://sports.betmgm.com" },
  caesars:     { label: "Caesars",    webUrl: "https://sportsbook.caesars.com" },
  espnbet:     { label: "ESPN BET",   webUrl: "https://espnbet.com" },
  hardrockbet: { label: "Hard Rock",  webUrl: "https://app.hardrock.bet" },
  betrivers:   { label: "BetRivers",  webUrl: "https://betrivers.com" },
  bovada:      { label: "Bovada",     webUrl: "https://www.bovada.lv" },
  pinnacle:    { label: "Pinnacle",   webUrl: "https://www.pinnacle.com" },
  circasports: { label: "Circa",      webUrl: "https://www.circasports.com" },
};

export function bookLabel(bookKey: string): string {
  return BOOKS[bookKey]?.label ?? bookKey;
}

/**
 * Best available link for a price:
 * 1. apiLink (outcome-level betslip prefill or event page from The Odds API)
 * 2. book homepage + affiliate params
 * Affiliate params are appended to API links too when the domain matches
 * the book (keeps attribution on deep links).
 */
export function resolveBetLink(bookKey: string, apiLink?: string | null): string {
  const cfg = BOOKS[bookKey];
  const base = apiLink || cfg?.webUrl;
  if (!base) return "#";
  if (!cfg?.affiliateParams) return base;
  return base + (base.includes("?") ? "&" : "?") + cfg.affiliateParams;
}

/** True when the link is a real deep link, not a homepage fallback. */
export function isDeepLink(apiLink?: string | null): boolean {
  return Boolean(apiLink);
}
