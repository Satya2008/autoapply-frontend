import clsx from 'clsx';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { errorMessage } from '@/api/client';

type Kind = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  kind: Kind;
  title: string;
  body?: string;
}

interface ToastApi {
  success: (title: string, body?: string) => void;
  error: (title: string, error?: unknown) => void;
  info: (title: string, body?: string) => void;
  warning: (title: string, body?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let next = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind: Kind, title: string, body?: string) => {
      const id = next++;
      setToasts((all) => [...all.slice(-4), { id, kind, title, body }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 8000 : 4500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, body) => push('success', title, body),
      error: (title, error) => push('error', title, error === undefined ? undefined : errorMessage(error)),
      info: (title, body) => push('info', title, body),
      warning: (title, body) => push('warning', title, body),
    }),
    [push],
  );

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <XCircle className="h-5 w-5 text-rose-500" />,
    info: <Info className="h-5 w-5 text-brand-500" />,
    warning: <TriangleAlert className="h-5 w-5 text-amber-500" />,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-16 z-[60] flex w-full max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3 shadow-lg dark:bg-slate-900',
              t.kind === 'error' ? 'border-rose-200 dark:border-rose-900' : 'border-slate-200 dark:border-slate-800',
            )}
          >
            {icons[t.kind]}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t.title}</div>
              {t.body && <div className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">{t.body}</div>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast outside ToastProvider');
  }
  return ctx;
}
