const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

function getClientIdentifier(req: Request): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('cf-connecting-ip') || 
         'anonymous';
}

// Cache for picks data
let cachedPicks: Pick[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface Pick {
  id: string;
  platform: string;
  sport: string;
  playerName: string;
  playerImage: string;
  team: string;
  opponent: string;
  gameDate: string;
  gameTime: string;
  propType: string;
  line: number;
  direction: 'MORE' | 'LESS';
  confidence: number;
  hitRate?: number;
  projection?: number;
}

// Platform mapping
const PLATFORMS = [
  'PrizePicks',
  'Underdog', 
  'Pick6',
  'Sleeper',
  'FanDuel',
  'DraftKings',
  'BetMGM',
  'BetRivers',
  'RTSports',
  'Hard Rock',
  'Caesars'
];

// Parse picks from RotoWire markdown
function parseRotoWireMarkdown(markdown: string): Pick[] {
  const picks: Pick[] = [];
  const lines = markdown.split('\n');
  
  let currentDirection: 'MORE' | 'LESS' = 'MORE';
  let i = 0;
  
  // Find where MORE section starts
  while (i < lines.length && !lines[i].includes('LeaningMORE')) {
    i++;
  }
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Track direction changes
    if (line.includes('LeaningMORE')) {
      currentDirection = 'MORE';
      i++;
      continue;
    }
    if (line.includes('LeaningLESS')) {
      currentDirection = 'LESS';
      i++;
      continue;
    }
    
    // Look for player image pattern from RotoWire
    const imageMatch = line.match(/!\[([^\]]+)\]\((https:\/\/content\.rotowire\.com\/images\/headshots\/[^)]+)\)/);
    
    if (imageMatch) {
      const playerName = imageMatch[1];
      const playerImage = imageMatch[2];
      
      // Skip if it's a team logo
      if (playerImage.includes('teamlogo')) {
        i++;
        continue;
      }
      
      // Determine sport from image URL
      let sport = 'NFL';
      if (playerImage.includes('/nba/')) sport = 'NBA';
      else if (playerImage.includes('/mlb/')) sport = 'MLB';
      else if (playerImage.includes('/nhl/')) sport = 'NHL';
      else if (playerImage.includes('/nfl/') || playerImage.includes('/football/')) sport = 'NFL';
      
      // Look ahead to find team, opponent, date, time, line, and prop type
      let team = '';
      let opponent = '';
      let gameDate = '';
      let gameTime = '';
      let propLine = 0;
      let propType = '';
      let platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
      
      // Scan next 30 lines for pick details
      for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
        const nextLine = lines[j].trim();
        
        // Team abbreviation (usually 2-3 uppercase letters alone)
        if (!team && /^[A-Z]{2,3}$/.test(nextLine)) {
          team = nextLine;
          continue;
        }
        
        // Opponent pattern (vs or @)
        const oppMatch = nextLine.match(/^(vs|@)\s*([A-Z]{2,3})$/i);
        if (oppMatch) {
          opponent = `${oppMatch[1]} ${oppMatch[2]}`;
          continue;
        }
        
        // Date pattern
        const dateMatch = nextLine.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}$/i);
        if (dateMatch) {
          gameDate = nextLine;
          continue;
        }
        
        // Time pattern
        const timeMatch = nextLine.match(/^\d{1,2}:\d{2}\s*(am|pm)$/i);
        if (timeMatch) {
          gameTime = nextLine;
          continue;
        }
        
        // Line (number with optional decimal)
        const lineMatch = nextLine.match(/^(\d+\.?\d*)$/);
        if (lineMatch && !propLine) {
          propLine = parseFloat(lineMatch[1]);
          continue;
        }
        
        // Prop type
        if (nextLine.match(/^(Passing Yards|Rushing Yards|Receiving Yards|Rushing \+ Receiving|Receptions|Touchdowns|Points|Rebounds|Assists|Strikeouts|Hits|RBIs|Total Bases|Runs|Walks|Stolen Bases|Outs|Earned Runs|3-Pointers|Steals|Blocks|Shots|Goals|Blocked Shots|Completions|Passing TDs|Rushing TDs|Receiving TDs|Interceptions|Rushing Attempts|Fantasy Score|Longest Reception|Sacks|Tackles|Saves|Pitcher Outs|Hits Allowed|Pitcher Strikeouts|Home Runs)$/i)) {
          propType = nextLine;
          break; // We found the prop type, we have enough info
        }
        
        // Platform detection
        const platformMatch = PLATFORMS.find(p => nextLine.toLowerCase() === p.toLowerCase());
        if (platformMatch) {
          platform = platformMatch;
        }
        
        // Break if we hit next player image
        if (nextLine.match(/!\[.*\]\(https:\/\/content\.rotowire\.com\/images\/headshots/)) {
          break;
        }
        
        // Break if subscriber-only (we still want to create a pick)
        if (nextLine.includes('Subscriber-Only')) {
          break;
        }
      }
      
      // Only add if we have minimum required fields
      if (playerName && propType) {
        const confidence = Math.floor(Math.random() * 25) + 65;
        const hitRate = Math.floor(Math.random() * 20) + 55;
        
        picks.push({
          id: `${playerName}-${propType}-${currentDirection}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.replace(/\s/g, '-').toLowerCase(),
          platform,
          sport,
          playerName,
          playerImage,
          team: team || 'TBD',
          opponent: opponent || 'TBD',
          gameDate: gameDate || 'Today',
          gameTime: gameTime || 'TBD',
          propType,
          line: propLine || generateDefaultLine(propType),
          direction: currentDirection,
          confidence,
          hitRate,
          projection: propLine ? Math.round(propLine * (currentDirection === 'MORE' ? 1.12 : 0.88) * 10) / 10 : undefined,
        });
      }
    }
    
    i++;
  }
  
  return picks;
}

// Generate default line based on prop type
function generateDefaultLine(propType: string): number {
  const defaults: Record<string, number> = {
    'Passing Yards': 250,
    'Rushing Yards': 65,
    'Receiving Yards': 55,
    'Rushing + Receiving': 85,
    'Receptions': 5,
    'Points': 24,
    'Rebounds': 8,
    'Assists': 6,
    '3-Pointers': 3,
    'Strikeouts': 6,
    'Hits': 1.5,
    'Total Bases': 2.5,
    'RBIs': 1,
    'Shots': 4,
    'Goals': 0.5,
  };
  return defaults[propType] || 10;
}

// ESPN headshot URL helper - uses player ID
function getESPNHeadshot(playerId: string, sport: 'nfl' | 'nba' | 'mlb' | 'nhl' = 'nfl'): string {
  return `https://a.espncdn.com/i/headshots/${sport}/players/full/${playerId}.png`;
}

// Expanded player database with ESPN IDs for headshots
const PLAYER_DATABASE = {
  nfl: [
    { name: 'Patrick Mahomes', team: 'KC', espnId: '3139477', props: ['Passing Yards', 'Passing TDs', 'Completions', 'Interceptions'] },
    { name: 'Josh Allen', team: 'BUF', espnId: '3918298', props: ['Passing Yards', 'Rushing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Lamar Jackson', team: 'BAL', espnId: '3916387', props: ['Passing Yards', 'Rushing Yards', 'Passing TDs', 'Rushing TDs'] },
    { name: 'Jalen Hurts', team: 'PHI', espnId: '4040715', props: ['Passing Yards', 'Rushing Yards', 'Passing TDs', 'Rushing TDs'] },
    { name: 'Joe Burrow', team: 'CIN', espnId: '3915511', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Dak Prescott', team: 'DAL', espnId: '2577417', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Tua Tagovailoa', team: 'MIA', espnId: '4241479', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'C.J. Stroud', team: 'HOU', espnId: '4432577', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Brock Purdy', team: 'SF', espnId: '4361741', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Jordan Love', team: 'GB', espnId: '4036378', props: ['Passing Yards', 'Passing TDs', 'Interceptions'] },
    { name: 'Caleb Williams', team: 'CHI', espnId: '4429013', props: ['Passing Yards', 'Passing TDs', 'Rushing Yards'] },
    { name: 'Jayden Daniels', team: 'WAS', espnId: '4426354', props: ['Passing Yards', 'Rushing Yards', 'Passing TDs'] },
    { name: 'Bo Nix', team: 'DEN', espnId: '4361529', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Drake Maye', team: 'NE', espnId: '4429022', props: ['Passing Yards', 'Passing TDs', 'Interceptions'] },
    { name: 'Derrick Henry', team: 'BAL', espnId: '3043078', props: ['Rushing Yards', 'Rushing + Receiving', 'Rushing Attempts', 'Rushing TDs'] },
    { name: 'Saquon Barkley', team: 'PHI', espnId: '3929630', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions', 'Rushing TDs'] },
    { name: 'Christian McCaffrey', team: 'SF', espnId: '3117251', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions', 'Receiving Yards'] },
    { name: 'Bijan Robinson', team: 'ATL', espnId: '4426348', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Breece Hall', team: 'NYJ', espnId: '4362628', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Jonathan Taylor', team: 'IND', espnId: '4242335', props: ['Rushing Yards', 'Rushing + Receiving', 'Rushing Attempts'] },
    { name: 'Josh Jacobs', team: 'GB', espnId: '4047365', props: ['Rushing Yards', 'Rushing + Receiving', 'Rushing Attempts'] },
    { name: 'De\'Von Achane', team: 'MIA', espnId: '4429795', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Jahmyr Gibbs', team: 'DET', espnId: '4426385', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Kyren Williams', team: 'LAR', espnId: '4361579', props: ['Rushing Yards', 'Rushing + Receiving', 'Rushing TDs'] },
    { name: 'James Cook', team: 'BUF', espnId: '4361777', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Alvin Kamara', team: 'NO', espnId: '3054850', props: ['Rushing Yards', 'Receiving Yards', 'Receptions'] },
    { name: 'Tyreek Hill', team: 'MIA', espnId: '3116406', props: ['Receiving Yards', 'Receptions', 'Longest Reception', 'Receiving TDs'] },
    { name: 'Ja\'Marr Chase', team: 'CIN', espnId: '4362628', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'CeeDee Lamb', team: 'DAL', espnId: '4241389', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'A.J. Brown', team: 'PHI', espnId: '4047650', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Amon-Ra St. Brown', team: 'DET', espnId: '4360438', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Davante Adams', team: 'NYJ', espnId: '2976499', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Travis Kelce', team: 'KC', espnId: '2976212', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'T.J. Hockenson', team: 'MIN', espnId: '4040980', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'George Kittle', team: 'SF', espnId: '2976630', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Puka Nacua', team: 'LAR', espnId: '4569618', props: ['Receiving Yards', 'Receptions', 'Longest Reception'] },
    { name: 'Nico Collins', team: 'HOU', espnId: '4242546', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Mike Evans', team: 'TB', espnId: '16737', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Malik Nabers', team: 'NYG', espnId: '4432577', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Marvin Harrison Jr.', team: 'ARI', espnId: '4429160', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Cooper Kupp', team: 'LAR', espnId: '3046779', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Justin Jefferson', team: 'MIN', espnId: '4262921', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Stefon Diggs', team: 'HOU', espnId: '2976592', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'DK Metcalf', team: 'SEA', espnId: '4047646', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Garrett Wilson', team: 'NYJ', espnId: '4362873', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
  ],
  nba: [
    { name: 'LeBron James', team: 'LAL', espnId: '1966', props: ['Points', 'Rebounds', 'Assists', 'Steals'] },
    { name: 'Stephen Curry', team: 'GSW', espnId: '3975', props: ['Points', '3-Pointers', 'Assists'] },
    { name: 'Luka Doncic', team: 'DAL', espnId: '3945274', props: ['Points', 'Assists', 'Rebounds', '3-Pointers'] },
    { name: 'Giannis Antetokounmpo', team: 'MIL', espnId: '3032977', props: ['Points', 'Rebounds', 'Assists', 'Blocks'] },
    { name: 'Kevin Durant', team: 'PHX', espnId: '3202', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Nikola Jokic', team: 'DEN', espnId: '3112335', props: ['Points', 'Assists', 'Rebounds'] },
    { name: 'Joel Embiid', team: 'PHI', espnId: '3059318', props: ['Points', 'Rebounds', 'Blocks'] },
    { name: 'Jayson Tatum', team: 'BOS', espnId: '4065648', props: ['Points', 'Rebounds', 'Assists', '3-Pointers'] },
    { name: 'Anthony Edwards', team: 'MIN', espnId: '4594327', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Shai Gilgeous-Alexander', team: 'OKC', espnId: '4278073', props: ['Points', 'Assists', 'Steals'] },
    { name: 'Donovan Mitchell', team: 'CLE', espnId: '3908809', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Devin Booker', team: 'PHX', espnId: '3136193', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Ja Morant', team: 'MEM', espnId: '4279888', props: ['Points', 'Assists', 'Rebounds'] },
    { name: 'Trae Young', team: 'ATL', espnId: '4277905', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Damian Lillard', team: 'MIL', espnId: '6606', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Tyrese Haliburton', team: 'IND', espnId: '4396993', props: ['Points', 'Assists', 'Steals'] },
    { name: 'De\'Aaron Fox', team: 'SAC', espnId: '4066259', props: ['Points', 'Assists', 'Steals'] },
    { name: 'Jaylen Brown', team: 'BOS', espnId: '3917376', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Kawhi Leonard', team: 'LAC', espnId: '6450', props: ['Points', 'Rebounds', 'Steals'] },
    { name: 'Paolo Banchero', team: 'ORL', espnId: '4433134', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Domantas Sabonis', team: 'SAC', espnId: '3155942', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Bam Adebayo', team: 'MIA', espnId: '4066261', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Jimmy Butler', team: 'MIA', espnId: '6430', props: ['Points', 'Rebounds', 'Assists', 'Steals'] },
    { name: 'Karl-Anthony Towns', team: 'NYK', espnId: '3136195', props: ['Points', 'Rebounds', '3-Pointers'] },
    { name: 'Chet Holmgren', team: 'OKC', espnId: '4432159', props: ['Points', 'Rebounds', 'Blocks'] },
    { name: 'Victor Wembanyama', team: 'SAS', espnId: '4871823', props: ['Points', 'Rebounds', 'Blocks', 'Assists'] },
    { name: 'Anthony Davis', team: 'LAL', espnId: '6583', props: ['Points', 'Rebounds', 'Blocks'] },
    { name: 'Kyrie Irving', team: 'DAL', espnId: '6442', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Jalen Brunson', team: 'NYK', espnId: '3934672', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Lauri Markkanen', team: 'UTA', espnId: '4066336', props: ['Points', 'Rebounds', '3-Pointers'] },
    { name: 'Scottie Barnes', team: 'TOR', espnId: '4433216', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Franz Wagner', team: 'ORL', espnId: '4432166', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Desmond Bane', team: 'MEM', espnId: '4395628', props: ['Points', '3-Pointers', 'Assists'] },
    { name: 'Zion Williamson', team: 'NOP', espnId: '4395628', props: ['Points', 'Rebounds', 'Blocks'] },
  ],
  mlb: [
    { name: 'Shohei Ohtani', team: 'LAD', espnId: '39832', props: ['Hits', 'Total Bases', 'RBIs', 'Home Runs'] },
    { name: 'Aaron Judge', team: 'NYY', espnId: '33192', props: ['Hits', 'Total Bases', 'RBIs', 'Home Runs'] },
    { name: 'Mookie Betts', team: 'LAD', espnId: '33039', props: ['Hits', 'Runs', 'Total Bases', 'Stolen Bases'] },
    { name: 'Ronald Acuna Jr.', team: 'ATL', espnId: '39373', props: ['Hits', 'Total Bases', 'Stolen Bases'] },
    { name: 'Juan Soto', team: 'NYY', espnId: '35882', props: ['Hits', 'Walks', 'Total Bases', 'RBIs'] },
    { name: 'Mike Trout', team: 'LAA', espnId: '30836', props: ['Hits', 'RBIs', 'Total Bases'] },
    { name: 'Freddie Freeman', team: 'LAD', espnId: '32098', props: ['Hits', 'RBIs', 'Total Bases'] },
    { name: 'Corey Seager', team: 'TEX', espnId: '32691', props: ['Hits', 'RBIs', 'Total Bases'] },
    { name: 'Trea Turner', team: 'PHI', espnId: '32129', props: ['Hits', 'Stolen Bases', 'Runs'] },
    { name: 'Marcus Semien', team: 'TEX', espnId: '31771', props: ['Hits', 'Runs', 'Total Bases'] },
    { name: 'Francisco Lindor', team: 'NYM', espnId: '32129', props: ['Hits', 'RBIs', 'Total Bases'] },
    { name: 'Bobby Witt Jr.', team: 'KC', espnId: '39373', props: ['Hits', 'Total Bases', 'Stolen Bases'] },
    { name: 'Gunnar Henderson', team: 'BAL', espnId: '39373', props: ['Hits', 'Total Bases', 'RBIs'] },
    { name: 'Elly De La Cruz', team: 'CIN', espnId: '39373', props: ['Hits', 'Stolen Bases', 'Total Bases'] },
    { name: 'Gerrit Cole', team: 'NYY', espnId: '28963', props: ['Strikeouts', 'Outs', 'Earned Runs', 'Hits Allowed'] },
    { name: 'Spencer Strider', team: 'ATL', espnId: '39911', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Zack Wheeler', team: 'PHI', espnId: '30988', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Corbin Burnes', team: 'BAL', espnId: '36040', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Dylan Cease', team: 'SD', espnId: '39683', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Tyler Glasnow', team: 'LAD', espnId: '36040', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Yoshinobu Yamamoto', team: 'LAD', espnId: '39832', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Tarik Skubal', team: 'DET', espnId: '39911', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
  ],
  nhl: [
    { name: 'Connor McDavid', team: 'EDM', espnId: '3895074', props: ['Points', 'Shots', 'Assists', 'Goals'] },
    { name: 'Nathan MacKinnon', team: 'COL', espnId: '3041969', props: ['Points', 'Shots', 'Assists'] },
    { name: 'Leon Draisaitl', team: 'EDM', espnId: '3114727', props: ['Points', 'Shots', 'Goals'] },
    { name: 'Auston Matthews', team: 'TOR', espnId: '4024123', props: ['Points', 'Shots', 'Goals'] },
    { name: 'David Pastrnak', team: 'BOS', espnId: '3899937', props: ['Points', 'Shots', 'Goals'] },
    { name: 'Nikita Kucherov', team: 'TB', espnId: '3042109', props: ['Points', 'Shots', 'Assists'] },
    { name: 'Cale Makar', team: 'COL', espnId: '4351729', props: ['Points', 'Shots', 'Blocked Shots'] },
    { name: 'Sidney Crosby', team: 'PIT', espnId: '3114', props: ['Points', 'Shots', 'Assists'] },
    { name: 'Jack Eichel', team: 'VGK', espnId: '3895074', props: ['Points', 'Shots', 'Assists'] },
    { name: 'Kirill Kaprizov', team: 'MIN', espnId: '4351729', props: ['Points', 'Shots', 'Goals'] },
    { name: 'Matthew Tkachuk', team: 'FLA', espnId: '4024123', props: ['Points', 'Shots', 'Assists'] },
    { name: 'Jack Hughes', team: 'NJ', espnId: '4351729', props: ['Points', 'Shots', 'Goals'] },
    { name: 'Mitch Marner', team: 'TOR', espnId: '3899937', props: ['Points', 'Assists', 'Shots'] },
    { name: 'Alex Ovechkin', team: 'WAS', espnId: '3101', props: ['Goals', 'Shots', 'Points'] },
    { name: 'Connor Hellebuyck', team: 'WPG', espnId: '3042109', props: ['Saves', 'Goals Against'] },
  ],
};

// Generate realistic mock picks (expanded version)
function generateMockPicks(): Pick[] {
  const mockPicks: Pick[] = [];
  
  const opponents = {
    nfl: ['GB', 'DAL', 'SF', 'NYG', 'CHI', 'DET', 'SEA', 'MIN', 'TB', 'LAR', 'PHI', 'KC', 'BUF', 'BAL', 'MIA'],
    nba: ['BOS', 'MIA', 'NYK', 'PHX', 'LAC', 'DEN', 'MIL', 'CLE', 'OKC', 'SAC', 'LAL', 'GSW', 'PHI', 'DAL', 'MIN'],
    mlb: ['NYY', 'BOS', 'HOU', 'ATL', 'LAD', 'SD', 'PHI', 'TEX', 'BAL', 'ARI', 'NYM', 'CIN', 'CLE', 'MIL', 'SEA'],
    nhl: ['TOR', 'BOS', 'NYR', 'VGK', 'CAR', 'DAL', 'FLA', 'NJ', 'WPG', 'VAN', 'COL', 'EDM', 'MIN', 'TB', 'LAK'],
  };
  
  const dates = ['Today', 'Tomorrow', 'Sat Jan 11', 'Sun Jan 12', 'Mon Jan 13', 'Tue Jan 14', 'Wed Jan 15'];
  const times = ['1:00 pm', '4:00 pm', '4:30 pm', '7:00 pm', '7:30 pm', '8:00 pm', '8:20 pm', '9:00 pm', '10:00 pm', '10:30 pm'];

  // Helper to generate line based on prop type
  const getLine = (prop: string): number => {
    const lines: Record<string, [number, number]> = {
      'Passing Yards': [225, 325],
      'Passing TDs': [1.5, 2.5],
      'Completions': [20, 28],
      'Interceptions': [0.5, 1.5],
      'Rushing Yards': [55, 110],
      'Rushing + Receiving': [75, 140],
      'Rushing Attempts': [14, 22],
      'Rushing TDs': [0.5, 1.5],
      'Receiving Yards': [50, 95],
      'Receptions': [4.5, 7.5],
      'Receiving TDs': [0.5, 1.5],
      'Longest Reception': [18, 32],
      'Points': [22, 34],
      'Rebounds': [7, 13],
      'Assists': [5, 11],
      '3-Pointers': [2.5, 4.5],
      'Steals': [0.5, 2.5],
      'Blocks': [0.5, 3.5],
      'Hits': [0.5, 2.5],
      'Total Bases': [1.5, 3.5],
      'RBIs': [0.5, 2.5],
      'Runs': [0.5, 2.5],
      'Walks': [0.5, 1.5],
      'Stolen Bases': [0.5, 1.5],
      'Home Runs': [0.5, 1.5],
      'Strikeouts': [5.5, 8.5],
      'Outs': [16, 20],
      'Earned Runs': [2, 4],
      'Hits Allowed': [4.5, 7.5],
      'Shots': [3.5, 6.5],
      'Goals': [0.5, 1.5],
      'Blocked Shots': [1.5, 3.5],
      'Saves': [25, 35],
      'Goals Against': [2, 4],
    };
    const range = lines[prop] || [5, 15];
    return Math.round((range[0] + Math.random() * (range[1] - range[0])) * 10) / 10;
  };

  // Generate picks for each sport
  const sports: Array<{ key: keyof typeof PLAYER_DATABASE; name: string }> = [
    { key: 'nfl', name: 'NFL' },
    { key: 'nba', name: 'NBA' },
    { key: 'mlb', name: 'MLB' },
    { key: 'nhl', name: 'NHL' },
  ];

  sports.forEach(({ key, name }) => {
    const players = PLAYER_DATABASE[key];
    const sportOpponents = opponents[key];

    players.forEach(player => {
      // Generate 3-5 picks per player across different platforms
      const numPicks = Math.floor(Math.random() * 3) + 3;
      const usedCombos = new Set<string>();

      for (let i = 0; i < numPicks; i++) {
        const prop = player.props[Math.floor(Math.random() * player.props.length)];
        const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
        const direction = Math.random() > 0.5 ? 'MORE' : 'LESS';
        
        const comboKey = `${prop}-${platform}-${direction}`;
        if (usedCombos.has(comboKey)) continue;
        usedCombos.add(comboKey);

        const line = getLine(prop);
        const confidence = Math.floor(Math.random() * 30) + 60;
        const hitRate = Math.floor(Math.random() * 25) + 52;

        mockPicks.push({
          id: `${player.name}-${prop}-${platform}-${direction}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.replace(/\s/g, '-').toLowerCase(),
          platform,
          sport: name,
          playerName: player.name,
          playerImage: getESPNHeadshot(player.espnId, key),
          team: player.team,
          opponent: sportOpponents[Math.floor(Math.random() * sportOpponents.length)],
          gameDate: dates[Math.floor(Math.random() * dates.length)],
          gameTime: times[Math.floor(Math.random() * times.length)],
          propType: prop,
          line,
          direction,
          confidence,
          hitRate,
          projection: Math.round(line * (direction === 'MORE' ? (1 + (confidence - 50) / 180) : (1 - (confidence - 50) / 180)) * 10) / 10,
        });
      }
    });
  });

  // Shuffle picks for variety
  return mockPicks.sort(() => Math.random() - 0.5);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = getClientIdentifier(req);
    
    if (!checkRateLimit(clientId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Return cached data if valid
    const now = Date.now();
    if (!forceRefresh && cachedPicks.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
      console.log('Returning cached picks data');
      return new Response(
        JSON.stringify({
          success: true,
          data: cachedPicks,
          source: 'cache',
          lastUpdated: new Date(cacheTimestamp).toISOString(),
          platforms: PLATFORMS,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    let picks: Pick[] = [];
    let source = 'generated';
    
    if (firecrawlApiKey) {
      console.log('Scraping RotoWire picks with Firecrawl...');
      
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://www.rotowire.com/picks/',
            formats: ['markdown'],
            waitFor: 3000, // Wait for dynamic content
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          
          if (markdown) {
            console.log('Parsing RotoWire markdown...');
            picks = parseRotoWireMarkdown(markdown);
            console.log(`Parsed ${picks.length} picks from RotoWire`);
            
            if (picks.length > 0) {
              source = 'scraped';
            }
          }
        } else {
          console.error('Firecrawl scrape failed:', await scrapeResponse.text());
        }
      } catch (scrapeError) {
        console.error('Error scraping RotoWire:', scrapeError);
      }
    }

    // If scraping didn't work or no picks found, use generated picks
    if (picks.length < 20) {
      console.log('Using generated picks data');
      const generatedPicks = generateMockPicks();
      
      // Merge scraped picks with generated picks if we have some scraped
      if (picks.length > 0) {
        // Add generated picks that don't overlap
        const existingPlayers = new Set(picks.map(p => `${p.playerName}-${p.propType}`));
        const additionalPicks = generatedPicks.filter(p => !existingPlayers.has(`${p.playerName}-${p.propType}`));
        picks = [...picks, ...additionalPicks.slice(0, 200 - picks.length)];
        source = 'merged';
      } else {
        picks = generatedPicks;
        source = 'generated';
      }
    }

    // Update cache
    cachedPicks = picks;
    cacheTimestamp = now;

    console.log(`Returning ${picks.length} picks (source: ${source})`);

    return new Response(
      JSON.stringify({
        success: true,
        data: picks,
        source,
        lastUpdated: new Date().toISOString(),
        platforms: PLATFORMS,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-picks:', error);
    
    // Fallback to generated picks
    const fallbackPicks = generateMockPicks();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: fallbackPicks,
        source: 'fallback',
        lastUpdated: new Date().toISOString(),
        platforms: PLATFORMS,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
