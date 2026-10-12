import { Activity, Radio } from 'lucide-react';
import { describeAttempt, describeRun, useLive } from '@/app/live';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui/primitives';
import { dateTime } from '@/lib/format';

export default function ActivityPage() {
  const { connected, events } = useLive();
  return (
    <div className="space-y-5">
      <PageHeader icon={<Activity />}
        title="Live activity"
        subtitle="What happens to your applications, as it happens: when an apply run finishes and when an application is sent or handed to you. No need to refresh."
        actions={<Badge tone={connected ? 'green' : 'slate'}>{connected ? 'Connected' : 'Reconnecting…'}</Badge>}
      />
      {events.length === 0 ? (
        <EmptyState title="Nothing yet" icon={<Radio className="h-8 w-8" />}>
          Press “Apply to my matches” on the Applications page: the result appears here within seconds.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Card key={e.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={e.name === 'apply-run-completed' ? 'blue' : 'violet'}>{e.name === 'apply-run-completed' ? 'Apply run finished' : 'Application updated'}</Badge>
                  <span className="text-sm">{e.name === 'apply-run-completed' ? describeRun(e.data) : describeAttempt(e.data)}</span>
                </div>
                <span className="text-xs text-slate-400">{dateTime(e.at.toISOString())}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
