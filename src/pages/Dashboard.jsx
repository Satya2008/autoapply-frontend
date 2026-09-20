import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { applyApi, errorMessage, jobsApi, matchApi } from '../services/api'
import { useApp } from '../store/AppContext'
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  ScoreRing,
  Skeleton,
  StatTile,
  StatusBadge,
} from '../components/ui'

export default function Dashboard() {
  const { user, toast } = useApp()
  const [stats, setStats] = useState(null)
  const [recommended, setRecommended] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(null)

  const load = async () => {
    try {
      const [statsData, recommendedData, historyData] = await Promise.all([
        applyApi.stats(),
        matchApi.recommended(),
        applyApi.history(),
      ])
      setStats(statsData)
      setRecommended(recommendedData.slice(0, 6))
      setApplications(historyData.slice(0, 6))
    } catch (error) {
      toast(errorMessage(error, 'Could not load your dashboard'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runTask = async (key, label, fn) => {
    setRunning(key)
    toast(`${label} started…`, 'info')
    try {
      const result = await fn()
      toast(summarise(label, result), 'success')
      await load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setRunning(null)
    }
  }

  const summarise = (label, result) => {
    if (!result || typeof result !== 'object') return `${label} finished`
    if ('created' in result) return `Matching done · ${result.created} new matches from ${result.evaluated} jobs`
    if ('applied' in result) return `Auto apply done · ${result.applied} sent, ${result.failed} failed`
    if ('saved' in result) return `Fetch done · ${result.saved} new jobs, ${result.skipped} duplicates skipped`
    return `${label} finished`
  }

  const firstName = user?.fullName?.split(' ')[0] || 'there'

  return (
    <div className="animate-in">
      <PageHeader
        icon={Zap}
        title={`Good ${greeting()}, ${firstName}`}
        subtitle="Here is where your search stands right now."
        actions={
          <>
            <Button
              variant="ghost"
              icon={RefreshCw}
              loading={running === 'fetch'}
              onClick={() => runTask('fetch', 'Job fetch', jobsApi.fetchNew)}
            >
              Fetch jobs
            </Button>
            <Button
              variant="ghost"
              icon={Sparkles}
              loading={running === 'match'}
              onClick={() => runTask('match', 'Matching', matchApi.run)}
            >
              Run matching
            </Button>
            <Button
              icon={Play}
              loading={running === 'apply'}
              onClick={() => runTask('apply', 'Auto apply', applyApi.run)}
            >
              Apply now
            </Button>
          </>
        }
      />

      {!user?.autoApplyEnabled && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                background: 'rgb(var(--warning) / 0.12)',
                border: '1px solid rgb(var(--warning) / 0.3)',
              }}
            >
              <Target size={17} style={{ color: 'rgb(var(--warning))' }} />
            </div>
            <div>
              <p className="text-sm font-medium">Auto apply is switched off</p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                Turn it on in Preferences and the scheduler will start applying for you.
              </p>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="ghost" icon={ArrowUpRight}>
              Open preferences
            </Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-2xl" />)
        ) : (
          <>
            <StatTile label="Matches found" value={stats?.totalMatches || 0} icon={Sparkles} tone="accent" />
            <StatTile label="Recommended" value={stats?.recommended || 0} icon={Target} tone="cyan" />
            <StatTile label="Applications" value={stats?.totalApplications || 0} icon={FileText} tone="pink" />
            <StatTile
              label="Success rate"
              value={stats?.successRate || 0}
              suffix="%"
              decimals={1}
              icon={TrendingUp}
              tone="success"
              hint={`${stats?.appliedToday || 0} sent in the last 24h`}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* ------------------------------------------------ recommended */}
        <Card className="lg:col-span-3">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: 'rgb(var(--border))' }}
          >
            <div>
              <h2 className="text-sm font-semibold">Top recommendations</h2>
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                Highest scoring roles waiting for you
              </p>
            </div>
            <Link to="/matches" className="text-xs font-medium" style={{ color: 'rgb(var(--accent))' }}>
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No recommendations yet"
              description="Fetch some jobs and run matching to see roles scored against your profile."
              action={
                <Button icon={Sparkles} loading={running === 'match'} onClick={() => runTask('match', 'Matching', matchApi.run)}>
                  Run matching
                </Button>
              }
            />
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
              {recommended.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          )}
        </Card>

        {/* ------------------------------------------------- activity */}
        <Card className="lg:col-span-2">
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: 'rgb(var(--border))' }}
          >
            <div>
              <h2 className="text-sm font-semibold">Recent applications</h2>
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                What has been sent on your behalf
              </p>
            </div>
            <Link to="/applications" className="text-xs font-medium" style={{ color: 'rgb(var(--accent))' }}>
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing sent yet"
              description="Once matching finds strong roles, applications will show up here."
            />
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
              {applications.map((application) => (
                <div key={application.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'rgb(var(--surface-2))' }}
                  >
                    <Briefcase size={14} style={{ color: 'rgb(var(--text-dim))' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{application.jobTitle}</p>
                    <p className="truncate text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                      {application.employerName}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function MatchRow({ match }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
      <ScoreRing score={match.matchScore} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{match.jobId?.split(':').slice(1).join(':') || match.jobId}</p>
        <p className="truncate text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
          {match.reasoning || 'Scored against your profile'}
        </p>
      </div>
      {match.scoredBy && (
        <span className="chip shrink-0 text-[10px]">{match.scoredBy === 'AI' ? 'AI scored' : 'Keyword'}</span>
      )}
    </div>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
