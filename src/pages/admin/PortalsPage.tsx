import { MonitorPlay, Pencil, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { portals } from '@/api/endpoints';
import type { Json, Portal, PortalInput, RiskBand } from '@/api/types';
import { RiskBadge } from '@/components/domain';
import { JsonView, KeyValueEditor } from '@/components/ui/editors';
import { ConfirmButton, Modal } from '@/components/ui/overlays';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, Notice, PageHeader, Select, Spinner, Table, Td, Toggle } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { timeAgo } from '@/lib/format';

const SELECTOR_KEYS = ['fullName', 'email', 'phone', 'location', 'currentTitle', 'experienceYears', 'expectedSalary', 'noticePeriodDays',
  'linkedinUrl', 'coverLetter', 'submit', 'success'];

const BLANK: PortalInput = { domain: '', name: '', riskBand: 'LOW', enabled: true, selectors: { submit: 'button[type=submit]', success: '.thank-you' } };

export default function PortalsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const list = useQuery({ queryKey: ['admin', 'portals'], queryFn: portals.list });
  const [editing, setEditing] = useState<{ id: string | null; input: PortalInput } | null>(null);
  const [dryRunFor, setDryRunFor] = useState<Portal | null>(null);
  const remove = useMutation({
    mutationFn: portals.remove,
    onSuccess: () => (toast.success('Portal removed'), queryClient.invalidateQueries({ queryKey: ['admin', 'portals'] })),
    onError: (e) => toast.error('Not removed', e),
  });

  return (
    <div className="space-y-5">
      <PageHeader icon={<ShieldAlert />}
        title="Apply portals"
        subtitle="How risky each careers site is, and for safe ones how the apply worker fills its form: a CSS selector per field, plus “submit” and “success” (something only shown once it went through)."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ id: null, input: BLANK })}>Add a portal</Button>}
      />
      <Notice tone="blue">
        LinkedIn, Naukri, Indeed, Workday and other sites that ban automation are always HIGH risk and never applied to automatically,
        whatever is set here. Unknown sites are MEDIUM. The most specific domain wins.
      </Notice>
      {list.error ? <ErrorBox error={list.error} /> : null}
      {list.isLoading ? (
        <Spinner />
      ) : !list.data?.length ? (
        <EmptyState title="No portals set up">Without one, every site is handled by the built-in risk lists.</EmptyState>
      ) : (
        <Card padded={false}>
          <Table head={['Portal', 'Risk', 'Enabled', 'Selectors', 'Added', '']}>
            {list.data.map((p) => (
              <tr key={p.id}>
                <Td>
                  <div className="font-medium">{p.name}</div>
                  <div className="font-mono text-xs text-slate-500">{p.domain}</div>
                </Td>
                <Td><RiskBadge risk={p.riskBand} /></Td>
                <Td>{p.enabled ? <Badge tone="green">on</Badge> : <Badge>off</Badge>}</Td>
                <Td>
                  <div className="flex max-w-sm flex-wrap gap-1">
                    {Object.keys(p.selectors ?? {}).map((k) => <Badge key={k}>{k}</Badge>)}
                  </div>
                </Td>
                <Td>{timeAgo(p.createdAt)}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="secondary" icon={<MonitorPlay className="h-3.5 w-3.5" />} onClick={() => setDryRunFor(p)}>Dry run</Button>
                    <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => setEditing({ id: p.id, input: { domain: p.domain, name: p.name, riskBand: p.riskBand, enabled: p.enabled, selectors: p.selectors ?? {} } })}>
                      Edit
                    </Button>
                    <ConfirmButton title={`Remove ${p.name}?`} message="The site falls back to the built-in risk lists." icon={<Trash2 className="h-3.5 w-3.5" />} onConfirm={() => remove.mutate(p.id)}>
                      Remove
                    </ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {editing && (
        <PortalEditor initial={editing} onClose={() => setEditing(null)}
          onSaved={() => (setEditing(null), queryClient.invalidateQueries({ queryKey: ['admin', 'portals'] }))} />
      )}
      {dryRunFor && <DryRun portal={dryRunFor} onClose={() => setDryRunFor(null)} />}
    </div>
  );
}

function PortalEditor({ initial, onClose, onSaved }: { initial: { id: string | null; input: PortalInput }; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState(initial.input);
  const save = useMutation({
    mutationFn: () => (initial.id ? portals.update(initial.id, form) : portals.create(form)),
    onSuccess: () => (toast.success('Portal saved'), onSaved()),
  });
  const err = save.error instanceof ApiError ? save.error : null;
  return (
    <Modal open wide onClose={onClose} title={initial.id ? `Edit ${initial.input.name}` : 'Add a portal'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="space-y-4">
        {err && <ErrorBox error={err} />}
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Domain" hint="e.g. jobs.lever.co" error={err?.field('domain')}>
            <Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          </Field>
          <Field label="Name" error={err?.field('name')}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Risk" error={err?.field('riskBand')}>
            <Select value={form.riskBand} onChange={(e) => setForm({ ...form, riskBand: e.target.value as RiskBand })}>
              <option value="LOW">Low: may be applied to automatically</option>
              <option value="MEDIUM">Medium: the candidate applies</option>
              <option value="HIGH">High: bans automation</option>
            </Select>
          </Field>
        </div>
        <Toggle checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="Enabled" />
        <Field label="Form selectors" hint="Field name → CSS selector. Without “submit” and “success” nothing is ever counted as submitted.">
          <KeyValueEditor value={form.selectors} onChange={(v) => setForm({ ...form, selectors: v })} keyPlaceholder="field" valuePlaceholder="CSS selector" suggestions={SELECTOR_KEYS} />
        </Field>
      </div>
    </Modal>
  );
}

function DryRun({ portal, onClose }: { portal: Portal; onClose: () => void }) {
  const [url, setUrl] = useState(`https://${portal.domain}/`);
  const [result, setResult] = useState<Json | null>(null);
  const run = useMutation({ mutationFn: () => portals.dryRun(portal.id, url), onSuccess: setResult });
  return (
    <Modal open wide onClose={onClose} title={`Dry run on ${portal.name}`}
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button loading={run.isPending} onClick={() => run.mutate()}>Fill the form</Button></>}>
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          The apply worker opens the page in headless Chrome and fills the form with clearly fake answers. It never presses submit.
          A cold browser takes about half a minute.
        </p>
        <Field label="Page with the application form">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </Field>
        {run.error ? <ErrorBox error={run.error} /> : null}
        {result !== null && <JsonView value={result} />}
      </div>
    </Modal>
  );
}
