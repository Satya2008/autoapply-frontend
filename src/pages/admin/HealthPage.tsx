import { Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ai, platform, scheduler } from '@/api/endpoints';
import type { ServiceName } from '@/api/types';
import { Badge, Card, ErrorBox, Notice, PageHeader, Stat, Table, Td } from '@/components/ui/primitives';
import { percent, timeAgo } from '@/lib/format';

export const SERVICES_WITH_RESILIENCE: ServiceName[] = ['core-api', 'job-service', 'matching-service'];
export const SERVICES_WITH_EVENTS: ServiceName[] = ['core-api', 'job-service', 'matching-service', 'notification-service'];

/** The platform at a glance: circuit breakers, event backlogs, dead letters, semantic index, jobs. */
export default function HealthPage() {
  const resilience = useQueries({
    queries: SERVICES_WITH_RESILIENCE.map((s) => ({ queryKey: ['admin', 'resilience', s], queryFn: () => platform.resilience(s), refetchInterval: 15_000 })),
  });
  const outbox = useQueries({
    queries: SERVICES_WITH_EVENTS.map((s) => ({ queryKey: ['admin', 'outbox', s], queryFn: () => platform.outbox(s), refetchInterval: 15_000 })),
  });
  const dlq = useQueries({
    queries: SERVICES_WITH_EVENTS.map((s) => ({ queryKey: ['admin', 'dlq', s], queryFn: () => platform.deadLetters(s), refetchInterval: 30_000 })),
  });
  const embeddings = useQuery({ queryKey: ['admin', 'embeddings'], queryFn: ai.embeddings });
  const jobs = useQuery({ queryKey: ['admin', 'scheduler'], queryFn: scheduler.list });

  const open = resilience.flatMap((r) => r.data ?? []).filter((d) => d.state !== 'CLOSED');
  const pending = outbox.reduce((sum, o) => sum + (o.data?.pending ?? 0), 0);
  const deadLetters = dlq.reduce((sum, d) => sum + (d.data?.filter((l) => !l.replayedAt).length ?? 0), 0);
  const down = [...resilience, ...outbox].filter((q) => q.error).length;

  return (
    <div className="space-y-6">
      <PageHeader icon={<Gauge />} title="System health" subtitle="Refreshes every 15 seconds. Every number here comes straight from the services." />
      <Notice tone="amber">
        Admin screens are open to anyone signed in until login and roles arrive (Phase 8); keep this app local until then.
      </Notice>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Services answering" value={`${SERVICES_WITH_EVENTS.length + 1 - Math.min(down, SERVICES_WITH_EVENTS.length)}/${SERVICES_WITH_EVENTS.length + 1}`}
          tone={down ? 'bad' : 'good'} hint="gateway + services" />
        <Stat label="Open circuits" value={open.length} tone={open.length ? 'bad' : 'good'} />
        <Stat label="Events waiting" value={pending} tone={pending > 100 ? 'warn' : 'default'} hint="in outboxes" />
        <Stat label="Dead letters" value={deadLetters} tone={deadLetters ? 'warn' : 'good'} hint="not replayed" />
        <Stat label="Job vectors" value={embeddings.data?.jobsWithVectors ?? '—'} hint={embeddings.data?.currentModel} />
      </div>

      <Card title="Dependencies (circuit breakers)" padded={false}>
        <Table head={['Service', 'Calls to', 'State', 'Failure rate', 'Recent calls', 'Refused', 'Free slots']}>
          {resilience.map((r, i) =>
            r.error ? (
              <tr key={SERVICES_WITH_RESILIENCE[i]}>
                <Td>{SERVICES_WITH_RESILIENCE[i]}</Td>
                <Td className="text-rose-600" title={String(r.error)}>
                  not answering
                </Td>
              </tr>
            ) : (
              (r.data ?? []).map((d) => (
                <tr key={SERVICES_WITH_RESILIENCE[i] + d.name}>
                  <Td>{SERVICES_WITH_RESILIENCE[i]}</Td>
                  <Td className="font-mono text-xs">{d.name}</Td>
                  <Td>
                    <Badge tone={d.state === 'CLOSED' ? 'green' : d.state === 'HALF_OPEN' ? 'amber' : 'red'}>{d.state}</Badge>
                  </Td>
                  <Td>{d.failureRate < 0 ? '—' : percent(d.failureRate / 100)}</Td>
                  <Td>{d.recentCalls}</Td>
                  <Td>{d.refusedCalls}</Td>
                  <Td>{d.freeSlots}</Td>
                </tr>
              ))
            ),
          )}
        </Table>
      </Card>

      <Card title="Events" actions={<Link to="/admin/events" className="text-sm text-brand-600 hover:underline">Dead letters →</Link>} padded={false}>
        <Table head={['Service', 'Waiting', 'Oldest waiting', 'Failing', 'Sent last hour', 'Dead letters']}>
          {SERVICES_WITH_EVENTS.map((s, i) => (
            <tr key={s}>
              <Td>{s}</Td>
              {outbox[i].error ? (
                <Td className="text-rose-600">not answering</Td>
              ) : (
                <>
                  <Td>{outbox[i].data?.pending ?? '…'}</Td>
                  <Td>{outbox[i].data ? (outbox[i].data.oldestPendingSeconds == null ? '—' : `${outbox[i].data.oldestPendingSeconds}s`) : '…'}</Td>
                  <Td>{outbox[i].data?.failing ?? '…'}</Td>
                  <Td>{outbox[i].data?.sentLastHour ?? '…'}</Td>
                  <Td>{dlq[i].data?.filter((l) => !l.replayedAt).length ?? '…'}</Td>
                </>
              )}
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Scheduled jobs" actions={<Link to="/admin/scheduler" className="text-sm text-brand-600 hover:underline">Scheduler →</Link>} padded={false}>
        {jobs.error ? (
          <div className="p-4"><ErrorBox error={jobs.error} /></div>
        ) : (
          <Table head={['Job', 'Enabled', 'Next run', 'Last run', 'Result']}>
            {jobs.data?.map((j) => (
              <tr key={j.name}>
                <Td className="font-medium">{j.name}</Td>
                <Td>{j.enabled ? <Badge tone="green">on</Badge> : <Badge>off</Badge>}</Td>
                <Td>{timeAgo(j.nextRunAt)}</Td>
                <Td>{timeAgo(j.lastFinishedAt)}</Td>
                <Td className="max-w-md truncate text-xs" title={j.lastResult ?? ''}>
                  {j.lastSuccess === false ? <span className="text-rose-600">{j.lastResult}</span> : j.lastResult ?? '—'}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
