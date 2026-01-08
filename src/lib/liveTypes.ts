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
  odds?: LiveOdds; // Made optional for scraped games without odds
  hasOdds: boolean;
  popularityScore?: number; // Optional popularity for fallback signal calculation
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

// Calculate bet qualification for live games based on odds value
export function calculateLiveBetQualification(game: LiveGame): LiveBetQualification {
  // If no odds data, use popularity-based fallback (same logic as PopularGameCard)
  if (!game.odds || !game.hasOdds) {
    const popularity = game.popularityScore || 50;
    if (popularity >= 85) {
      return {
        signal: 'GOOD',
        confidenceScore: 65,
        riskScore: 40,
        volatility: 'Medium',
        reason: 'High popularity matchup',
        pick: 'home',
      };
    } else if (popularity >= 70) {
      return {
        signal: 'BORDERLINE',
        confidenceScore: 55,
        riskScore: 50,
        volatility: 'Medium',
        reason: 'Moderate interest matchup',
        pick: 'home',
      };
    }
    return {
      signal: 'PASS',
      confidenceScore: 40,
      riskScore: 60,
      volatility: 'High',
      reason: 'Low popularity, no odds available',
      pick: 'home',
    };
  }

  let confidenceScore = 50;
  let riskScore = 30;
  const reasons: string[] = [];
  
  const homeML = game.odds.moneyline?.home ?? 0;
  const awayML = game.odds.moneyline?.away ?? 0;
  const spread = game.odds.spread?.home ?? 0;
  const total = game.odds.total?.over ?? 0;
  
  // Check if we have meaningful odds data
  const hasMoneyline = homeML !== 0 && awayML !== 0;
  const hasSpread = spread !== 0;
  const hasTotal = total !== 0;
  
  if (!hasMoneyline && !hasSpread && !hasTotal) {
    // Fallback to popularity when odds are incomplete
    const popularity = game.popularityScore || 50;
    if (popularity >= 80) {
      return {
        signal: 'BORDERLINE',
        confidenceScore: 50,
        riskScore: 50,
        volatility: 'Medium',
        reason: 'Popular matchup, odds incomplete',
        pick: 'home',
      };
    }
    return {
      signal: 'PASS',
      confidenceScore: 35,
      riskScore: 60,
      volatility: 'High',
      reason: 'Insufficient odds data',
      pick: 'home',
    };
  }
  
  // Analyze moneyline for value
  if (hasMoneyline) {
    // Convert to implied probability
    const homeImplied = homeML > 0 
      ? 100 / (homeML + 100) 
      : Math.abs(homeML) / (Math.abs(homeML) + 100);
    const awayImplied = awayML > 0 
      ? 100 / (awayML + 100) 
      : Math.abs(awayML) / (Math.abs(awayML) + 100);
    
    // Check for value based on odds differential
    const impliedDiff = Math.abs(homeImplied - awayImplied);
    
    if (impliedDiff >= 0.25) {
      // Clear favorite - look for underdog value
      confidenceScore += 15;
      reasons.push('Clear favorite identified');
    } else if (impliedDiff >= 0.10) {
      confidenceScore += 10;
      reasons.push('Moderate edge available');
    } else {
      // Close matchup - more risk
      riskScore += 10;
      reasons.push('Close matchup');
    }
    
    // Heavy favorites are risky for value
    if (homeML < -300 || awayML < -300) {
      riskScore += 15;
      confidenceScore -= 10;
      reasons.push('Heavy favorite risk');
    }
    
    // Good underdog value
    if ((homeML >= 150 && homeML <= 250) || (awayML >= 150 && awayML <= 250)) {
      confidenceScore += 12;
      reasons.push('Underdog value spot');
    }
  }
  
  // Spread analysis
  if (hasSpread) {
    const absSpread = Math.abs(spread);
    if (absSpread <= 3) {
      confidenceScore += 8;
      reasons.push('Close spread');
    } else if (absSpread >= 10) {
      riskScore += 8;
      reasons.push('Large spread');
    }
  }
  
  // Total analysis  
  if (hasTotal) {
    confidenceScore += 5;
  }
  
  // Sport-based variance
  const highVarianceSports = ['mma', 'boxing', 'tennis'];
  const sportLower = game.sport.toLowerCase();
  if (highVarianceSports.includes(sportLower)) {
    riskScore += 10;
  }
  
  // Live games have more uncertainty
  if (game.status === 'live') {
    riskScore += 15;
    reasons.push('Live game volatility');
  }
  
  // Clamp values
  confidenceScore = Math.min(100, Math.max(0, confidenceScore));
  riskScore = Math.min(100, Math.max(0, riskScore));
  
  // Determine signal based on confidence and risk thresholds
  let signal: 'GOOD' | 'BORDERLINE' | 'PASS';
  let reason: string;
  
  if (confidenceScore >= 60 && riskScore <= 50) {
    signal = 'GOOD';
    reason = reasons[0] || 'Strong value identified';
  } else if (riskScore > 60 || confidenceScore < 40) {
    signal = 'PASS';
    reason = reasons.find(r => r.includes('risk') || r.includes('volatility')) || 'Insufficient edge';
  } else {
    signal = 'BORDERLINE';
    reason = reasons[0] || 'Moderate opportunity';
  }
  
  // Determine pick based on odds
  const pick: 'home' | 'away' = homeML < awayML ? 'home' : 'away';
  
  const volatility: 'Low' | 'Medium' | 'High' = 
    riskScore <= 35 ? 'Low' : riskScore <= 55 ? 'Medium' : 'High';
  
  return {
    signal,
    confidenceScore: Math.round(confidenceScore),
    riskScore: Math.round(riskScore),
    volatility,
    reason,
    pick,
  };
}
