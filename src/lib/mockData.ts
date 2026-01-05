// Mock NBA data for development
export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
}

export interface Game {
  id: string;
  sport: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  venue: string;
  status: 'scheduled' | 'live' | 'final';
}

export interface OddsData {
  moneyline: { home: number; away: number };
  spread: { home: number; away: number; line: number };
  total: { over: number; under: number; line: number };
  impliedProb: { homePct: number; awayPct: number };
  lineMovement?: { opening: { home: number; away: number }; current: { home: number; away: number } };
}

export interface Injury {
  team: string;
  player: string;
  position: string;
  injuryType: string;
  status: 'Out' | 'Questionable' | 'Probable' | 'Day-to-Day';
  startDate: string;
  gamesMissed: number;
}

export interface GameResult {
  opponent: string;
  result: 'W' | 'L';
  score: string;
  date: string;
}

export interface HeadToHead {
  date: string;
  winner: string;
  score: string;
  location: string;
}

export interface RiskAssessment {
  level: 'Low' | 'Medium' | 'High';
  reasons: string[];
}

export interface GameContext {
  homeIsHomeStrong: boolean;
  awayIsAwayStrong: boolean;
  restDays: { home: number; away: number };
  backToBack: { home: boolean; away: boolean };
}

export interface GameFacts {
  game: Game;
  odds: OddsData;
  injuries: Injury[];
  recentForm: {
    homeLast5: GameResult[];
    awayLast5: GameResult[];
  };
  headToHead: HeadToHead[];
  context: GameContext;
  risk: RiskAssessment;
  lastUpdated: string;
}

export const mockTeams: Team[] = [
  { id: 'lal', name: 'Los Angeles Lakers', abbreviation: 'LAL' },
  { id: 'bos', name: 'Boston Celtics', abbreviation: 'BOS' },
  { id: 'gsw', name: 'Golden State Warriors', abbreviation: 'GSW' },
  { id: 'mia', name: 'Miami Heat', abbreviation: 'MIA' },
  { id: 'phi', name: 'Philadelphia 76ers', abbreviation: 'PHI' },
  { id: 'den', name: 'Denver Nuggets', abbreviation: 'DEN' },
  { id: 'mil', name: 'Milwaukee Bucks', abbreviation: 'MIL' },
  { id: 'pho', name: 'Phoenix Suns', abbreviation: 'PHO' },
];

export const mockGames: Game[] = [
  {
    id: 'game-1',
    sport: 'NBA',
    homeTeam: mockTeams[0],
    awayTeam: mockTeams[1],
    startTime: '2026-01-06T19:30:00Z',
    venue: 'Crypto.com Arena',
    status: 'scheduled',
  },
  {
    id: 'game-2',
    sport: 'NBA',
    homeTeam: mockTeams[2],
    awayTeam: mockTeams[3],
    startTime: '2026-01-06T22:00:00Z',
    venue: 'Chase Center',
    status: 'scheduled',
  },
  {
    id: 'game-3',
    sport: 'NBA',
    homeTeam: mockTeams[4],
    awayTeam: mockTeams[5],
    startTime: '2026-01-07T19:00:00Z',
    venue: 'Wells Fargo Center',
    status: 'scheduled',
  },
  {
    id: 'game-4',
    sport: 'NBA',
    homeTeam: mockTeams[6],
    awayTeam: mockTeams[7],
    startTime: '2026-01-07T20:00:00Z',
    venue: 'Fiserv Forum',
    status: 'scheduled',
  },
];

export const getGameFacts = (gameId: string): GameFacts | null => {
  const game = mockGames.find(g => g.id === gameId);
  if (!game) return null;

  const isLakersGame = game.homeTeam.id === 'lal' || game.awayTeam.id === 'lal';
  
  return {
    game,
    odds: {
      moneyline: { home: -145, away: +125 },
      spread: { home: -3.5, away: +3.5, line: -110 },
      total: { over: -110, under: -110, line: 224.5 },
      impliedProb: { homePct: 59.2, awayPct: 44.4 },
      lineMovement: {
        opening: { home: -130, away: +110 },
        current: { home: -145, away: +125 },
      },
    },
    injuries: [
      {
        team: game.homeTeam.name,
        player: 'Anthony Davis',
        position: 'PF/C',
        injuryType: 'Knee soreness',
        status: 'Questionable',
        startDate: '2026-01-03',
        gamesMissed: 2,
      },
      {
        team: game.awayTeam.name,
        player: 'Jaylen Brown',
        position: 'SG/SF',
        injuryType: 'Ankle sprain',
        status: 'Probable',
        startDate: '2026-01-04',
        gamesMissed: 1,
      },
      {
        team: game.homeTeam.name,
        player: 'Austin Reaves',
        position: 'SG',
        injuryType: 'Illness',
        status: 'Out',
        startDate: '2026-01-05',
        gamesMissed: 1,
      },
    ],
    recentForm: {
      homeLast5: [
        { opponent: 'PHO', result: 'W', score: '112-105', date: '2026-01-04' },
        { opponent: 'DEN', result: 'L', score: '98-110', date: '2026-01-02' },
        { opponent: 'MIL', result: 'W', score: '121-115', date: '2025-12-31' },
        { opponent: 'MIA', result: 'W', score: '108-102', date: '2025-12-29' },
        { opponent: 'GSW', result: 'L', score: '105-118', date: '2025-12-27' },
      ],
      awayLast5: [
        { opponent: 'PHI', result: 'W', score: '118-112', date: '2026-01-04' },
        { opponent: 'NYK', result: 'W', score: '125-120', date: '2026-01-02' },
        { opponent: 'BKN', result: 'W', score: '132-108', date: '2025-12-31' },
        { opponent: 'TOR', result: 'L', score: '99-105', date: '2025-12-29' },
        { opponent: 'CLE', result: 'W', score: '110-102', date: '2025-12-27' },
      ],
    },
    headToHead: [
      { date: '2025-12-15', winner: game.awayTeam.abbreviation, score: '115-108', location: game.awayTeam.name },
      { date: '2025-03-08', winner: game.homeTeam.abbreviation, score: '122-118', location: game.homeTeam.name },
      { date: '2024-12-25', winner: game.awayTeam.abbreviation, score: '139-132', location: game.homeTeam.name },
      { date: '2024-02-01', winner: game.homeTeam.abbreviation, score: '105-96', location: game.awayTeam.name },
      { date: '2023-12-18', winner: game.awayTeam.abbreviation, score: '126-115', location: game.homeTeam.name },
    ],
    context: {
      homeIsHomeStrong: true,
      awayIsAwayStrong: true,
      restDays: { home: 1, away: 1 },
      backToBack: { home: false, away: false },
    },
    risk: isLakersGame ? {
      level: 'Medium',
      reasons: [
        'Key player (Anthony Davis) listed as Questionable',
        'Line has moved 15 cents toward home team',
        'Away team on 4-1 streak, strong recent form',
        'Both teams well-rested (1 day off each)',
      ],
    } : {
      level: 'Low',
      reasons: [
        'No major injuries reported for either team',
        'Minimal line movement since opening',
        'Both teams playing at expected level',
      ],
    },
    lastUpdated: new Date().toISOString(),
  };
};

export const mockAIExplanation = `
## ODDS EXPLAINED
The home team is favored at -145 on the moneyline, implying a 59.2% win probability. The spread of -3.5 suggests oddsmakers expect a close game with the home team winning by 3-4 points. The total of 224.5 indicates expectations of a moderately-paced, average-scoring contest.

## INJURY IMPACT
- **Anthony Davis (Questionable)**: His absence would significantly impact the home team's rim protection and interior scoring. If he plays limited minutes, expect defensive adjustments.
- **Jaylen Brown (Probable)**: Expected to play but may be on a minutes restriction. Monitor pregame warmups.
- **Austin Reaves (Out)**: Reduces backcourt depth and secondary playmaking.

## RECENT FORM & HISTORY
The home team is 3-2 in their last 5, with quality wins over playoff-caliber teams. The away team enters hot at 4-1, including a dominant road performance. Head-to-head, the away team has won 3 of the last 5 meetings, though the home team has shown improvement recently.

## RISK / VOLATILITY
- **Level: Medium**
- The questionable status of a key player creates uncertainty. The 15-cent line move suggests sharp money has been placed. The away team's strong recent form against the spread adds another variable.

## WHAT TO WATCH
- Pregame injury report confirmation (especially Anthony Davis)
- First quarter pace and defensive intensity
- How the home team adjusts rotation if key players are limited
- Fourth quarter execution in what projects as a close game

---
*This is informational only, not betting advice. No guarantees. Past performance does not predict future outcomes.*
`;
