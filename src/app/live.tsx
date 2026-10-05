import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { openStream } from '@/api/sse';
import { useToast } from '@/components/ui/toast';
import { useSession } from './session';

/** One live event from the server, as the activity feed shows it. */
export interface LiveEvent {
  id: number;
  name: string;
  data: Record<string, unknown>;
  at: Date;
}

interface Live {
  connected: boolean;
  events: LiveEvent[];
}

const LiveContext = createContext<Live>({ connected: false, events: [] });

let sequence = 1;

/**
 * Keeps one stream open to /api/v1/me/applications/stream while signed in: apply results
 * arrive as they happen (from the apply worker, through Kafka), the screens that show
 * applications refresh, and a toast says what changed.
 */
export function LiveProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }
    const stop = openStream(
      '/api/v1/me/applications/stream',
      (message) => {
        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(message.data) as Record<string, unknown>;
        } catch {
          data = { text: message.data };
        }
        if (message.event === 'connected') {
          return;
        }
        setEvents((all) => [{ id: sequence++, name: message.event, data, at: new Date() }, ...all].slice(0, 50));
        void queryClient.invalidateQueries({ queryKey: ['applications'] });
        if (message.event === 'apply-run-completed') {
          toast.info('Apply run finished', describeRun(data));
        } else if (message.event === 'application-updated') {
          toast.info('Application updated', describeAttempt(data));
        }
      },
      setConnected,
    );
    return stop;
  }, [user, queryClient, toast]);

  const value = useMemo(() => ({ connected, events }), [connected, events]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): Live {
  return useContext(LiveContext);
}

export function describeRun(data: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, label] of [['sent', 'sent'], ['queued', 'queued'], ['needsYou', 'need you'], ['failed', 'failed']] as const) {
    if (typeof data[key] === 'number') {
      parts.push(`${data[key]} ${label}`);
    }
  }
  return parts.join(', ') || 'Done.';
}

export function describeAttempt(data: Record<string, unknown>): string {
  const outcome = typeof data.outcome === 'string' ? data.outcome.replace(/_/g, ' ').toLowerCase() : '';
  const note = typeof data.note === 'string' ? data.note : '';
  const attempt = typeof data.attempt === 'number' ? `attempt ${data.attempt}` : '';
  return [outcome, attempt, note].filter(Boolean).join(' · ') || 'An application changed.';
}
