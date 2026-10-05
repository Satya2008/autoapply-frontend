import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ApiError } from '@/api/client';
import { applications, matches, me, resume } from '@/api/endpoints';
import { APPLICATION_STATUSES } from '@/api/types';
import { describeAttempt, describeRun, useLive } from '@/app/live';
import { useSession } from '@/app/session';
import { AiScoreBadge, ScoreRing } from '@/components/domain';
import { ApplyRunPanel, MatchRunPanel } from '@/components/runs';
import { Card, EmptyState, ErrorBox, PageHeader, Spinner, Stat } from '@/components/ui/primitives';
import { humanize, timeAgo } from '@/lib/format';

export default function DashboardPage() {
  const { user } = useSession();
  const profile = useQuery({ queryKey: ['profile'], queryFn: me.profile });
  const skills = useQuery({ queryKey: ['skills'], queryFn: me.skills });
  const cv = useQuery({
    queryKey: ['resume'],
    queryFn: () => resume.get().catch((e) => (e instanceof ApiError && e.status === 404 ? null : Promise.reject(e))),
  });
  const stats = useQuery({ queryKey: ['applications', 'stats'], queryFn: applications.stats });
  const top = useQuery({ queryKey: ['matches', 'top'], queryFn: () => matches.list(0, null, 5) });
  const needsYou = useQuery({ queryKey: ['applications', 'needs-you'], queryFn: applications.needsYou });
  const { events } = useLive();

  const p = profile.data;
  const steps = [
    { done: !!p?.fullName && !!p?.currentTitle, label: 'Fill in your name and current title', to: '/profile' },
    { done: (p?.targetRoles.length ?? 0) > 0, label: 'Add the roles you want', to: '/profile' },
    { done: (skills.data?.length ?? 0) >= 3, label: 'List at least three skills', to: '/profile' },
    { done: !!cv.data, label: 'Upload your resume', to: '/resume' },
    { done: (top.data?.items.length ?? 0) > 0, label: 'Find your first matches', to: '/matches' },
  ];
  const setupLeft = steps.filter((s) => !s.done).length;
  const pipeline = APPLICATION_STATUSES.map((status) => ({ status: humanize(status), count: stats.data?.byStatus[status] ?? 0 })).filter(
    (row) => row.count > 0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello${p?.fullName ? `, ${p.fullName.split(' ')[0]}` : ''}`}
        subtitle={`Signed in as ${user?.email}. Here is where your job hunt stands.`}
      />

      {setupLeft > 0 && !profile.isLoading && (
        <Card title={`Get set up · ${steps.length - setupLeft} of ${steps.length} done`}>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <li key={s.label}>
                <Link to={s.to} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  {s.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                  <span className={s.done ? 'text-slate-400 line-through' : ''}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {stats.error ? <ErrorBox error={stats.error} onRetry={() => stats.refetch()} /> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Applications" value={stats.data?.total ?? '—'} />
        <Stat label="Sent" value={stats.data?.sent ?? '—'} tone="good" />
        <Stat label="Need you" value={needsYou.data?.length ?? '—'} tone={(needsYou.data?.length ?? 0) > 0 ? 'warn' : 'default'} />
        <Stat label="Automated today" value={stats.data ? `${stats.data.automatedToday} / ${stats.data.dailyLimit}` : '—'} hint="daily limit" />
        <Stat
          label="Interviews"
          value={(stats.data?.byStatus.INTERVIEW ?? 0) + (stats.data?.byStatus.OFFER ?? 0)}
          hint={`${stats.data?.byStatus.OFFER ?? 0} offers`}
          tone="good"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Matching">
          <MatchRunPanel compact />
        </Card>
        <Card title="Applying">
          <ApplyRunPanel compact />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Best matches"
          className="lg:col-span-2"
          actions={
            <Link to="/matches" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
              All matches <ArrowRight className="h-4 w-4" />
            </Link>
          }
          padded={false}
        >
          {top.isLoading ? (
            <Spinner />
          ) : top.data?.items.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {top.data.items.map((m) => (
                <li key={m.id}>
                  <Link to={`/matches/${m.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <ScoreRing score={m.score} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{m.title}</div>
                      <div className="truncate text-xs text-slate-500">
                        {m.company} · {m.location}
                        {m.remote ? ' · remote' : ''}
                      </div>
                    </div>
                    <AiScoreBadge score={m.aiScore} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No matches yet">Fill in your profile, then press “Find matches now”.</EmptyState>
          )}
        </Card>

        <Card title="Pipeline">
          {pipeline.length ? (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={pipeline} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="status" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Applications" fill="#3366ff" radius={[0, 4, 4, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No applications yet" />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Waiting for you"
          actions={
            <Link to="/needs-you" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
              Open queue <ArrowRight className="h-4 w-4" />
            </Link>
          }
          padded={false}
        >
          {needsYou.data?.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {needsYou.data.slice(0, 5).map((n) => (
                <li key={n.application.id}>
                  <Link to={`/applications/${n.application.id}`} className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="truncate text-sm font-medium">{n.application.title}</div>
                    <div className="truncate text-xs text-slate-500">{n.reason}</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing waiting for you" />
          )}
        </Card>
        <Card
          title="Live activity"
          actions={
            <Link to="/activity" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
              Feed <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {events.length ? (
            <ul className="space-y-2">
              {events.slice(0, 6).map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="font-medium">{e.name === 'apply-run-completed' ? 'Apply run finished' : 'Application updated'}</span>
                  <span className="text-slate-500"> · {e.name === 'apply-run-completed' ? describeRun(e.data) : describeAttempt(e.data)}</span>
                  <span className="ml-2 text-xs text-slate-400">{timeAgo(e.at.toISOString())}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Quiet for now">Results of apply runs and the apply worker show up here as they happen.</EmptyState>
          )}
        </Card>
      </div>
    </div>
  );
}
