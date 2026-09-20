import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Search,
  Settings as SettingsIcon,
} from 'lucide-react'
import { adminApi, errorMessage } from '../../services/api'
import { useApp } from '../../store/AppContext'
import { Badge, Button, Card, PageHeader, Skeleton, Toggle } from '../../components/ui'

export default function AdminSettings() {
  const { toast } = useApp()
  const [groups, setGroups] = useState({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [savingKey, setSavingKey] = useState(null)
  const [revealed, setRevealed] = useState({})

  const load = async () => {
    try {
      const data = await adminApi.settings()
      setGroups(data)
      setActiveCategory((current) => current || Object.keys(data)[0])
    } catch (error) {
      toast(errorMessage(error, 'Could not load settings'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categories = useMemo(() => Object.keys(groups), [groups])

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return null
    return Object.values(groups)
      .flat()
      .filter(
        (setting) =>
          setting.key.toLowerCase().includes(needle) ||
          (setting.description || '').toLowerCase().includes(needle),
      )
  }, [groups, query])

  const visible = searchResults ?? groups[activeCategory] ?? []

  const save = async (setting, rawValue) => {
    setSavingKey(setting.key)
    try {
      await adminApi.updateSetting(setting.key, String(rawValue))
      toast(`${setting.key} updated`, 'success')
      setDrafts((current) => {
        const next = { ...current }
        delete next[setting.key]
        return next
      })
      await load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSavingKey(null)
    }
  }

  const reset = async (setting) => {
    setSavingKey(setting.key)
    try {
      await adminApi.resetSetting(setting.key)
      toast(`${setting.key} reset to default`, 'success')
      await load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSavingKey(null)
    }
  }

  const dirtyCount = Object.keys(drafts).length

  return (
    <div className="animate-in">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Every behaviour in the product, changeable live. No restart, no deploy."
        actions={
          <Button
            variant="ghost"
            icon={RotateCcw}
            onClick={async () => {
              await adminApi.reloadSettings()
              toast('Settings cache reloaded', 'success')
              load()
            }}
          >
            Reload cache
          </Button>
        }
      />

      <div className="relative mb-5">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'rgb(var(--text-dim))' }}
        />
        <input
          className="input pl-9"
          placeholder="Search every setting by key or description…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {dirtyCount > 0 && (
        <Card
          className="mb-4 flex items-center gap-3 p-3.5"
          style={{ borderColor: 'rgb(var(--warning) / 0.35)' }}
        >
          <AlertTriangle size={16} style={{ color: 'rgb(var(--warning))' }} />
          <span className="text-sm">
            {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}
          </span>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {!searchResults && (
            <nav className="space-y-1 lg:sticky lg:top-8 lg:self-start">
              {categories.map((category) => {
                const active = category === activeCategory
                const unconfigured = (groups[category] || []).filter(
                  (s) => s.secret && !s.configured,
                ).length
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
                    style={{
                      background: active ? 'rgb(var(--accent) / 0.12)' : 'transparent',
                      color: active ? 'rgb(var(--accent))' : 'rgb(var(--text-muted))',
                      border: `1px solid ${active ? 'rgb(var(--accent) / 0.25)' : 'transparent'}`,
                    }}
                  >
                    <span className="truncate">{category}</span>
                    {unconfigured > 0 && (
                      <span
                        className="ml-2 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px]"
                        style={{ background: 'rgb(var(--warning) / 0.2)', color: 'rgb(var(--warning))' }}
                      >
                        {unconfigured}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          )}

          <div className={`space-y-3 ${searchResults ? 'lg:col-span-2' : ''}`}>
            {searchResults && (
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                {searchResults.length} settings match “{query}”
              </p>
            )}
            {visible.map((setting) => (
              <SettingRow
                key={setting.key}
                setting={setting}
                draft={drafts[setting.key]}
                onDraft={(value) => setDrafts({ ...drafts, [setting.key]: value })}
                onSave={(value) => save(setting, value)}
                onReset={() => reset(setting)}
                saving={savingKey === setting.key}
                revealed={revealed[setting.key]}
                onReveal={() => setRevealed({ ...revealed, [setting.key]: !revealed[setting.key] })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SettingRow({ setting, draft, onDraft, onSave, onReset, saving, revealed, onReveal }) {
  const value = draft ?? setting.value ?? ''
  const dirty = draft !== undefined && draft !== setting.value
  const isBoolean = setting.type === 'BOOLEAN'

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-xs font-medium" style={{ color: 'rgb(var(--accent-2))' }}>
              {setting.key}
            </code>
            <Badge>{setting.type}</Badge>
            {setting.secret && (
              <Badge tone={setting.configured ? 'success' : 'warning'}>
                {setting.configured ? 'configured' : 'not set'}
              </Badge>
            )}
          </div>
          {setting.description && (
            <p className="mt-1.5 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              {setting.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {setting.secret && (
            <button
              onClick={onReveal}
              className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
              style={{ color: 'rgb(var(--text-dim))' }}
              title={revealed ? 'Hide' : 'Edit this secret'}
            >
              {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
          <button
            onClick={onReset}
            disabled={saving}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            style={{ color: 'rgb(var(--text-dim))' }}
            title="Reset to default"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {isBoolean ? (
          <Toggle
            checked={String(value).toLowerCase() === 'true'}
            onChange={(next) => onSave(next)}
          />
        ) : setting.allowedValues ? (
          <select
            className="input max-w-xs"
            value={value}
            onChange={(e) => onSave(e.target.value)}
            disabled={saving}
          >
            {setting.allowedValues.split(',').map((option) => (
              <option key={option.trim()} value={option.trim()}>
                {option.trim()}
              </option>
            ))}
          </select>
        ) : setting.type === 'TEXT' || setting.type === 'JSON' ? (
          <textarea
            className="input min-h-[80px] resize-y font-mono text-xs"
            value={value}
            onChange={(e) => onDraft(e.target.value)}
            disabled={saving}
          />
        ) : setting.secret && !revealed ? (
          <input className="input max-w-md font-mono text-xs" value={value || '(not set)'} disabled />
        ) : (
          <input
            className="input max-w-md"
            type={setting.type === 'INTEGER' || setting.type === 'DECIMAL' ? 'number' : 'text'}
            step={setting.type === 'DECIMAL' ? '0.1' : undefined}
            value={value}
            onChange={(e) => onDraft(e.target.value)}
            disabled={saving}
            placeholder={setting.secret ? 'Paste the new key…' : setting.defaultValue}
          />
        )}

        {!isBoolean && (dirty || (setting.secret && revealed)) && (
          <Button loading={saving} icon={dirty ? Save : Check} onClick={() => onSave(value)}>
            Save
          </Button>
        )}
      </div>

      {setting.updatedBy && (
        <p className="mt-2 text-[11px]" style={{ color: 'rgb(var(--text-dim))' }}>
          Last changed by {setting.updatedBy}
          {setting.updatedAt ? ` · ${new Date(setting.updatedAt).toLocaleString()}` : ''}
        </p>
      )}
    </Card>
  )
}
