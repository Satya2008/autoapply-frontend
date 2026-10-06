import { CalendarClock, Play, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scheduler } from '@/api/endpoints';
import type { ScheduledJob } from '@/api/types';
import { Badge, Button, Card, EmptyState, ErrorBox, KeyValue, PageHeader, Spinner } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { dateTime, duration, humanize, timeAgo } from '@/lib/format';

export default function SchedulerPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const jobs = useQuery({
    queryKey: ['admin', 'scheduler'],
    queryFn: scheduler.list,
    refetchInterval: (q) => (q.state.data?.some((j) => j.running) ? 2000 : 15_000),
  });
  const run = useMutation({
    mutationFn: scheduler.run,
    onSuccess: (job) => {
      queryClient.setQueryData<ScheduledJob[]>(['admin', 'scheduler'], (all) => all?.map((j) => (j.name === job.name ? job : j)));
      toast.info(`${humanize(job.name)} started`);
    },
    onError: (e) => toast.error('Not started', e),
  });

  return (
    <div className="space-y-5">
      <PageHeader icon={<CalendarClock />}
        title="Scheduler"
        subtitle="Jobs core-api runs on a timer; only one instance runs each trigger. Their timing and on/off switch are settings."
        actions={<Link to="/admin/settings" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"><Settings2 className="h-4 w-4" /> Change times</Link>}
      />
      {jobs.error ? <ErrorBox error={jobs.error} /> : null}
      {jobs.isLoading ? (
        <Spinner />
      ) : !jobs.data?.length ? (
        <EmptyState title="No scheduled jobs" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.data.map((j) => (
            <Card
              key={j.name}
              title={<span className="flex items-center gap-2">{humanize(j.name)} {j.running ? <Badge tone="blue">running</Badge> : j.enabled ? <Badge tone="green">on</Badge> : <Badge>off</Badge>}</span>}
              actions={
                <Button size="sm" icon={<Play className="h-3.5 w-3.5" />} loading={(run.isPending && run.variables === j.name) || j.running} onClick={() => run.mutate(j.name)}>
                  Run now
                </Button>
              }
            >
              <KeyValue
                items={[
                  ['Cron', <code key="c" className="text-xs">{j.cron}</code>],
                  ['Next run', j.nextRunAt ? `${timeAgo(j.nextRunAt)} (${dateTime(j.nextRunAt)})` : '—'],
                  ['Last run', j.lastStartedAt ? `${timeAgo(j.lastStartedAt)} · ${j.lastTrigger?.toLowerCase() ?? ''}` : 'never'],
                  ['Took', duration(j.lastDurationMs)],
                  ['Outcome', j.lastSuccess === null ? '—' : j.lastSuccess ? 'succeeded' : 'failed'],
                ]}
              />
              {j.lastResult && <p className={`mt-3 text-xs ${j.lastSuccess === false ? 'text-rose-600' : 'text-slate-500'}`}>{j.lastResult}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
