// Mock data for development - Multiple sports
export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  stats?: TeamStats;
}

export interface TeamStats {
  wins: number;
  losses: number;
  winPct: number;
  streak: string;
  homeRecord: string;
  awayRecord: string;
  pointsPerGame: number;
  pointsAllowed: number;
  ranking: number;
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

export interface PerformanceData {
  date: string;
  predicted: number;
  actual: number;
}

export interface GameFacts {
  game: Game;
  odds: OddsData | null; // null = odds not available yet
  injuries: Injury[];
  recentForm: {
    homeLast5: GameResult[];
    awayLast5: GameResult[];
  };
  headToHead: HeadToHead[];
  context: GameContext;
  risk: RiskAssessment;
  lastUpdated: string;
  performanceHistory: PerformanceData[];
  oddsStatus: 'available' | 'pending' | 'suspended'; // Tracks why odds may be missing
}

// NBA Teams
export const nbaTeams: Team[] = [
  { id: 'lal', name: 'Los Angeles Lakers', abbreviation: 'LAL', stats: { wins: 22, losses: 15, winPct: 0.595, streak: 'W2', homeRecord: '14-5', awayRecord: '8-10', pointsPerGame: 115.2, pointsAllowed: 112.1, ranking: 5 } },
  { id: 'bos', name: 'Boston Celtics', abbreviation: 'BOS', stats: { wins: 28, losses: 9, winPct: 0.757, streak: 'W4', homeRecord: '16-2', awayRecord: '12-7', pointsPerGame: 120.5, pointsAllowed: 108.3, ranking: 1 } },
  { id: 'gsw', name: 'Golden State Warriors', abbreviation: 'GSW', stats: { wins: 19, losses: 18, winPct: 0.514, streak: 'L1', homeRecord: '12-6', awayRecord: '7-12', pointsPerGame: 112.8, pointsAllowed: 113.5, ranking: 10 } },
  { id: 'mia', name: 'Miami Heat', abbreviation: 'MIA', stats: { wins: 20, losses: 17, winPct: 0.541, streak: 'W1', homeRecord: '13-5', awayRecord: '7-12', pointsPerGame: 109.4, pointsAllowed: 108.9, ranking: 7 } },
  { id: 'phi', name: 'Philadelphia 76ers', abbreviation: 'PHI', stats: { wins: 15, losses: 21, winPct: 0.417, streak: 'L3', homeRecord: '10-8', awayRecord: '5-13', pointsPerGame: 106.2, pointsAllowed: 111.8, ranking: 11 } },
  { id: 'den', name: 'Denver Nuggets', abbreviation: 'DEN', stats: { wins: 24, losses: 13, winPct: 0.649, streak: 'W3', homeRecord: '15-3', awayRecord: '9-10', pointsPerGame: 118.1, pointsAllowed: 112.4, ranking: 3 } },
];

// NFL Teams
export const nflTeams: Team[] = [
  { id: 'kc', name: 'Kansas City Chiefs', abbreviation: 'KC', stats: { wins: 13, losses: 4, winPct: 0.765, streak: 'W2', homeRecord: '7-1', awayRecord: '6-3', pointsPerGame: 27.5, pointsAllowed: 19.2, ranking: 1 } },
  { id: 'buf', name: 'Buffalo Bills', abbreviation: 'BUF', stats: { wins: 12, losses: 5, winPct: 0.706, streak: 'W3', homeRecord: '6-2', awayRecord: '6-3', pointsPerGame: 29.1, pointsAllowed: 21.4, ranking: 2 } },
  { id: 'det', name: 'Detroit Lions', abbreviation: 'DET', stats: { wins: 14, losses: 3, winPct: 0.824, streak: 'W5', homeRecord: '8-0', awayRecord: '6-3', pointsPerGame: 32.4, pointsAllowed: 20.8, ranking: 1 } },
  { id: 'phi', name: 'Philadelphia Eagles', abbreviation: 'PHI', stats: { wins: 13, losses: 4, winPct: 0.765, streak: 'L1', homeRecord: '7-1', awayRecord: '6-3', pointsPerGame: 26.8, pointsAllowed: 18.5, ranking: 3 } },
];

// Tennis Players (as teams for consistency)
export const tennisPlayers: Team[] = [
  { id: 'djo', name: 'Novak Djokovic', abbreviation: 'DJO', stats: { wins: 45, losses: 8, winPct: 0.849, streak: 'W6', homeRecord: '23-3', awayRecord: '22-5', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'sin', name: 'Jannik Sinner', abbreviation: 'SIN', stats: { wins: 52, losses: 6, winPct: 0.897, streak: 'W8', homeRecord: '26-2', awayRecord: '26-4', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'alc', name: 'Carlos Alcaraz', abbreviation: 'ALC', stats: { wins: 48, losses: 10, winPct: 0.828, streak: 'W3', homeRecord: '25-4', awayRecord: '23-6', pointsPerGame: 0, pointsAllowed: 0, ranking: 2 } },
  { id: 'med', name: 'Daniil Medvedev', abbreviation: 'MED', stats: { wins: 40, losses: 15, winPct: 0.727, streak: 'L1', homeRecord: '20-7', awayRecord: '20-8', pointsPerGame: 0, pointsAllowed: 0, ranking: 4 } },
  { id: 'zve', name: 'Alexander Zverev', abbreviation: 'ZVE', stats: { wins: 42, losses: 12, winPct: 0.778, streak: 'W2', homeRecord: '22-5', awayRecord: '20-7', pointsPerGame: 0, pointsAllowed: 0, ranking: 3 } },
  { id: 'rub', name: 'Andrey Rublev', abbreviation: 'RUB', stats: { wins: 35, losses: 18, winPct: 0.660, streak: 'W1', homeRecord: '18-8', awayRecord: '17-10', pointsPerGame: 0, pointsAllowed: 0, ranking: 6 } },
];

// Table Tennis Players
export const tableTennisPlayers: Team[] = [
  { id: 'wch', name: 'Wang Chuqin', abbreviation: 'WCH', stats: { wins: 38, losses: 4, winPct: 0.905, streak: 'W7', homeRecord: '20-1', awayRecord: '18-3', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'fzd', name: 'Fan Zhendong', abbreviation: 'FZD', stats: { wins: 35, losses: 6, winPct: 0.854, streak: 'W4', homeRecord: '18-2', awayRecord: '17-4', pointsPerGame: 0, pointsAllowed: 0, ranking: 2 } },
  { id: 'mlo', name: 'Ma Long', abbreviation: 'MLO', stats: { wins: 32, losses: 8, winPct: 0.800, streak: 'W2', homeRecord: '17-3', awayRecord: '15-5', pointsPerGame: 0, pointsAllowed: 0, ranking: 3 } },
  { id: 'tho', name: 'Truls Moregard', abbreviation: 'TMO', stats: { wins: 28, losses: 12, winPct: 0.700, streak: 'L1', homeRecord: '15-5', awayRecord: '13-7', pointsPerGame: 0, pointsAllowed: 0, ranking: 5 } },
  { id: 'leb', name: 'Felix Lebrun', abbreviation: 'FLB', stats: { wins: 30, losses: 10, winPct: 0.750, streak: 'W3', homeRecord: '16-4', awayRecord: '14-6', pointsPerGame: 0, pointsAllowed: 0, ranking: 4 } },
  { id: 'cal', name: 'Hugo Calderano', abbreviation: 'HCA', stats: { wins: 26, losses: 14, winPct: 0.650, streak: 'W1', homeRecord: '14-6', awayRecord: '12-8', pointsPerGame: 0, pointsAllowed: 0, ranking: 7 } },
];

// Soccer Teams
export const soccerTeams: Team[] = [
  { id: 'rma', name: 'Real Madrid', abbreviation: 'RMA', stats: { wins: 18, losses: 3, winPct: 0.857, streak: 'W4', homeRecord: '10-0', awayRecord: '8-3', pointsPerGame: 2.5, pointsAllowed: 0.8, ranking: 1 } },
  { id: 'bar', name: 'FC Barcelona', abbreviation: 'BAR', stats: { wins: 16, losses: 4, winPct: 0.800, streak: 'W2', homeRecord: '9-1', awayRecord: '7-3', pointsPerGame: 2.3, pointsAllowed: 1.0, ranking: 2 } },
  { id: 'mci', name: 'Manchester City', abbreviation: 'MCI', stats: { wins: 14, losses: 6, winPct: 0.700, streak: 'L2', homeRecord: '8-2', awayRecord: '6-4', pointsPerGame: 2.1, pointsAllowed: 1.2, ranking: 4 } },
  { id: 'liv', name: 'Liverpool FC', abbreviation: 'LIV', stats: { wins: 17, losses: 2, winPct: 0.895, streak: 'W6', homeRecord: '9-0', awayRecord: '8-2', pointsPerGame: 2.6, pointsAllowed: 0.7, ranking: 1 } },
  { id: 'ars', name: 'Arsenal FC', abbreviation: 'ARS', stats: { wins: 15, losses: 4, winPct: 0.789, streak: 'W1', homeRecord: '9-1', awayRecord: '6-3', pointsPerGame: 2.2, pointsAllowed: 0.9, ranking: 3 } },
  { id: 'bay', name: 'Bayern Munich', abbreviation: 'BAY', stats: { wins: 16, losses: 3, winPct: 0.842, streak: 'W3', homeRecord: '9-1', awayRecord: '7-2', pointsPerGame: 2.4, pointsAllowed: 0.9, ranking: 2 } },
];

// MLB Teams
export const mlbTeams: Team[] = [
  { id: 'lad', name: 'Los Angeles Dodgers', abbreviation: 'LAD', stats: { wins: 98, losses: 64, winPct: 0.605, streak: 'W3', homeRecord: '52-29', awayRecord: '46-35', pointsPerGame: 5.2, pointsAllowed: 4.1, ranking: 1 } },
  { id: 'nyy', name: 'New York Yankees', abbreviation: 'NYY', stats: { wins: 94, losses: 68, winPct: 0.580, streak: 'W1', homeRecord: '50-31', awayRecord: '44-37', pointsPerGame: 4.8, pointsAllowed: 4.0, ranking: 2 } },
  { id: 'atl', name: 'Atlanta Braves', abbreviation: 'ATL', stats: { wins: 89, losses: 73, winPct: 0.549, streak: 'L2', homeRecord: '48-33', awayRecord: '41-40', pointsPerGame: 4.5, pointsAllowed: 4.2, ranking: 4 } },
  { id: 'hou', name: 'Houston Astros', abbreviation: 'HOU', stats: { wins: 88, losses: 74, winPct: 0.543, streak: 'W2', homeRecord: '47-34', awayRecord: '41-40', pointsPerGame: 4.4, pointsAllowed: 4.1, ranking: 5 } },
];

// NHL Teams
export const nhlTeams: Team[] = [
  { id: 'edm', name: 'Edmonton Oilers', abbreviation: 'EDM', stats: { wins: 28, losses: 12, winPct: 0.700, streak: 'W4', homeRecord: '15-4', awayRecord: '13-8', pointsPerGame: 3.8, pointsAllowed: 2.9, ranking: 2 } },
  { id: 'fla', name: 'Florida Panthers', abbreviation: 'FLA', stats: { wins: 26, losses: 14, winPct: 0.650, streak: 'W2', homeRecord: '14-5', awayRecord: '12-9', pointsPerGame: 3.5, pointsAllowed: 2.8, ranking: 3 } },
  { id: 'wpg', name: 'Winnipeg Jets', abbreviation: 'WPG', stats: { wins: 30, losses: 10, winPct: 0.750, streak: 'W5', homeRecord: '16-3', awayRecord: '14-7', pointsPerGame: 3.9, pointsAllowed: 2.5, ranking: 1 } },
  { id: 'vgk', name: 'Vegas Golden Knights', abbreviation: 'VGK', stats: { wins: 25, losses: 13, winPct: 0.658, streak: 'L1', homeRecord: '14-5', awayRecord: '11-8', pointsPerGame: 3.4, pointsAllowed: 2.7, ranking: 4 } },
];

// UFC Fighters
export const ufcFighters: Team[] = [
  { id: 'jon', name: 'Jon Jones', abbreviation: 'JON', stats: { wins: 27, losses: 1, winPct: 0.964, streak: 'W3', homeRecord: '14-0', awayRecord: '13-1', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'isl', name: 'Islam Makhachev', abbreviation: 'ISL', stats: { wins: 26, losses: 1, winPct: 0.963, streak: 'W14', homeRecord: '13-0', awayRecord: '13-1', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'ale', name: 'Alex Pereira', abbreviation: 'ALE', stats: { wins: 11, losses: 2, winPct: 0.846, streak: 'W7', homeRecord: '6-1', awayRecord: '5-1', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'max', name: 'Max Holloway', abbreviation: 'MAX', stats: { wins: 26, losses: 7, winPct: 0.788, streak: 'W2', homeRecord: '14-3', awayRecord: '12-4', pointsPerGame: 0, pointsAllowed: 0, ranking: 2 } },
  { id: 'vol', name: 'Alexander Volkanovski', abbreviation: 'VOL', stats: { wins: 26, losses: 4, winPct: 0.867, streak: 'L2', homeRecord: '14-1', awayRecord: '12-3', pointsPerGame: 0, pointsAllowed: 0, ranking: 3 } },
  { id: 'dri', name: 'Dricus du Plessis', abbreviation: 'DRI', stats: { wins: 22, losses: 2, winPct: 0.917, streak: 'W9', homeRecord: '11-1', awayRecord: '11-1', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'jai', name: 'Jailton Almeida', abbreviation: 'JAI', stats: { wins: 21, losses: 2, winPct: 0.913, streak: 'W6', homeRecord: '11-1', awayRecord: '10-1', pointsPerGame: 0, pointsAllowed: 0, ranking: 5 } },
  { id: 'tom', name: 'Tom Aspinall', abbreviation: 'TOM', stats: { wins: 15, losses: 3, winPct: 0.833, streak: 'W5', homeRecord: '8-1', awayRecord: '7-2', pointsPerGame: 0, pointsAllowed: 0, ranking: 2 } },
];

// Golf Players
export const golfPlayers: Team[] = [
  { id: 'sch', name: 'Scottie Scheffler', abbreviation: 'SCH', stats: { wins: 9, losses: 0, winPct: 0.900, streak: 'W2', homeRecord: '5-0', awayRecord: '4-0', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'ror', name: 'Rory McIlroy', abbreviation: 'ROR', stats: { wins: 4, losses: 0, winPct: 0.750, streak: 'W1', homeRecord: '2-0', awayRecord: '2-0', pointsPerGame: 0, pointsAllowed: 0, ranking: 3 } },
  { id: 'xan', name: 'Xander Schauffele', abbreviation: 'XAN', stats: { wins: 3, losses: 0, winPct: 0.700, streak: 'W1', homeRecord: '2-0', awayRecord: '1-0', pointsPerGame: 0, pointsAllowed: 0, ranking: 2 } },
  { id: 'col', name: 'Collin Morikawa', abbreviation: 'COL', stats: { wins: 2, losses: 0, winPct: 0.650, streak: 'L1', homeRecord: '1-0', awayRecord: '1-0', pointsPerGame: 0, pointsAllowed: 0, ranking: 4 } },
];

// Boxing Fighters
export const boxingFighters: Team[] = [
  { id: 'can', name: 'Canelo Alvarez', abbreviation: 'CAN', stats: { wins: 61, losses: 2, winPct: 0.953, streak: 'W2', homeRecord: '30-1', awayRecord: '31-1', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'bet', name: 'Terence Crawford', abbreviation: 'TER', stats: { wins: 40, losses: 0, winPct: 1.000, streak: 'W10', homeRecord: '20-0', awayRecord: '20-0', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'usa', name: 'Jermell Charlo', abbreviation: 'JER', stats: { wins: 35, losses: 1, winPct: 0.944, streak: 'L1', homeRecord: '18-0', awayRecord: '17-1', pointsPerGame: 0, pointsAllowed: 0, ranking: 3 } },
  { id: 'nak', name: 'Naoya Inoue', abbreviation: 'NAO', stats: { wins: 27, losses: 0, winPct: 1.000, streak: 'W12', homeRecord: '14-0', awayRecord: '13-0', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
];

// Esports Teams
export const esportsTeams: Team[] = [
  { id: 'navi', name: 'Natus Vincere', abbreviation: 'NAVI', stats: { wins: 24, losses: 8, winPct: 0.750, streak: 'W3', homeRecord: '12-3', awayRecord: '12-5', pointsPerGame: 0, pointsAllowed: 0, ranking: 1 } },
  { id: 'faze', name: 'FaZe Clan', abbreviation: 'FAZE', stats: { wins: 22, losses: 10, winPct: 0.688, streak: 'W1', homeRecord: '11-4', awayRecord: '11-6', pointsPerGame: 0, pointsAllowed: 0, ranking: 2 } },
  { id: 'g2', name: 'G2 Esports', abbreviation: 'G2', stats: { wins: 20, losses: 12, winPct: 0.625, streak: 'L1', homeRecord: '10-5', awayRecord: '10-7', pointsPerGame: 0, pointsAllowed: 0, ranking: 4 } },
  { id: 'vit', name: 'Team Vitality', abbreviation: 'VIT', stats: { wins: 21, losses: 11, winPct: 0.656, streak: 'W2', homeRecord: '11-5', awayRecord: '10-6', pointsPerGame: 0, pointsAllowed: 0, ranking: 3 } },
];

// Combine all teams for reference
export const mockTeams: Team[] = [...nbaTeams, ...nflTeams, ...tennisPlayers, ...tableTennisPlayers, ...soccerTeams, ...mlbTeams, ...nhlTeams, ...ufcFighters, ...golfPlayers, ...boxingFighters, ...esportsTeams];

// IDs of games where odds are NOT yet available (Master Event Pool concept)
// These games exist in the schedule but betting markets haven't opened
const gamesWithoutOdds = new Set<string>([]);

// IDs of games where odds are suspended (markets temporarily closed)
const gamesWithSuspendedOdds = new Set<string>([]);

// Odds configurations to create varied bet signals (GOOD, BORDERLINE, PASS)
// We create odds that work WITH team win percentages to generate edges
type OddsProfile = 'good_home' | 'good_away' | 'borderline_home' | 'borderline_away' | 'pass' | 'pass_volatile';
const gameOddsProfile: Record<string, OddsProfile> = {
  // NBA - mix of signals
  'nba-1': 'good_home', 'nba-2': 'borderline_away', 'nba-3': 'good_away', 'nba-4': 'borderline_home',
  'nba-5': 'pass', 'nba-6': 'good_home', 'nba-7': 'borderline_home', 'nba-8': 'good_away',
  'nba-9': 'good_home', 'nba-10': 'borderline_away', 'nba-11': 'good_away', 'nba-12': 'pass',
  
  // NFL - strong edges
  'nfl-1': 'good_home', 'nfl-2': 'good_home', 'nfl-3': 'borderline_away', 'nfl-4': 'good_away',
  'nfl-5': 'borderline_home', 'nfl-6': 'good_home', 'nfl-7': 'good_away',
  
  // Tennis - varied
  'ten-1': 'good_home', 'ten-2': 'good_away', 'ten-3': 'borderline_home', 'ten-4': 'good_home',
  'ten-5': 'borderline_away', 'ten-6': 'pass', 'ten-7': 'good_home', 'ten-8': 'borderline_away',
  
  // Table Tennis
  'tt-1': 'good_home', 'tt-2': 'borderline_home', 'tt-3': 'good_away', 'tt-4': 'borderline_away',
  
  // Soccer
  'soc-1': 'good_home', 'soc-2': 'borderline_home', 'soc-3': 'good_away', 'soc-4': 'pass_volatile',
  'soc-5': 'borderline_away', 'soc-6': 'good_home', 'soc-7': 'good_away', 'soc-8': 'borderline_home',
  
  // MLB
  'mlb-1': 'good_home', 'mlb-2': 'borderline_away', 'mlb-3': 'good_away', 'mlb-4': 'borderline_home',
  'mlb-5': 'good_home', 'mlb-6': 'pass',
  
  // NHL
  'nhl-1': 'good_home', 'nhl-2': 'good_home', 'nhl-3': 'borderline_away', 'nhl-4': 'good_away',
  'nhl-5': 'borderline_home', 'nhl-6': 'good_home',
  
  // UFC - high edge potential
  'ufc-1': 'good_home', 'ufc-2': 'good_away', 'ufc-3': 'borderline_home', 'ufc-4': 'good_home',
  'ufc-5': 'borderline_away', 'ufc-6': 'good_home', 'ufc-7': 'good_away', 'ufc-8': 'borderline_home',
  
  // Golf
  'golf-1': 'good_home', 'golf-2': 'borderline_home', 'golf-3': 'good_away',
  
  // Boxing
  'box-1': 'good_home', 'box-2': 'good_away', 'box-3': 'borderline_home',
  
  // Esports
  'esp-1': 'good_home', 'esp-2': 'borderline_away', 'esp-3': 'good_away', 'esp-4': 'borderline_home',
};

// MASTER EVENT POOL - All scheduled games regardless of odds availability
// Games spread across next month with varied sports
export const mockGames: Game[] = [
  // TODAY & TOMORROW (Jan 6-7) - High density
  { id: 'nba-1', sport: 'NBA', homeTeam: nbaTeams[0], awayTeam: nbaTeams[1], startTime: '2026-01-06T19:30:00Z', venue: 'Crypto.com Arena', status: 'scheduled' },
  { id: 'nba-2', sport: 'NBA', homeTeam: nbaTeams[2], awayTeam: nbaTeams[3], startTime: '2026-01-06T22:00:00Z', venue: 'Chase Center', status: 'scheduled' },
  { id: 'nfl-1', sport: 'NFL', homeTeam: nflTeams[0], awayTeam: nflTeams[1], startTime: '2026-01-06T20:15:00Z', venue: 'Arrowhead Stadium', status: 'scheduled' },
  { id: 'ten-1', sport: 'Tennis', homeTeam: tennisPlayers[0], awayTeam: tennisPlayers[1], startTime: '2026-01-06T10:00:00Z', venue: 'Australian Open - Rod Laver Arena', status: 'scheduled' },
  { id: 'ten-2', sport: 'Tennis', homeTeam: tennisPlayers[2], awayTeam: tennisPlayers[3], startTime: '2026-01-06T14:00:00Z', venue: 'Australian Open - Margaret Court Arena', status: 'scheduled' },
  { id: 'tt-1', sport: 'Table Tennis', homeTeam: tableTennisPlayers[0], awayTeam: tableTennisPlayers[1], startTime: '2026-01-06T08:00:00Z', venue: 'WTT Singapore Smash', status: 'scheduled' },
  { id: 'tt-2', sport: 'Table Tennis', homeTeam: tableTennisPlayers[2], awayTeam: tableTennisPlayers[3], startTime: '2026-01-06T12:00:00Z', venue: 'WTT Singapore Smash', status: 'scheduled' },
  { id: 'soc-1', sport: 'Soccer', homeTeam: soccerTeams[0], awayTeam: soccerTeams[1], startTime: '2026-01-06T20:00:00Z', venue: 'Santiago Bernabéu', status: 'scheduled' },
  { id: 'mlb-1', sport: 'MLB', homeTeam: mlbTeams[0], awayTeam: mlbTeams[1], startTime: '2026-01-06T22:10:00Z', venue: 'Dodger Stadium', status: 'scheduled' },
  { id: 'nhl-1', sport: 'NHL', homeTeam: nhlTeams[0], awayTeam: nhlTeams[1], startTime: '2026-01-06T21:00:00Z', venue: 'Rogers Place', status: 'scheduled' },
  
  // Jan 7
  { id: 'nba-3', sport: 'NBA', homeTeam: nbaTeams[4], awayTeam: nbaTeams[5], startTime: '2026-01-07T19:00:00Z', venue: 'Wells Fargo Center', status: 'scheduled' },
  { id: 'nba-4', sport: 'NBA', homeTeam: nbaTeams[1], awayTeam: nbaTeams[0], startTime: '2026-01-07T20:00:00Z', venue: 'TD Garden', status: 'scheduled' },
  { id: 'nfl-2', sport: 'NFL', homeTeam: nflTeams[2], awayTeam: nflTeams[3], startTime: '2026-01-07T13:00:00Z', venue: 'Ford Field', status: 'scheduled' },
  { id: 'nfl-3', sport: 'NFL', homeTeam: nflTeams[1], awayTeam: nflTeams[2], startTime: '2026-01-07T16:30:00Z', venue: 'Highmark Stadium', status: 'scheduled' },
  { id: 'ten-3', sport: 'Tennis', homeTeam: tennisPlayers[4], awayTeam: tennisPlayers[5], startTime: '2026-01-07T10:00:00Z', venue: 'Australian Open - Rod Laver Arena', status: 'scheduled' },
  { id: 'ten-4', sport: 'Tennis', homeTeam: tennisPlayers[1], awayTeam: tennisPlayers[2], startTime: '2026-01-07T16:00:00Z', venue: 'Australian Open - Rod Laver Arena', status: 'scheduled' },
  { id: 'soc-2', sport: 'Soccer', homeTeam: soccerTeams[2], awayTeam: soccerTeams[3], startTime: '2026-01-07T17:30:00Z', venue: 'Etihad Stadium', status: 'scheduled' },
  { id: 'soc-3', sport: 'Soccer', homeTeam: soccerTeams[4], awayTeam: soccerTeams[5], startTime: '2026-01-07T20:00:00Z', venue: 'Emirates Stadium', status: 'scheduled' },
  { id: 'mlb-2', sport: 'MLB', homeTeam: mlbTeams[2], awayTeam: mlbTeams[3], startTime: '2026-01-07T19:20:00Z', venue: 'Truist Park', status: 'scheduled' },
  { id: 'nhl-2', sport: 'NHL', homeTeam: nhlTeams[2], awayTeam: nhlTeams[3], startTime: '2026-01-07T20:00:00Z', venue: 'Canada Life Centre', status: 'scheduled' },
  { id: 'tt-3', sport: 'Table Tennis', homeTeam: tableTennisPlayers[4], awayTeam: tableTennisPlayers[5], startTime: '2026-01-07T08:00:00Z', venue: 'WTT Singapore Smash', status: 'scheduled' },
  
  // Jan 8-10
  { id: 'nba-5', sport: 'NBA', homeTeam: nbaTeams[5], awayTeam: nbaTeams[2], startTime: '2026-01-08T21:00:00Z', venue: 'Ball Arena', status: 'scheduled' },
  { id: 'nba-6', sport: 'NBA', homeTeam: nbaTeams[3], awayTeam: nbaTeams[4], startTime: '2026-01-08T19:30:00Z', venue: 'Kaseya Center', status: 'scheduled' },
  { id: 'nfl-4', sport: 'NFL', homeTeam: nflTeams[3], awayTeam: nflTeams[0], startTime: '2026-01-08T20:15:00Z', venue: 'Lincoln Financial Field', status: 'scheduled' },
  { id: 'ten-5', sport: 'Tennis', homeTeam: tennisPlayers[0], awayTeam: tennisPlayers[4], startTime: '2026-01-08T14:00:00Z', venue: 'Australian Open - Rod Laver Arena', status: 'scheduled' },
  { id: 'soc-4', sport: 'Soccer', homeTeam: soccerTeams[3], awayTeam: soccerTeams[0], startTime: '2026-01-08T15:00:00Z', venue: 'Anfield', status: 'scheduled' },
  { id: 'mlb-3', sport: 'MLB', homeTeam: mlbTeams[1], awayTeam: mlbTeams[0], startTime: '2026-01-08T19:05:00Z', venue: 'Yankee Stadium', status: 'scheduled' },
  { id: 'nhl-3', sport: 'NHL', homeTeam: nhlTeams[1], awayTeam: nhlTeams[2], startTime: '2026-01-08T19:00:00Z', venue: 'Amerant Bank Arena', status: 'scheduled' },
  { id: 'tt-4', sport: 'Table Tennis', homeTeam: tableTennisPlayers[0], awayTeam: tableTennisPlayers[4], startTime: '2026-01-08T10:00:00Z', venue: 'WTT Singapore Smash - Finals', status: 'scheduled' },
  { id: 'nba-7', sport: 'NBA', homeTeam: nbaTeams[0], awayTeam: nbaTeams[2], startTime: '2026-01-09T22:00:00Z', venue: 'Crypto.com Arena', status: 'scheduled' },
  { id: 'ten-6', sport: 'Tennis', homeTeam: tennisPlayers[3], awayTeam: tennisPlayers[5], startTime: '2026-01-09T10:00:00Z', venue: 'Australian Open - Margaret Court Arena', status: 'scheduled' },
  { id: 'soc-5', sport: 'Soccer', homeTeam: soccerTeams[1], awayTeam: soccerTeams[4], startTime: '2026-01-09T20:00:00Z', venue: 'Camp Nou', status: 'scheduled' },
  { id: 'nhl-4', sport: 'NHL', homeTeam: nhlTeams[3], awayTeam: nhlTeams[0], startTime: '2026-01-09T21:00:00Z', venue: 'T-Mobile Arena', status: 'scheduled' },
  { id: 'ten-7', sport: 'Tennis', homeTeam: tennisPlayers[0], awayTeam: tennisPlayers[2], startTime: '2026-01-10T14:00:00Z', venue: 'Australian Open - Rod Laver Arena', status: 'scheduled' },
  { id: 'soc-6', sport: 'Soccer', homeTeam: soccerTeams[5], awayTeam: soccerTeams[2], startTime: '2026-01-10T17:30:00Z', venue: 'Allianz Arena', status: 'scheduled' },
  { id: 'nhl-5', sport: 'NHL', homeTeam: nhlTeams[0], awayTeam: nhlTeams[3], startTime: '2026-01-10T20:00:00Z', venue: 'Rogers Place', status: 'scheduled' },
  
  // WEEK 2 (Jan 11-17) - UFC Event!
  { id: 'ufc-1', sport: 'UFC', homeTeam: ufcFighters[0], awayTeam: ufcFighters[7], startTime: '2026-01-11T22:00:00Z', venue: 'T-Mobile Arena - UFC 315', status: 'scheduled' },
  { id: 'ufc-2', sport: 'UFC', homeTeam: ufcFighters[1], awayTeam: ufcFighters[3], startTime: '2026-01-11T21:00:00Z', venue: 'T-Mobile Arena - UFC 315', status: 'scheduled' },
  { id: 'ufc-3', sport: 'UFC', homeTeam: ufcFighters[2], awayTeam: ufcFighters[5], startTime: '2026-01-11T20:00:00Z', venue: 'T-Mobile Arena - UFC 315', status: 'scheduled' },
  { id: 'ufc-4', sport: 'UFC', homeTeam: ufcFighters[4], awayTeam: ufcFighters[6], startTime: '2026-01-11T19:00:00Z', venue: 'T-Mobile Arena - UFC 315', status: 'scheduled' },
  { id: 'nfl-5', sport: 'NFL', homeTeam: nflTeams[0], awayTeam: nflTeams[2], startTime: '2026-01-12T13:00:00Z', venue: 'Arrowhead Stadium', status: 'scheduled' },
  { id: 'nba-8', sport: 'NBA', homeTeam: nbaTeams[4], awayTeam: nbaTeams[1], startTime: '2026-01-12T19:30:00Z', venue: 'Wells Fargo Center', status: 'scheduled' },
  { id: 'nba-9', sport: 'NBA', homeTeam: nbaTeams[0], awayTeam: nbaTeams[5], startTime: '2026-01-13T22:00:00Z', venue: 'Crypto.com Arena', status: 'scheduled' },
  { id: 'soc-7', sport: 'Soccer', homeTeam: soccerTeams[0], awayTeam: soccerTeams[4], startTime: '2026-01-14T20:00:00Z', venue: 'Santiago Bernabéu', status: 'scheduled' },
  { id: 'nhl-6', sport: 'NHL', homeTeam: nhlTeams[2], awayTeam: nhlTeams[1], startTime: '2026-01-15T20:00:00Z', venue: 'Canada Life Centre', status: 'scheduled' },
  { id: 'mlb-4', sport: 'MLB', homeTeam: mlbTeams[0], awayTeam: mlbTeams[2], startTime: '2026-01-16T22:10:00Z', venue: 'Dodger Stadium', status: 'scheduled' },
  
  // WEEK 3 (Jan 18-24) - More UFC + Golf Tournament
  { id: 'golf-1', sport: 'Golf', homeTeam: golfPlayers[0], awayTeam: golfPlayers[1], startTime: '2026-01-18T12:00:00Z', venue: 'TPC Scottsdale - WM Phoenix Open', status: 'scheduled' },
  { id: 'golf-2', sport: 'Golf', homeTeam: golfPlayers[2], awayTeam: golfPlayers[3], startTime: '2026-01-19T12:00:00Z', venue: 'TPC Scottsdale - WM Phoenix Open', status: 'scheduled' },
  { id: 'nfl-6', sport: 'NFL', homeTeam: nflTeams[2], awayTeam: nflTeams[0], startTime: '2026-01-19T18:30:00Z', venue: 'Ford Field - NFC Championship', status: 'scheduled' },
  { id: 'nfl-7', sport: 'NFL', homeTeam: nflTeams[1], awayTeam: nflTeams[3], startTime: '2026-01-19T15:00:00Z', venue: 'Highmark Stadium - AFC Championship', status: 'scheduled' },
  { id: 'ufc-5', sport: 'UFC', homeTeam: ufcFighters[5], awayTeam: ufcFighters[2], startTime: '2026-01-18T22:00:00Z', venue: 'UFC APEX - Fight Night', status: 'scheduled' },
  { id: 'ufc-6', sport: 'UFC', homeTeam: ufcFighters[3], awayTeam: ufcFighters[4], startTime: '2026-01-18T20:00:00Z', venue: 'UFC APEX - Fight Night', status: 'scheduled' },
  { id: 'nba-10', sport: 'NBA', homeTeam: nbaTeams[1], awayTeam: nbaTeams[3], startTime: '2026-01-20T19:30:00Z', venue: 'TD Garden', status: 'scheduled' },
  { id: 'soc-8', sport: 'Soccer', homeTeam: soccerTeams[3], awayTeam: soccerTeams[1], startTime: '2026-01-21T20:00:00Z', venue: 'Anfield', status: 'scheduled' },
  { id: 'ten-8', sport: 'Tennis', homeTeam: tennisPlayers[1], awayTeam: tennisPlayers[0], startTime: '2026-01-22T10:00:00Z', venue: 'Australian Open - Final', status: 'scheduled' },
  { id: 'golf-3', sport: 'Golf', homeTeam: golfPlayers[0], awayTeam: golfPlayers[2], startTime: '2026-01-21T14:00:00Z', venue: 'TPC Scottsdale - WM Phoenix Open Final', status: 'scheduled' },
  
  // WEEK 4 (Jan 25-31) - Boxing + More UFC
  { id: 'box-1', sport: 'Boxing', homeTeam: boxingFighters[0], awayTeam: boxingFighters[2], startTime: '2026-01-25T23:00:00Z', venue: 'T-Mobile Arena - Main Event', status: 'scheduled' },
  { id: 'box-2', sport: 'Boxing', homeTeam: boxingFighters[1], awayTeam: boxingFighters[3], startTime: '2026-01-25T21:00:00Z', venue: 'T-Mobile Arena - Co-Main', status: 'scheduled' },
  { id: 'ufc-7', sport: 'UFC', homeTeam: ufcFighters[0], awayTeam: ufcFighters[2], startTime: '2026-01-25T22:00:00Z', venue: 'Madison Square Garden - UFC 316', status: 'scheduled' },
  { id: 'ufc-8', sport: 'UFC', homeTeam: ufcFighters[1], awayTeam: ufcFighters[4], startTime: '2026-01-25T20:00:00Z', venue: 'Madison Square Garden - UFC 316', status: 'scheduled' },
  { id: 'nba-11', sport: 'NBA', homeTeam: nbaTeams[2], awayTeam: nbaTeams[0], startTime: '2026-01-27T22:00:00Z', venue: 'Chase Center', status: 'scheduled' },
  { id: 'nba-12', sport: 'NBA', homeTeam: nbaTeams[5], awayTeam: nbaTeams[4], startTime: '2026-01-28T21:00:00Z', venue: 'Ball Arena', status: 'scheduled' },
  { id: 'mlb-5', sport: 'MLB', homeTeam: mlbTeams[3], awayTeam: mlbTeams[1], startTime: '2026-01-29T19:20:00Z', venue: 'Minute Maid Park', status: 'scheduled' },
  { id: 'mlb-6', sport: 'MLB', homeTeam: mlbTeams[2], awayTeam: mlbTeams[0], startTime: '2026-01-30T19:05:00Z', venue: 'Truist Park', status: 'scheduled' },
  
  // WEEK 5 (Feb 1-6) - Esports Major + More events
  { id: 'esp-1', sport: 'Esports', homeTeam: esportsTeams[0], awayTeam: esportsTeams[1], startTime: '2026-02-01T18:00:00Z', venue: 'IEM Katowice - Grand Finals', status: 'scheduled' },
  { id: 'esp-2', sport: 'Esports', homeTeam: esportsTeams[2], awayTeam: esportsTeams[3], startTime: '2026-02-01T15:00:00Z', venue: 'IEM Katowice - Semi Finals', status: 'scheduled' },
  { id: 'esp-3', sport: 'Esports', homeTeam: esportsTeams[0], awayTeam: esportsTeams[2], startTime: '2026-02-02T18:00:00Z', venue: 'IEM Katowice - Finals', status: 'scheduled' },
  { id: 'esp-4', sport: 'Esports', homeTeam: esportsTeams[1], awayTeam: esportsTeams[3], startTime: '2026-02-02T15:00:00Z', venue: 'IEM Katowice - 3rd Place', status: 'scheduled' },
  { id: 'box-3', sport: 'Boxing', homeTeam: boxingFighters[3], awayTeam: boxingFighters[0], startTime: '2026-02-03T23:00:00Z', venue: 'Tokyo Dome - Super Fight', status: 'scheduled' },
];

// Helper to check if game has odds available
export const hasOddsAvailable = (gameId: string): boolean => {
  return !gamesWithoutOdds.has(gameId) && !gamesWithSuspendedOdds.has(gameId);
};

// Get odds status for a game
export const getOddsStatus = (gameId: string): 'available' | 'pending' | 'suspended' => {
  if (gamesWithSuspendedOdds.has(gameId)) return 'suspended';
  if (gamesWithoutOdds.has(gameId)) return 'pending';
  return 'available';
};

// Performance history for charts
const generatePerformanceHistory = (): PerformanceData[] => {
  const data: PerformanceData[] = [];
  const baseDate = new Date('2025-12-01');
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const predicted = 55 + Math.random() * 20;
    const variance = (Math.random() - 0.5) * 15;
    data.push({
      date: date.toISOString().split('T')[0],
      predicted: Math.round(predicted * 10) / 10,
      actual: Math.round((predicted + variance) * 10) / 10,
    });
  }
  return data;
};

export const getGameFacts = (gameId: string): GameFacts | null => {
  const game = mockGames.find(g => g.id === gameId);
  if (!game) return null;

  const sport = game.sport;
  const isHighProfile = game.homeTeam.stats?.ranking && game.homeTeam.stats.ranking <= 3;
  const oddsStatus = getOddsStatus(gameId);
  
  // Generate sport-appropriate injuries
  const generateInjuries = (): Injury[] => {
    if (sport === 'Tennis' || sport === 'Table Tennis') {
      return [
        { team: game.homeTeam.name, player: game.homeTeam.name, position: 'Player', injuryType: 'Shoulder fatigue', status: 'Probable', startDate: '2026-01-04', gamesMissed: 0 },
      ];
    }
    return [
      { team: game.homeTeam.name, player: 'Star Player', position: sport === 'Soccer' ? 'Forward' : 'Starter', injuryType: 'Knee soreness', status: 'Questionable', startDate: '2026-01-03', gamesMissed: 2 },
      { team: game.awayTeam.name, player: 'Key Defender', position: sport === 'Soccer' ? 'CB' : 'Defender', injuryType: 'Ankle sprain', status: 'Probable', startDate: '2026-01-04', gamesMissed: 1 },
    ];
  };

  // Get odds profile for this game to generate varied bet signals
  const profile = gameOddsProfile[gameId] || 'pass';
  
  // Generate odds based on profile to create correct bet signals
  // GOOD needs: edge >= 4% and confidence >= 70% (low implied prob vs model prob)
  // BORDERLINE needs: edge >= 2% and < 4%
  // PASS: edge < 2% or high volatility
  const getOddsForProfile = (p: OddsProfile): OddsData => {
    // Model probability will be based on team stats (typically 50-70% for favorites)
    // We need implied probabilities that create the desired edge when compared to model
    const homeWinPct = game.homeTeam.stats?.winPct ?? 0.5;
    const awayWinPct = game.awayTeam.stats?.winPct ?? 0.5;
    // Approximate model home probability (will be refined by actual calculation)
    const approxModelHome = Math.min(0.75, Math.max(0.35, homeWinPct * 0.5 + 0.25 + 0.04));
    
    switch (p) {
      case 'good_home':
        // Market significantly undervalues home - creates 5%+ edge
        return {
          moneyline: { home: +150, away: -180 },
          spread: { home: +3.5, away: -3.5, line: -110 },
          total: { over: -110, under: -110, line: sport === 'Soccer' ? 2.5 : 218.5 },
          impliedProb: { homePct: 40.0, awayPct: 64.3 }, // Very low home implied = big edge
          lineMovement: {
            opening: { home: +160, away: -190 },
            current: { home: +150, away: -180 },
          },
        };
      case 'good_away':
        // Market significantly undervalues away - creates 5%+ edge
        return {
          moneyline: { home: -250, away: +200 },
          spread: { home: -6.5, away: +6.5, line: -110 },
          total: { over: -110, under: -110, line: sport === 'Soccer' ? 2.5 : 222.5 },
          impliedProb: { homePct: 71.4, awayPct: 33.3 }, // Very low away implied
          lineMovement: {
            opening: { home: -230, away: +190 },
            current: { home: -250, away: +200 },
          },
        };
      case 'borderline_home':
        // Market slightly undervalues home - creates 2-4% edge
        return {
          moneyline: { home: +110, away: -130 },
          spread: { home: +1.5, away: -1.5, line: -110 },
          total: { over: -110, under: -110, line: sport === 'Soccer' ? 2.5 : 220.5 },
          impliedProb: { homePct: 47.6, awayPct: 56.5 },
          lineMovement: {
            opening: { home: +115, away: -135 },
            current: { home: +110, away: -130 },
          },
        };
      case 'borderline_away':
        // Market slightly undervalues away - creates 2-4% edge
        return {
          moneyline: { home: -180, away: +155 },
          spread: { home: -4.5, away: +4.5, line: -110 },
          total: { over: -110, under: -110, line: sport === 'Soccer' ? 3.0 : 226.5 },
          impliedProb: { homePct: 64.3, awayPct: 39.2 },
          lineMovement: {
            opening: { home: -175, away: +150 },
            current: { home: -180, away: +155 },
          },
        };
      case 'pass_volatile':
        // High line movement = volatile = PASS due to risk
        return {
          moneyline: { home: -130, away: +110 },
          spread: { home: -2.5, away: +2.5, line: -110 },
          total: { over: -110, under: -110, line: sport === 'Soccer' ? 2.5 : 224.5 },
          impliedProb: { homePct: 56.5, awayPct: 47.6 },
          lineMovement: {
            opening: { home: -180, away: +160 }, // 50 cent move = High volatility
            current: { home: -130, away: +110 },
          },
        };
      case 'pass':
      default:
        // Fair odds matching model - no edge
        return {
          moneyline: { home: -140, away: +120 },
          spread: { home: -3.0, away: +3.0, line: -110 },
          total: { over: -110, under: -110, line: sport === 'Soccer' ? 2.5 : 224.5 },
          impliedProb: { homePct: 58.3, awayPct: 45.5 }, // Close to model = no edge
          lineMovement: {
            opening: { home: -140, away: +120 },
            current: { home: -140, away: +120 },
          },
        };
    }
  };
  
  // Only provide odds if they're available (Master Event Pool concept)
  const odds: OddsData | null = oddsStatus === 'available' ? getOddsForProfile(profile) : null;

  return {
    game,
    odds,
    oddsStatus,
    injuries: generateInjuries(),
    recentForm: {
      homeLast5: [
        { opponent: 'OPP1', result: 'W', score: sport === 'Soccer' ? '2-1' : '112-105', date: '2026-01-04' },
        { opponent: 'OPP2', result: 'L', score: sport === 'Soccer' ? '0-1' : '98-110', date: '2026-01-02' },
        { opponent: 'OPP3', result: 'W', score: sport === 'Soccer' ? '3-0' : '121-115', date: '2025-12-31' },
        { opponent: 'OPP4', result: 'W', score: sport === 'Soccer' ? '2-0' : '108-102', date: '2025-12-29' },
        { opponent: 'OPP5', result: 'L', score: sport === 'Soccer' ? '1-2' : '105-118', date: '2025-12-27' },
      ],
      awayLast5: [
        { opponent: 'OPP1', result: 'W', score: sport === 'Soccer' ? '2-0' : '118-112', date: '2026-01-04' },
        { opponent: 'OPP2', result: 'W', score: sport === 'Soccer' ? '1-0' : '125-120', date: '2026-01-02' },
        { opponent: 'OPP3', result: 'W', score: sport === 'Soccer' ? '4-1' : '132-108', date: '2025-12-31' },
        { opponent: 'OPP4', result: 'L', score: sport === 'Soccer' ? '0-2' : '99-105', date: '2025-12-29' },
        { opponent: 'OPP5', result: 'W', score: sport === 'Soccer' ? '3-1' : '110-102', date: '2025-12-27' },
      ],
    },
    headToHead: [
      { date: '2025-12-15', winner: game.awayTeam.abbreviation, score: sport === 'Soccer' ? '2-1' : '115-108', location: game.awayTeam.name },
      { date: '2025-03-08', winner: game.homeTeam.abbreviation, score: sport === 'Soccer' ? '1-0' : '122-118', location: game.homeTeam.name },
      { date: '2024-12-25', winner: game.awayTeam.abbreviation, score: sport === 'Soccer' ? '3-2' : '139-132', location: game.homeTeam.name },
      { date: '2024-02-01', winner: game.homeTeam.abbreviation, score: sport === 'Soccer' ? '2-0' : '105-96', location: game.awayTeam.name },
      { date: '2023-12-18', winner: game.awayTeam.abbreviation, score: sport === 'Soccer' ? '2-1' : '126-115', location: game.homeTeam.name },
    ],
    context: {
      homeIsHomeStrong: game.homeTeam.stats?.homeRecord ? parseInt(game.homeTeam.stats.homeRecord.split('-')[0]) > parseInt(game.homeTeam.stats.homeRecord.split('-')[1]) : true,
      awayIsAwayStrong: game.awayTeam.stats?.awayRecord ? parseInt(game.awayTeam.stats.awayRecord.split('-')[0]) > parseInt(game.awayTeam.stats.awayRecord.split('-')[1]) : false,
      restDays: { home: 1, away: 1 },
      backToBack: { home: false, away: false },
    },
    risk: isHighProfile ? {
      level: 'Medium',
      reasons: [
        'Key player listed as Questionable',
        'Line has moved 15 cents toward home team',
        'Away team on strong recent form (4-1)',
        'Both teams well-rested',
      ],
    } : {
      level: 'Low',
      reasons: [
        'No major injuries reported',
        'Minimal line movement',
        'Both teams playing at expected level',
      ],
    },
    lastUpdated: new Date().toISOString(),
    performanceHistory: generatePerformanceHistory(),
  };
};

// Platform win ratio stats - QUALIFIED PICKS ONLY (GOOD bets)
export const platformStats = {
  // Qualified picks only (GOOD signal bets)
  totalQualified: 487,
  correctQualified: 352,
  qualifiedWinRate: 72.3,
  averageConfidence: 74.2,
  streakCurrent: 8,
  streakBest: 14,
  // Sport breakdown - qualified picks only (varied win rates per sport)
  sportBreakdown: [
    { sport: 'NFL', qualified: 68, wins: 56, winRate: 82.4 },
    { sport: 'UFC', qualified: 52, wins: 42, winRate: 80.8 },
    { sport: 'NBA', qualified: 98, wins: 76, winRate: 77.6 },
    { sport: 'Tennis', qualified: 78, wins: 57, winRate: 73.1 },
    { sport: 'Soccer', qualified: 72, wins: 50, winRate: 69.4 },
    { sport: 'MLB', qualified: 45, wins: 30, winRate: 66.7 },
    { sport: 'Table Tennis', qualified: 38, wins: 24, winRate: 63.2 },
    { sport: 'NHL', qualified: 36, wins: 17, winRate: 47.2 },
  ],
};

export const mockAIExplanation = `
## ODDS EXPLAINED
The home team is favored at -145 on the moneyline, implying a 59.2% win probability. The spread of -3.5 suggests oddsmakers expect a close game with the home team winning by 3-4 points. The total of 224.5 indicates expectations of a moderately-paced, average-scoring contest.

## INJURY IMPACT
- **Star Player (Questionable)**: Absence would significantly impact the team's performance. Monitor pregame reports.
- **Key Defender (Probable)**: Expected to play but may be on a minutes restriction.

## RECENT FORM & HISTORY
The home team is 3-2 in their last 5, with quality wins. The away team enters hot at 4-1. Head-to-head, the away team has won 3 of the last 5 meetings.

## RISK / VOLATILITY
- **Level: Medium**
- The questionable status of a key player creates uncertainty. The 15-cent line move suggests sharp money has been placed.

## WHAT TO WATCH
- Pregame injury report confirmation
- First quarter pace and defensive intensity
- Fourth quarter execution in what projects as a close game

---
*This is informational only, not betting advice. No guarantees.*
`;
