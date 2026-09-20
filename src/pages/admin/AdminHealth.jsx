import { useEffect, useState } from 'react'
import { Activity, Bell, Bot, Cpu, Database, RefreshCw, Send, Server } from 'lucide-react'
import { adminApi, errorMessage } from '../../services/api'
import { useApp } from '../../store/AppContext'
import { Badge, Button, Card, PageHeader, Skeleton } from '../../components/ui'

export default function AdminHealth() {
  const { toast } = useApp()
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(null)

  const load = async () => {
    try {
      setHealth(await adminApi.health())
    } catch (error) {
      toast(errorMessage(error, 'Could not read system health'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const testChannel = async (channel) => {
    setTesting(channel)
    try {
      const result = await adminApi.testChannel(channel)
      toast(result, result.toLowerCase().startsWith('failed') ? 'error' : 'success')
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="animate-in">
        <PageHeader icon={Activity} title="System health" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in">
      <PageHeader
        icon={Activity}
        title="System health"
        subtitle="Dependencies, providers and runtime, refreshed every 30 seconds."
        actions={<Button variant="ghost" icon={RefreshCw} onClick={load}>Refresh</Button>}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone={health.maintenanceMode ? 'warning' : 'success'}>
          {health.maintenanceMode ? 'maintenance mode on' : 'serving traffic'}
        </Badge>
        <Badge tone="accent">apply mode: {health.applyMode}</Badge>
        <Badge tone={health.browserAutomation ? 'success' : 'default'}>
          browser automation {health.browserAutomation ? 'on' : 'off'}
        </Badge>
        <Badge tone={health.aiActive ? 'success' : 'warning'}>
          AI {health.aiActive ? 'ready' : 'not configured'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HealthCard
          icon={Database}
          title="Database"
          up={health.database?.up}
          lines={[health.database?.product, health.database?.url, health.database?.error].filter(Boolean)}
        />
        <HealthCard
          icon={Server}
          title="Redis"
          up={health.redis?.up}
          lines={[health.redis?.up ? 'Responding to PING' : health.redis?.error || 'Unreachable']}
        />
        <HealthCard
          icon={Cpu}
          title="JVM"
          up
          lines={[
            `${health.jvm?.usedMb} MB of ${health.jvm?.maxMb} MB used`,
            `${health.jvm?.processors} processors`,
          ]}
        />
        <HealthCard
          icon={Activity}
          title="Scheduler"
          up={(health.scheduler || []).some((t) => t.scheduled)}
          lines={[`${(health.scheduler || []).filter((t) => t.scheduled).length} of ${(health.scheduler || []).length} tasks scheduled`]}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bot size={15} style={{ color: 'rgb(var(--accent))' }} />
            <h2 className="text-sm font-semibold">AI providers</h2>
          </div>
          <div className="space-y-2">
            {(health.aiProviders || []).map((provider) => (
              <div
                key={provider.name}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                style={{ background: 'rgb(var(--surface-2) / 0.5)', border: '1px solid rgb(var(--border))' }}
              >
                <span className="text-sm font-medium capitalize">{provider.name}</span>
                <div className="flex gap-1.5">
                  {provider.active && <Badge tone="accent">active</Badge>}
                  <Badge tone={provider.configured ? 'success' : 'default'}>
                    {provider.configured ? 'configured' : 'no key'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={15} style={{ color: 'rgb(var(--warning))' }} />
            <h2 className="text-sm font-semibold">Notification channels</h2>
          </div>
          <div className="space-y-2">
            {(health.notificationChannels || []).map((channel) => (
              <div
                key={channel.name}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                style={{ background: 'rgb(var(--surface-2) / 0.5)', border: '1px solid rgb(var(--border))' }}
              >
                <span className="text-sm font-medium capitalize">{channel.name}</span>
                <div className="flex items-center gap-1.5">
                  {channel.enabled && <Badge tone="accent">enabled</Badge>}
                  <Badge tone={channel.configured ? 'success' : 'default'}>
                    {channel.configured ? 'configured' : 'not set'}
                  </Badge>
                  <Button
                    variant="ghost"
                    icon={Send}
                    loading={testing === channel.name}
                    disabled={!channel.configured}
                    onClick={() => testChannel(channel.name)}
                    className="!px-2.5 !py-1.5 !text-xs"
                  >
                    Test
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function HealthCard({ icon: Icon, title, up, lines }) {
  const tone = up ? 'var(--success)' : 'var(--danger)'
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `rgb(${tone} / 0.12)`, border: `1px solid rgb(${tone} / 0.25)` }}
          >
            <Icon size={16} style={{ color: `rgb(${tone})` }} />
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span
          className={`h-2 w-2 rounded-full ${up ? 'live-dot' : ''}`}
          style={{ background: `rgb(${tone})` }}
        />
      </div>
      <div className="mt-3 space-y-1">
        {lines.map((line, index) => (
          <p key={index} className="break-all text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            {line}
          </p>
        ))}
      </div>
    </Card>
  )
}
