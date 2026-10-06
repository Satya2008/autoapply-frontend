import clsx from 'clsx';
import {
  Activity, ArrowLeftRight, BarChart3, Bell, BookOpen, Boxes, Briefcase, Brain, CalendarClock, ClipboardList, Cpu, Database,
  FileText, FlaskConical, Gauge, Globe, HandHelping, LayoutDashboard, ListChecks, LogOut, Menu, MessageSquareCode, Moon,
  ScrollText, Settings2, ShieldAlert, Sparkles, Sun, Target, User, Wrench, X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import { SkeletonList } from '@/components/ui/primitives';
import { useLive } from './live';
import { useSession } from './session';
import { useTheme } from './theme';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ICON = 'h-[18px] w-[18px]';

const ADMIN: NavSection[] = [
  {
    title: 'Platform',
    items: [
      { to: '/admin', label: 'System health', icon: <Gauge className={ICON} /> },
      { to: '/admin/events', label: 'Events & dead letters', icon: <ListChecks className={ICON} /> },
      { to: '/admin/scheduler', label: 'Scheduler', icon: <CalendarClock className={ICON} /> },
      { to: '/admin/caches', label: 'Caches', icon: <Boxes className={ICON} /> },
      { to: '/admin/audit', label: 'Audit log', icon: <ScrollText className={ICON} /> },
    ],
  },
  {
    title: 'Jobs & applying',
    items: [
      { to: '/admin/job-sources', label: 'Job sources', icon: <Globe className={ICON} /> },
      { to: '/admin/fetch-runs', label: 'Fetch runs', icon: <Database className={ICON} /> },
      { to: '/admin/portals', label: 'Apply portals', icon: <ShieldAlert className={ICON} /> },
    ],
  },
  {
    title: 'AI',
    items: [
      { to: '/admin/ai/providers', label: 'Providers', icon: <Cpu className={ICON} /> },
      { to: '/admin/ai/usage', label: 'Usage & cost', icon: <BarChart3 className={ICON} /> },
      { to: '/admin/ai/prompts', label: 'Prompts', icon: <MessageSquareCode className={ICON} /> },
      { to: '/admin/ai/evals', label: 'Evals', icon: <FlaskConical className={ICON} /> },
      { to: '/admin/ai/semantic', label: 'Semantic search', icon: <Brain className={ICON} /> },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: <Settings2 className={ICON} /> },
      { to: '/admin/tools', label: 'Storage & tools', icon: <Wrench className={ICON} /> },
    ],
  },
];

export function AppShell() {
  const { user, signOut } = useSession();
  const { connected } = useLive();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const inAdmin = location.pathname.startsWith('/admin');
  const needsYou = useQuery({ queryKey: ['applications', 'needs-you'], queryFn: applications.needsYou, staleTime: 30_000 });

  const user_: NavSection[] = [
    {
      title: 'Job hunt',
      items: [
        { to: '/', label: 'Dashboard', icon: <LayoutDashboard className={ICON} /> },
        { to: '/jobs', label: 'Jobs', icon: <Briefcase className={ICON} /> },
        { to: '/matches', label: 'Matches', icon: <Target className={ICON} /> },
        { to: '/applications', label: 'Applications', icon: <ClipboardList className={ICON} /> },
        { to: '/needs-you', label: 'Needs you', icon: <HandHelping className={ICON} />, badge: needsYou.data?.length },
        { to: '/skill-gap', label: 'Skill gap', icon: <Sparkles className={ICON} /> },
        { to: '/activity', label: 'Live activity', icon: <Activity className={ICON} /> },
      ],
    },
    {
      title: 'You',
      items: [
        { to: '/profile', label: 'Profile & skills', icon: <User className={ICON} /> },
        { to: '/resume', label: 'Resume', icon: <FileText className={ICON} /> },
        { to: '/notifications', label: 'Notifications', icon: <Bell className={ICON} /> },
      ],
    },
  ];
  const sections = inAdmin ? ADMIN : user_;
  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase();

  const sidebar = (
    <div className="relative flex h-full flex-col overflow-hidden bg-ink-900 text-slate-300">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative flex items-center justify-between px-5 pb-4 pt-5">
        <Brand />
        <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mx-4 mb-4 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.06] p-1 text-xs font-semibold">
        {[
          { admin: false, label: 'Job hunt', to: '/' },
          { admin: true, label: 'Admin console', to: '/admin' },
        ].map((ws) => (
          <button
            key={ws.label}
            type="button"
            onClick={() => {
              setOpen(false);
              if (ws.admin !== inAdmin) {
                navigate(ws.to);
              }
            }}
            className={clsx(
              'rounded-lg px-2 py-1.5 transition-colors',
              ws.admin === inAdmin ? 'bg-white text-ink-900 shadow' : 'text-slate-400 hover:text-white',
            )}
          >
            {ws.label}
          </button>
        ))}
      </div>

      <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {sections.map((s) => (
          <NavGroup key={s.title} section={s} onPick={() => setOpen(false)} />
        ))}
        <a
          href="/swagger-ui.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <BookOpen className={ICON} /> API docs
        </a>
      </nav>

      <div className="relative border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-xs font-bold text-white">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white" title={user?.email}>
              {user?.email}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={clsx('h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-400' : 'bg-slate-500')} />
              {connected ? 'Live updates on' : 'Reconnecting…'}
            </div>
          </div>
          <button type="button" onClick={signOut} title="Sign out" aria-label="Sign out" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-[280px] animate-fade-up" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-[#f4f5fa]/80 px-4 backdrop-blur-md dark:border-white/5 dark:bg-ink-950/80 sm:px-8">
          <button type="button" className="rounded-lg p-1.5 hover:bg-slate-900/5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={clsx(
                'rounded-lg px-2 py-1 text-xs font-semibold',
                inAdmin ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200',
              )}
            >
              {inAdmin ? 'Admin console' : 'Job hunt'}
            </span>
          </div>
          <div className="flex-1" />
          {inAdmin ? (
            <NavLink to="/" className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5 sm:inline-flex">
              <ArrowLeftRight className="h-4 w-4" /> Back to my job hunt
            </NavLink>
          ) : (
            !!needsYou.data?.length && (
              <NavLink
                to="/needs-you"
                className="hidden items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300 sm:inline-flex"
              >
                <HandHelping className="h-3.5 w-3.5" /> {needsYou.data.length} waiting for you
              </NavLink>
            )
          )}
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              connected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/5',
            )}
            title={connected ? 'Live updates are on' : 'Live updates are reconnecting'}
          >
            <span className="relative flex h-2 w-2">
              {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className={clsx('relative inline-flex h-2 w-2 rounded-full', connected ? 'bg-emerald-500' : 'bg-slate-400')} />
            </span>
            {connected ? 'Live' : 'Offline'}
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl p-2 text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-white dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5"
            aria-label="Switch theme"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </header>
        <main key={location.pathname.split('/')[1]} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">
          <Suspense
            fallback={
              <div className="space-y-6">
                <div className="skeleton h-9 w-64" />
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-white/5 dark:bg-ink-900">
                  <SkeletonList rows={5} />
                </div>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <RadarMark />
      <div>
        <div className="text-[15px] font-bold tracking-tight text-white">NaukriRadar</div>
        <div className="text-[11px] font-medium text-slate-400">find · match · apply</div>
      </div>
    </div>
  );
}

/** The logo: a radar dish with a sweeping beam. */
export function RadarMark({ size = 36 }: { size?: number }) {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-xl bg-brand-gradient shadow-glow" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="absolute inset-0" aria-hidden="true">
        <circle cx="18" cy="18" r="11" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="1.2" />
        <circle cx="18" cy="18" r="6" fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" />
        <circle cx="18" cy="18" r="1.8" fill="white" />
        <circle cx="24.5" cy="12.5" r="1.6" fill="#6ee7b7" />
      </svg>
      <div
        className="absolute inset-0 animate-sweep"
        style={{ background: 'conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.45), transparent 22%)', borderRadius: '9999px' }}
      />
    </div>
  );
}

function NavGroup({ section, onPick }: { section: NavSection; onPick: () => void }) {
  return (
    <div>
      <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{section.title}</div>
      <div className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/' || item.to === '/admin'}
            onClick={onPick}
            className={({ isActive }) =>
              clsx(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />}
                <span className={clsx(isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300')}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {!!item.badge && (
                  <span className="rounded-md bg-amber-400/90 px-1.5 py-0.5 text-[11px] font-bold leading-none text-amber-950">{item.badge}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
