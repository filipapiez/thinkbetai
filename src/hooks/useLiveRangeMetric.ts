import { useEffect, useMemo, useState } from 'react';

interface LiveRangeConfig {
  min: number;
  max: number;
  stepMin: number;
  stepMax: number;
  intervalMs: number;
  storageKey?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const randomInt = (min: number, max: number) => {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
};

export const useLiveRangeMetric = ({
  min,
  max,
  stepMin,
  stepMax,
  intervalMs,
  storageKey,
}: LiveRangeConfig) => {
  const midpoint = useMemo(() => Math.round((min + max) / 2), [min, max]);

  const [value, setValue] = useState(() => {
    if (!storageKey || typeof window === 'undefined') return midpoint;

    const stored = Number(window.sessionStorage.getItem(storageKey));
    return Number.isFinite(stored) ? clamp(stored, min, max) : randomInt(min, max);
  });

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    window.sessionStorage.setItem(storageKey, String(value));
  }, [storageKey, value]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setValue((current) => {
        const step = randomInt(stepMin, stepMax);
        const direction = current >= max - step ? -1 : current <= min + step ? 1 : Math.random() > 0.5 ? 1 : -1;
        return clamp(current + direction * step, min, max);
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, max, min, stepMax, stepMin]);

  return value;
};
