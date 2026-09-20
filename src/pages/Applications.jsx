import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  Play,
  Search,
} from 'lucide-react'
import { applyApi, errorMessage } from '../services/api'
import { useApp } from '../store/AppContext'
import {
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  ScoreRing,
  Skeleton,
  StatusBadge,
} from '../components/ui'

export default function Applications() {
  const { toast } = useApp()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [selected, setSelected] = useState(null)

  const load = async () => {
    try {
      setApplications(await applyApi.history())
    } catch (error) {
      toast(errorMessage(error, 'Could not load applications'), 'error')
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
    toast('Auto apply started…', 'info')
    try {
      const result = await applyApi.run()
      toast(`${result.applied} applications sent · ${result.failed} failed`, 'success')
      await load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setRunning(false)
    }
  }

  const statuses = useMemo(
    () => ['ALL', ...new Set(applications.map((a) => a.status).filter(Boolean))],
    [applications],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return applications
      .filter((a) => (status === 'ALL' ? true : a.status === status))
      .filter((a) =>
        needle
          ? `${a.jobTitle} ${a.employerName}`.toLowerCase().includes(needle)
          : true,
      )
  }, [applications, query, status])

  return (
    <div className="animate-in">
      <PageHeader
        icon={FileText}
        title="Applications"
        subtitle={`${applications.length} applications tracked`}
        actions={
          <Button icon={Play} loading={running} onClick={run}>
            Run auto apply
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgb(var(--text-dim))' }}
          />
          <input
            className="input pl-9"
            placeholder="Search applications…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All statuses' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={applications.length === 0 ? 'No applications yet' : 'Nothing matches that filter'}
            description={
              applications.length === 0
                ? 'Run auto apply, or let the scheduler do it on its own.'
                : 'Try another search term or status.'
            }
            action={
              applications.length === 0 ? (
                <Button icon={Play} loading={running} onClick={run}>
                  Run auto apply
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
            {filtered.map((application) => (
              <button
                key={application.id}
                onClick={() => setSelected(application)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                {application.matchScore != null ? (
                  <ScoreRing score={application.matchScore} size={40} />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'rgb(var(--surface-2))' }}
                  >
                    <Building2 size={15} style={{ color: 'rgb(var(--text-dim))' }} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{application.jobTitle}</p>
                  <p className="truncate text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                    {application.employerName}
                    {application.portal ? ` · ${application.portal}` : ''}
                  </p>
                </div>

                <div className="hidden items-center gap-1.5 text-xs sm:flex" style={{ color: 'rgb(var(--text-dim))' }}>
                  <Calendar size={12} />
                  {new Date(application.appliedAt).toLocaleDateString()}
                </div>

                <StatusBadge status={application.status} />
              </button>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.jobTitle || 'Application'}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={selected.status} />
              {selected.matchScore != null && <ScoreRing score={selected.matchScore} size={38} />}
              <span className="text-xs" style={{ color: 'rgb(var(--text-dim))' }}>
                Attempt {selected.attemptCount} · {new Date(selected.appliedAt).toLocaleString()}
              </span>
            </div>

            <Detail label="Company" value={selected.employerName} />
            <Detail label="Portal" value={selected.portal} />
            {selected.message && <Detail label="Result" value={selected.message} />}
            {selected.nextRetryAt && (
              <Detail label="Next retry" value={new Date(selected.nextRetryAt).toLocaleString()} />
            )}
            {selected.screenshotPath && <Detail label="Screenshot saved to" value={selected.screenshotPath} />}

            {selected.coverLetter && (
              <div>
                <p className="label">Cover letter used</p>
                <pre
                  className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl p-3.5 text-xs leading-relaxed"
                  style={{ background: 'rgb(var(--bg) / 0.6)', border: '1px solid rgb(var(--border))' }}
                >
                  {selected.coverLetter}
                </pre>
              </div>
            )}

            {selected.applyLink && (
              <a
                href={selected.applyLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: 'rgb(var(--accent))' }}
              >
                Open the original posting
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function Detail({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="label">{label}</p>
      <p className="break-words text-sm">{value}</p>
    </div>
  )
}
