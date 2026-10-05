import clsx from 'clsx';
import {
  Activity, BarChart3, Bell, BookOpen, Boxes, Briefcase, Brain, CalendarClock, ClipboardList, Cpu, Database, FileText,
  FlaskConical, Gauge, Globe, HandHelping, LayoutDashboard, ListChecks, LogOut, Menu, MessageSquareCode, Moon,
  Radar, ScrollText, Settings2, ShieldAlert, Sparkles, Sun, Target, User, Wrench, X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import { useLive } from './live';
import { useSession } from './session';
import { useTheme } from './theme';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

const ICON = 'h-4 w-4';

export function AppShell() {
  const { user, signOut } = useSession();
  const { connected } = useLive();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const needsYou = useQuery({ queryKey: ['applications', 'needs-you'], queryFn: applications.needsYou, staleTime: 30_000 });

  const mine: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className={ICON} /> },
    { to: '/jobs', label: 'Jobs', icon: <Briefcase className={ICON} /> },
    { to: '/matches', label: 'Matches', icon: <Target className={ICON} /> },
    { to: '/skill-gap', label: 'Skill gap', icon: <Sparkles className={ICON} /> },
    { to: '/applications', label: 'Applications', icon: <ClipboardList className={ICON} /> },
    { to: '/needs-you', label: 'Needs you', icon: <HandHelping className={ICON} />, badge: needsYou.data?.length },
    { to: '/activity', label: 'Live activity', icon: <Activity className={ICON} /> },
  ];
  const account: NavItem[] = [
    { to: '/profile', label: 'Profile & skills', icon: <User className={ICON} /> },
    { to: '/resume', label: 'Resume', icon: <FileText className={ICON} /> },
    { to: '/notifications', label: 'Notifications', icon: <Bell className={ICON} /> },
  ];
  const admin: NavItem[] = [
    { to: '/admin', label: 'System health', icon: <Gauge className={ICON} /> },
    { to: '/admin/job-sources', label: 'Job sources', icon: <Globe className={ICON} /> },
    { to: '/admin/fetch-runs', label: 'Fetch runs', icon: <Database className={ICON} /> },
    { to: '/admin/portals', label: 'Apply portals', icon: <ShieldAlert className={ICON} /> },
    { to: '/admin/ai/providers', label: 'AI providers', icon: <Cpu className={ICON} /> },
    { to: '/admin/ai/usage', label: 'AI usage & cost', icon: <BarChart3 className={ICON} /> },
    { to: '/admin/ai/prompts', label: 'Prompts', icon: <MessageSquareCode className={ICON} /> },
    { to: '/admin/ai/evals', label: 'Evals', icon: <FlaskConical className={ICON} /> },
    { to: '/admin/ai/semantic', label: 'Semantic search', icon: <Brain className={ICON} /> },
    { to: '/admin/settings', label: 'Settings', icon: <Settings2 className={ICON} /> },
    { to: '/admin/scheduler', label: 'Scheduler', icon: <CalendarClock className={ICON} /> },
    { to: '/admin/events', label: 'Events & dead letters', icon: <ListChecks className={ICON} /> },
    { to: '/admin/caches', label: 'Caches', icon: <Boxes className={ICON} /> },
    { to: '/admin/audit', label: 'Audit log', icon: <ScrollText className={ICON} /> },
    { to: '/admin/tools', label: 'Storage & tools', icon: <Wrench className={ICON} /> },
  ];

  const nav = (
    <nav className="flex flex-col gap-5 overflow-y-auto px-3 pb-6">
      <NavGroup title="Job hunt" items={mine} onPick={() => setOpen(false)} />
      <NavGroup title="You" items={account} onPick={() => setOpen(false)} />
      <NavGroup title="Admin" items={admin} onPick={() => setOpen(false)} />
      <a
        href="/swagger-ui.html"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <BookOpen className={ICON} /> API docs (Swagger)
      </a>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <Brand />
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="flex h-full w-72 flex-col bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <span
            className={clsx('inline-flex items-center gap-1.5 text-xs', connected ? 'text-emerald-600' : 'text-slate-400')}
            title={connected ? 'Live updates are on' : 'Live updates are reconnecting'}
          >
            <span className={clsx('h-2 w-2 rounded-full', connected ? 'animate-pulse bg-emerald-500' : 'bg-slate-300')} />
            {connected ? 'Live' : 'Offline'}
          </span>
          <button type="button" onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Switch theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <span className="hidden max-w-[16rem] truncate text-sm text-slate-600 dark:text-slate-300 sm:inline" title={user?.id}>
            {user?.email}
          </span>
          <button type="button" onClick={signOut} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>
        <main key={location.pathname.split('/')[1]} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Radar className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-semibold">NaukriRadar</div>
        <div className="text-[11px] text-slate-500">find, match, apply</div>
      </div>
    </div>
  );
}

function NavGroup({ title, items, onPick }: { title: string; items: NavItem[]; onPick: () => void }) {
  return (
    <div>
      <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/' || item.to === '/admin'}
            onClick={onPick}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {!!item.badge && <span className="rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">{item.badge}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
