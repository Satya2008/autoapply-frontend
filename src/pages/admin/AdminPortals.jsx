import { useEffect, useState } from 'react'
import { MousePointerClick, Plus, ShieldAlert, Trash2 } from 'lucide-react'
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
  urlPattern: '',
  enabled: true,
  dryRun: true,
  priority: 100,
  readySelector: 'form',
  openFormSelector: '',
  fieldMappingJson:
    '[\n  {"selector":"input[name=\'name\']","valueFrom":"fullName","type":"text","required":true},\n  {"selector":"input[type=\'email\']","valueFrom":"email","type":"text","required":true},\n  {"selector":"input[type=file]","valueFrom":"resumeFile","type":"file"}\n]',
  submitSelector: 'button[type=submit]',
  successSelector: '',
  failureText: '',
  dismissSelectors: '',
  maxWaitSeconds: 20,
}

export default function AdminPortals() {
  const { toast } = useApp()
  const [portals, setPortals] = useState([])
  const [reference, setReference] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [list, ref] = await Promise.all([adminApi.portals(), adminApi.portalFieldReference()])
      setPortals(list)
      setReference(ref)
    } catch (error) {
      toast(errorMessage(error, 'Could not load portal configurations'), 'error')
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
      if (editing.id) await adminApi.updatePortal(editing.id, editing)
      else await adminApi.createPortal(editing)
      toast('Portal configuration saved', 'success')
      setEditing(null)
      load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const set = (key) => (e) =>
    setEditing({ ...editing, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value })

  return (
    <div className="animate-in">
      <PageHeader
        icon={MousePointerClick}
        title="Apply portals"
        subtitle="Selectors that teach the browser how to fill each site's form. Fixing a site redesign happens here."
        actions={<Button icon={Plus} onClick={() => setEditing({ ...blank })}>Add portal</Button>}
      />

      <Card className="mb-5 flex items-start gap-3 p-4" style={{ borderColor: 'rgb(var(--warning) / 0.3)' }}>
        <ShieldAlert size={17} className="mt-0.5 shrink-0" style={{ color: 'rgb(var(--warning))' }} />
        <div className="text-sm">
          <p className="font-medium">Portals ship in dry-run mode</p>
          <p className="mt-0.5 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            In dry run the engine fills the form and stops before submitting, so you can verify the
            selectors safely. Turn dry run off only once you have watched a run succeed. Browser
            automation also needs <code>selenium.enabled</code> and{' '}
            <code>apply.mode = BROWSER</code> in Settings.
          </p>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : portals.length === 0 ? (
        <Card>
          <EmptyState
            icon={MousePointerClick}
            title="No portal configurations"
            description="Add one so the browser engine knows how to apply on that site."
            action={<Button icon={Plus} onClick={() => setEditing({ ...blank })}>Add portal</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {portals.map((portal) => (
            <Card key={portal.id} hover className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{portal.name}</h3>
                    <Badge tone={portal.enabled ? 'success' : 'default'}>
                      {portal.enabled ? 'enabled' : 'disabled'}
                    </Badge>
                    {portal.dryRun && <Badge tone="warning">dry run</Badge>}
                  </div>
                  <code className="mt-1 block truncate text-xs" style={{ color: 'rgb(var(--text-dim))' }}>
                    {portal.urlPattern}
                  </code>
                </div>
              </div>

              <div className="mt-3 flex gap-4 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                <span style={{ color: 'rgb(var(--success))' }}>{portal.successCount || 0} succeeded</span>
                <span style={{ color: 'rgb(var(--danger))' }}>{portal.failureCount || 0} failed</span>
              </div>

              {portal.lastError && (
                <p
                  className="mt-3 break-words rounded-lg px-3 py-2 text-xs"
                  style={{ background: 'rgb(var(--danger) / 0.08)', color: 'rgb(var(--danger))' }}
                >
                  {portal.lastError}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(portal)}>Edit selectors</Button>
                <Button variant="danger" icon={Trash2} onClick={() => setDeleting(portal)} className="ml-auto">
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
        title={editing?.id ? `Edit ${editing.name}` : 'Add a portal'}
        width="max-w-3xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button loading={saving} onClick={save}>Save portal</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code">
                <input className="input" value={editing.code} onChange={set('code')} disabled={Boolean(editing.id)} placeholder="mycompany_ats" />
              </Field>
              <Field label="Display name">
                <input className="input" value={editing.name} onChange={set('name')} placeholder="My Company ATS" />
              </Field>
            </div>

            <Field label="URL pattern" hint="A substring or a regular expression matched against the apply link">
              <input className="input font-mono text-xs" value={editing.urlPattern} onChange={set('urlPattern')} placeholder="jobs.mycompany.com" />
            </Field>

            <div className="flex flex-wrap gap-6">
              <Toggle checked={editing.enabled} onChange={(enabled) => setEditing({ ...editing, enabled })} label="Enabled" />
              <Toggle
                checked={editing.dryRun}
                onChange={(dryRun) => setEditing({ ...editing, dryRun })}
                label="Dry run"
                description="Fill the form but never click submit"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ready selector" hint="Must exist for the page to count as loaded">
                <input className="input font-mono text-xs" value={editing.readySelector || ''} onChange={set('readySelector')} />
              </Field>
              <Field label="Open form selector" hint="Optional button clicked to reveal the form">
                <input className="input font-mono text-xs" value={editing.openFormSelector || ''} onChange={set('openFormSelector')} />
              </Field>
            </div>

            <Field
              label="Field mapping (JSON array)"
              hint={`Each entry: {"selector", "valueFrom", "type": text|file|select|checkbox|click, "required"}. Available valueFrom: ${Object.keys(reference).join(', ')}`}
            >
              <textarea className="input min-h-[170px] font-mono text-xs" value={editing.fieldMappingJson || ''} onChange={set('fieldMappingJson')} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Submit selector">
                <input className="input font-mono text-xs" value={editing.submitSelector || ''} onChange={set('submitSelector')} />
              </Field>
              <Field label="Success selector" hint="Appears only when the application went through">
                <input className="input font-mono text-xs" value={editing.successSelector || ''} onChange={set('successSelector')} />
              </Field>
              <Field label="Failure text" hint="Text on the page that means it failed">
                <input className="input" value={editing.failureText || ''} onChange={set('failureText')} />
              </Field>
              <Field label="Max wait (seconds)">
                <input className="input" type="number" value={editing.maxWaitSeconds ?? 20} onChange={set('maxWaitSeconds')} />
              </Field>
            </div>

            <Field label="Dismiss selectors" hint="Cookie banners and overlays, one per line">
              <textarea className="input min-h-[60px] font-mono text-xs" value={editing.dismissSelectors || ''} onChange={set('dismissSelectors')} />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this portal configuration?"
        message={`Applications to ${deleting?.name} will be skipped until another config matches.`}
        confirmLabel="Delete portal"
        onConfirm={async () => {
          try {
            await adminApi.deletePortal(deleting.id)
            toast('Portal deleted', 'success')
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
