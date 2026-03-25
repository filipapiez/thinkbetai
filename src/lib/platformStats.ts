// Platform win ratio stats - QUALIFIED PICKS ONLY (GOOD bets)
// Extracted to a separate file so the landing page doesn't load the entire mockData module (28KB).
export const platformStats = {
  totalQualified: 487,
  correctQualified: 408,
  qualifiedWinRate: 83.8,
  averageConfidence: 82.5,
  streakCurrent: 12,
  streakBest: 18,
  sportBreakdown: [
    { sport: 'NFL', qualified: 68, wins: 60, winRate: 88.2 },
    { sport: 'UFC', qualified: 52, wins: 46, winRate: 88.5 },
    { sport: 'NBA', qualified: 98, wins: 84, winRate: 85.7 },
    { sport: 'Tennis', qualified: 78, wins: 66, winRate: 84.6 },
    { sport: 'Soccer', qualified: 72, wins: 59, winRate: 81.9 },
    { sport: 'MLB', qualified: 45, wins: 37, winRate: 82.2 },
    { sport: 'Table Tennis', qualified: 38, wins: 31, winRate: 81.6 },
    { sport: 'NHL', qualified: 36, wins: 25, winRate: 69.4 },
  ],
};
