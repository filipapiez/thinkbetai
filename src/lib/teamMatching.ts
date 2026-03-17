const normalizeTeam = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const TEAM_ALIASES: Record<string, Record<string, string[]>> = {
  nba: {
    atlanta_hawks: ['atlanta hawks', 'hawks', 'atl'],
    boston_celtics: ['boston celtics', 'celtics', 'bos'],
    brooklyn_nets: ['brooklyn nets', 'nets', 'bkn', 'bk'],
    charlotte_hornets: ['charlotte hornets', 'hornets', 'cha'],
    chicago_bulls: ['chicago bulls', 'bulls', 'chi'],
    cleveland_cavaliers: ['cleveland cavaliers', 'cavaliers', 'cavs', 'cle'],
    dallas_mavericks: ['dallas mavericks', 'mavericks', 'mavs', 'dal'],
    denver_nuggets: ['denver nuggets', 'nuggets', 'den'],
    detroit_pistons: ['detroit pistons', 'pistons', 'det'],
    golden_state_warriors: ['golden state warriors', 'warriors', 'gsw', 'gs'],
    houston_rockets: ['houston rockets', 'rockets', 'hou'],
    indiana_pacers: ['indiana pacers', 'pacers', 'ind'],
    los_angeles_clippers: ['los angeles clippers', 'la clippers', 'clippers', 'lac'],
    los_angeles_lakers: ['los angeles lakers', 'la lakers', 'lakers', 'lal'],
    memphis_grizzlies: ['memphis grizzlies', 'grizzlies', 'mem'],
    miami_heat: ['miami heat', 'heat', 'mia'],
    milwaukee_bucks: ['milwaukee bucks', 'bucks', 'mil'],
    minnesota_timberwolves: ['minnesota timberwolves', 'timberwolves', 'wolves', 'min'],
    new_orleans_pelicans: ['new orleans pelicans', 'pelicans', 'nop', 'no'],
    new_york_knicks: ['new york knicks', 'knicks', 'nyk', 'ny'],
    oklahoma_city_thunder: ['oklahoma city thunder', 'thunder', 'okc'],
    orlando_magic: ['orlando magic', 'magic', 'orl'],
    philadelphia_76ers: ['philadelphia 76ers', '76ers', 'sixers', 'phi'],
    phoenix_suns: ['phoenix suns', 'suns', 'phx'],
    portland_trail_blazers: ['portland trail blazers', 'trail blazers', 'blazers', 'por'],
    sacramento_kings: ['sacramento kings', 'kings', 'sac'],
    san_antonio_spurs: ['san antonio spurs', 'spurs', 'sas', 'sa'],
    toronto_raptors: ['toronto raptors', 'raptors', 'tor'],
    utah_jazz: ['utah jazz', 'jazz', 'uta', 'utah'],
    washington_wizards: ['washington wizards', 'wizards', 'was', 'wsh'],
  },
  nhl: {
    anaheim_ducks: ['anaheim ducks', 'ducks', 'ana'],
    boston_bruins: ['boston bruins', 'bruins', 'bos'],
    buffalo_sabres: ['buffalo sabres', 'sabres', 'buf'],
    calgary_flames: ['calgary flames', 'flames', 'cgy', 'cgy'],
    carolina_hurricanes: ['carolina hurricanes', 'hurricanes', 'canes', 'car'],
    chicago_blackhawks: ['chicago blackhawks', 'blackhawks', 'chi'],
    colorado_avalanche: ['colorado avalanche', 'avalanche', 'avs', 'col'],
    columbus_blue_jackets: ['columbus blue jackets', 'blue jackets', 'jackets', 'cbj'],
    dallas_stars: ['dallas stars', 'stars', 'dal'],
    detroit_red_wings: ['detroit red wings', 'red wings', 'det'],
    edmonton_oilers: ['edmonton oilers', 'oilers', 'edm'],
    florida_panthers: ['florida panthers', 'panthers', 'fla'],
    los_angeles_kings: ['los angeles kings', 'la kings', 'kings', 'lak', 'la'],
    minnesota_wild: ['minnesota wild', 'wild', 'min'],
    montreal_canadiens: ['montreal canadiens', 'canadiens', 'habs', 'mtl'],
    nashville_predators: ['nashville predators', 'predators', 'preds', 'nsh'],
    new_jersey_devils: ['new jersey devils', 'devils', 'njd', 'nj'],
    new_york_islanders: ['new york islanders', 'islanders', 'nyi'],
    new_york_rangers: ['new york rangers', 'rangers', 'nyr'],
    ottawa_senators: ['ottawa senators', 'senators', 'sens', 'ott'],
    philadelphia_flyers: ['philadelphia flyers', 'flyers', 'phi'],
    pittsburgh_penguins: ['pittsburgh penguins', 'penguins', 'pens', 'pit'],
    san_jose_sharks: ['san jose sharks', 'sharks', 'sjs', 'sj'],
    seattle_kraken: ['seattle kraken', 'kraken', 'sea'],
    st_louis_blues: ['st louis blues', 'st. louis blues', 'blues', 'stl'],
    tampa_bay_lightning: ['tampa bay lightning', 'lightning', 'tbl', 'tb'],
    toronto_maple_leafs: ['toronto maple leafs', 'maple leafs', 'leafs', 'tor'],
    utah_hockey_club: ['utah hockey club', 'utah', 'uta'],
    vancouver_canucks: ['vancouver canucks', 'canucks', 'van'],
    vegas_golden_knights: ['vegas golden knights', 'golden knights', 'knights', 'vgk', 'lv'],
    washington_capitals: ['washington capitals', 'capitals', 'caps', 'wsh', 'was'],
    winnipeg_jets: ['winnipeg jets', 'jets', 'wpg'],
  },
  nfl: {
    kansas_city_chiefs: ['kansas city chiefs', 'chiefs', 'kc'],
    san_francisco_49ers: ['san francisco 49ers', '49ers', 'sf'],
    dallas_cowboys: ['dallas cowboys', 'cowboys', 'dal'],
    philadelphia_eagles: ['philadelphia eagles', 'eagles', 'phi'],
    buffalo_bills: ['buffalo bills', 'bills', 'buf'],
    baltimore_ravens: ['baltimore ravens', 'ravens', 'bal'],
    cincinnati_bengals: ['cincinnati bengals', 'bengals', 'cin'],
    detroit_lions: ['detroit lions', 'lions', 'det'],
    green_bay_packers: ['green bay packers', 'packers', 'gb'],
    miami_dolphins: ['miami dolphins', 'dolphins', 'mia'],
    minnesota_vikings: ['minnesota vikings', 'vikings', 'min'],
    new_england_patriots: ['new england patriots', 'patriots', 'pats', 'ne'],
    new_orleans_saints: ['new orleans saints', 'saints', 'no'],
    new_york_giants: ['new york giants', 'giants', 'nyg'],
    new_york_jets: ['new york jets', 'jets', 'nyj'],
    las_vegas_raiders: ['las vegas raiders', 'raiders', 'lv'],
    los_angeles_rams: ['los angeles rams', 'la rams', 'rams', 'lar'],
    los_angeles_chargers: ['los angeles chargers', 'la chargers', 'chargers', 'lac'],
  },
  mlb: {
    new_york_yankees: ['new york yankees', 'yankees', 'nyy'],
    new_york_mets: ['new york mets', 'mets', 'nym'],
    boston_red_sox: ['boston red sox', 'red sox', 'bos'],
    los_angeles_dodgers: ['los angeles dodgers', 'la dodgers', 'dodgers', 'lad'],
    los_angeles_angels: ['los angeles angels', 'la angels', 'angels', 'laa'],
    san_diego_padres: ['san diego padres', 'padres', 'sd'],
    san_francisco_giants: ['san francisco giants', 'giants', 'sf'],
    chicago_cubs: ['chicago cubs', 'cubs', 'chc'],
    chicago_white_sox: ['chicago white sox', 'white sox', 'chw'],
    houston_astros: ['houston astros', 'astros', 'hou'],
    atlanta_braves: ['atlanta braves', 'braves', 'atl'],
    philadelphia_phillies: ['philadelphia phillies', 'phillies', 'phi'],
    st_louis_cardinals: ['st louis cardinals', 'st. louis cardinals', 'cardinals', 'stl'],
    toronto_blue_jays: ['toronto blue jays', 'blue jays', 'tor'],
    texas_rangers: ['texas rangers', 'rangers', 'tex'],
  },
};

const buildAliasSet = (team: string, sport?: string) => {
  const normalizedTeam = normalizeTeam(team);
  const normalizedSport = normalizeTeam(sport || '');
  const sportAliases = TEAM_ALIASES[normalizedSport] || {};

  for (const aliases of Object.values(sportAliases)) {
    const normalizedAliases = aliases.map(normalizeTeam);
    if (normalizedAliases.includes(normalizedTeam)) {
      return new Set(normalizedAliases);
    }
  }

  const words = normalizedTeam.split(' ').filter(Boolean);
  const derived = [normalizedTeam];

  if (words.length > 1) {
    derived.push(words[words.length - 1]);
    derived.push(words.map((word) => word[0]).join(''));
  }

  return new Set(derived.map(normalizeTeam));
};

export const areTeamsEquivalent = (a?: string, b?: string, sport?: string) => {
  if (!a || !b) return false;

  const aAliases = buildAliasSet(a, sport);
  const bAliases = buildAliasSet(b, sport);

  for (const alias of aAliases) {
    if (bAliases.has(alias)) return true;
  }

  const aNorm = normalizeTeam(a);
  const bNorm = normalizeTeam(b);
  return aNorm.includes(bNorm) || bNorm.includes(aNorm);
};
