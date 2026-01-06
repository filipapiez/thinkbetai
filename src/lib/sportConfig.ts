// Sport Priority & Game Coverage Configuration (United States Focus)

export interface SportConfig {
  id: string;
  name: string;
  shortName: string;
  priority: number; // 1 = highest priority
  coverage: {
    description: string;
    notes?: string[];
  };
  dailySurfaced: {
    min: number;
    max: number;
    period: 'daily' | 'weekly' | 'per-event' | 'per-tournament' | 'per-race';
  };
  active: boolean;
}

export const SPORT_CONFIGS: SportConfig[] = [
  {
    id: 'NFL',
    name: 'NFL Football',
    shortName: 'NFL',
    priority: 1,
    coverage: {
      description: 'ALL games each week (16–17)',
      notes: ['Full NFL coverage']
    },
    dailySurfaced: { min: 3, max: 6, period: 'weekly' },
    active: true,
  },
  {
    id: 'CFB',
    name: 'College Football',
    shortName: 'CFB',
    priority: 1,
    coverage: {
      description: 'Top 25 + Power Conferences only',
      notes: ['Ranked teams', 'Major conferences']
    },
    dailySurfaced: { min: 5, max: 10, period: 'weekly' },
    active: true,
  },
  {
    id: 'NBA',
    name: 'NBA Basketball',
    shortName: 'NBA',
    priority: 2,
    coverage: {
      description: 'ALL games daily (8–12)',
      notes: ['Full NBA coverage']
    },
    dailySurfaced: { min: 4, max: 8, period: 'daily' },
    active: true,
  },
  {
    id: 'NCAAB',
    name: 'College Basketball',
    shortName: 'NCAAB',
    priority: 2,
    coverage: {
      description: 'Ranked teams + major conferences only',
      notes: ['Top 25', 'Power conferences']
    },
    dailySurfaced: { min: 6, max: 12, period: 'daily' },
    active: true,
  },
  {
    id: 'MLB',
    name: 'Major League Baseball',
    shortName: 'MLB',
    priority: 3,
    coverage: {
      description: 'ALL MLB games daily (10–15)',
      notes: ['Full MLB coverage']
    },
    dailySurfaced: { min: 5, max: 8, period: 'daily' },
    active: true,
  },
  {
    id: 'Soccer',
    name: 'Soccer',
    shortName: 'Soccer',
    priority: 4,
    coverage: {
      description: 'EPL, Champions League, MLS, La Liga, Major tournaments',
      notes: ['U.S. betting focus', 'Do NOT show all global matches']
    },
    dailySurfaced: { min: 4, max: 7, period: 'daily' },
    active: true,
  },
  {
    id: 'NHL',
    name: 'NHL Hockey',
    shortName: 'NHL',
    priority: 5,
    coverage: {
      description: 'ALL NHL games daily (6–12)',
      notes: ['Full NHL coverage']
    },
    dailySurfaced: { min: 3, max: 6, period: 'daily' },
    active: true,
  },
  {
    id: 'Tennis',
    name: 'Tennis',
    shortName: 'Tennis',
    priority: 6,
    coverage: {
      description: 'ATP & WTA main draw matches only',
      notes: ['Exclude qualifiers unless high confidence']
    },
    dailySurfaced: { min: 5, max: 10, period: 'daily' },
    active: true,
  },
  {
    id: 'UFC',
    name: 'UFC / MMA',
    shortName: 'UFC',
    priority: 7,
    coverage: {
      description: 'ALL fights on each card (10–14 fights)',
      notes: ['Full card coverage']
    },
    dailySurfaced: { min: 4, max: 6, period: 'per-event' },
    active: true,
  },
  {
    id: 'Golf',
    name: 'Golf',
    shortName: 'Golf',
    priority: 9,
    coverage: {
      description: 'PGA Tour majors & top-tier tournaments only',
      notes: ['Focus on marquee events']
    },
    dailySurfaced: { min: 5, max: 10, period: 'per-tournament' },
    active: true,
  },
  {
    id: 'Boxing',
    name: 'Boxing',
    shortName: 'Boxing',
    priority: 10,
    coverage: {
      description: 'Main card fights only',
      notes: ['High-profile bouts']
    },
    dailySurfaced: { min: 1, max: 3, period: 'per-event' },
    active: true,
  },
  {
    id: 'NASCAR',
    name: 'NASCAR',
    shortName: 'NASCAR',
    priority: 11,
    coverage: {
      description: 'Main races only',
      notes: ['Cup Series focus']
    },
    dailySurfaced: { min: 2, max: 4, period: 'per-race' },
    active: true,
  },
  {
    id: 'Esports',
    name: 'Esports',
    shortName: 'Esports',
    priority: 12,
    coverage: {
      description: 'CS:GO, Valorant — Major tournaments only',
      notes: ['Tier 1 events']
    },
    dailySurfaced: { min: 3, max: 6, period: 'daily' },
    active: true,
  },
  {
    id: 'College Baseball',
    name: 'College Baseball',
    shortName: 'CBASE',
    priority: 13,
    coverage: {
      description: 'Ranked teams + major conferences',
      notes: ['Top 25', 'Power conferences']
    },
    dailySurfaced: { min: 3, max: 6, period: 'daily' },
    active: true,
  },
  {
    id: 'Horse Racing',
    name: 'Horse Racing',
    shortName: 'Horses',
    priority: 14,
    coverage: {
      description: 'Major tracks and marquee races only',
      notes: ['High-liquidity events', 'Triple Crown, Breeders Cup']
    },
    dailySurfaced: { min: 2, max: 5, period: 'daily' },
    active: true,
  },
  {
    id: 'Table Tennis',
    name: 'Table Tennis',
    shortName: 'TT',
    priority: 15,
    coverage: {
      description: 'Professional leagues only',
      notes: ['WTT events', 'International tournaments']
    },
    dailySurfaced: { min: 5, max: 10, period: 'daily' },
    active: true,
  },
];

// Get sport config by ID
export const getSportConfig = (sportId: string): SportConfig | undefined => {
  return SPORT_CONFIGS.find(s => s.id === sportId || s.shortName === sportId);
};

// Get all sports sorted by priority
export const getSportsByPriority = (): SportConfig[] => {
  return [...SPORT_CONFIGS].sort((a, b) => a.priority - b.priority);
};

// Get sport priority (lower = higher priority)
export const getSportPriority = (sportId: string): number => {
  const config = getSportConfig(sportId);
  return config?.priority ?? 999;
};

// Check if sport is covered
export const isSportCovered = (sportId: string): boolean => {
  const config = getSportConfig(sportId);
  return config?.active ?? false;
};

// Format surfaced range for display
export const formatSurfacedRange = (config: SportConfig): string => {
  const { min, max, period } = config.dailySurfaced;
  const periodLabel = {
    'daily': '/day',
    'weekly': '/week',
    'per-event': '/event',
    'per-tournament': '/tourney',
    'per-race': '/race',
  }[period];
  return `${min}–${max} picks${periodLabel}`;
};
