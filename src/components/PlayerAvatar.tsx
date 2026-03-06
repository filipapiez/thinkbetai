import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
  playerName: string;
  sport: string;
  className?: string;
}

const CACHE_KEY_PREFIX = 'player-img-v2-';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  url: string | null;
  ts: number;
}

function getCached(key: string): string | null | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      localStorage.removeItem(key);
      return undefined;
    }
    return entry.url;
  } catch {
    return undefined;
  }
}

function setCache(key: string, url: string | null) {
  try {
    localStorage.setItem(key, JSON.stringify({ url, ts: Date.now() }));
  } catch { /* quota exceeded */ }
}

export function PlayerAvatar({ playerName, sport, className }: PlayerAvatarProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cacheKey = CACHE_KEY_PREFIX + playerName.toLowerCase().replace(/\s/g, '-');
    const cached = getCached(cacheKey);

    if (cached !== undefined) {
      setImgUrl(cached);
      if (!cached) setFailed(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(playerName)}&limit=1&type=player`
        );
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        const item = data?.items?.[0];
        const headshot = item?.headshot?.href || null;

        if (!cancelled) {
          setCache(cacheKey, headshot);
          setImgUrl(headshot);
          if (!headshot) setFailed(true);
        }
      } catch {
        if (!cancelled) {
          setCache(cacheKey, null);
          setFailed(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [playerName, sport]);

  if (failed || !imgUrl) {
    return (
      <div className={cn(
        "rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground",
        className
      )}>
        {playerName.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={imgUrl}
      alt={playerName}
      onError={() => setFailed(true)}
      className={cn("rounded-full object-cover bg-muted", className)}
      loading="lazy"
    />
  );
}
