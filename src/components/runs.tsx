import { Play, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { applications, matches } from '@/api/endpoints';
import type { ApplyRun, MatchRun } from '@/api/types';
import { isRunning, useRunPolling } from '@/app/hooks';
import { duration } from '@/lib/format';
import { RunStatusBadge } from './domain';
import { Button, ErrorBox, KeyValue, Notice } from './ui/primitives';
import { useToast } from './ui/toast';

function took(run: { startedAt: string; finishedAt: string | null }): string {
  return run.finishedAt ? duration(new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) : '…';
}

/** Starts a match run and follows it to the end. */
export function MatchRunPanel({ compact = false }: { compact?: boolean }) {
  const [runId, setRunId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const start = useMutation({
    mutationFn: matches.startRun,
    onSuccess: (run) => setRunId(run.id),
  });
  const run = useRunPolling<MatchRun>('match', runId, matches.run);
  const data = run.data;
  const done = data && !isRunning(data.status);

  useEffect(() => {
    if (done) {
      // the run wrote new matches: lists showing the old ones refresh
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
    }
  }, [done, runId, queryClient]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          icon={<Play className="h-4 w-4" />}
          loading={start.isPending || (data ? isRunning(data.status) : !!runId)}
          onClick={() => start.mutate(undefined, { onError: (e) => toast.error('Matching did not start', e) })}
        >
          Find matches now
        </Button>
        {data && <RunStatusBadge status={data.status} />}
        {!compact && !data && <span className="text-sm text-slate-500">Scores fresh jobs against your profile in the background.</span>}
      </div>
      {start.error && <StartError error={start.error} />}
      {data && done && (
        <div className="space-y-2">
          {data.message && <Notice tone={data.status === 'SUCCESS' ? 'green' : 'red'}>{data.message}</Notice>}
          {!compact && data.status === 'SUCCESS' && (
            <KeyValue
              items={[
                ['Jobs considered', data.jobsConsidered],
                ['New matches', data.matchesCreated],
                ['Updated matches', data.matchesUpdated],
                ['Excluded by your filters', data.excluded],
                ['Below the threshold', data.belowThreshold],
                ['Reviewed by AI', data.aiReviewed],
                ['Took', took(data)],
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** Starts an apply run and follows it to the end. */
export function ApplyRunPanel({ compact = false }: { compact?: boolean }) {
  const [runId, setRunId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const start = useMutation({
    mutationFn: applications.startRun,
    onSuccess: (run) => setRunId(run.id),
  });
  const run = useRunPolling<ApplyRun>('apply', runId, applications.run);
  const data = run.data;
  const done = data && !isRunning(data.status);

  useEffect(() => {
    if (done) {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  }, [done, runId, queryClient]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="success"
          icon={<Send className="h-4 w-4" />}
          loading={start.isPending || (data ? isRunning(data.status) : !!runId)}
          onClick={() => start.mutate(undefined, { onError: (e) => toast.error('Applying did not start', e) })}
        >
          Apply to my matches
        </Button>
        {data && <RunStatusBadge status={data.status} />}
        {!compact && !data && (
          <span className="text-sm text-slate-500">Safe sites are applied to for you; the rest wait under “Needs you”.</span>
        )}
      </div>
      {start.error && <StartError error={start.error} />}
      {data && done && (
        <div className="space-y-2">
          {data.message && <Notice tone={data.status === 'SUCCESS' ? 'green' : 'red'}>{data.message}</Notice>}
          {!compact && data.status === 'SUCCESS' && (
            <KeyValue
              items={[
                ['Matches considered', data.matchesConsidered],
                ['Queued to send', data.queued],
                ['Simulated', data.simulated],
                ['Waiting for you', data.needsYou],
                ['Already applied', data.alreadyApplied],
                ['Below your minimum score', data.belowScore],
                ['Over today’s limit (later)', data.deferred],
                ['Failed', data.failed],
                ['Took', took(data)],
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
}

function StartError({ error }: { error: unknown }) {
  if (error instanceof ApiError && error.status === 409) {
    return <Notice tone="amber">{error.message} It continues in the background; results show up here and in Live activity.</Notice>;
  }
  if (error instanceof ApiError && error.status === 422) {
    return <Notice tone="amber">{error.message}</Notice>;
  }
  return <ErrorBox error={error} />;
}
