import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Bot,
  Briefcase,
  CornerDownLeft,
  Database,
  FileText,
  Gauge,
  LayoutDashboard,
  Moon,
  MousePointerClick,
  Play,
  RefreshCw,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Sun,
  Timer,
  User,
  Users,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { applyApi, errorMessage, jobsApi, matchApi } from '../services/api'

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const { isAdmin, toggleTheme, theme, toast } = useApp()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)

  const commands = useMemo(() => {
    const go = (path) => () => {
      navigate(path)
      onClose()
    }

    const run = (label, fn) => async () => {
      onClose()
      toast(`${label} started…`, 'info')
      try {
        await fn()
        toast(`${label} finished`, 'success')
      } catch (error) {
        toast(errorMessage(error), 'error')
      }
    }

    const list = [
      { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, group: 'Navigate', action: go('/dashboard') },
      { id: 'matches', label: 'Go to Matches', icon: Sparkles, group: 'Navigate', action: go('/matches') },
      { id: 'jobs', label: 'Go to Jobs', icon: Briefcase, group: 'Navigate', action: go('/jobs') },
      { id: 'applications', label: 'Go to Applications', icon: FileText, group: 'Navigate', action: go('/applications') },
      { id: 'profile', label: 'Go to Profile', icon: User, group: 'Navigate', action: go('/profile') },
      { id: 'prefs', label: 'Go to Preferences', icon: Settings, group: 'Navigate', action: go('/settings') },

      { id: 'run-match', label: 'Run job matching now', icon: Sparkles, group: 'Actions', action: run('Matching', matchApi.run) },
      { id: 'run-apply', label: 'Run auto apply now', icon: Play, group: 'Actions', action: run('Auto apply', applyApi.run) },
      { id: 'fetch-jobs', label: 'Fetch fresh jobs', icon: RefreshCw, group: 'Actions', action: run('Job fetch', jobsApi.fetchNew) },
      {
        id: 'theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: theme === 'dark' ? Sun : Moon,
        group: 'Actions',
        action: () => {
          toggleTheme()
          onClose()
        },
      },
    ]

    if (isAdmin) {
      list.push(
        { id: 'admin', label: 'Open Control Center', icon: Gauge, group: 'Admin', action: go('/admin') },
        { id: 'admin-settings', label: 'Admin · Settings', icon: Settings, group: 'Admin', action: go('/admin/settings') },
        { id: 'admin-users', label: 'Admin · Users', icon: Users, group: 'Admin', action: go('/admin/users') },
        { id: 'admin-sources', label: 'Admin · Job Sources', icon: Database, group: 'Admin', action: go('/admin/sources') },
        { id: 'admin-portals', label: 'Admin · Apply Portals', icon: MousePointerClick, group: 'Admin', action: go('/admin/portals') },
        { id: 'admin-prompts', label: 'Admin · AI Prompts', icon: Bot, group: 'Admin', action: go('/admin/prompts') },
        { id: 'admin-scheduler', label: 'Admin · Scheduler', icon: Timer, group: 'Admin', action: go('/admin/scheduler') },
        { id: 'admin-audit', label: 'Admin · Audit Log', icon: ScrollText, group: 'Admin', action: go('/admin/audit') },
        { id: 'admin-health', label: 'Admin · System Health', icon: Activity, group: 'Admin', action: go('/admin/health') },
      )
    }
    return list
  }, [navigate, onClose, isAdmin, theme, toggleTheme, toast])

  const results = useMemo(() => {
    if (!query.trim()) return commands
    const needle = query.toLowerCase()
    return commands.filter(
      (c) => c.label.toLowerCase().includes(needle) || c.group.toLowerCase().includes(needle),
    )
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => Math.min(results.length - 1, c + 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => Math.max(0, c - 1))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        results[cursor]?.action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, cursor, onClose])

  if (!open) return null

  let lastGroup = null

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[14vh]">
      <div
        className="fixed inset-0"
        style={{ background: 'rgb(0 0 0 / 0.55)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <div className="card animate-in relative z-10 w-full max-w-xl overflow-hidden">
        <div
          className="flex items-center gap-2.5 border-b px-4 py-3.5"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <Search size={17} style={{ color: 'rgb(var(--text-dim))' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages and actions…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'rgb(var(--text))' }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: 'rgb(var(--surface-2))', color: 'rgb(var(--text-dim))' }}
          >
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm" style={{ color: 'rgb(var(--text-dim))' }}>
              Nothing matches “{query}”
            </p>
          )}
          {results.map((command, index) => {
            const showGroup = command.group !== lastGroup
            lastGroup = command.group
            const active = index === cursor
            return (
              <div key={command.id}>
                {showGroup && <p className="section-title px-3 pb-1.5 pt-3">{command.group}</p>}
                <button
                  onMouseEnter={() => setCursor(index)}
                  onClick={command.action}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
                  style={{
                    background: active ? 'rgb(var(--accent) / 0.12)' : 'transparent',
                    color: active ? 'rgb(var(--text))' : 'rgb(var(--text-muted))',
                  }}
                >
                  <command.icon
                    size={16}
                    style={{ color: active ? 'rgb(var(--accent))' : 'inherit' }}
                  />
                  <span className="flex-1">{command.label}</span>
                  {active && <CornerDownLeft size={13} style={{ color: 'rgb(var(--text-dim))' }} />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
