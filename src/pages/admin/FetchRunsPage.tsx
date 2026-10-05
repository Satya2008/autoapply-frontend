import { Brush, Download, ScanText } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRuns } from '@/api/endpoints';
import type { FetchRun } from '@/api/types';
import { isRunning, useRunPolling } from '@/app/hooks';
import { RunStatusBadge } from '@/components/domain';
import { ConfirmButton } from '@/components/ui/overlays';
import { Button, Card, EmptyState, ErrorBox, Notice, PageHeader, Spinner, Table, Td } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { dateTime, duration, timeAgo } from '@/lib/format';

export default function FetchRunsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [runId, setRunId] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const runs = useQuery({ queryKey: ['admin', 'fetch-runs'], queryFn: () => fetchRuns.list(30) });
  const live = useRunPolling<FetchRun>('fetch', runId, fetchRuns.get);

  const start = useMutation({
    mutationFn: fetchRuns.start,
    onSuccess: (run) => setRunId(run.id),
    onError: (e) => toast.error('Fetch run not started', e),
  });
  useEffect(() => {
    if (live.data && !isRunning(live.data.status)) {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'fetch-runs'] });
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['job-sources'] });
    }
  }, [live.data, queryClient]);

  const cleanup = useMutation({
    mutationFn: fetchRuns.cleanup,
    onSuccess: (r) => toast.success('Cleanup done', `${r.closed} jobs closed (gone from their boards), ${r.deleted} old ones deleted.`),
    onError: (e) => toast.error('Cleanup failed', e),
  });
  const reparse = useMutation({
    mutationFn: fetchRuns.reparse,
    onSuccess: (r) => toast.info('Parsing jobs again', Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(', ')),
    onError: (e) => toast.error('Reparse not started', e),
  });

  const running = live.data && isRunning(live.data.status);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Fetch runs"
        subtitle="One run fetches every enabled board in parallel, each with its own deadline; a slow board never holds up the others. New jobs then go to AI parsing and every active user is rematched."
        actions={
          <>
            <ConfirmButton variant="secondary" size="md" icon={<ScanText className="h-4 w-4" />} title="Parse every active job again?"
              message="Use it after improving the job-parse prompt. It runs in the background and costs AI calls." onConfirm={() => reparse.mutate()} loading={reparse.isPending}>
              Parse all again
            </ConfirmButton>
            <ConfirmButton variant="secondary" size="md" icon={<Brush className="h-4 w-4" />} title="Clean up old jobs?"
              message="Jobs unseen on their board for 7 days are closed; closed ones older than 60 days are deleted." onConfirm={() => cleanup.mutate()} loading={cleanup.isPending}>
              Clean up
            </ConfirmButton>
            <Button icon={<Download className="h-4 w-4" />} loading={start.isPending || !!running} onClick={() => start.mutate()}>
              Fetch all boards now
            </Button>
          </>
        }
      />
      {start.error ? <ErrorBox error={start.error} /> : null}
      {live.data && (
        <Notice tone={running ? 'blue' : live.data.status === 'SUCCESS' ? 'green' : 'amber'}>
          <div className="flex items-center gap-2">
            <RunStatusBadge status={live.data.status} />
            {running ? 'Fetching…' : live.data.message}
          </div>
        </Notice>
      )}
      {runs.error ? <ErrorBox error={runs.error} /> : null}
      {runs.isLoading ? (
        <Spinner />
      ) : !runs.data?.length ? (
        <EmptyState title="No fetch runs yet" />
      ) : (
        <Card padded={false}>
          <Table head={['Started', 'Trigger', 'Status', 'Boards', 'Received', 'New', 'Updated', 'Duplicates', 'Took']}>
            {runs.data.map((r) => (
              <Fragment key={r.id}>
                <tr className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40" onClick={() => setOpen(open === r.id ? null : r.id)}>
                  <Td title={dateTime(r.startedAt)}>{timeAgo(r.startedAt)}</Td>
                  <Td>{r.trigger.toLowerCase()}</Td>
                  <Td>
                    <RunStatusBadge status={r.status} />
                  </Td>
                  <Td>
                    {r.sourcesSucceeded} ok{r.sourcesFailed ? <span className="text-rose-600"> · {r.sourcesFailed} failed</span> : null}
                  </Td>
                  <Td>{r.received}</Td>
                  <Td className="font-medium text-emerald-600">{r.inserted}</Td>
                  <Td>{r.updated}</Td>
                  <Td>{r.duplicates}</Td>
                  <Td>{r.finishedAt ? duration(new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) : '…'}</Td>
                </tr>
                {open === r.id && (
                  <tr>
                    <td colSpan={9} className="bg-slate-50 px-6 py-3 dark:bg-slate-800/30">
                      {r.message && <div className="mb-2 text-sm">{r.message}</div>}
                      <Table head={['Board', 'Status', 'Received', 'New', 'Updated', 'Duplicates', 'Skipped', 'Took', 'Message']}>
                        {r.sources.map((s) => (
                          <tr key={s.sourceCode}>
                            <Td className="font-mono text-xs">{s.sourceCode}</Td>
                            <Td>
                              <RunStatusBadge status={s.status} />
                            </Td>
                            <Td>{s.received}</Td>
                            <Td>{s.inserted}</Td>
                            <Td>{s.updated}</Td>
                            <Td>{s.duplicates}</Td>
                            <Td>{s.skipped}</Td>
                            <Td>{duration(s.durationMs)}</Td>
                            <Td className="text-xs">{s.message}</Td>
                          </tr>
                        ))}
                      </Table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}
