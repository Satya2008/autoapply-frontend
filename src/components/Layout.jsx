import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  Bot,
  Briefcase,
  Command,
  Database,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  MousePointerClick,
  Radar,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Timer,
  User,
  Users,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import CommandPalette from './CommandPalette'

const userNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/matches', icon: Sparkles, label: 'Matches' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/applications', icon: FileText, label: 'Applications' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Preferences' },
]

const adminNav = [
  { to: '/admin', icon: Gauge, label: 'Control Center', end: true },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/sources', icon: Database, label: 'Job Sources' },
  { to: '/admin/portals', icon: MousePointerClick, label: 'Apply Portals' },
  { to: '/admin/prompts', icon: Bot, label: 'AI Prompts' },
  { to: '/admin/scheduler', icon: Timer, label: 'Scheduler' },
  { to: '/admin/audit', icon: ScrollText, label: 'Audit Log' },
  { to: '/admin/health', icon: Activity, label: 'System Health' },
]

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
          isActive ? 'font-medium' : ''
        }`
      }
      style={({ isActive }) => ({
        color: isActive ? 'rgb(var(--text))' : 'rgb(var(--text-muted))',
        background: isActive ? 'rgb(var(--surface-2))' : 'transparent',
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
              style={{
                background: 'linear-gradient(180deg, rgb(var(--accent)), rgb(var(--accent-2)))',
              }}
            />
          )}
          <item.icon
            size={17}
            className="shrink-0 transition-transform group-hover:scale-110"
            style={{ color: isActive ? 'rgb(var(--accent))' : 'inherit' }}
          />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const { user, config, isAdmin, signOut, theme, toggleTheme } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const inAdmin = location.pathname.startsWith('/admin')

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const initials = useMemo(() => {
    const source = user?.fullName || user?.email || '?'
    return source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="relative flex h-screen">
      <div className="aurora" />

      {/* ------------------------------------------------------- sidebar */}
      <aside
        className="relative z-10 flex w-[var(--sidebar-w)] shrink-0 flex-col border-r"
        style={{
          background: 'rgb(var(--bg-elevated) / 0.72)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgb(var(--border))',
        }}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))',
              boxShadow: '0 8px 22px -10px rgb(var(--glow))',
            }}
          >
            <Radar size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {config.appName || 'AutoApply AI'}
            </p>
            <p className="text-[11px]" style={{ color: 'rgb(var(--text-dim))' }}>
              {inAdmin ? 'Administration' : 'Job hunt on autopilot'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="mx-4 mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors"
          style={{
            background: 'rgb(var(--bg) / 0.6)',
            border: '1px solid rgb(var(--border))',
            color: 'rgb(var(--text-dim))',
          }}
        >
          <Command size={13} />
          <span className="flex-1 text-left">Quick actions</span>
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: 'rgb(var(--surface-2))', border: '1px solid rgb(var(--border))' }}
          >
            ⌘K
          </kbd>
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {!inAdmin && userNav.map((item) => <NavItem key={item.to} item={item} />)}

          {inAdmin && (
            <>
              <p className="section-title px-3 pb-2 pt-1">Administration</p>
              {adminNav.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </>
          )}

          {isAdmin && (
            <div className="pt-3">
              <NavLink
                to={inAdmin ? '/dashboard' : '/admin'}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                style={{
                  color: 'rgb(var(--accent))',
                  background: 'rgb(var(--accent) / 0.08)',
                  border: '1px solid rgb(var(--accent) / 0.22)',
                }}
              >
                {inAdmin ? <ListChecks size={17} /> : <ShieldCheck size={17} />}
                {inAdmin ? 'Back to my workspace' : 'Open control center'}
              </NavLink>
            </div>
          )}
        </nav>

        <div className="border-t p-3" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--accent) / 0.25), rgb(var(--accent-2) / 0.2))',
                border: '1px solid rgb(var(--accent) / 0.3)',
                color: 'rgb(var(--accent))',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.fullName || 'Account'}</p>
              <p className="truncate text-[11px]" style={{ color: 'rgb(var(--text-dim))' }}>
                {user?.role === 'SUPER_ADMIN'
                  ? 'Super Admin'
                  : user?.role === 'ADMIN'
                    ? 'Admin'
                    : user?.email}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
              style={{ color: 'rgb(var(--text-dim))' }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
              style={{ color: 'rgb(var(--text-dim))' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------------- content */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <Outlet />
        </div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
