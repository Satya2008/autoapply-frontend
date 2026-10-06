import clsx from 'clsx';
import {
  Activity, ArrowRight, CalendarCheck, CheckCircle2, ChevronRight, ClipboardList, HandHelping, MapPin, Send, Target, Wifi, Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { applications, matches, me, resume } from '@/api/endpoints';
import type { ApplicationStatus } from '@/api/types';
import { APPLICATION_STATUSES } from '@/api/types';
import { describeAttempt, describeRun, useLive } from '@/app/live';
import { useSession } from '@/app/session';
import { AiScoreBadge, CompanyAvatar, ScoreRing } from '@/components/domain';
import { ApplyRunPanel, MatchRunPanel } from '@/components/runs';
import { Card, EmptyState, ErrorBox, IconChip, SkeletonList, Stat } from '@/components/ui/primitives';
import { humanize, timeAgo } from '@/lib/format';

const PIPELINE_COLORS: Partial<Record<ApplicationStatus, string>> = {
  PLANNED: 'bg-slate-400',
  QUEUED: 'bg-cyan-500',
  SENDING: 'bg-cyan-500',
  SIMULATED: 'bg-violet-500',
  SUBMITTED: 'bg-emerald-500',
  APPLIED: 'bg-emerald-500',
  NEEDS_YOU: 'bg-amber-500',
  INTERVIEW: 'bg-brand-500',
  OFFER: 'bg-teal-500',
  FAILED: 'bg-rose-500',
  REJECTED: 'bg-rose-400',
  SKIPPED: 'bg-slate-300',
};

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

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
    { done: !!p?.fullName && !!p?.currentTitle, label: 'Name and current title', to: '/profile' },
    { done: (p?.targetRoles.length ?? 0) > 0, label: 'Roles you want', to: '/profile' },
    { done: (skills.data?.length ?? 0) >= 3, label: 'At least three skills', to: '/profile' },
    { done: !!cv.data, label: 'Your resume', to: '/resume' },
    { done: (top.data?.items.length ?? 0) > 0, label: 'First matches', to: '/matches' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const setupKnown = !profile.isLoading && !skills.isLoading && !cv.isLoading && !top.isLoading;
  const pipeline = APPLICATION_STATUSES.map((status) => ({ status, count: stats.data?.byStatus[status] ?? 0 })).filter((row) => row.count > 0);
  const pipelineMax = Math.max(1, ...pipeline.map((r) => r.count));
  const firstName = p?.fullName?.split(' ')[0];
  const waiting = needsYou.data?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* hero */}
      <section className="relative overflow-hidden rounded-3xl bg-hero-gradient p-6 text-white shadow-lift sm:p-8 animate-fade-up">
        <HeroRadar />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="text-sm font-medium text-white/70">{greeting()}</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{firstName ? `${firstName}, let’s land the next one.` : 'Let’s land the next one.'}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {top.data?.items.length
                ? `Your best match right now scores ${top.data.items[0].score}. ${waiting ? `${waiting} ${waiting === 1 ? 'application needs' : 'applications need'} you.` : 'Nothing is waiting on you.'}`
                : `Signed in as ${user?.email}. Fill in your profile and NaukriRadar starts finding jobs that fit.`}
            </p>
          </div>
          {setupKnown && doneCount < steps.length && (
            <div className="w-full max-w-sm rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15 backdrop-blur">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Get set up</span>
                <span className="tabular-nums text-white/70">
                  {doneCount}/{steps.length}
                </span>
              </div>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
              </div>
              <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                {steps.map((s) => (
                  <li key={s.label}>
                    <Link to={s.to} className={clsx('flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-white/10', s.done && 'text-white/50')}>
                      {s.done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <span className="h-4 w-4 rounded-full border-2 border-white/40" />}
                      <span className={clsx(s.done && 'line-through')}>{s.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {stats.error ? <ErrorBox error={stats.error} onRetry={() => stats.refetch()} /> : null}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Applications" value={stats.data?.total} loading={stats.isLoading} icon={<ClipboardList />} hint={stats.data ? `${stats.data.sent} sent` : undefined} />
        <Stat
          label="Need you"
          value={waiting}
          loading={needsYou.isLoading}
          icon={<HandHelping />}
          tone={waiting > 0 ? 'warn' : 'default'}
          hint={waiting > 0 ? 'Finish these yourself' : 'All clear'}
        />
        <Stat
          label="Automated today"
          value={stats.data ? `${stats.data.automatedToday}/${stats.data.dailyLimit}` : undefined}
          loading={stats.isLoading}
          icon={<Zap />}
          hint="of your daily limit"
        />
        <Stat
          label="Interviews"
          value={(stats.data?.byStatus.INTERVIEW ?? 0) + (stats.data?.byStatus.OFFER ?? 0)}
          loading={stats.isLoading}
          icon={<CalendarCheck />}
          tone="good"
          hint={`${stats.data?.byStatus.OFFER ?? 0} offers`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionCard
          icon={<Target />}
          tone="brand"
          title="Find matches"
          text="Scores every fresh job against your profile: skills, title, location, salary, experience and meaning."
        >
          <MatchRunPanel compact />
        </ActionCard>
        <ActionCard
          icon={<Send />}
          tone="green"
          title="Apply to my matches"
          text="Safe sites are applied to for you. Sites that ban automation wait under “Needs you” with your answers ready."
        >
          <ApplyRunPanel compact />
        </ActionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card title="Best matches" subtitle="Highest scores first" className="lg:col-span-3" padded={false} actions={<Link to="/matches" className="link">All matches <ArrowRight className="h-4 w-4" /></Link>}>
          {top.isLoading ? (
            <div className="p-5"><SkeletonList rows={4} /></div>
          ) : top.data?.items.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {top.data.items.map((m) => (
                <li key={m.id}>
                  <Link to={`/matches/${m.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                    <CompanyAvatar name={m.company} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">{m.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 truncate text-xs text-slate-500">
                        <span className="truncate">{m.company}</span>
                        {m.location && (
                          <span className="inline-flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3" /> {m.location}
                          </span>
                        )}
                        {m.remote && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600">
                            <Wifi className="h-3 w-3" /> remote
                          </span>
                        )}
                      </div>
                    </div>
                    <AiScoreBadge score={m.aiScore} />
                    <ScoreRing score={m.score} size={44} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No matches yet" icon={<Target />}>
              Fill in your profile, then press “Find matches now”.
            </EmptyState>
          )}
        </Card>

        <Card title="Pipeline" subtitle="Applications by status" className="lg:col-span-2" actions={<Link to="/applications" className="link">Open <ArrowRight className="h-4 w-4" /></Link>}>
          {stats.isLoading ? (
            <SkeletonList rows={4} avatar={false} />
          ) : pipeline.length ? (
            <ul className="space-y-3">
              {pipeline.map((row) => (
                <li key={row.status}>
                  <Link to="/applications" className="block">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{humanize(row.status)}</span>
                      <span className="font-semibold tabular-nums">{row.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                      <div className={clsx('h-full rounded-full', PIPELINE_COLORS[row.status] ?? 'bg-brand-500')} style={{ width: `${(row.count / pipelineMax) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No applications yet" icon={<ClipboardList />}>
              Apply to your matches and they show up here.
            </EmptyState>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Waiting for you"
          subtitle="Sites you finish yourself"
          padded={false}
          actions={<Link to="/needs-you" className="link">Open queue <ArrowRight className="h-4 w-4" /></Link>}
        >
          {needsYou.isLoading ? (
            <div className="p-5"><SkeletonList rows={3} /></div>
          ) : needsYou.data?.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {needsYou.data.slice(0, 5).map((n) => (
                <li key={n.application.id}>
                  <Link to={`/applications/${n.application.id}`} className="group flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                    <CompanyAvatar name={n.application.company} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{n.application.title}</div>
                      <div className="truncate text-xs text-amber-700 dark:text-amber-300">{n.reason}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing waiting for you" icon={<CheckCircle2 />} />
          )}
        </Card>
        <Card title="Live activity" subtitle="As it happens" actions={<Link to="/activity" className="link">Feed <ArrowRight className="h-4 w-4" /></Link>}>
          {events.length ? (
            <ol className="relative space-y-4 border-l border-slate-200 pl-5 dark:border-white/10">
              {events.slice(0, 6).map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span
                    className={clsx(
                      'absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-ink-900',
                      e.name === 'apply-run-completed' ? 'bg-brand-500' : 'bg-emerald-500',
                    )}
                  />
                  <div className="font-semibold">{e.name === 'apply-run-completed' ? 'Apply run finished' : 'Application updated'}</div>
                  <div className="text-slate-500">{e.name === 'apply-run-completed' ? describeRun(e.data) : describeAttempt(e.data)}</div>
                  <div className="text-xs text-slate-400">{timeAgo(e.at.toISOString())}</div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Quiet for now" icon={<Activity />}>
              Results of apply runs and the apply worker show up here as they happen.
            </EmptyState>
          )}
        </Card>
      </div>
    </div>
  );
}

function ActionCard({ icon, tone, title, text, children }: { icon: ReactNode; tone: 'brand' | 'green'; title: string; text: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/[0.06] dark:bg-ink-900">
      <div className="mb-4 flex items-start gap-3">
        <IconChip tone={tone} size="lg">
          {icon}
        </IconChip>
        <div>
          <div className="text-[15px] font-semibold">{title}</div>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/** Concentric rings with a sweeping beam, drawn behind the hero text. */
function HeroRadar() {
  return (
    <div className="pointer-events-none absolute -right-20 -top-24 h-[420px] w-[420px] opacity-60" aria-hidden="true">
      <svg viewBox="0 0 420 420" className="absolute inset-0">
        {[200, 150, 100, 50].map((r) => (
          <circle key={r} cx="210" cy="210" r={r} fill="none" stroke="white" strokeOpacity="0.14" />
        ))}
        <line x1="10" y1="210" x2="410" y2="210" stroke="white" strokeOpacity="0.08" />
        <line x1="210" y1="10" x2="210" y2="410" stroke="white" strokeOpacity="0.08" />
        <circle cx="290" cy="150" r="5" fill="#6ee7b7" />
        <circle cx="150" cy="280" r="4" fill="white" fillOpacity="0.7" />
        <circle cx="320" cy="260" r="3.5" fill="#fcd34d" />
      </svg>
      <div
        className="absolute inset-0 animate-sweep rounded-full"
        style={{ background: 'conic-gradient(from 0deg, rgba(255,255,255,0.22), transparent 20%)', animationDuration: '6s' }}
      />
    </div>
  );
}
