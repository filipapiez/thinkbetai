/**
 * Season Guard — blocks AI analysis for sports that are currently in their offseason.
 * Also provides the stronger data-freshness system prompt block used by all AI functions.
 */

interface SeasonWindow {
  /** Month the regular season typically starts (1-12) */
  start: number;
  /** Month the season typically ends (including playoffs, 1-12) */
  end: number;
}

const SEASON_WINDOWS: Record<string, SeasonWindow> = {
  NFL:   { start: 9, end: 2 },   // Sep – Feb (Super Bowl)
  NCAAF: { start: 8, end: 1 },   // Aug – Jan (bowls)
  NBA:   { start: 10, end: 6 },   // Oct – Jun (Finals)
  NCAAB: { start: 11, end: 4 },   // Nov – Apr (March Madness)
  NHL:   { start: 10, end: 6 },   // Oct – Jun (Stanley Cup)
  MLB:   { start: 3, end: 11 },   // Mar – Nov (World Series)
};

function monthInRange(month: number, start: number, end: number): boolean {
  if (start <= end) {
    return month >= start && month <= end;
  }
  // Wraps around year boundary (e.g. Sep-Feb)
  return month >= start || month <= end;
}

export interface SeasonCheckResult {
  allowed: boolean;
  sport: string;
  message?: string;
}

/**
 * Returns whether analysis is allowed for the given sport right now.
 * Sports not in SEASON_WINDOWS are always allowed (tennis, soccer, UFC, etc.).
 */
export function checkSportSeason(sport: string): SeasonCheckResult {
  const key = sport?.toUpperCase().trim();
  const window = SEASON_WINDOWS[key];

  if (!window) {
    // Sport not tracked (UFC, Tennis, Soccer, etc.) — always allow
    return { allowed: true, sport: key || 'UNKNOWN' };
  }

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  if (monthInRange(month, window.start, window.end)) {
    return { allowed: true, sport: key };
  }

  return {
    allowed: false,
    sport: key,
    message: `${key} is currently in its offseason. The regular season runs from ${monthName(window.start)} to ${monthName(window.end)}. No games are available for analysis right now.`,
  };
}

function monthName(m: number): string {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
}

/**
 * The universal data-freshness preamble to inject into every AI system prompt.
 */
export function dataFreshnessPrompt(currentDate: string): string {
  return `CRITICAL DATA FRESHNESS RULES (HIGHEST PRIORITY — VIOLATING THESE IS A CRITICAL FAILURE):
- Today's date is ${currentDate}.
- Your training data is SEVERELY OUTDATED for player rosters, trades, free-agent signings, and injuries. Players change teams constantly — mid-season trades, free agency, waivers.
- NEVER assume ANY player is on the same team as your training data suggests. Training data may be 6-18 months old.
- ONLY use the player/roster/injury data that is EXPLICITLY PROVIDED in this prompt. If a player is listed under a specific team in the provided data, trust THAT over your training data.
- If NO roster or injury data is provided for a player, DO NOT mention that player by name. Use generic terms like "the team's starting pitcher" or "their top scorer" instead.
- If you are uncertain which team a player plays for, SAY SO: "I cannot confirm [player]'s current team — verify on ESPN or the official roster."
- NEVER confidently state a player's team affiliation from memory. This is the #1 source of errors.
- NEVER suggest a bet involving a specific player whose team or availability you cannot confirm from the live data provided.
- When discussing trades or roster moves, ONLY reference moves that are mentioned in the provided context. DO NOT speculate about trades from your training data.`;
}
