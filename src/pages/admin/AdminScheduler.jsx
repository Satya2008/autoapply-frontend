import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Play, RefreshCw, Timer, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminApi, errorMessage } from '../../services/api'
import { useApp } from '../../store/AppContext'
import { Badge, Button, Card, PageHeader, Skeleton } from '../../components/ui'

export default function AdminScheduler() {
  const { toast } = useApp()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(null)

  const load = async () => {
    try {
      setTasks(await adminApi.scheduler())
    } catch (error) {
      toast(errorMessage(error, 'Could not load the scheduler'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 20_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async (task) => {
    setRunning(task.id)
    toast(`${task.id} started…`, 'info')
    try {
      await adminApi.runTask(task.id)
      setTimeout(load, 2500)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setTimeout(() => setRunning(null), 2500)
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        icon={Timer}
        title="Scheduler"
        subtitle="Every recurring task, driven by a cron expression you can change live."
        actions={
          <Button
            variant="ghost"
            icon={RefreshCw}
            onClick={async () => {
              await adminApi.reloadScheduler()
              toast('Schedules rebuilt', 'success')
              load()
            }}
          >
            Rebuild schedules
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} hover className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{task.id}</h3>
                    <Badge tone={task.enabled ? 'success' : 'default'}>
                      {task.enabled ? 'enabled' : 'disabled'}
                    </Badge>
                    {!task.scheduled && <Badge tone="warning">not scheduled</Badge>}
                  </div>
                  <p className="mt-1 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                    {task.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: 'rgb(var(--text-muted))' }}>
                      <Clock size={12} />
                      <code style={{ color: 'rgb(var(--accent-2))' }}>{task.cron || 'no cron set'}</code>
                    </span>
                    {task.nextRun && (
                      <span style={{ color: 'rgb(var(--text-dim))' }}>
                        next {new Date(task.nextRun).toLocaleString()}
                      </span>
                    )}
                    <Link
                      to="/admin/settings"
                      className="font-medium"
                      style={{ color: 'rgb(var(--accent))' }}
                      title={task.cronSettingKey}
                    >
                      edit schedule
                    </Link>
                  </div>

                  {task.lastRunAt && (
                    <div
                      className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                      style={{
                        background: task.lastRunOk ? 'rgb(var(--success) / 0.08)' : 'rgb(var(--danger) / 0.08)',
                        border: `1px solid rgb(var(--${task.lastRunOk ? 'success' : 'danger'}) / 0.22)`,
                      }}
                    >
                      {task.lastRunOk ? (
                        <CheckCircle2 size={13} className="mt-px shrink-0" style={{ color: 'rgb(var(--success))' }} />
                      ) : (
                        <XCircle size={13} className="mt-px shrink-0" style={{ color: 'rgb(var(--danger))' }} />
                      )}
                      <span className="break-words">
                        Last run {new Date(task.lastRunAt).toLocaleString()} · {task.lastRunMillis}ms
                        {task.lastRunError ? ` · ${task.lastRunError}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <Button variant="ghost" icon={Play} loading={running === task.id} onClick={() => run(task)}>
                  Run now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
