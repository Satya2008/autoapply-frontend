import { Download, FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { jobSources } from '@/api/endpoints';
import type { JobSource, JobSourceInput, SourceDryRun, SourceFetchResult } from '@/api/types';
import { RunStatusBadge } from '@/components/domain';
import { KeyValueEditor } from '@/components/ui/editors';
import { ConfirmButton, Modal } from '@/components/ui/overlays';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, KeyValue, Notice, PageHeader, Select, Spinner, Table, Td, Textarea, Toggle } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { duration, timeAgo } from '@/lib/format';

const FIELDS = ['externalId', 'title', 'company', 'applyUrl', 'location', 'remote', 'description', 'postedAt', 'salaryMin', 'salaryMax', 'currency'];

const BLANK: JobSourceInput = {
  code: '',
  name: '',
  type: 'REST_JSON',
  baseUrl: 'https://',
  searchPath: '',
  method: 'GET',
  bodyTemplate: null,
  headers: {},
  queryParams: { page: '{page}' },
  resultsPath: '$.data',
  fieldMappings: { externalId: '$.id', title: '$.title', company: '$.company', applyUrl: '$.url' },
  enabled: true,
  priority: 10,
  timeoutSeconds: 20,
  maxPages: 2,
};

export default function JobSourcesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const list = useQuery({ queryKey: ['job-sources'], queryFn: jobSources.list });
  const [editing, setEditing] = useState<{ id: string | null; input: JobSourceInput } | null>(null);
  const [dryRun, setDryRun] = useState<SourceDryRun | null>(null);
  const [fetched, setFetched] = useState<SourceFetchResult | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['job-sources'] });
  const test = useMutation({ mutationFn: jobSources.test, onSuccess: setDryRun, onError: (e) => toast.error('Test failed', e) });
  const fetchNow = useMutation({
    mutationFn: jobSources.fetch,
    onSuccess: (r) => {
      setFetched(r);
      void refresh();
    },
    onError: (e) => toast.error('Fetch failed', e),
  });
  const remove = useMutation({ mutationFn: jobSources.remove, onSuccess: () => (toast.success('Board removed'), refresh()), onError: (e) => toast.error('Not removed', e) });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Job sources"
        subtitle="Each job board is configuration, not code: where to call, where the list of jobs is in the answer, and a JSONPath for each field. A new JSON board is one form."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ id: null, input: BLANK })}>
            Add a board
          </Button>
        }
      />
      {list.error ? <ErrorBox error={list.error} /> : null}
      {list.isLoading ? (
        <Spinner />
      ) : !list.data?.length ? (
        <EmptyState title="No job boards yet" />
      ) : (
        <Card padded={false}>
          <Table head={['Board', 'Enabled', 'Jobs', 'Last run', 'Failures in a row', '']}>
            {list.data.map((s) => (
              <tr key={s.id}>
                <Td>
                  <div className="font-medium">{s.name}</div>
                  <div className="font-mono text-xs text-slate-500">
                    {s.code} · {s.method} {s.baseUrl}
                    {s.searchPath}
                  </div>
                </Td>
                <Td>{s.enabled ? <Badge tone="green">on</Badge> : <Badge tone="red">off</Badge>}</Td>
                <Td className="tabular-nums">{s.jobCount}</Td>
                <Td>
                  <RunStatusBadge status={s.lastRunStatus} />
                  <div className="text-xs text-slate-500">{timeAgo(s.lastRunAt)}</div>
                  {s.lastRunMessage && <div className="max-w-xs truncate text-xs text-slate-500" title={s.lastRunMessage}>{s.lastRunMessage}</div>}
                </Td>
                <Td className={s.consecutiveFailures ? 'text-rose-600' : ''}>{s.consecutiveFailures}</Td>
                <Td>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button size="sm" variant="secondary" icon={<FlaskConical className="h-3.5 w-3.5" />} loading={test.isPending && test.variables === s.id} onClick={() => test.mutate(s.id)}>
                      Test
                    </Button>
                    <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} loading={fetchNow.isPending && fetchNow.variables === s.id} onClick={() => fetchNow.mutate(s.id)}>
                      Fetch
                    </Button>
                    <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing({ id: s.id, input: toInput(s) })}>
                      Edit
                    </Button>
                    <ConfirmButton title={`Remove ${s.name}?`} message="Its jobs stay until cleanup closes them." icon={<Trash2 className="h-3.5 w-3.5" />} onConfirm={() => remove.mutate(s.id)}>
                      Remove
                    </ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {editing && <SourceEditor initial={editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), refresh())} />}

      <Modal open={!!dryRun} onClose={() => setDryRun(null)} title={`Test of ${dryRun?.sourceCode}: nothing saved`} wide>
        {dryRun && (
          <div className="space-y-3">
            {dryRun.ok ? <Notice tone="green">The board answered and {dryRun.valid} jobs read correctly.</Notice> : <Notice tone="red">{dryRun.error}</Notice>}
            <KeyValue items={[['Pages fetched', dryRun.pagesFetched], ['Jobs received', dryRun.received], ['Valid', dryRun.valid], ['Skipped', dryRun.skipped]]} />
            {dryRun.problems.length > 0 && (
              <Notice tone="amber">
                <ul className="list-disc pl-4">
                  {dryRun.problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </Notice>
            )}
            <Table head={['Title', 'Company', 'Location', 'Posted', 'Apply link']}>
              {dryRun.sample.map((j) => (
                <tr key={j.externalId}>
                  <Td>{j.title}</Td>
                  <Td>{j.company}</Td>
                  <Td>{j.location}{j.remote ? ' (remote)' : ''}</Td>
                  <Td>{timeAgo(j.postedAt)}</Td>
                  <Td className="max-w-[12rem] truncate text-xs">{j.applyUrl}</Td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </Modal>

      <Modal open={!!fetched} onClose={() => setFetched(null)} title={`Fetched ${fetched?.sourceCode}`}>
        {fetched && (
          <div className="space-y-3">
            {fetched.message && <Notice tone={fetched.status === 'SUCCESS' ? 'green' : 'red'}>{fetched.message}</Notice>}
            {fetched.sourceDisabled && <Notice tone="red">The board failed too many times in a row and was switched off.</Notice>}
            <KeyValue
              items={[
                ['Pages', fetched.pagesFetched],
                ['Received', fetched.received],
                ['New', fetched.inserted],
                ['Updated', fetched.updated],
                ['Already from another board', fetched.duplicates],
                ['Skipped', fetched.skipped],
                ['Took', duration(fetched.durationMs)],
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function toInput(s: JobSource): JobSourceInput {
  return {
    code: s.code, name: s.name, type: s.type, baseUrl: s.baseUrl, searchPath: s.searchPath, method: s.method,
    bodyTemplate: s.bodyTemplate, headers: s.headers ?? {}, queryParams: s.queryParams ?? {}, resultsPath: s.resultsPath,
    fieldMappings: s.fieldMappings ?? {}, enabled: s.enabled, priority: s.priority, timeoutSeconds: s.timeoutSeconds, maxPages: s.maxPages,
  };
}

function SourceEditor({ initial, onClose, onSaved }: { initial: { id: string | null; input: JobSourceInput }; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<JobSourceInput>(initial.input);
  const save = useMutation({
    mutationFn: () => (initial.id ? jobSources.update(initial.id, form) : jobSources.create(form)),
    onSuccess: () => {
      toast.success(initial.id ? 'Board saved' : 'Board added');
      onSaved();
    },
  });
  const err = save.error instanceof ApiError ? save.error : null;
  const set = <K extends keyof JobSourceInput>(k: K, v: JobSourceInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={initial.id ? `Edit ${initial.input.name}` : 'Add a job board'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <ErrorBox error={err} />}
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Code" hint="Short id; can't change later" error={err?.field('code')}>
            <Input value={form.code} disabled={!!initial.id} onChange={(e) => set('code', e.target.value)} placeholder="arbeitnow" />
          </Field>
          <Field label="Name" error={err?.field('name')}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Method">
            <Select value={form.method} onChange={(e) => set('method', e.target.value as 'GET' | 'POST')}>
              <option>GET</option>
              <option>POST</option>
            </Select>
          </Field>
          <Field label="Base URL" error={err?.field('baseUrl')} className="md:col-span-2">
            <Input value={form.baseUrl} onChange={(e) => set('baseUrl', e.target.value)} />
          </Field>
          <Field label="Search path" error={err?.field('searchPath')}>
            <Input value={form.searchPath ?? ''} onChange={(e) => set('searchPath', e.target.value)} placeholder="/api/jobs" />
          </Field>
          <Field label="Results path (JSONPath)" hint="Where the list of jobs is" error={err?.field('resultsPath')}>
            <Input className="font-mono" value={form.resultsPath} onChange={(e) => set('resultsPath', e.target.value)} />
          </Field>
          <Field label="Priority" error={err?.field('priority')}>
            <Input type="number" value={form.priority} onChange={(e) => set('priority', Number(e.target.value))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Timeout (s)" error={err?.field('timeoutSeconds')}>
              <Input type="number" min={1} value={form.timeoutSeconds} onChange={(e) => set('timeoutSeconds', Number(e.target.value))} />
            </Field>
            <Field label="Max pages" error={err?.field('maxPages')}>
              <Input type="number" min={1} value={form.maxPages} onChange={(e) => set('maxPages', Number(e.target.value))} />
            </Field>
          </div>
        </div>
        <Toggle checked={form.enabled} onChange={(v) => set('enabled', v)} label="Enabled" description="Fetched by every fetch run." />
        <Field label="Query parameters" hint="{query} and {page} are filled in; ${setting:key} reads a secret setting.">
          <KeyValueEditor value={form.queryParams} onChange={(v) => set('queryParams', v)} />
        </Field>
        <Field label="Headers" hint="Values of secret headers should come from settings: ${setting:key}">
          <KeyValueEditor value={form.headers} onChange={(v) => set('headers', v)} keyPlaceholder="Header" />
        </Field>
        {form.method === 'POST' && (
          <Field label="Body template">
            <Textarea rows={4} className="font-mono text-xs" value={form.bodyTemplate ?? ''} onChange={(e) => set('bodyTemplate', e.target.value)} />
          </Field>
        )}
        <Field label="Field mappings (JSONPath per job field)" hint="externalId, title, company and applyUrl are required." error={err?.field('fieldMappings')}>
          <KeyValueEditor value={form.fieldMappings} onChange={(v) => set('fieldMappings', v)} keyPlaceholder="field" valuePlaceholder="$.path" suggestions={FIELDS} />
        </Field>
      </div>
    </Modal>
  );
}
