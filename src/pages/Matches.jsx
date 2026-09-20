import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  ExternalLink,
  MapPin,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { errorMessage, matchApi } from '../services/api'
import { useApp } from '../store/AppContext'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ScoreRing,
  Skeleton,
} from '../components/ui'

export default function Matches() {
  const { toast } = useApp()
  const [views, setViews] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const load = async () => {
    try {
      setViews(await matchApi.list())
    } catch (error) {
      toast(errorMessage(error, 'Could not load matches'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async () => {
    setRunning(true)
    toast('Matching started…', 'info')
    try {
      const result = await matchApi.run()
      toast(`Scored ${result.evaluated} jobs · ${result.created} new matches`, 'success')
      await load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setRunning(false)
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return views
      .filter((view) => (filter === 'recommended' ? view.match.recommended : true))
      .filter((view) => {
        if (!needle) return true
        const haystack = `${view.job.jobTitle} ${view.job.employerName} ${view.job.jobCity}`.toLowerCase()
        return haystack.includes(needle)
      })
  }, [views, query, filter])

  return (
    <div className="animate-in">
      <PageHeader
        icon={Sparkles}
        title="Matches"
        subtitle={`${views.length} roles scored against your profile`}
        actions={
          <Button icon={Sparkles} loading={running} onClick={run}>
            Run matching
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgb(var(--text-dim))' }}
          />
          <input
            className="input pl-9"
            placeholder="Search by title, company or city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { id: 'all', label: `All (${views.length})` },
            { id: 'recommended', label: `Recommended (${views.filter((v) => v.match.recommended).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="rounded-xl px-3.5 py-2.5 text-sm transition-all"
              style={{
                background: filter === tab.id ? 'rgb(var(--accent) / 0.14)' : 'rgb(var(--surface-2) / 0.7)',
                border: `1px solid rgb(var(--${filter === tab.id ? 'accent' : 'border'}) / ${filter === tab.id ? 0.35 : 1})`,
                color: filter === tab.id ? 'rgb(var(--accent))' : 'rgb(var(--text-muted))',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Sparkles}
            title={views.length === 0 ? 'No matches yet' : 'Nothing matches that filter'}
            description={
              views.length === 0
                ? 'Run matching to score the current job pool against your profile.'
                : 'Try a different search term or switch back to all matches.'
            }
            action={
              views.length === 0 ? (
                <Button icon={Sparkles} loading={running} onClick={run}>
                  Run matching
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((view) => (
            <MatchCard key={view.match.id} view={view} />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchCard({ view }) {
  const { match, job } = view
  const skills = (match.matchingSkills || '').split(',').map((s) => s.trim()).filter(Boolean)
  const missing = (match.missingSkills || '').split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <Card hover className="flex flex-col p-5">
      <div className="flex items-start gap-4">
        <ScoreRing score={match.matchScore} size={52} stroke={5} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-sm font-semibold leading-snug">{job.jobTitle}</h3>
            {match.recommended && <Badge tone="success">Recommended</Badge>}
          </div>
          <div
            className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <span className="flex items-center gap-1">
              <Building2 size={12} />
              {job.employerName || 'Unknown company'}
            </span>
            {(job.jobCity || job.jobIsRemote) && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {job.jobIsRemote ? 'Remote' : job.jobCity}
              </span>
            )}
            {job.jobMaxSalary && (
              <span className="flex items-center gap-1">
                <Wallet size={12} />
                {Math.round(job.jobMaxSalary).toLocaleString()} {job.jobSalaryCurrency || ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {match.reasoning && (
        <p className="mt-3.5 text-xs leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
          {match.reasoning}
        </p>
      )}

      {(skills.length > 0 || missing.length > 0) && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {skills.slice(0, 5).map((skill) => (
            <Badge key={skill} tone="success">
              {skill}
            </Badge>
          ))}
          {missing.slice(0, 3).map((skill) => (
            <Badge key={skill} tone="warning">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      <div
        className="mt-auto flex items-center justify-between border-t pt-3.5"
        style={{ borderColor: 'rgb(var(--border))', marginTop: '1rem' }}
      >
        <span className="chip text-[10px]">
          {match.scoredBy === 'AI' ? 'Scored by AI' : 'Keyword scored'}
        </span>
        {job.jobApplyLink && (
          <a
            href={job.jobApplyLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: 'rgb(var(--accent))' }}
          >
            Open posting
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </Card>
  )
}
