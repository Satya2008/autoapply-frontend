import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

// v2: light became the default; earlier keys held the system theme saved on every load
const KEY = 'naukriradar.theme.v2';

function initial(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // no storage: use the default
  }
  return 'light';
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const toggle = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // not remembered
      }
      return next;
    });
  return [theme, toggle];
}
