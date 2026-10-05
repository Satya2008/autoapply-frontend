import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setApiUser } from '@/api/client';
import type { User } from '@/api/types';

/**
 * Who is using the app. Until Phase 8 adds real login, signing in means picking a user by
 * email (created if new); the id then goes on every request as X-User-Id.
 */
interface Session {
  user: Pick<User, 'id' | 'email'> | null;
  signIn: (user: Pick<User, 'id' | 'email'>) => void;
  signOut: () => void;
}

const KEY = 'naukriradar.session';

function load(): Session['user'] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session['user']) : null;
  } catch {
    return null;
  }
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session['user']>(() => {
    const saved = load();
    setApiUser(saved?.id ?? null);
    return saved;
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    setApiUser(user?.id ?? null);
  }, [user]);

  const signIn = useCallback(
    (next: Pick<User, 'id' | 'email'>) => {
      setApiUser(next.id);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // private window: the session lasts until the tab closes
      }
      queryClient.clear();
      setUser(next);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // nothing saved
    }
    setApiUser(null);
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession outside SessionProvider');
  }
  return ctx;
}
