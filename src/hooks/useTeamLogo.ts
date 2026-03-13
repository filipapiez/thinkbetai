import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTeamLogoUrl, sportSupportsLogos, isIndividualSportForLogos } from '@/lib/teamLogos';

// In-memory cache shared across all component instances
const logoCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

export function useTeamLogo(teamName: string, sport: string): {
  logoUrl: string | null;
  loading: boolean;
} {
  const isIndividual = isIndividualSportForLogos(sport);

  // First try static ESPN mapping (instant, no network)
  const staticUrl = !isIndividual ? getTeamLogoUrl(teamName, sport) : null;

  const [dynamicUrl, setDynamicUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!staticUrl && !isIndividual);

  useEffect(() => {
    // If we have a static URL or it's an individual sport, skip dynamic lookup
    if (staticUrl || isIndividual) return;

    const cacheKey = `${teamName.toLowerCase().trim()}::${sport.toLowerCase().trim()}`;

    // Check in-memory cache
    if (logoCache.has(cacheKey)) {
      setDynamicUrl(logoCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    // Deduplicate concurrent requests for the same team
    let request = pendingRequests.get(cacheKey);
    if (!request) {
      request = fetchLogo(teamName, sport, cacheKey);
      pendingRequests.set(cacheKey, request);
    }

    request.then((url) => {
      setDynamicUrl(url);
      setLoading(false);
    });
  }, [teamName, sport, staticUrl, isIndividual]);

  return {
    logoUrl: staticUrl || dynamicUrl,
    loading: loading && !staticUrl,
  };
}

async function fetchLogo(
  teamName: string,
  sport: string,
  cacheKey: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-team-logo', {
      body: { teamName, sport },
    });

    const url = data?.logoUrl || null;
    logoCache.set(cacheKey, url);
    pendingRequests.delete(cacheKey);
    return url;
  } catch (e) {
    console.error('Failed to fetch team logo:', e);
    logoCache.set(cacheKey, null);
    pendingRequests.delete(cacheKey);
    return null;
  }
}
