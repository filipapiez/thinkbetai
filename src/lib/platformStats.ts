// Platform win ratio stats - QUALIFIED PICKS ONLY (confidence >= 75)
// Extracted to a separate file so the landing page doesn't load the entire mockData module.
export const platformStats = {
  totalQualified: 1806,
  correctQualified: 1616,
  qualifiedWinRate: 89.5,
  averageConfidence: 82.5,
  streakCurrent: 8,
  streakBest: 18,
  sportBreakdown: [
    { sport: 'NBA', qualified: 560, wins: 505, winRate: 90.2 },
    { sport: 'NHL', qualified: 403, wins: 360, winRate: 89.3 },
    { sport: 'Soccer', qualified: 364, wins: 327, winRate: 89.8 },
    { sport: 'MLB', qualified: 191, wins: 172, winRate: 90.1 },
    { sport: 'College Baseball', qualified: 92, wins: 79, winRate: 85.9 },
    { sport: 'Table Tennis', qualified: 46, wins: 40, winRate: 87.0 },
    { sport: 'UFC', qualified: 33, wins: 29, winRate: 87.9 },
    { sport: 'NFL', qualified: 29, wins: 26, winRate: 89.7 },
  ],
};
