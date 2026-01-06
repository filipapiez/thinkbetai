import { Game, OddsData, Injury, RiskAssessment, GameResult } from './mockData';

export type BetSignal = 'GOOD' | 'BORDERLINE' | 'PASS' | 'NEUTRAL';

export interface BetQualification {
  signal: BetSignal;
  edge: number; // percentage
  confidence: number; // 0-100
  modelProbability: number;
  impliedProbability: number;
  volatility: 'Low' | 'Medium' | 'High';
  injuryUncertainty: 'Low' | 'Medium' | 'High';
  reason: string; // max ~35 chars
  pick?: 'home' | 'away';
}

interface QualificationInput {
  game: Game;
  odds?: OddsData;
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

// Estimate model probability based on team stats and form
const calculateModelProbability = (input: QualificationInput): { homePct: number; awayPct: number } => {
  const { game, homeLast5, awayLast5 } = input;
  
  // Base probability from team win percentages
  const homeWinPct = game.homeTeam.stats?.winPct ?? 0.5;
  const awayWinPct = game.awayTeam.stats?.winPct ?? 0.5;
  
  // Form adjustment (recent performance)
  const homeForm = calculateFormStrength(homeLast5 || []);
  const awayForm = calculateFormStrength(awayLast5 || []);
  
  // Home court advantage (~3-5% boost)
  const homeAdvantage = 0.04;
  
  // Ranking factor
  const homeRank = game.homeTeam.stats?.ranking ?? 15;
  const awayRank = game.awayTeam.stats?.ranking ?? 15;
  const rankFactor = (awayRank - homeRank) * 0.01; // Higher away rank = home boost
  
  // Combined home probability
  let homePct = (homeWinPct * 0.4) + (homeForm * 0.3) + (0.5 * 0.3); // Base calculation
  homePct += homeAdvantage + rankFactor;
  homePct = Math.min(0.85, Math.max(0.15, homePct)); // Clamp between 15-85%
  
  return {
    homePct: homePct * 100,
    awayPct: (1 - homePct) * 100,
  };
};

// Calculate injury uncertainty
const calculateInjuryUncertainty = (injuries: Injury[]): 'Low' | 'Medium' | 'High' => {
  if (!injuries || injuries.length === 0) return 'Low';
  
  const outCount = injuries.filter(i => i.status === 'Out').length;
  const questionableCount = injuries.filter(i => i.status === 'Questionable').length;
  
  if (outCount >= 2 || (outCount >= 1 && questionableCount >= 2)) return 'High';
  if (outCount >= 1 || questionableCount >= 2) return 'Medium';
  return 'Low';
};

// Calculate volatility from risk level and line movement
const calculateVolatility = (risk?: RiskAssessment, odds?: OddsData): 'Low' | 'Medium' | 'High' => {
  if (!risk) return 'Medium';
  
  // Check line movement magnitude
  if (odds?.lineMovement) {
    const openHome = Math.abs(odds.lineMovement.opening.home);
    const currentHome = Math.abs(odds.lineMovement.current.home);
    const movement = Math.abs(currentHome - openHome);
    if (movement >= 20) return 'High';
    if (movement >= 10) return 'Medium';
  }
  
  return risk.level;
};

export const calculateBetQualification = (input: QualificationInput): BetQualification => {
  const { game, odds, injuries, risk, homeLast5, awayLast5 } = input;
  
  // If no odds available, return NEUTRAL
  if (!odds) {
    return {
      signal: 'NEUTRAL',
      edge: 0,
      confidence: 0,
      modelProbability: 50,
      impliedProbability: 50,
      volatility: 'Medium',
      injuryUncertainty: 'Low',
      reason: 'Line not available',
    };
  }
  
  // Calculate model probabilities
  const modelProb = calculateModelProbability({ game, odds, injuries, risk, homeLast5, awayLast5 });
  const impliedProb = odds.impliedProb;
  
  // Determine which side has edge
  const homeEdge = modelProb.homePct - impliedProb.homePct;
  const awayEdge = modelProb.awayPct - impliedProb.awayPct;
  
  const pick: 'home' | 'away' = Math.abs(homeEdge) >= Math.abs(awayEdge) ? 'home' : 'away';
  const edge = pick === 'home' ? homeEdge : awayEdge;
  const modelProbability = pick === 'home' ? modelProb.homePct : modelProb.awayPct;
  const impliedProbability = pick === 'home' ? impliedProb.homePct : impliedProb.awayPct;
  
  // Calculate other factors
  const injuryUncertainty = calculateInjuryUncertainty(injuries || []);
  const volatility = calculateVolatility(risk, odds);
  
  // Calculate confidence score (0-100)
  // Higher edge = higher confidence, adjusted down for uncertainty
  let confidence = 50 + (edge * 3); // Base confidence from edge
  if (injuryUncertainty === 'High') confidence -= 20;
  else if (injuryUncertainty === 'Medium') confidence -= 10;
  if (volatility === 'High') confidence -= 15;
  else if (volatility === 'Medium') confidence -= 5;
  
  // Boost for strong recent form
  const homeForm = calculateFormStrength(homeLast5 || []);
  const awayForm = calculateFormStrength(awayLast5 || []);
  if (pick === 'home' && homeForm >= 0.6) confidence += 5;
  if (pick === 'away' && awayForm >= 0.6) confidence += 5;
  
  confidence = Math.min(95, Math.max(20, confidence));
  
  // Determine signal based on rules
  let signal: BetSignal;
  let reason: string;
  
  if (volatility === 'High' || injuryUncertainty === 'High') {
    signal = 'PASS';
    reason = volatility === 'High' ? 'High volatility' : 'Injury uncertainty';
  } else if (edge >= 4 && confidence >= 70) {
    signal = 'GOOD';
    reason = `Edge +${edge.toFixed(1)}% • ${volatility === 'Low' ? 'Low risk' : 'Solid edge'}`;
  } else if ((edge >= 2 && edge < 4) || (confidence >= 55 && confidence < 70)) {
    signal = 'BORDERLINE';
    reason = edge >= 2 ? `Lean +${edge.toFixed(1)}% edge` : 'Moderate confidence';
  } else if (edge < 2 || confidence < 55) {
    signal = 'PASS';
    reason = edge < 2 ? 'No edge vs market' : 'Low confidence';
  } else {
    signal = 'NEUTRAL';
    reason = 'Insufficient data';
  }
  
  return {
    signal,
    edge: Math.round(edge * 10) / 10,
    confidence: Math.round(confidence),
    modelProbability: Math.round(modelProbability * 10) / 10,
    impliedProbability: Math.round(impliedProbability * 10) / 10,
    volatility,
    injuryUncertainty,
    reason,
    pick,
  };
};

// Sort games by bet signal priority
export const sortGamesBySignal = (games: Game[], getQualification: (game: Game) => BetQualification): Game[] => {
  const signalPriority: Record<BetSignal, number> = {
    'GOOD': 0,
    'BORDERLINE': 1,
    'PASS': 2,
    'NEUTRAL': 3,
  };
  
  return [...games].sort((a, b) => {
    const qualA = getQualification(a);
    const qualB = getQualification(b);
    
    // First sort by signal priority
    const priorityDiff = signalPriority[qualA.signal] - signalPriority[qualB.signal];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by confidence within same signal
    return qualB.confidence - qualA.confidence;
  });
};
