import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * Polls a background run (match, apply, fetch, eval) every 1.5 s until it is no longer
 * running. The backend answers 202 and does the work on a worker pool; this is the other half.
 */
export function useRunPolling<T extends { status: string }>(
  key: string,
  id: string | null,
  fetchRun: (id: string) => Promise<T>,
) {
  return useQuery({
    queryKey: ['run', key, id],
    queryFn: () => fetchRun(id as string),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'RUNNING' || status === 'QUEUED' || status === undefined ? 1500 : false;
    },
  });
}

export function isRunning(status: string | undefined): boolean {
  return status === 'RUNNING' || status === 'QUEUED';
}

/** A value that settles after the user stops typing. */
export function useDebounced<T>(value: T, ms = 350): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

/** Remembers a small UI choice (a filter, a tab) per browser; falls back to the default without storage. */
export function useStoredState<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`naukriradar.ui.${key}`);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  });
  const set = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(`naukriradar.ui.${key}`, JSON.stringify(next));
    } catch {
      // not remembered
    }
  };
  return [value, set];
}
