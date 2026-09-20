import { useEffect, useState } from 'react'
import { Bot, Play, Save, Sparkles } from 'lucide-react'
import { adminApi, errorMessage } from '../../services/api'
import { useApp } from '../../store/AppContext'
import { Badge, Button, Card, Field, PageHeader, Skeleton, Toggle } from '../../components/ui'

export default function AdminPrompts() {
  const { toast } = useApp()
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [testPrompt, setTestPrompt] = useState('Reply with the single word: ok')
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const load = async () => {
    try {
      const list = await adminApi.prompts()
      setPrompts(list)
      if (!active && list.length) {
        setActive(list[0])
        setDraft(list[0].template || '')
      }
    } catch (error) {
      toast(errorMessage(error, 'Could not load prompts'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const select = (prompt) => {
    setActive(prompt)
    setDraft(prompt.template || '')
  }

  const save = async () => {
    setSaving(true)
    try {
      await adminApi.updatePrompt(active.code, { ...active, template: draft })
      toast('Prompt saved. The next AI call uses it.', 'success')
      await load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      setTestResult(await adminApi.testAi(testPrompt))
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        icon={Bot}
        title="AI prompts"
        subtitle="How the model reasons about your candidates. Editing a prompt changes behaviour instantly."
      />

      {loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-2 lg:sticky lg:top-8 lg:self-start">
            {prompts.map((prompt) => (
              <button
                key={prompt.code}
                onClick={() => select(prompt)}
                className="w-full rounded-xl px-3.5 py-3 text-left transition-colors"
                style={{
                  background: active?.code === prompt.code ? 'rgb(var(--accent) / 0.12)' : 'rgb(var(--surface-2) / 0.5)',
                  border: `1px solid ${active?.code === prompt.code ? 'rgb(var(--accent) / 0.28)' : 'rgb(var(--border))'}`,
                }}
              >
                <p className="text-sm font-medium">{prompt.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                  {prompt.description}
                </p>
              </button>
            ))}

            <Card className="mt-4 p-4">
              <p className="mb-2 text-xs font-medium">Test the provider</p>
              <textarea
                className="input min-h-[60px] text-xs"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
              />
              <Button variant="ghost" icon={Play} loading={testing} onClick={runTest} className="mt-2 w-full">
                Send test
              </Button>
              {testResult && (
                <div className="mt-3">
                  <Badge tone="accent">{testResult.provider}</Badge>
                  <pre
                    className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg p-2.5 text-[11px] leading-relaxed"
                    style={{ background: 'rgb(var(--bg) / 0.6)', border: '1px solid rgb(var(--border))' }}
                  >
                    {testResult.response}
                  </pre>
                </div>
              )}
            </Card>
          </div>

          {active && (
            <Card className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">{active.name}</h2>
                  <code className="text-xs" style={{ color: 'rgb(var(--accent-2))' }}>
                    {active.code}
                  </code>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle
                    checked={active.enabled}
                    onChange={async (enabled) => {
                      await adminApi.updatePrompt(active.code, { ...active, enabled })
                      setActive({ ...active, enabled })
                      load()
                    }}
                    label="Enabled"
                  />
                  <Button icon={Save} loading={saving} onClick={save}>
                    Save prompt
                  </Button>
                </div>
              </div>

              {active.variables && (
                <div className="mb-4">
                  <p className="label">Available placeholders</p>
                  <div className="flex flex-wrap gap-1.5">
                    {active.variables.split(',').map((variable) => (
                      <button
                        key={variable}
                        onClick={() => setDraft((d) => `${d}{{${variable.trim()}}}`)}
                        className="chip chip-accent transition-transform hover:scale-105"
                      >
                        {`{{${variable.trim()}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Field label="Template">
                <textarea
                  className="input min-h-[420px] resize-y font-mono text-xs leading-relaxed"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </Field>

              <div
                className="mt-4 flex items-start gap-2.5 rounded-xl p-3.5"
                style={{ background: 'rgb(var(--accent) / 0.07)', border: '1px solid rgb(var(--accent) / 0.2)' }}
              >
                <Sparkles size={15} className="mt-0.5 shrink-0" style={{ color: 'rgb(var(--accent))' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
                  Prompts that must return JSON should say so explicitly and show the exact shape.
                  The parser strips code fences and reads the first JSON object it finds, so a stray
                  sentence around the JSON will not break scoring.
                </p>
              </div>

              {active.updatedBy && (
                <p className="mt-3 text-[11px]" style={{ color: 'rgb(var(--text-dim))' }}>
                  Last edited by {active.updatedBy}
                  {active.updatedAt ? ` · ${new Date(active.updatedAt).toLocaleString()}` : ''}
                </p>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
