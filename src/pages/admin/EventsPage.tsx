import { RotateCw } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platform } from '@/api/endpoints';
import type { ServiceName } from '@/api/types';
import { JsonView } from '@/components/ui/editors';
import { ConfirmButton } from '@/components/ui/overlays';
import { Badge, Card, EmptyState, ErrorBox, Input, KeyValue, PageHeader, Spinner, Tabs } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { dateTime, timeAgo } from '@/lib/format';
import { SERVICES_WITH_EVENTS } from './HealthPage';

/** Each service's outbox backlog and the events that failed every retry, with replay. */
export default function EventsPage() {
  const [service, setService] = useState<ServiceName>('core-api');
  const [topic, setTopic] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();
  const outbox = useQuery({ queryKey: ['admin', 'outbox', service], queryFn: () => platform.outbox(service), refetchInterval: 10_000 });
  const letters = useQuery({ queryKey: ['admin', 'dlq', service, topic], queryFn: () => platform.deadLetters(service, topic || undefined) });
  const replay = useMutation({
    mutationFn: (id: string) => platform.replay(service, id),
    onSuccess: () => {
      toast.success('Sent again', 'With its original event id, so a consumer that already handled it skips it.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dlq', service] });
    },
    onError: (e) => toast.error('Not replayed', e),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Events & dead letters"
        subtitle="Events are written in the same transaction as the change (outbox) and relayed to Kafka. One that fails twice is kept here with its error; fix the cause, then replay it."
      />
      <Tabs value={service} onChange={setService} tabs={SERVICES_WITH_EVENTS.map((s) => ({ value: s, label: s }))} />
      <Card title="Outbox">
        {outbox.error ? (
          <ErrorBox error={outbox.error} />
        ) : outbox.data ? (
          <KeyValue
            items={[
              ['Waiting to be sent', outbox.data.pending],
              ['Oldest waiting', `${outbox.data.oldestPendingSeconds} s`],
              ['Failing to send', outbox.data.failing],
              ['Sent in the last hour', outbox.data.sentLastHour],
            ]}
          />
        ) : (
          <Spinner />
        )}
      </Card>
      <Card title="Dead letters" actions={<Input className="w-56" placeholder="filter by topic" value={topic} onChange={(e) => setTopic(e.target.value)} />}>
        {letters.error ? <ErrorBox error={letters.error} /> : null}
        {letters.isLoading ? (
          <Spinner />
        ) : !letters.data?.length ? (
          <EmptyState title="No dead letters">Every event of {service} was handled.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {letters.data.map((l) => (
              <li key={l.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="violet">{l.topic}</Badge>
                    {l.key && <span className="font-mono text-xs text-slate-500">key {l.key}</span>}
                    <span className="text-xs text-slate-500" title={dateTime(l.failedAt)}>failed {timeAgo(l.failedAt)}</span>
                    {l.replayedAt && <Badge tone="green">replayed {timeAgo(l.replayedAt)}</Badge>}
                  </div>
                  {!l.replayedAt && (
                    <ConfirmButton variant="secondary" icon={<RotateCw className="h-3.5 w-3.5" />} title="Replay this event?"
                      message="Sent to its topic again. Do it after fixing whatever made it fail." loading={replay.isPending && replay.variables === l.id}
                      onConfirm={() => replay.mutate(l.id)}>
                      Replay
                    </ConfirmButton>
                  )}
                </div>
                {l.error && <p className="mt-2 text-sm text-rose-600">{l.error}</p>}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-slate-500">Payload</summary>
                  <div className="mt-2"><JsonView value={l.payload} maxHeight="14rem" /></div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
