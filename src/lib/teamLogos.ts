// Team logo utilities - fetches logos from public CDNs
// Uses ESPN CDN for major sports, with fallbacks

interface LogoConfig {
  baseUrl: string;
  pathBuilder: (teamId: string) => string;
}

// Sport-specific logo configurations using ESPN's public CDN
const sportLogoConfigs: Record<string, LogoConfig> = {
  // NBA
  nba: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/nba/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // NFL
  nfl: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // MLB
  mlb: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/mlb/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // NHL
  nhl: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/nhl/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // NCAAB / College Basketball
  ncaab: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // NCAAF / College Football
  ncaaf: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // WNBA
  wnba: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // Soccer - Premier League
  'premier league': {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  epl: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // Soccer - MLS
  mls: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // Soccer - Champions League
  'champions league': {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  ucl: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // La Liga
  'la liga': {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // Serie A
  'serie a': {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // Bundesliga
  bundesliga: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // Ligue 1
  'ligue 1': {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/soccer/500/',
    pathBuilder: (id) => `${id}.png`,
  },
};

// Team name to ESPN ID mapping for major sports
// This mapping helps convert team names to ESPN's team IDs
const teamIdMappings: Record<string, Record<string, string>> = {
  nba: {
    'atlanta hawks': 'atl',
    'boston celtics': 'bos',
    'brooklyn nets': 'bkn',
    'charlotte hornets': 'cha',
    'chicago bulls': 'chi',
    'cleveland cavaliers': 'cle',
    'dallas mavericks': 'dal',
    'denver nuggets': 'den',
    'detroit pistons': 'det',
    'golden state warriors': 'gs',
    'houston rockets': 'hou',
    'indiana pacers': 'ind',
    'los angeles clippers': 'lac',
    'la clippers': 'lac',
    'los angeles lakers': 'lal',
    'la lakers': 'lal',
    'memphis grizzlies': 'mem',
    'miami heat': 'mia',
    'milwaukee bucks': 'mil',
    'minnesota timberwolves': 'min',
    'new orleans pelicans': 'no',
    'new york knicks': 'ny',
    'oklahoma city thunder': 'okc',
    'orlando magic': 'orl',
    'philadelphia 76ers': 'phi',
    'phoenix suns': 'phx',
    'portland trail blazers': 'por',
    'sacramento kings': 'sac',
    'san antonio spurs': 'sa',
    'toronto raptors': 'tor',
    'utah jazz': 'uta',
    'washington wizards': 'wsh',
  },
  nfl: {
    'arizona cardinals': 'ari',
    'atlanta falcons': 'atl',
    'baltimore ravens': 'bal',
    'buffalo bills': 'buf',
    'carolina panthers': 'car',
    'chicago bears': 'chi',
    'cincinnati bengals': 'cin',
    'cleveland browns': 'cle',
    'dallas cowboys': 'dal',
    'denver broncos': 'den',
    'detroit lions': 'det',
    'green bay packers': 'gb',
    'houston texans': 'hou',
    'indianapolis colts': 'ind',
    'jacksonville jaguars': 'jax',
    'kansas city chiefs': 'kc',
    'las vegas raiders': 'lv',
    'los angeles chargers': 'lac',
    'la chargers': 'lac',
    'los angeles rams': 'lar',
    'la rams': 'lar',
    'miami dolphins': 'mia',
    'minnesota vikings': 'min',
    'new england patriots': 'ne',
    'new orleans saints': 'no',
    'new york giants': 'nyg',
    'new york jets': 'nyj',
    'philadelphia eagles': 'phi',
    'pittsburgh steelers': 'pit',
    'san francisco 49ers': 'sf',
    'seattle seahawks': 'sea',
    'tampa bay buccaneers': 'tb',
    'tennessee titans': 'ten',
    'washington commanders': 'wsh',
  },
  mlb: {
    'arizona diamondbacks': 'ari',
    'atlanta braves': 'atl',
    'baltimore orioles': 'bal',
    'boston red sox': 'bos',
    'chicago cubs': 'chc',
    'chicago white sox': 'chw',
    'cincinnati reds': 'cin',
    'cleveland guardians': 'cle',
    'colorado rockies': 'col',
    'detroit tigers': 'det',
    'houston astros': 'hou',
    'kansas city royals': 'kc',
    'los angeles angels': 'laa',
    'la angels': 'laa',
    'los angeles dodgers': 'lad',
    'la dodgers': 'lad',
    'miami marlins': 'mia',
    'milwaukee brewers': 'mil',
    'minnesota twins': 'min',
    'new york mets': 'nym',
    'new york yankees': 'nyy',
    'oakland athletics': 'oak',
    'philadelphia phillies': 'phi',
    'pittsburgh pirates': 'pit',
    'san diego padres': 'sd',
    'san francisco giants': 'sf',
    'seattle mariners': 'sea',
    'st. louis cardinals': 'stl',
    'tampa bay rays': 'tb',
    'texas rangers': 'tex',
    'toronto blue jays': 'tor',
    'washington nationals': 'wsh',
  },
  nhl: {
    'anaheim ducks': 'ana',
    'arizona coyotes': 'ari',
    'boston bruins': 'bos',
    'buffalo sabres': 'buf',
    'calgary flames': 'cgy',
    'carolina hurricanes': 'car',
    'chicago blackhawks': 'chi',
    'colorado avalanche': 'col',
    'columbus blue jackets': 'cbj',
    'dallas stars': 'dal',
    'detroit red wings': 'det',
    'edmonton oilers': 'edm',
    'florida panthers': 'fla',
    'los angeles kings': 'la',
    'la kings': 'la',
    'minnesota wild': 'min',
    'montreal canadiens': 'mtl',
    'nashville predators': 'nsh',
    'new jersey devils': 'nj',
    'new york islanders': 'nyi',
    'new york rangers': 'nyr',
    'ottawa senators': 'ott',
    'philadelphia flyers': 'phi',
    'pittsburgh penguins': 'pit',
    'san jose sharks': 'sj',
    'seattle kraken': 'sea',
    'st. louis blues': 'stl',
    'tampa bay lightning': 'tb',
    'toronto maple leafs': 'tor',
    'utah hockey club': 'uta',
    'vancouver canucks': 'van',
    'vegas golden knights': 'vgk',
    'washington capitals': 'wsh',
    'winnipeg jets': 'wpg',
  },
  // Soccer teams mapping
  'premier league': {
    'arsenal': '359',
    'aston villa': '362',
    'bournemouth': '349',
    'brentford': '337',
    'brighton': '331',
    'brighton & hove albion': '331',
    'burnley': '379',
    'chelsea': '363',
    'crystal palace': '384',
    'everton': '368',
    'fulham': '370',
    'ipswich': '373',
    'ipswich town': '373',
    'leicester': '375',
    'leicester city': '375',
    'liverpool': '364',
    'luton': '389',
    'luton town': '389',
    'manchester city': '382',
    'man city': '382',
    'manchester united': '360',
    'man united': '360',
    'newcastle': '361',
    'newcastle united': '361',
    'nottingham forest': '393',
    'sheffield united': '398',
    'southampton': '376',
    'tottenham': '367',
    'tottenham hotspur': '367',
    'spurs': '367',
    'west ham': '371',
    'west ham united': '371',
    'wolverhampton': '380',
    'wolves': '380',
  },
};

// Normalize sport name for lookup
function normalizeSport(sport: string): string {
  const sportLower = sport.toLowerCase().trim();
  
  // Map common variations
  const sportMap: Record<string, string> = {
    'basketball_nba': 'nba',
    'americanfootball_nfl': 'nfl',
    'baseball_mlb': 'mlb',
    'icehockey_nhl': 'nhl',
    'soccer_epl': 'premier league',
    'soccer_england_league1': 'premier league',
    'soccer_england_epl': 'premier league',
    'soccer_usa_mls': 'mls',
    'soccer_uefa_champs_league': 'champions league',
  };
  
  return sportMap[sportLower] || sportLower;
}

// Try to get team ID from mapping or derive from team name
function getTeamId(teamName: string, sport: string): string | null {
  const normalizedSport = normalizeSport(sport);
  const normalizedTeam = teamName.toLowerCase().trim();
  
  // First try exact mapping
  const sportMappings = teamIdMappings[normalizedSport];
  if (sportMappings && sportMappings[normalizedTeam]) {
    return sportMappings[normalizedTeam];
  }
  
  // Try partial matching for common team name variations
  if (sportMappings) {
    for (const [key, value] of Object.entries(sportMappings)) {
      if (normalizedTeam.includes(key) || key.includes(normalizedTeam)) {
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Get team logo URL from public CDNs
 * @param teamName - Full team name (e.g., "Los Angeles Lakers")
 * @param sport - Sport name or key (e.g., "NBA" or "basketball_nba")
 * @returns Logo URL or null if not found
 */
export function getTeamLogoUrl(teamName: string, sport: string): string | null {
  const normalizedSport = normalizeSport(sport);
  const config = sportLogoConfigs[normalizedSport];
  
  if (!config) {
    return null;
  }
  
  const teamId = getTeamId(teamName, sport);
  if (!teamId) {
    return null;
  }
  
  return `${config.baseUrl}${config.pathBuilder(teamId)}`;
}

/**
 * Check if a sport supports team logos
 */
export function sportSupportsLogos(sport: string): boolean {
  const normalizedSport = normalizeSport(sport);
  return normalizedSport in sportLogoConfigs;
}

/**
 * Check if we should show fighter images (for combat sports)
 */
export function isCombatSportForLogos(sport: string): boolean {
  const sportLower = sport.toLowerCase();
  return ['ufc', 'mma', 'boxing'].some(s => sportLower.includes(s));
}

/**
 * Check if sport is individual (no team logos)
 */
export function isIndividualSportForLogos(sport: string): boolean {
  const sportLower = sport.toLowerCase();
  const individualSports = [
    'tennis', 'table tennis', 'atp', 'wta', 'wtt',
    'golf', 'pga', 'lpga',
    'esports', 'darts', 'snooker', 'badminton', 'pool',
    'cricket', 'f1', 'nascar', 'formula'
  ];
  return individualSports.some(s => sportLower.includes(s));
}
