import { Activity, Radio } from 'lucide-react';
import { describeAttempt, describeRun, useLive } from '@/app/live';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui/primitives';
import { JsonView } from '@/components/ui/editors';
import { dateTime } from '@/lib/format';

export default function ActivityPage() {
  const { connected, events } = useLive();
  return (
    <div className="space-y-5">
      <PageHeader icon={<Activity />}
        title="Live activity"
        subtitle="Results arrive here the moment they happen: apply runs finishing, and each application the apply worker sends. It flows fetch → match → apply → this screen, through Kafka, without refreshing."
        actions={<Badge tone={connected ? 'green' : 'slate'}>{connected ? 'Connected' : 'Reconnecting…'}</Badge>}
      />
      {events.length === 0 ? (
        <EmptyState title="Nothing yet" icon={<Radio className="h-8 w-8" />}>
          Keep this open and run applying: the result shows up here.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Card key={e.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={e.name === 'apply-run-completed' ? 'blue' : 'violet'}>{e.name}</Badge>
                  <span className="text-sm">{e.name === 'apply-run-completed' ? describeRun(e.data) : describeAttempt(e.data)}</span>
                </div>
                <span className="text-xs text-slate-400">{dateTime(e.at.toISOString())}</span>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-slate-500">Event payload</summary>
                <div className="mt-2">
                  <JsonView value={e.data} maxHeight="12rem" />
                </div>
              </details>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
