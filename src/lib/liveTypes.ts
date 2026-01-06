// Live data types for real API data

export interface LiveTeamStats {
  wins: number;
  losses: number;
  winPct: number;
}

export interface LiveTeam {
  id: string;
  name: string;
  abbreviation: string;
  stats?: LiveTeamStats;
}

export interface LiveOdds {
  moneyline: {
    home: number;
    away: number;
  };
  spread: {
    home: number;
    homeOdds: number;
    away: number;
    awayOdds: number;
  };
  total: {
    over: number;
    overOdds: number;
    under: number;
    underOdds: number;
  };
}

export interface LiveGame {
  id: string;
  sport: string;
  sportKey: string;
  homeTeam: LiveTeam;
  awayTeam: LiveTeam;
  startTime: string;
  venue: string;
  status: 'scheduled' | 'live' | 'final';
  odds: LiveOdds;
  hasOdds: boolean;
}

export interface LiveBetQualification {
  signal: 'GOOD' | 'BORDERLINE' | 'PASS';
  confidenceScore: number;
  riskScore: number;
  volatility: 'Low' | 'Medium' | 'High';
  reason: string;
  pick?: 'home' | 'away';
  edge?: number;
}

// Calculate bet qualification for live games (simplified - no mock dependencies)
export function calculateLiveBetQualification(game: LiveGame): LiveBetQualification {
  const homeStats = game.homeTeam.stats;
  const awayStats = game.awayTeam.stats;
  
  let confidenceScore = 50;
  let riskScore = 30;
  const reasons: string[] = [];
  
  // 1. Win percentage edge (major factor)
  if (homeStats && awayStats) {
    const winPctDiff = homeStats.winPct - awayStats.winPct;
    
    if (Math.abs(winPctDiff) >= 0.20) {
      confidenceScore += 20;
      reasons.push(`${winPctDiff > 0 ? 'Home' : 'Away'} team has strong win rate edge`);
    } else if (Math.abs(winPctDiff) >= 0.10) {
      confidenceScore += 12;
      reasons.push('Moderate win rate advantage');
    } else if (Math.abs(winPctDiff) >= 0.05) {
      confidenceScore += 5;
    } else {
      reasons.push('Evenly matched teams');
      riskScore += 10;
    }
  } else {
    riskScore += 15;
    reasons.push('Limited team stats');
  }
  
  // 2. Home advantage
  confidenceScore += 5;
  
  // 3. Odds-based edge detection
  if (game.hasOdds && game.odds.moneyline.home !== 0 && game.odds.moneyline.away !== 0) {
    const homeML = game.odds.moneyline.home;
    const awayML = game.odds.moneyline.away;
    
    // Convert to implied probability
    const homeImplied = homeML > 0 
      ? 100 / (homeML + 100) 
      : Math.abs(homeML) / (Math.abs(homeML) + 100);
    const awayImplied = awayML > 0 
      ? 100 / (awayML + 100) 
      : Math.abs(awayML) / (Math.abs(awayML) + 100);
    
    // If we have stats, compare to implied odds for value
    if (homeStats && awayStats) {
      const homeModelProb = homeStats.winPct;
      const awayModelProb = awayStats.winPct;
      
      const homeEdge = homeModelProb - homeImplied;
      const awayEdge = awayModelProb - awayImplied;
      
      if (homeEdge > 0.08 || awayEdge > 0.08) {
        confidenceScore += 15;
        reasons.push('Value edge detected vs odds');
      } else if (homeEdge > 0.03 || awayEdge > 0.03) {
        confidenceScore += 8;
      }
    }
    
    // Very lopsided odds = less value
    if (Math.abs(homeML) > 300 || Math.abs(awayML) > 300) {
      confidenceScore -= 5;
      riskScore += 5;
    }
  } else {
    riskScore += 10;
  }
  
  // 4. Sport-based variance
  const highVarianceSports = ['tennis', 'mma', 'boxing', 'table-tennis'];
  if (highVarianceSports.includes(game.sport.toLowerCase())) {
    riskScore += 12;
  }
  
  // Clamp values
  confidenceScore = Math.min(100, Math.max(0, confidenceScore));
  riskScore = Math.min(100, Math.max(0, riskScore));
  
  // Determine signal
  let signal: 'GOOD' | 'BORDERLINE' | 'PASS';
  let reason: string;
  
  if (confidenceScore >= 72 && riskScore <= 40) {
    signal = 'GOOD';
    reason = reasons[0] || `High confidence (${confidenceScore}%)`;
  } else if (riskScore > 55) {
    signal = 'PASS';
    reason = `Risk too high (${riskScore}%)`;
  } else if (confidenceScore < 55) {
    signal = 'PASS';
    reason = reasons[0] || `Low confidence (${confidenceScore}%)`;
  } else {
    signal = 'BORDERLINE';
    reason = reasons[0] || `Moderate confidence (${confidenceScore}%)`;
  }
  
  // Determine pick
  const pick: 'home' | 'away' = 
    (homeStats?.winPct || 0) >= (awayStats?.winPct || 0) ? 'home' : 'away';
  
  const volatility: 'Low' | 'Medium' | 'High' = 
    riskScore <= 30 ? 'Low' : riskScore <= 55 ? 'Medium' : 'High';
  
  return {
    signal,
    confidenceScore: Math.round(confidenceScore),
    riskScore: Math.round(riskScore),
    volatility,
    reason,
    pick,
  };
}
