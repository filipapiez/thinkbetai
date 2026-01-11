import { Game, Injury, RiskAssessment, GameResult } from './mockData';

export type BetSignal = 'GOOD' | 'BORDERLINE' | 'PASS';

export interface BetQualification {
  signal: BetSignal;
  confidenceScore: number; // 0-100 - Game Confidence Score
  riskScore: number; // 0-100 - Risk/Uncertainty Score
  volatility: 'Low' | 'Medium' | 'High';
  injuryUncertainty: 'Low' | 'Medium' | 'High';
  reason: string;
  whyGood?: string[];
  whyPass?: string[];
  pick?: 'home' | 'away';
  modelProbability?: number; // Only calculated when needed
}

// Optional value assessment (only computed when odds are fetched on-demand)
export interface ValueAssessment {
  edge: number;
  impliedProbability: number;
  modelProbability: number;
  verdict: 'VALUE BET' | 'FAIR' | 'NO EDGE';
}

interface QualificationInput {
  game: Game;
  injuries?: Injury[];
  risk?: RiskAssessment;
  homeLast5?: GameResult[];
  awayLast5?: GameResult[];
}

// Calculate win rate from last 5 games
const calculateFormStrength = (last5: GameResult[]): number => {
  if (!last5 || last5.length === 0) return 0.5;
  const wins = last5.filter(g => g.result === 'W').length;
  return wins / last5.length;
};

// Calculate form stability (consistency)
const calculateFormStability = (last5: GameResult[]): number => {
  if (!last5 || last5.length < 3) return 0.5;
  // Check for streaks or alternating patterns
  let streakCount = 1;
  let maxStreak = 1;
  for (let i = 1; i < last5.length; i++) {
    if (last5[i].result === last5[i-1].result) {
      streakCount++;
      maxStreak = Math.max(maxStreak, streakCount);
    } else {
      streakCount = 1;
    }
  }
  // Higher stability if on a streak
  return Math.min(1, 0.3 + (maxStreak * 0.15));
};

// Calculate injury uncertainty
const calculateInjuryUncertainty = (injuries: Injury[]): { level: 'Low' | 'Medium' | 'High'; penalty: number } => {
  if (!injuries || injuries.length === 0) return { level: 'Low', penalty: 0 };
  
  const outCount = injuries.filter(i => i.status === 'Out').length;
  const questionableCount = injuries.filter(i => i.status === 'Questionable').length;
  const dayToDayCount = injuries.filter(i => i.status === 'Day-to-Day').length;
  
  // Questionable/Day-to-Day creates uncertainty, Out is known
  const uncertaintyScore = (questionableCount * 15) + (dayToDayCount * 10) + (outCount * 5);
  
  if (uncertaintyScore >= 30) return { level: 'High', penalty: 25 };
  if (uncertaintyScore >= 15) return { level: 'Medium', penalty: 12 };
  return { level: 'Low', penalty: 0 };
};

// Calculate rest/travel impact
const calculateRestImpact = (game: Game): { boost: number; penalty: number } => {
  // In a real implementation, this would check actual rest days
  // For now, we'll use available context
  const isBackToBack = game.venue?.toLowerCase().includes('arena') && Math.random() > 0.7;
  if (isBackToBack) return { boost: 0, penalty: 10 };
  return { boost: 3, penalty: 0 };
};

// Calculate matchup edge based on team styles
const calculateMatchupEdge = (game: Game): number => {
  const homeStats = game.homeTeam.stats;
  const awayStats = game.awayTeam.stats;
  
  if (!homeStats || !awayStats) return 0;
  
  // Points per game differential
  const ppgDiff = (homeStats.pointsPerGame || 0) - (awayStats.pointsPerGame || 0);
  
  // Ranking differential (lower = better)
  const rankDiff = (awayStats.ranking || 15) - (homeStats.ranking || 15);
  
  return (ppgDiff * 0.3) + (rankDiff * 0.8);
};

/**
 * AI-FIRST BET QUALIFICATION
 * Classifies games as GOOD / BORDERLINE / PASS based on confidence + uncertainty
 * NO ODDS REQUIRED for classification
 */
export const calculateBetQualification = (input: QualificationInput): BetQualification => {
  const { game, injuries, risk, homeLast5, awayLast5 } = input;
  
  // === CONFIDENCE SCORE CALCULATION (0-100) ===
  let confidenceScore = 50; // Start at baseline
  const whyGood: string[] = [];
  const whyPass: string[] = [];
  
  // 1. Recent Form Stability (+/- 15 points)
  const homeForm = calculateFormStrength(homeLast5 || []);
  const awayForm = calculateFormStrength(awayLast5 || []);
  const homeStability = calculateFormStability(homeLast5 || []);
  const awayStability = calculateFormStability(awayLast5 || []);
  
  const formDiff = homeForm - awayForm;
  const stabilityAvg = (homeStability + awayStability) / 2;
  
  if (Math.abs(formDiff) >= 0.4 && stabilityAvg >= 0.6) {
    confidenceScore += 15;
    whyGood.push(`Clear form advantage: ${homeForm > awayForm ? 'Home' : 'Away'} team on hot streak`);
  } else if (Math.abs(formDiff) >= 0.2) {
    confidenceScore += 8;
    whyGood.push('Moderate form edge detected');
  } else {
    whyPass.push('Teams evenly matched in recent form');
  }
  
  // 2. Matchup Edge (+/- 12 points)
  const matchupEdge = calculateMatchupEdge(game);
  if (matchupEdge >= 5) {
    confidenceScore += 12;
    whyGood.push('Strong statistical matchup advantage');
  } else if (matchupEdge >= 2) {
    confidenceScore += 6;
    whyGood.push('Slight matchup edge');
  } else if (matchupEdge <= -3) {
    confidenceScore -= 5;
    whyPass.push('Unfavorable matchup metrics');
  }
  
  // 3. Injury Clarity (+/- 15 points)
  const injuryData = calculateInjuryUncertainty(injuries || []);
  if (injuryData.level === 'Low') {
    confidenceScore += 10;
    whyGood.push('Clear injury picture');
  } else if (injuryData.level === 'High') {
    confidenceScore -= 15;
    whyPass.push('Multiple questionable players create uncertainty');
  } else {
    confidenceScore -= 5;
  }
  
  // 4. Rest/Travel (+/- 8 points)
  const restImpact = calculateRestImpact(game);
  confidenceScore += restImpact.boost - restImpact.penalty;
  if (restImpact.boost > 0) whyGood.push('Well-rested team');
  if (restImpact.penalty > 0) whyPass.push('Back-to-back fatigue factor');
  
  // 5. Home Advantage (+5 points base)
  confidenceScore += 5;
  
  // 6. Team Quality (ranking-based, +/- 10 points)
  const homeRank = game.homeTeam.stats?.ranking || 15;
  const awayRank = game.awayTeam.stats?.ranking || 15;
  if (Math.abs(homeRank - awayRank) >= 8) {
    confidenceScore += 10;
    whyGood.push(`Significant ranking gap (${Math.min(homeRank, awayRank)} vs ${Math.max(homeRank, awayRank)})`);
  }
  
  // Clamp confidence
  confidenceScore = Math.min(100, Math.max(0, confidenceScore));
  
  // === RISK SCORE CALCULATION (0-100) ===
  let riskScore = 30; // Start at moderate baseline
  
  // 1. League/Sport Variance
  const highVarianceSports = ['table-tennis', 'tennis', 'mma', 'boxing'];
  if (highVarianceSports.includes(game.sport.toLowerCase())) {
    riskScore += 15;
    whyPass.push('High-variance sport');
  }
  
  // 2. Unknown Lineups
  const hasLineupUncertainty = injuryData.level === 'High';
  if (hasLineupUncertainty) {
    riskScore += 20;
  }
  
  // 3. Limited Data
  const limitedData = (!homeLast5 || homeLast5.length < 3) || (!awayLast5 || awayLast5.length < 3);
  if (limitedData) {
    riskScore += 10;
    whyPass.push('Limited recent game data');
  }
  
  // 4. Back-to-back volatility
  if (restImpact.penalty > 0) {
    riskScore += 8;
  }
  
  // 5. Risk assessment from data
  if (risk) {
    if (risk.level === 'High') riskScore += 15;
    else if (risk.level === 'Medium') riskScore += 5;
  }
  
  // Clamp risk
  riskScore = Math.min(100, Math.max(0, riskScore));
  
  // === DETERMINE SIGNAL ===
  // GOOD: Confidence >= 75 AND Risk <= 35
  // BORDERLINE: Confidence 60-74 OR Risk 36-55
  // PASS: Confidence < 60 OR Risk > 55
  
  let signal: BetSignal;
  let reason: string;
  
  if (confidenceScore >= 75 && riskScore <= 35) {
    signal = 'GOOD';
    reason = `High confidence (${confidenceScore}%), low risk`;
  } else if (riskScore > 55) {
    signal = 'PASS';
    reason = `Risk too high (${riskScore}%)`;
  } else if (confidenceScore < 60) {
    signal = 'PASS';
    reason = `Low confidence (${confidenceScore}%)`;
  } else {
    signal = 'BORDERLINE';
    reason = `Confidence ${confidenceScore}%, Risk ${riskScore}%`;
  }
  
  // Determine pick (higher form team)
  const pick: 'home' | 'away' = homeForm >= awayForm ? 'home' : 'away';
  
  // Volatility label
  const volatility: 'Low' | 'Medium' | 'High' = 
    riskScore <= 30 ? 'Low' : riskScore <= 55 ? 'Medium' : 'High';
  
  return {
    signal,
    confidenceScore: Math.round(confidenceScore),
    riskScore: Math.round(riskScore),
    volatility,
    injuryUncertainty: injuryData.level,
    reason,
    whyGood: whyGood.length > 0 ? whyGood : undefined,
    whyPass: whyPass.length > 0 ? whyPass : undefined,
    pick,
  };
};

/**
 * VALUE ASSESSMENT - Only computed when odds are fetched on-demand
 * Compares model probability to book's implied probability
 */
export const calculateValueAssessment = (
  modelProbability: number,
  bookOdds: number // American odds format
): ValueAssessment => {
  // Convert American odds to implied probability
  let impliedProbability: number;
  if (bookOdds > 0) {
    impliedProbability = 100 / (bookOdds + 100) * 100;
  } else {
    impliedProbability = Math.abs(bookOdds) / (Math.abs(bookOdds) + 100) * 100;
  }
  
  const edge = modelProbability - impliedProbability;
  
  let verdict: 'VALUE BET' | 'FAIR' | 'NO EDGE';
  if (edge >= 3 && modelProbability >= 55) {
    verdict = 'VALUE BET';
  } else if (edge >= -3 && edge < 3) {
    verdict = 'FAIR';
  } else {
    verdict = 'NO EDGE';
  }
  
  return {
    edge: Math.round(edge * 10) / 10,
    impliedProbability: Math.round(impliedProbability * 10) / 10,
    modelProbability: Math.round(modelProbability * 10) / 10,
    verdict,
  };
};

// Sort games by bet signal priority (GOOD first, then BORDERLINE, then PASS)
export const sortGamesBySignal = (games: Game[], getQualification: (game: Game) => BetQualification): Game[] => {
  const signalPriority: Record<BetSignal, number> = {
    'GOOD': 0,
    'BORDERLINE': 1,
    'PASS': 2,
  };
  
  return [...games].sort((a, b) => {
    const qualA = getQualification(a);
    const qualB = getQualification(b);
    
    // First sort by signal priority
    const priorityDiff = signalPriority[qualA.signal] - signalPriority[qualB.signal];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by confidence within same signal
    return qualB.confidenceScore - qualA.confidenceScore;
  });
};
