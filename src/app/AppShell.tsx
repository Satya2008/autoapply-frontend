import clsx from 'clsx';
import {
  ArrowLeft, BarChart3, Bell, BookOpen, Boxes, Briefcase, Brain, CalendarClock, ClipboardList, Cpu, Database, FlaskConical, Gauge,
  Globe, HandHelping, Home, ListChecks, LogOut, Menu, MessageSquareCode, Moon, ScrollText, Settings2, ShieldAlert, Sun, Target,
  User, Users, Wrench, X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import { ApplyCheckPrompt } from '@/components/applyCheck';
import { SkeletonList } from '@/components/ui/primitives';
import { useLive } from './live';
import { useSession } from './session';
import { useTheme } from './theme';

const ICON = 'h-[18px] w-[18px]';
const SPRING = { type: 'spring', stiffness: 420, damping: 36 } as const;

interface Tab {
  to: string;
  label: string;
  badge?: number;
}

/** One entry in the sidebar. Its tabs are the related pages, shown as a strip at the top of each. */
interface Section {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  tabs?: Tab[];
  /** Pages that belong to this section without a tab of their own. */
  also?: string[];
}

interface AdminGroup {
  title: string;
  items: Section[];
}

const ADMIN: AdminGroup[] = [
  {
    title: 'Platform',
    items: [
      { to: '/admin/users', label: 'Users', icon: <Users className={ICON} /> },
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

/** True when `path` is `to` or a page below it. */
function under(path: string, to: string): boolean {
  return to === '/' || to === '/admin' ? path === to : path === to || path.startsWith(`${to}/`);
}

function sectionActive(path: string, s: Section): boolean {
  return [s.to, ...(s.tabs ?? []).map((t) => t.to), ...(s.also ?? [])].some((to) => under(path, to));
}

export function AppShell() {
  const { user, isAdmin, signOut } = useSession();
  const { connected } = useLive();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const inAdmin = pathname.startsWith('/admin');
  const needsYou = useQuery({ queryKey: ['applications', 'needs-you'], queryFn: applications.needsYou, staleTime: 30_000 });
  const waiting = needsYou.data?.length ?? 0;

  const sections: Section[] = [
    { to: '/', label: 'Home', icon: <Home className={ICON} /> },
    { to: '/jobs', label: 'Jobs', icon: <Briefcase className={ICON} /> },
    {
      to: '/matches',
      label: 'Matches',
      icon: <Target className={ICON} />,
      badge: waiting,
      tabs: [
        { to: '/matches', label: 'My matches' },
        { to: '/needs-you', label: 'Needs you', badge: waiting },
        { to: '/skill-gap', label: 'Skill gap' },
      ],
    },
    {
      to: '/applications',
      label: 'Applications',
      icon: <ClipboardList className={ICON} />,
      tabs: [
        { to: '/applications', label: 'All' },
      ],
      also: ['/activity'],
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: <User className={ICON} />,
      tabs: [
        { to: '/profile', label: 'Profile & skills' },
        { to: '/resume', label: 'Resume' },
        { to: '/notifications', label: 'Notifications' },
      ],
    },
  ];
  const current = inAdmin ? undefined : sections.find((s) => sectionActive(pathname, s));
  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase();

  const sidebar = (
    <div className="relative flex h-full flex-col overflow-hidden border-r border-slate-200/70 bg-white/75 text-slate-600 backdrop-blur-xl dark:border-white/5 dark:bg-ink-900 dark:text-slate-300">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-drift rounded-full bg-fuchsia-200/50 blur-3xl dark:bg-brand-600/30" />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 animate-drift rounded-full bg-sky-200/50 blur-3xl dark:bg-fuchsia-600/15"
        style={{ animationDelay: '-8s' }}
      />

      <div className="relative flex items-center justify-between px-5 pb-6 pt-6">
        <Brand />
        <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 pb-6">
        {inAdmin ? (
          <div className="space-y-6">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" /> Back to my job hunt
            </Link>
            {ADMIN.map((g) => (
              <div key={g.title}>
                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{g.title}</div>
                <div className="flex flex-col gap-0.5">
                  {g.items.map((item) => (
                    <NavItem key={item.to} item={item} active={under(pathname, item.to)} onPick={() => setOpen(false)} />
                  ))}
                </div>
              </div>
            ))}
            <a
              href="/swagger-ui.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <BookOpen className={ICON} /> API docs
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {sections.map((s, i) => (
              <motion.div key={s.to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i, ...SPRING }}>
                <NavItem item={s} big active={s === current} onPick={() => setOpen(false)} />
              </motion.div>
            ))}
          </div>
        )}
      </nav>

      <div className="relative border-t border-slate-200/70 p-3 dark:border-white/[0.06]">
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-2 ring-1 ring-slate-200/70 dark:bg-transparent dark:ring-0">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-xs font-bold text-white">
            {initials}
            <span className={clsx('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-ink-900', connected ? 'bg-emerald-400' : 'bg-slate-500')} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={user?.email}>
              {user?.name || user?.email}
            </div>
            {!inAdmin && isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-800 dark:text-slate-400 dark:hover:text-white">
                Admin console →
              </Link>
            )}
          </div>
          <button type="button" onClick={signOut} title="Sign out" aria-label="Sign out" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 lg:block">{sidebar}</aside>

        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.aside
                className="h-full w-[280px]"
                onClick={(e) => e.stopPropagation()}
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={SPRING}
              >
                {sidebar}
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <Backdrop />
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/60 bg-white/60 px-4 backdrop-blur-xl dark:border-white/5 dark:bg-ink-950/70 sm:px-8">
            <button type="button" className="rounded-lg p-1.5 hover:bg-slate-900/5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            {current?.tabs ? (
              <SubTabs tabs={current.tabs} pathname={pathname} />
            ) : (
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{inAdmin ? 'Admin console' : current?.label}</span>
            )}
            <div className="flex-1" />
            <AnimatePresence>
              {!inAdmin && waiting > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <NavLink
                    to="/needs-you"
                    className="hidden items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300 md:inline-flex"
                  >
                    <HandHelping className="h-3.5 w-3.5" /> {waiting} waiting for you
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
            <span
              className="relative flex h-2.5 w-2.5"
              title={connected ? 'Live updates are on' : 'Live updates are reconnecting'}
              aria-label={connected ? 'Live' : 'Offline'}
            >
              {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className={clsx('relative inline-flex h-2.5 w-2.5 rounded-full', connected ? 'bg-emerald-500' : 'bg-slate-400')} />
            </span>
            {!inAdmin && (
              <NavLink to="/notifications" className={iconButton} aria-label="Notifications" title="Notifications">
                <Bell className="h-4 w-4" />
              </NavLink>
            )}
            <button type="button" onClick={toggleTheme} className={iconButton} aria-label="Switch theme" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  className="block"
                  initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </header>
          <main className="relative mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-8 sm:px-8 lg:pb-10">
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
              <div key={pathname} className="stagger">
                <Outlet />
              </div>
              <ApplyCheckPrompt />
            </Suspense>
          </main>
        </div>

        {!inAdmin && <BottomNav sections={sections} current={current} />}
      </div>
    </MotionConfig>
  );
}

const iconButton =
  'rounded-2xl bg-white/70 p-2 text-slate-500 ring-1 ring-inset ring-slate-200/80 transition-all hover:-translate-y-px hover:bg-white hover:text-brand-600 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10 dark:hover:text-white';

/** Soft colour blobs drifting slowly behind the page. */
function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden lg:left-[248px]" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)] dark:hidden" />
      <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] animate-drift rounded-full bg-fuchsia-300/30 blur-[120px] dark:bg-brand-600/15" />
      <div
        className="absolute -right-32 top-1/3 h-[460px] w-[460px] animate-drift rounded-full bg-sky-300/30 blur-[120px] dark:bg-fuchsia-600/10"
        style={{ animationDelay: '-7s' }}
      />
      <div
        className="absolute bottom-0 left-0 h-[400px] w-[400px] animate-drift rounded-full bg-amber-200/40 blur-[120px] dark:bg-cyan-500/[0.07]"
        style={{ animationDelay: '-13s' }}
      />
    </div>
  );
}

function SubTabs({ tabs, pathname }: { tabs: Tab[]; pathname: string }) {
  // the most specific tab wins, so /matches/42 lights up "My matches"
  const active = tabs.find((t) => under(pathname, t.to));
  return (
    <div className="flex min-w-0 gap-1 overflow-x-auto rounded-2xl bg-white/70 p-1 ring-1 ring-slate-200/70 dark:bg-white/5 dark:ring-0">
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={clsx(
            'relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors',
            t === active ? 'text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
          )}
        >
          {t === active && <motion.span layoutId="subtab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 shadow-[0_6px_16px_-6px_rgba(124,58,237,0.6)]" transition={SPRING} />}
          <span className="relative">{t.label}</span>
          {!!t.badge && <span className="relative rounded-md bg-amber-400 px-1.5 text-[11px] font-bold text-amber-950">{t.badge}</span>}
        </Link>
      ))}
    </div>
  );
}

function NavItem({ item, active, big, onPick }: { item: Section; active: boolean; big?: boolean; onPick: () => void }) {
  return (
    <Link
      to={item.to}
      onClick={onPick}
      className={clsx(
        'group relative flex items-center gap-3 rounded-2xl px-3 font-semibold transition-colors',
        big ? 'py-2.5 text-[15px]' : 'py-2 text-sm',
        active
          ? 'text-brand-700 dark:text-white'
          : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-transparent dark:hover:text-slate-100',
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-100 via-violet-50 to-fuchsia-50 shadow-sm ring-1 ring-inset ring-brand-200/60 dark:from-brand-500/25 dark:via-violet-500/10 dark:to-transparent dark:shadow-none dark:ring-white/10"
          transition={SPRING}
        >
          <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-500 to-fuchsia-500 shadow-[0_0_12px_2px_rgba(139,92,246,0.45)]" />
        </motion.span>
      )}
      <span
        className={clsx(
          'relative transition-transform duration-300 group-hover:scale-110',
          active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300',
        )}
      >
        {item.icon}
      </span>
      <span className="relative flex-1">{item.label}</span>
      {!!item.badge && (
        <span className="relative rounded-md bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold leading-none text-amber-950">{item.badge}</span>
      )}
    </Link>
  );
}

/** On phones the five sections sit at the bottom, in thumb reach. */
function BottomNav({ sections, current }: { sections: Section[]; current: Section | undefined }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/80 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/5 dark:bg-ink-900/80 lg:hidden">
      <div className="mx-auto flex max-w-md">
        {sections.map((s) => {
          const active = s === current;
          return (
            <Link
              key={s.to}
              to={s.to}
              className={clsx(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors',
                active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {active && <motion.span layoutId="bottom-pill" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-500" transition={SPRING} />}
              <motion.span animate={{ y: active ? -2 : 0, scale: active ? 1.12 : 1 }} transition={SPRING} className="relative">
                {s.icon}
                {!!s.badge && <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-amber-400" />}
              </motion.span>
              {s.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <RadarMark />
      <div>
        <div className="text-[16px] font-extrabold tracking-tight text-slate-900 dark:text-white">NaukriRadar</div>
        <div className="text-[11px] font-medium text-slate-400">find · match · apply</div>
      </div>
    </Link>
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
        <circle cx="24.5" cy="12.5" r="1.6" fill="#6ee7b7" className="origin-[24.5px_12.5px] animate-blip" />
      </svg>
      <div
        className="absolute inset-0 animate-sweep"
        style={{ background: 'conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.45), transparent 22%)', borderRadius: '9999px' }}
      />
    </div>
  );
}
