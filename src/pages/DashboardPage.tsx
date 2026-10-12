import clsx from 'clsx';
import {
  Activity, ArrowRight, CalendarCheck, CheckCircle2, ChevronRight, ClipboardList, HandHelping, MapPin, Send, Target, Wifi, Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { applications, matches, me, resume } from '@/api/endpoints';
import type { ApplicationStatus } from '@/api/types';
import { APPLICATION_STATUSES } from '@/api/types';
import { describeAttempt, describeRun, useLive } from '@/app/live';
import { useSession } from '@/app/session';
import { AiScoreBadge, CompanyAvatar, ScoreRing } from '@/components/domain';
import { friendlyReason } from '@/components/answers';
import { ApplyRunPanel, MatchRunPanel } from '@/components/runs';
import { Card, EmptyState, ErrorBox, IconChip, SkeletonList, Stat } from '@/components/ui/primitives';
import { humanize, timeAgo } from '@/lib/format';
import { NEW_USER_KEY } from '@/lib/onboarding';

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
  const navigate = useNavigate();
  useEffect(() => {
    // a brand-new account goes through the setup steps first, once
    try {
      if (localStorage.getItem(NEW_USER_KEY)) {
        localStorage.removeItem(NEW_USER_KEY);
        navigate('/setup', { replace: true });
      }
    } catch {
      // no storage: the checklist below still guides them
    }
  }, [navigate]);
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
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-50 via-white to-fuchsia-50 p-6 text-slate-900 shadow-[0_24px_60px_-30px_rgba(30,27,75,0.35)] ring-1 ring-slate-200/70 dark:from-ink-900 dark:via-ink-900 dark:to-brand-950 dark:text-white dark:ring-white/5 sm:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-drift rounded-full bg-fuchsia-300/40 blur-3xl dark:bg-fuchsia-500/20" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 animate-drift rounded-full bg-amber-200/50 blur-3xl dark:bg-brand-500/20" style={{ animationDelay: '-6s' }} />
        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 animate-drift rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-500/10" style={{ animationDelay: '-12s' }} />
        <span className="pointer-events-none absolute right-[42%] top-8 h-4 w-4 animate-float rounded-full bg-amber-300" />
        <span className="pointer-events-none absolute bottom-10 right-[46%] h-3 w-3 animate-float rounded-full bg-emerald-400" style={{ animationDelay: '-2s' }} />
        <HeroRadar />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
            >
              {greeting()} 👋
            </motion.div>
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-[44px]">
              {[
                ...(firstName ? [{ w: `${firstName},`, accent: false }] : []),
                ...'let’s land the next one.'.split(' ').map((w) => ({ w, accent: true })),
              ].map(({ w, accent }, i) => (
                <motion.span
                  key={i}
                  className={clsx('inline-block', accent && 'bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent dark:from-brand-300 dark:via-violet-300 dark:to-fuchsia-300')}
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
                >
                  {i === 0 && !firstName ? 'Let’s' : w}&nbsp;
                </motion.span>
              ))}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
              {top.data?.items.length
                ? `Your best match right now scores ${top.data.items[0].score}. ${waiting ? `${waiting} ${waiting === 1 ? 'application needs' : 'applications need'} you.` : 'Nothing is waiting on you.'}`
                : `Signed in as ${user?.email}. Fill in your profile and NaukriRadar starts finding jobs that fit.`}
            </p>
          </div>
          {setupKnown && doneCount < steps.length && (
            <motion.div
              initial={{ opacity: 0, x: 24, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 24 }}
              className="w-full max-w-sm rounded-3xl bg-white/85 p-5 shadow-[0_20px_50px_-20px_rgba(30,27,75,0.3)] ring-1 ring-slate-200/70 backdrop-blur-md dark:bg-white/[0.06] dark:ring-white/10"
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-bold">Get set up</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold tabular-nums text-brand-700 dark:bg-white/10 dark:text-white/80">
                  {doneCount}/{steps.length}
                </span>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/15">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(doneCount / steps.length) * 100}%` }}
                  transition={{ delay: 0.5, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </div>
              <ul className="space-y-0.5 text-sm">
                {steps.map((s, i) => (
                  <motion.li key={s.label} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.06 }}>
                    <Link
                      to={s.to}
                      className={clsx(
                        'group flex items-center gap-2.5 rounded-xl px-2 py-1.5 font-medium text-slate-700 transition-colors hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-white/10',
                        s.done && 'text-slate-400 dark:text-white/50',
                      )}
                    >
                      {s.done ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-[10px] font-bold text-white">{i + 1}</span>
                      )}
                      <span className={clsx('flex-1', s.done && 'line-through')}>{s.label}</span>
                      {!s.done && <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
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
          text="Scores every fresh job against your profile: skills, title, location, experience, recency and meaning."
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
              {top.data.items.map((m, i) => (
                <motion.li key={m.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07, type: 'spring', stiffness: 260, damping: 26 }}>
                  <Link
                    to={`/matches/${m.id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-gradient-to-r hover:from-brand-50/80 hover:to-transparent hover:pl-6 dark:hover:from-brand-500/10"
                  >
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
                </motion.li>
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
                      <div className={clsx('bar-grow h-full rounded-full', PIPELINE_COLORS[row.status] ?? 'bg-brand-500')} style={{ width: `${(row.count / pipelineMax) * 100}%` }} />
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

      {/* only what has something in it, so a fresh account sees a short, calm page */}
      {(waiting > 0 || events.length > 0) && (
      <div className={clsx('grid gap-4', waiting > 0 && events.length > 0 && 'lg:grid-cols-2')}>
        {waiting > 0 && (
        <Card
          title="Waiting for you"
          subtitle="Sites you finish yourself"
          padded={false}
          actions={<Link to="/needs-you" className="link">Open queue <ArrowRight className="h-4 w-4" /></Link>}
        >
          {needsYou.data?.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {needsYou.data.slice(0, 5).map((n) => (
                <li key={n.application.id}>
                  <Link to={`/applications/${n.application.id}`} className="group flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                    <CompanyAvatar name={n.application.company} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{n.application.title}</div>
                      <div className="truncate text-xs text-amber-700 dark:text-amber-300">{friendlyReason(n.reason)}</div>
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
        )}
        {events.length > 0 && (
        <Card title="Live activity" subtitle="As it happens" actions={<Link to="/activity" className="link">Feed <ArrowRight className="h-4 w-4" /></Link>}>
          {events.length ? (
            <ol className="relative space-y-4 border-l border-slate-200 pl-5 dark:border-white/10">
              <AnimatePresence initial={false}>
              {events.slice(0, 6).map((e) => (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative text-sm"
                >
                  <span
                    className={clsx(
                      'absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-ink-900',
                      e.name === 'apply-run-completed' ? 'bg-brand-500' : 'bg-emerald-500',
                    )}
                  />
                  <div className="font-semibold">{e.name === 'apply-run-completed' ? 'Apply run finished' : 'Application updated'}</div>
                  <div className="text-slate-500">{e.name === 'apply-run-completed' ? describeRun(e.data) : describeAttempt(e.data)}</div>
                  <div className="text-xs text-slate-400">{timeAgo(e.at.toISOString())}</div>
                </motion.li>
              ))}
              </AnimatePresence>
            </ol>
          ) : (
            <EmptyState title="Quiet for now" icon={<Activity />}>
              Results of apply runs and the apply worker show up here as they happen.
            </EmptyState>
          )}
        </Card>
        )}
      </div>
      )}
    </div>
  );
}

function ActionCard({ icon, tone, title, text, children }: { icon: ReactNode; tone: 'brand' | 'green'; title: string; text: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift dark:border-white/[0.06] dark:bg-ink-900/80',
        tone === 'brand' ? 'hover:border-brand-200 dark:hover:border-brand-400/25' : 'hover:border-emerald-200 dark:hover:border-emerald-400/25',
      )}
    >
      <div
        className={clsx(
          'pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100',
          tone === 'brand' ? 'bg-brand-400/25' : 'bg-emerald-400/25',
          'opacity-40',
        )}
      />
      <div className="relative mb-4 flex items-start gap-3">
        <span className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
          <IconChip tone={tone} size="lg">
            {icon}
          </IconChip>
        </span>
        <div>
          <div className="text-[15px] font-semibold">{title}</div>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

/** Concentric rings with a sweeping beam, drawn behind the hero text. */
function HeroRadar() {
  return (
    <div className="pointer-events-none absolute -right-20 -top-24 hidden h-[420px] w-[420px] text-brand-400 opacity-70 dark:text-white dark:opacity-60 sm:block" aria-hidden="true">
      <svg viewBox="0 0 420 420" className="absolute inset-0">
        {[200, 150, 100, 50].map((r) => (
          <circle key={r} cx="210" cy="210" r={r} fill="none" stroke="currentColor" strokeOpacity="0.35" />
        ))}
        <line x1="10" y1="210" x2="410" y2="210" stroke="currentColor" strokeOpacity="0.2" />
        <line x1="210" y1="10" x2="210" y2="410" stroke="currentColor" strokeOpacity="0.2" />
        <circle cx="290" cy="150" r="5" fill="#6ee7b7" className="origin-[290px_150px] animate-blip" />
        <circle cx="150" cy="280" r="4" fill="#a78bfa" className="origin-[150px_280px] animate-blip" style={{ animationDelay: '-0.8s' }} />
        <circle cx="320" cy="260" r="3.5" fill="#fcd34d" className="origin-[320px_260px] animate-blip" style={{ animationDelay: '-1.6s' }} />
      </svg>
      <div
        className="absolute inset-0 animate-sweep rounded-full"
        style={{ background: 'conic-gradient(from 0deg, rgba(139,92,246,0.22), transparent 20%)', animationDuration: '6s' }}
      />
    </div>
  );
}
