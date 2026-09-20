import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Briefcase,
  Database,
  FileText,
  Gauge,
  RefreshCw,
  ScrollText,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { adminApi, errorMessage } from '../../services/api'
import { useApp } from '../../store/AppContext'
import { Badge, Button, Card, PageHeader, Skeleton, StatTile } from '../../components/ui'

const STATUS_COLORS = {
  APPLIED: 'var(--success)',
  DRY_RUN: 'var(--accent-2)',
  FAILED: 'var(--danger)',
  SKIPPED: 'var(--text-dim)',
  PENDING: 'var(--warning)',
  RETRY_SCHEDULED: 'var(--warning)',
}

export default function AdminOverview() {
  const { toast } = useApp()
  const [overview, setOverview] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [byStatus, setByStatus] = useState([])
  const [bySource, setBySource] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const [o, t, s, src, a] = await Promise.all([
        adminApi.overview(),
        adminApi.timeline(30),
        adminApi.byStatus(),
        adminApi.bySource(),
        adminApi.activity(),
      ])
      setOverview(o)
      setTimeline(t)
      setByStatus(s)
      setBySource(src)
      setActivity(a)
    } catch (error) {
      toast(errorMessage(error, 'Could not load the control center'), 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="animate-in">
      <PageHeader
        icon={Gauge}
        title="Control center"
        subtitle="Everything happening across the platform, live."
        actions={
          <Button
            variant="ghost"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => {
              setRefreshing(true)
              load()
            }}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-2xl" />)
        ) : (
          <>
            <StatTile label="Users" value={overview.totalUsers} icon={Users} tone="accent" hint={`${overview.activeUsers} active · ${overview.admins} admins`} />
            <StatTile label="Jobs in pool" value={overview.totalJobs} icon={Briefcase} tone="cyan" hint={`${overview.jobsToday} added today`} />
            <StatTile label="Matches" value={overview.totalMatches} icon={Sparkles} tone="pink" hint={`${overview.recommendedMatches} recommended`} />
            <StatTile label="Applications" value={overview.totalApplications} icon={FileText} tone="warning" hint={`${overview.applicationsToday} in last 24h`} />
            <StatTile label="Success rate" value={overview.successRate} suffix="%" decimals={1} icon={TrendingUp} tone="success" />
            <StatTile label="Avg match score" value={overview.averageMatchScore} decimals={1} icon={Sparkles} tone="accent" />
            <StatTile label="Job sources" value={overview.jobSources} icon={Database} tone="cyan" hint={`${overview.enabledJobSources} enabled`} />
            <StatTile label="Audit entries" value={overview.auditEntries} icon={ScrollText} tone="pink" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Applications over time</h2>
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                Last 30 days
              </p>
            </div>
            <Badge tone="accent">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'rgb(var(--success))' }} />
              Live
            </Badge>
          </div>

          {loading ? (
            <Skeleton className="h-[240px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timeline} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="applyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(124 92 255)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="rgb(124 92 255)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgb(var(--text-dim))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--text-dim))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" stroke="rgb(124 92 255)" strokeWidth={2} fill="url(#applyGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 text-sm font-semibold">Application outcomes</h2>
          <p className="mb-5 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            Where every attempt ended up
          </p>

          {loading ? (
            <Skeleton className="h-[240px] rounded-xl" />
          ) : byStatus.length === 0 ? (
            <p className="py-16 text-center text-sm" style={{ color: 'rgb(var(--text-dim))' }}>
              No applications yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byStatus} layout="vertical" margin={{ top: 0, right: 12, left: 18, bottom: 0 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 11, fill: 'rgb(var(--text-dim))' }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                  tickFormatter={(v) => v.replace(/_/g, ' ')}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--surface-2))' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                  {byStatus.map((entry) => (
                    <Cell key={entry.status} fill={`rgb(${STATUS_COLORS[entry.status] || 'var(--accent)'})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Jobs by source</h2>
          {loading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : bySource.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'rgb(var(--text-dim))' }}>
              No jobs collected yet
            </p>
          ) : (
            <div className="space-y-3">
              {bySource.slice(0, 6).map((row) => {
                const max = Math.max(...bySource.map((r) => r.count))
                return (
                  <div key={row.source}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{row.source}</span>
                      <span style={{ color: 'rgb(var(--text-dim))' }}>{row.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgb(var(--surface-2))' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(row.count / max) * 100}%`,
                          background: 'linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: 'rgb(var(--border))' }}
          >
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link to="/admin/audit" className="text-xs font-medium" style={{ color: 'rgb(var(--accent))' }}>
              Full audit log
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2.5 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="max-h-[260px] divide-y overflow-y-auto" style={{ borderColor: 'rgb(var(--border))' }}>
              {activity.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: entry.success ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}
                  />
                  <span className="shrink-0 text-xs font-medium">{entry.action.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                    {entry.actor}
                    {entry.detail ? ` · ${entry.detail}` : ''}
                  </span>
                  <span className="shrink-0 text-[11px]" style={{ color: 'rgb(var(--text-dim))' }}>
                    {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/admin/settings" icon={Settings} title="Settings" body="Every knob in the product" />
        <QuickLink to="/admin/sources" icon={Database} title="Job sources" body="Connect any job API" />
        <QuickLink to="/admin/scheduler" icon={Activity} title="Scheduler" body="Cron for every task" />
        <QuickLink to="/admin/health" icon={Gauge} title="System health" body="Dependencies and providers" />
      </div>
    </div>
  )
}

function QuickLink({ to, icon: Icon, title, body }) {
  return (
    <Link to={to}>
      <Card hover className="flex items-center gap-3.5 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: 'rgb(var(--accent) / 0.12)',
            border: '1px solid rgb(var(--accent) / 0.22)',
          }}
        >
          <Icon size={17} style={{ color: 'rgb(var(--accent))' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="truncate text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            {body}
          </p>
        </div>
      </Card>
    </Link>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: 'rgb(var(--bg-elevated))',
        border: '1px solid rgb(var(--border-strong))',
        boxShadow: '0 12px 30px -14px rgb(0 0 0 / 0.6)',
      }}
    >
      {label && <p className="mb-0.5 font-medium">{String(label).replace(/_/g, ' ')}</p>}
      <p style={{ color: 'rgb(var(--accent))' }}>{payload[0].value} applications</p>
    </div>
  )
}
