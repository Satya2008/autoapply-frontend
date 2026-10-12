import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onUnauthorized, setApiToken } from '@/api/client';
import { auth } from '@/api/endpoints';
import type { AuthSession, UserRole } from '@/api/types';

/** The signed-in user, as the server described them at sign-in. */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  mustChangePassword: boolean;
  token: string;
}

interface Session {
  user: SessionUser | null;
  isAdmin: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
  /** After a password change: no longer forced to change it. */
  passwordChanged: () => void;
}

const KEY = 'naukriradar.session.v2';

function load(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    const user = raw ? (JSON.parse(raw) as SessionUser) : null;
    return user?.token ? user : null;
  } catch {
    return null;
  }
}

function save(user: SessionUser | null) {
  try {
    if (user) {
      localStorage.setItem(KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // private window: the session lasts until the tab closes
  }
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    const saved = load();
    setApiToken(saved?.token ?? null);
    return saved;
  });
  const queryClient = useQueryClient();

  const clear = useCallback(() => {
    save(null);
    setApiToken(null);
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  useEffect(() => {
    // the server ended the session (signed out elsewhere, expired, disabled): back to sign-in
    onUnauthorized(clear);
    return () => onUnauthorized(null);
  }, [clear]);

  const signIn = useCallback(
    (session: AuthSession) => {
      const next: SessionUser = {
        id: session.userId, email: session.email, name: session.name, role: session.role,
        mustChangePassword: session.mustChangePassword, token: session.token,
      };
      setApiToken(next.token);
      save(next);
      queryClient.clear();
      setUser(next);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    // tell the server so the token stops working, but leave at once either way
    auth.logout().catch(() => undefined).finally(clear);
  }, [clear]);

  const passwordChanged = useCallback(() => {
    setUser((current) => {
      if (!current) {
        return current;
      }
      const next = { ...current, mustChangePassword: false };
      save(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === 'ADMIN', signIn, signOut, passwordChanged }),
    [user, signIn, signOut, passwordChanged],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession outside SessionProvider');
  }
  return ctx;
}
