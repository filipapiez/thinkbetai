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
  // NCAAB / College Basketball - ESPN uses numeric IDs
  ncaab: {
    baseUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/',
    pathBuilder: (id) => `${id}.png`,
  },
  // NCAAF / College Football - ESPN uses numeric IDs
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
    'utah jazz': 'utah',
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
  // NCAA Teams - using ESPN numeric IDs
  ncaab: {
    // ACC
    'duke blue devils': '150',
    'duke': '150',
    'north carolina tar heels': '153',
    'unc tar heels': '153',
    'nc state wolfpack': '152',
    'nc state': '152',
    'virginia cavaliers': '258',
    'virginia': '258',
    'louisville cardinals': '97',
    'louisville': '97',
    'clemson tigers': '228',
    'florida state seminoles': '52',
    'wake forest demon deacons': '154',
    'notre dame fighting irish': '87',
    'miami hurricanes': '2390',
    'georgia tech yellow jackets': '59',
    'boston college eagles': '103',
    'syracuse orange': '183',
    'pittsburgh panthers': '221',
    // Big Ten
    'michigan wolverines': '130',
    'michigan': '130',
    'michigan state spartans': '127',
    'michigan state': '127',
    'ohio state buckeyes': '194',
    'ohio state': '194',
    'purdue boilermakers': '2509',
    'purdue': '2509',
    'indiana hoosiers': '84',
    'indiana': '84',
    'illinois fighting illini': '356',
    'iowa hawkeyes': '2294',
    'wisconsin badgers': '275',
    'minnesota golden gophers': '135',
    'nebraska cornhuskers': '158',
    'northwestern wildcats': '77',
    'penn state nittany lions': '213',
    'maryland terrapins': '120',
    'rutgers scarlet knights': '164',
    'oregon ducks': '2483',
    'oregon': '2483',
    'washington huskies': '264',
    'usc trojans': '30',
    'ucla bruins': '26',
    // SEC
    'kentucky wildcats': '96',
    'kentucky': '96',
    'alabama crimson tide': '333',
    'alabama': '333',
    'tennessee volunteers': '2633',
    'tennessee': '2633',
    'auburn tigers': '2',
    'florida gators': '57',
    'georgia bulldogs': '61',
    'lsu tigers': '99',
    'arkansas razorbacks': '8',
    'mississippi state bulldogs': '344',
    'ole miss rebels': '145',
    'south carolina gamecocks': '2579',
    'missouri tigers': '142',
    'texas a&m aggies': '245',
    'vanderbilt commodores': '238',
    // Big 12
    'kansas jayhawks': '2305',
    'kansas': '2305',
    'baylor bears': '239',
    'texas longhorns': '251',
    'texas tech red raiders': '2641',
    'oklahoma sooners': '201',
    'oklahoma state cowboys': '197',
    'iowa state cyclones': '66',
    'kansas state wildcats': '2306',
    'tcu horned frogs': '2628',
    'west virginia mountaineers': '277',
    'cincinnati bearcats': '2132',
    'houston cougars': '248',
    'ucf knights': '2116',
    'byu cougars': '252',
    'colorado buffaloes': '38',
    'arizona wildcats': '12',
    'arizona state sun devils': '9',
    'utah utes': '254',
    // Pac-12 / Big East / Other Power
    'gonzaga bulldogs': '2250',
    'gonzaga': '2250',
    'villanova wildcats': '222',
    'uconn huskies': '41',
    'creighton bluejays': '156',
    'marquette golden eagles': '269',
    'xavier musketeers': '2752',
    'seton hall pirates': '2550',
    'st. johns red storm': '2599',
    'providence friars': '2507',
    'butler bulldogs': '2086',
    'depaul blue demons': '305',
    // Other notable teams
    'memphis tigers': '235',
    'san diego state aztecs': '21',
    'nevada wolf pack': '2440',
    'new mexico lobos': '167',
    'unlv rebels': '2439',
    'fresno state bulldogs': '278',
    'boise state broncos': '68',
    'saint marys gaels': '2608',
    'dayton flyers': '2168',
    'davidson wildcards': '2166',
    'richmond spiders': '257',
    'yale bulldogs': '43',
    'howard bison': '47',
    'indiana st sycamores': '282',
    'lamar cardinals': '2320',
    'southern illinois salukis': '2565',
    'northwestern st demons': '2447',
    'grambling st tigers': '2755',
    'alabama a&m bulldogs': '2010',
    'stephen f. austin lumberjacks': '2617',
    'mcneese cowboys': '2377',
    'east texas a&m lions': '2628',
    'houston christian huskies': '2277',
    'miss valley st delta devils': '2400',
    'alcorn st braves': '2016',
    'north carolina central eagles': '2428',
    'delaware st hornets': '2169',
    'evansville purple aces': '339',
    'illinois st redbirds': '2287',
    'southern jaguars': '2582',
    'alabama st hornets': '2011',
    // Fix apostrophe variations
    "st. john's red storm": '2599',
    'st johns red storm': '2599',
  },
  ncaaf: {
    // Same IDs work for football - major programs
    'alabama crimson tide': '333',
    'ohio state buckeyes': '194',
    'georgia bulldogs': '61',
    'michigan wolverines': '130',
    'clemson tigers': '228',
    'lsu tigers': '99',
    'notre dame fighting irish': '87',
    'oklahoma sooners': '201',
    'texas longhorns': '251',
    'florida state seminoles': '52',
    'penn state nittany lions': '213',
    'oregon ducks': '2483',
    'usc trojans': '30',
    'texas a&m aggies': '245',
    'auburn tigers': '2',
    'tennessee volunteers': '2633',
    'florida gators': '57',
    'wisconsin badgers': '275',
    'iowa hawkeyes': '2294',
    'washington huskies': '264',
  },
  // Serie A Italian soccer teams
  'serie a': {
    'juventus': '111',
    'inter': '110',
    'inter milan': '110',
    'internazionale': '110',
    'ac milan': '103',
    'milan': '103',
    'napoli': '114',
    'as roma': '104',
    'roma': '104',
    'lazio': '102',
    'atalanta': '105',
    'fiorentina': '109',
    'torino': '113',
    'bologna': '107',
    'sassuolo': '3897',
    'udinese': '115',
    'verona': '3077',
    'hellas verona': '3077',
    'empoli': '108',
    'sampdoria': '112',
    'cagliari': '106',
    'lecce': '3888',
    'spezia': '4925',
    'salernitana': '3987',
    'monza': '5914',
    'cremonese': '3896',
  },
  // La Liga Spanish soccer teams
  'la liga': {
    'real madrid': '86',
    'barcelona': '83',
    'fc barcelona': '83',
    'atletico madrid': '1068',
    'sevilla': '243',
    'real sociedad': '89',
    'villarreal': '102',
    'athletic bilbao': '93',
    'real betis': '244',
    'osasuna': '331',
    'celta vigo': '85',
    'valencia': '94',
    'rayo vallecano': '87',
    'getafe': '103',
    'almeria': '100',
    'espanyol': '88',
    'cadiz': '101',
    'mallorca': '84',
    'elche': '106',
    'valladolid': '95',
    'girona': '9812',
    'las palmas': '96',
  },
  // Bundesliga German soccer teams  
  'bundesliga': {
    'bayern munich': '132',
    'bayern': '132',
    'borussia dortmund': '124',
    'dortmund': '124',
    'rb leipzig': '11420',
    'leipzig': '11420',
    'bayer leverkusen': '131',
    'leverkusen': '131',
    'union berlin': '11406',
    'freiburg': '129',
    'eintracht frankfurt': '125',
    'frankfurt': '125',
    'wolfsburg': '134',
    'mainz': '130',
    'borussia monchengladbach': '123',
    'gladbach': '123',
    'koln': '122',
    'hoffenheim': '11407',
    'augsburg': '10738',
    'werder bremen': '133',
    'bremen': '133',
    'vfb stuttgart': '137',
    'stuttgart': '137',
    'bochum': '126',
    'hertha berlin': '127',
    'schalke': '135',
  },
  // Ligue 1 French soccer teams
  'ligue 1': {
    'paris saint-germain': '160',
    'psg': '160',
    'marseille': '176',
    'olympique marseille': '176',
    'monaco': '174',
    'lille': '167',
    'lyon': '178',
    'olympique lyon': '178',
    'nice': '172',
    'lens': '168',
    'rennes': '177',
    'montpellier': '171',
    'strasbourg': '169',
    'nantes': '173',
    'toulouse': '166',
    'reims': '175',
    'lorient': '170',
    'clermont': '179',
    'brest': '163',
    'auxerre': '162',
    'angers': '164',
    'ajaccio': '159',
    'troyes': '165',
  },
};

// Normalize sport name for lookup
function normalizeSport(sport: string): string {
  const sportLower = sport.toLowerCase().trim();
  
  // Map common variations - including display names from useLiveGames
  const sportMap: Record<string, string> = {
    // API keys
    'basketball_nba': 'nba',
    'americanfootball_nfl': 'nfl',
    'baseball_mlb': 'mlb',
    'icehockey_nhl': 'nhl',
    'soccer_epl': 'premier league',
    'soccer_england_league1': 'premier league',
    'soccer_england_epl': 'premier league',
    'soccer_usa_mls': 'mls',
    'soccer_uefa_champs_league': 'champions league',
    // Display names from useLiveGames sportDisplayNames
    'premier league': 'premier league',
    'la liga': 'la liga',
    'bundesliga': 'bundesliga', 
    'serie a': 'serie a',
    'ligue 1': 'ligue 1',
    'champions league': 'champions league',
    'ncaab': 'ncaab',
    'ncaaf': 'ncaaf',
    'wnba': 'wnba',
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
