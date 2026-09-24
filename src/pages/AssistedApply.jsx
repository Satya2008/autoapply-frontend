import { useEffect, useState } from 'react'
import {
  Building2,
  Check,
  Copy,
  CopyCheck,
  ExternalLink,
  Hand,
  ShieldAlert,
  SkipForward,
} from 'lucide-react'
import { applyApi, errorMessage } from '../services/api'
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

/**
 * Applications the engine deliberately did not submit, because the site detects
 * automation. Every answer is prepared, so finishing one is a click and a few pastes.
 */
export default function AssistedApply() {
  const { toast } = useApp()
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [busy, setBusy] = useState(null)

  const load = async () => {
    try {
      const data = await applyApi.assisted()
      setQueue(data)
      if (data.length && !expanded) setExpanded(data[0].application.id)
    } catch (error) {
      toast(errorMessage(error, 'Could not load the queue'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const act = async (id, action, label) => {
    setBusy(id)
    try {
      await (action === 'done' ? applyApi.markAssistedDone(id) : applyApi.skipAssisted(id))
      toast(label, 'success')
      setQueue((current) => current.filter((item) => item.application.id !== id))
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        icon={Hand}
        title="Needs your click"
        subtitle="These sites block automated applications, so we prepared everything instead."
      />

      <Card className="mb-5 flex items-start gap-3 p-4" style={{ borderColor: 'rgb(var(--accent) / 0.3)' }}>
        <ShieldAlert size={17} className="mt-0.5 shrink-0" style={{ color: 'rgb(var(--accent))' }} />
        <div className="text-sm">
          <p className="font-medium">Why these are not automatic</p>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
            LinkedIn, Naukri, Indeed and similar sites detect and ban automated submissions -
            an automated apply there risks your account, not just the application. So we stop,
            write every answer out for you, and let you finish it safely. Open the posting,
            paste each field, submit, then mark it done here.
          </p>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <Card>
          <EmptyState
            icon={Check}
            title="Nothing waiting on you"
            description="Every matched role so far was either applied to automatically or is not a fit yet."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map(({ application, prefill }) => {
            const open = expanded === application.id
            return (
              <Card key={application.id} className="overflow-hidden">
                <button
                  onClick={() => setExpanded(open ? null : application.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                >
                  {application.matchScore != null ? (
                    <ScoreRing score={application.matchScore} size={42} />
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
                    </p>
                  </div>

                  <Badge tone="warning">{application.botRisk} risk</Badge>
                  <span className="hidden text-xs sm:block" style={{ color: 'rgb(var(--text-dim))' }}>
                    {open ? 'Hide' : 'Open'}
                  </span>
                </button>

                {open && (
                  <div className="border-t px-5 py-4" style={{ borderColor: 'rgb(var(--border))' }}>
                    {application.riskReason && (
                      <p className="mb-4 text-xs" style={{ color: 'rgb(var(--text-dim))' }}>
                        {application.riskReason}
                      </p>
                    )}

                    <div className="mb-4 flex flex-wrap gap-2">
                      <a href={application.applyLink} target="_blank" rel="noreferrer">
                        <Button icon={ExternalLink}>Open the posting</Button>
                      </a>
                      <Button
                        variant="ghost"
                        icon={Check}
                        loading={busy === application.id}
                        onClick={() => act(application.id, 'done', 'Marked as applied')}
                      >
                        I applied
                      </Button>
                      <Button
                        variant="ghost"
                        icon={SkipForward}
                        loading={busy === application.id}
                        onClick={() => act(application.id, 'skip', 'Skipped')}
                      >
                        Not interested
                      </Button>
                    </div>

                    <p className="section-title mb-2">Your answers, ready to paste</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {prefill.map((field) => (
                        <CopyField key={field.label} field={field} />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CopyField({ field }) {
  const [copied, setCopied] = useState(false)
  const long = String(field.value).length > 90

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(field.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard can be blocked; the text stays selectable either way
    }
  }

  return (
    <button
      onClick={copy}
      className={`group flex items-start gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors ${
        long ? 'sm:col-span-2' : ''
      }`}
      style={{
        background: copied ? 'rgb(var(--success) / 0.1)' : 'rgb(var(--bg) / 0.5)',
        border: `1px solid ${copied ? 'rgb(var(--success) / 0.35)' : 'rgb(var(--border))'}`,
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider" style={{ color: 'rgb(var(--text-dim))' }}>
          {field.label}
        </p>
        <p className={`mt-0.5 text-sm ${long ? 'whitespace-pre-wrap' : 'truncate'}`}>{field.value}</p>
      </div>
      {copied ? (
        <CopyCheck size={14} className="mt-1 shrink-0" style={{ color: 'rgb(var(--success))' }} />
      ) : (
        <Copy
          size={14}
          className="mt-1 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
          style={{ color: 'rgb(var(--text-dim))' }}
        />
      )}
    </button>
  )
}
