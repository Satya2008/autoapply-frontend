import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { adminApi, errorMessage } from '../../services/api'
import { useApp } from '../../store/AppContext'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Skeleton,
  Toggle,
} from '../../components/ui'

const blank = {
  code: '',
  name: '',
  providerType: 'GENERIC_REST',
  enabled: true,
  baseUrl: '',
  searchPath: '',
  httpMethod: 'GET',
  headersJson: '{"Accept":"application/json"}',
  queryParamsJson: '{"page":"{page}"}',
  resultsPath: '$.data',
  fieldMappingJson:
    '{\n  "jobId": "$.id",\n  "jobTitle": "$.title",\n  "employerName": "$.company",\n  "jobApplyLink": "$.url",\n  "jobDescription": "$.description",\n  "jobCity": "$.location"\n}',
  defaultQueries: 'developer',
  priority: 100,
  timeoutSeconds: 30,
}

export default function AdminJobSources() {
  const { toast } = useApp()
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(null)

  const load = async () => {
    try {
      setSources(await adminApi.jobSources())
    } catch (error) {
      toast(errorMessage(error, 'Could not load job sources'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      if (editing.id) await adminApi.updateJobSource(editing.id, editing)
      else await adminApi.createJobSource(editing)
      toast('Job source saved', 'success')
      setEditing(null)
      load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const test = async (source) => {
    setTesting(source.id)
    toast(`Testing ${source.name}…`, 'info')
    try {
      const result = await adminApi.testJobSource(source.id)
      toast(`${source.name}: ${result.saved} saved, ${result.skipped} duplicates`, 'success')
      load()
    } catch (error) {
      toast(`${source.name} failed: ${errorMessage(error)}`, 'error')
      load()
    } finally {
      setTesting(null)
    }
  }

  const set = (key) => (e) =>
    setEditing({ ...editing, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value })

  return (
    <div className="animate-in">
      <PageHeader
        icon={Database}
        title="Job sources"
        subtitle="Any JSON job API becomes a source by describing it here. No code required."
        actions={
          <>
            <Button
              variant="ghost"
              icon={RefreshCw}
              onClick={async () => {
                toast('Fetching from every enabled source…', 'info')
                try {
                  const result = await adminApi.fetchAllSources()
                  toast(`${result.saved} new jobs · ${result.failed} source failures`, 'success')
                  load()
                } catch (error) {
                  toast(errorMessage(error), 'error')
                }
              }}
            >
              Fetch all
            </Button>
            <Button icon={Plus} onClick={() => setEditing({ ...blank })}>
              Add source
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : sources.length === 0 ? (
        <Card>
          <EmptyState
            icon={Database}
            title="No job sources yet"
            description="Add one and the fetcher will start pulling roles from it."
            action={<Button icon={Plus} onClick={() => setEditing({ ...blank })}>Add source</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sources.map((source) => (
            <Card key={source.id} hover className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{source.name}</h3>
                    <Badge tone={source.enabled ? 'success' : 'default'}>
                      {source.enabled ? 'enabled' : 'disabled'}
                    </Badge>
                  </div>
                  <code className="mt-1 block truncate text-xs" style={{ color: 'rgb(var(--text-dim))' }}>
                    {source.baseUrl}{source.searchPath}
                  </code>
                </div>
                <Badge tone="accent">{source.providerType}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                <span>{(source.totalFetched || 0).toLocaleString()} jobs collected</span>
                {source.lastRunAt && <span>· last run {new Date(source.lastRunAt).toLocaleString()}</span>}
              </div>

              {source.lastRunStatus && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                  style={{
                    background: source.lastRunStatus === 'SUCCESS' ? 'rgb(var(--success) / 0.08)' : 'rgb(var(--danger) / 0.08)',
                    border: `1px solid rgb(var(--${source.lastRunStatus === 'SUCCESS' ? 'success' : 'danger'}) / 0.22)`,
                  }}
                >
                  {source.lastRunStatus === 'SUCCESS' ? (
                    <CheckCircle2 size={13} className="mt-px shrink-0" style={{ color: 'rgb(var(--success))' }} />
                  ) : (
                    <AlertCircle size={13} className="mt-px shrink-0" style={{ color: 'rgb(var(--danger))' }} />
                  )}
                  <span className="break-words">{source.lastRunMessage}</span>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button variant="ghost" icon={Play} loading={testing === source.id} onClick={() => test(source)}>
                  Test run
                </Button>
                <Button variant="ghost" onClick={() => setEditing(source)}>Edit</Button>
                <Button variant="danger" icon={Trash2} onClick={() => setDeleting(source)} className="ml-auto">
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${editing.name}` : 'Add a job source'}
        width="max-w-3xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button loading={saving} onClick={save}>Save source</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code" hint="Unique identifier, used as a job id prefix">
                <input className="input" value={editing.code} onChange={set('code')} disabled={Boolean(editing.id)} placeholder="myboard" />
              </Field>
              <Field label="Display name">
                <input className="input" value={editing.name} onChange={set('name')} placeholder="My Job Board" />
              </Field>
            </div>

            <Toggle
              checked={editing.enabled}
              onChange={(enabled) => setEditing({ ...editing, enabled })}
              label="Enabled"
              description="Included in scheduled fetch runs."
            />

            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <Field label="Base URL">
                <input className="input" value={editing.baseUrl} onChange={set('baseUrl')} placeholder="https://api.example.com" />
              </Field>
              <Field label="Method">
                <select className="input" value={editing.httpMethod} onChange={set('httpMethod')}>
                  <option>GET</option>
                  <option>POST</option>
                </select>
              </Field>
            </div>

            <Field label="Search path" hint="Placeholders: {query} {rawQuery} {page} {country} {limit}">
              <input className="input" value={editing.searchPath} onChange={set('searchPath')} placeholder="/jobs/search" />
            </Field>

            <Field label="Headers (JSON)" hint="Use ${setting:some.key} to inject a secret from settings">
              <textarea className="input min-h-[70px] font-mono text-xs" value={editing.headersJson || ''} onChange={set('headersJson')} />
            </Field>

            <Field label="Query parameters (JSON)">
              <textarea className="input min-h-[70px] font-mono text-xs" value={editing.queryParamsJson || ''} onChange={set('queryParamsJson')} />
            </Field>

            <Field label="Results path" hint="JsonPath to the array of jobs, e.g. $.data or $.results">
              <input className="input font-mono text-xs" value={editing.resultsPath || ''} onChange={set('resultsPath')} />
            </Field>

            <Field
              label="Field mapping (JSON)"
              hint="Our field → JsonPath inside one result. Supported: jobId, jobTitle, employerName, employerLogo, employerWebsite, jobPublisher, jobApplyLink, jobDescription, jobCity, jobState, jobCountry, jobIsRemote, jobEmploymentType, jobMinSalary, jobMaxSalary, jobSalaryCurrency, jobRequiredSkills"
            >
              <textarea className="input min-h-[150px] font-mono text-xs" value={editing.fieldMappingJson || ''} onChange={set('fieldMappingJson')} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Default queries" hint="Comma separated">
                <input className="input" value={editing.defaultQueries || ''} onChange={set('defaultQueries')} />
              </Field>
              <Field label="Priority" hint="Lower runs first">
                <input className="input" type="number" value={editing.priority ?? 100} onChange={set('priority')} />
              </Field>
              <Field label="Timeout (seconds)">
                <input className="input" type="number" value={editing.timeoutSeconds ?? 30} onChange={set('timeoutSeconds')} />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this job source?"
        message={`${deleting?.name} will stop being fetched. Jobs already collected stay in the pool.`}
        confirmLabel="Delete source"
        onConfirm={async () => {
          try {
            await adminApi.deleteJobSource(deleting.id)
            toast('Job source deleted', 'success')
            setDeleting(null)
            load()
          } catch (error) {
            toast(errorMessage(error), 'error')
          }
        }}
      />
    </div>
  )
}
