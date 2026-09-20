import { useCallback, useEffect, useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { adminApi, errorMessage } from '../../services/api'
import { useApp } from '../../store/AppContext'
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from '../../components/ui'

export default function AdminAudit() {
  const { toast } = useApp()
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [actions, setActions] = useState([])
  const [actor, setActor] = useState('')
  const [actorSearch, setActorSearch] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(
        await adminApi.audit({
          actor: actorSearch || undefined,
          action: action || undefined,
          page,
          size: 50,
        }),
      )
    } catch (error) {
      toast(errorMessage(error, 'Could not load the audit log'), 'error')
    } finally {
      setLoading(false)
    }
  }, [actorSearch, action, page, toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    adminApi.auditActions().then(setActions).catch(() => {})
  }, [])

  return (
    <div className="animate-in">
      <PageHeader
        icon={ScrollText}
        title="Audit log"
        subtitle={`${data.totalElements?.toLocaleString() || 0} recorded events`}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setPage(0)
            setActorSearch(actor)
          }}
          className="relative min-w-[16rem] flex-1"
        >
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-dim))' }} />
          <input className="input pl-9" placeholder="Filter by actor email…" value={actor} onChange={(e) => setActor(e.target.value)} />
        </form>
        <select
          className="input w-auto"
          value={action}
          onChange={(e) => {
            setPage(0)
            setAction(e.target.value)
          }}
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : data.content.length === 0 ? (
        <Card><EmptyState icon={ScrollText} title="Nothing recorded" description="Try clearing the filters." /></Card>
      ) : (
        <Card>
          <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
            {data.content.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: entry.success ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}
                />
                <Badge tone={entry.success ? 'default' : 'danger'}>{entry.action.replace(/_/g, ' ')}</Badge>
                <span className="shrink-0 text-xs font-medium">{entry.actor}</span>
                <span className="min-w-0 flex-1 truncate text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                  {entry.targetType ? `${entry.targetType}:${entry.targetId || '—'}` : ''}
                  {entry.detail ? ` · ${entry.detail}` : ''}
                </span>
                {entry.ipAddress && (
                  <code className="hidden shrink-0 text-[11px] lg:block" style={{ color: 'rgb(var(--text-dim))' }}>
                    {entry.ipAddress}
                  </code>
                )}
                <span className="shrink-0 text-[11px]" style={{ color: 'rgb(var(--text-dim))' }}>
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>Page {page + 1} of {data.totalPages}</span>
          <Button variant="ghost" disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
