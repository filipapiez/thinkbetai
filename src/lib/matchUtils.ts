/**
 * Match identification and deduplication utilities
 * 
 * STRICT RULES:
 * 1. match_id = normalized(homeTeam + awayTeam + kickoff_utc + competition_id)
 * 2. NEVER join on team names alone
 * 3. Keep most recent odds timestamp per match
 * 4. Store times in UTC, convert to local only at display
 */

/**
 * Normalize team name for consistent matching
 * Removes city prefixes, normalizes spacing, handles common abbreviations
 */
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')        // Normalize spaces
    .replace(/^(the|los|la|las|el)\s+/i, '') // Remove common prefixes
    .trim();
}

/**
 * Generate a stable match_id from match components
 * This is the ONLY way to uniquely identify a match
 */
export function generateMatchId(
  homeTeam: string,
  awayTeam: string,
  kickoffUtc: string,
  competitionId: string
): string {
  const normalizedHome = normalizeTeamName(homeTeam);
  const normalizedAway = normalizeTeamName(awayTeam);
  
  // Extract date portion (YYYY-MM-DD) from kickoff for grouping
  let dateKey: string;
  try {
    const date = new Date(kickoffUtc);
    dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
  } catch {
    dateKey = 'unknown';
  }
  
  // Create a deterministic hash-like string
  const components = [
    normalizedHome,
    normalizedAway,
    dateKey,
    competitionId.toLowerCase().replace(/[^a-z0-9]/g, ''),
  ].join('_');
  
  // Simple hash for shorter ID
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `match_${Math.abs(hash).toString(36)}_${dateKey.replace(/-/g, '')}`;
}

/**
 * Check if two matches are the same based on teams, time, and competition
 */
export function isSameMatch(
  match1: { homeTeam: string; awayTeam: string; startTime: string; league: string },
  match2: { homeTeam: string; awayTeam: string; startTime: string; league: string }
): boolean {
  const home1 = normalizeTeamName(match1.homeTeam);
  const away1 = normalizeTeamName(match1.awayTeam);
  const home2 = normalizeTeamName(match2.homeTeam);
  const away2 = normalizeTeamName(match2.awayTeam);
  
  // Teams must match (either order for home/away swap detection)
  const teamsMatch = 
    (home1 === home2 && away1 === away2) ||
    (home1 === away2 && away1 === home2);
  
  if (!teamsMatch) return false;
  
  // Same league/competition
  const league1 = match1.league.toLowerCase().replace(/[^a-z0-9]/g, '');
  const league2 = match2.league.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (league1 !== league2) return false;
  
  // Same day (within 24 hours to handle timezone edge cases)
  try {
    const time1 = new Date(match1.startTime).getTime();
    const time2 = new Date(match2.startTime).getTime();
    const hoursDiff = Math.abs(time1 - time2) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  } catch {
    return false;
  }
}

/**
 * Validate a match record
 * Returns false if the record should be rejected
 */
export function isValidMatch(match: {
  id?: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
}): boolean {
  // Reject if home == away
  if (normalizeTeamName(match.homeTeam) === normalizeTeamName(match.awayTeam)) {
    return false;
  }
  
  // Reject if missing or empty team names
  if (!match.homeTeam?.trim() || !match.awayTeam?.trim()) {
    return false;
  }
  
  // Reject if start time is invalid
  try {
    const date = new Date(match.startTime);
    if (isNaN(date.getTime())) return false;
  } catch {
    return false;
  }
  
  return true;
}

/**
 * Check if kickoff time is in the past
 */
export function isKickoffInPast(kickoffUtc: string): boolean {
  try {
    const kickoff = new Date(kickoffUtc);
    return kickoff.getTime() < Date.now();
  } catch {
    return true; // Treat invalid dates as past
  }
}

/**
 * Convert UTC time to local display time
 * This should be the ONLY place time conversion happens for display
 */
export function formatKickoffLocal(kickoffUtc: string): {
  date: string;
  time: string;
  dayOfWeek: string;
} {
  try {
    const date = new Date(kickoffUtc);
    
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  } catch {
    return { date: 'TBD', time: 'TBD', dayOfWeek: '' };
  }
}

export interface MatchOdds {
  moneyline?: { home: number; away: number; draw?: number };
  spread?: { home: number; homeOdds: number; away: number; awayOdds: number };
  total?: { over: number; overOdds: number; under: number; underOdds: number };
  timestamp: number;
}

export interface MatchPick {
  market: 'moneyline' | 'spread' | 'total';
  pick: string;
  confidence: number;
  edge: number;
  generatedAt: number;
}

/**
 * Merge odds from multiple sources, keeping most recent
 */
export function mergeOdds(existing: MatchOdds | undefined, incoming: MatchOdds): MatchOdds {
  if (!existing) return incoming;
  
  // Keep the most recent timestamp's data
  if (incoming.timestamp > existing.timestamp) {
    return {
      ...existing,
      ...incoming,
      // Prefer non-null values from newer data
      moneyline: incoming.moneyline || existing.moneyline,
      spread: incoming.spread || existing.spread,
      total: incoming.total || existing.total,
      timestamp: incoming.timestamp,
    };
  }
  
  return existing;
}

/**
 * Get most recent pick for a match and market
 * If multiple picks exist for same match_id and market, keep most recent
 */
export function getMostRecentPick(picks: MatchPick[], market: string): MatchPick | undefined {
  const marketPicks = picks.filter(p => p.market === market);
  if (marketPicks.length === 0) return undefined;
  
  return marketPicks.reduce((latest, current) => 
    current.generatedAt > latest.generatedAt ? current : latest
  );
}
