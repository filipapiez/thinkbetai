import { supabase } from '@/integrations/supabase/client';

export interface ScrapedInjury {
  team: string;
  player: string;
  position: string;
  injuryType: string;
  status: 'Out' | 'Questionable' | 'Probable' | 'Day-to-Day';
}

export interface ScrapedGameResult {
  opponent: string;
  result: 'W' | 'L';
  score: string;
  date: string;
}

export interface ScrapedRecentForm {
  team: string;
  last5: ScrapedGameResult[];
  limitedData?: boolean;
  isGenerated?: boolean;
}

export interface ScrapedH2H {
  date: string;
  winner: string;
  score: string;
  sport: string;
  competitionLevel: string;
}

export interface ScrapedH2HMeta {
  limitedData: boolean;
  validMatchCount: number;
  message?: string;
  isGenerated?: boolean;
}

export interface ScrapedTeamStats {
  team: string;
  wins: number;
  losses: number;
  streak: string;
  ranking: number;
}

export interface SportValidation {
  sport: string;
  competitionLevel: string;
  scoringSystem: string;
}

export interface ScrapedGameData {
  injuries: ScrapedInjury[];
  recentForm: ScrapedRecentForm[];
  headToHead: ScrapedH2H[];
  headToHeadMeta?: ScrapedH2HMeta;
  teamStats: ScrapedTeamStats[];
  analysis: string;
  sportValidation?: SportValidation;
  dataSource?: 'real' | 'simulated' | 'partial';
}

export interface GameDataResponse {
  success: boolean;
  data?: ScrapedGameData;
  source?: 'scraped' | 'generated';
  error?: string;
}

export async function fetchGameData(
  homeTeam: string,
  awayTeam: string,
  sport: string
): Promise<GameDataResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-game-data', {
      body: { homeTeam, awayTeam, sport },
    });

    if (error) {
      console.error('Error fetching game data:', error);
      return { success: false, error: error.message };
    }

    return data as GameDataResponse;
  } catch (error) {
    console.error('Error fetching game data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch game data' 
    };
  }
}
