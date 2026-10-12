import clsx from 'clsx';
import { ArrowLeft, Download, FlaskConical, Globe, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import type { TemplateAnswers, TemplateKind } from './sourceTemplates';
import { ADZUNA_COUNTRIES, buildFromTemplate, REGIONS, regionOf, TEMPLATES } from './sourceTemplates';

const FIELDS = ['externalId', 'title', 'company', 'applyUrl', 'location', 'remote', 'description', 'postedAt', 'salaryMin', 'salaryMax', 'currency'];

export default function JobSourcesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const list = useQuery({ queryKey: ['job-sources'], queryFn: jobSources.list });
  const [region, setRegion] = useState<string>('ALL');
  const [picking, setPicking] = useState(false);
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
  const remove = useMutation({ mutationFn: jobSources.remove, onSuccess: () => (toast.success('Source removed'), refresh()), onError: (e) => toast.error('Not removed', e) });
  const toggle = useMutation({
    mutationFn: (s: JobSource) => jobSources.update(s.id, { ...toInput(s), enabled: !s.enabled }),
    onSuccess: (s) => (toast.success(`${s.name} ${s.enabled ? 'on' : 'off'}`), refresh()),
    onError: (e) => toast.error('Not changed', e),
  });
  const bulk = useMutation({
    mutationFn: async ({ sources, enabled }: { sources: JobSource[]; enabled: boolean }) => {
      for (const s of sources.filter((x) => x.enabled !== enabled)) {
        await jobSources.update(s.id, { ...toInput(s), enabled });
      }
      return { count: sources.length, enabled };
    },
    onSuccess: ({ enabled }) => (toast.success(enabled ? 'All switched on' : 'All switched off'), refresh()),
    onError: (e) => (toast.error('Some sources not changed', e), refresh()),
  });

  const all = list.data ?? [];
  const counts = useMemo(() => {
    const map = new Map<string, { total: number; on: number }>();
    for (const s of all) {
      const c = map.get(s.region) ?? { total: 0, on: 0 };
      map.set(s.region, { total: c.total + 1, on: c.on + (s.enabled ? 1 : 0) });
    }
    return map;
  }, [all]);
  const shown = region === 'ALL' ? all : all.filter((s) => s.region === region);
  const regionsInUse = REGIONS.filter((r) => counts.has(r.code)).concat(
    [...counts.keys()].filter((c) => !REGIONS.some((r) => r.code === c)).map((c) => regionOf(c)),
  );

  return (
    <div className="space-y-5">
      <PageHeader icon={<Globe />}
        title="Job sources"
        subtitle="Where jobs come from: company career APIs (Greenhouse, Lever, Ashby), job APIs (Adzuna) and allowed career pages. Switch any source, or a whole region, on and off."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setPicking(true)}>
            Add a source
          </Button>
        }
      />
      {list.error ? <ErrorBox error={list.error} /> : null}

      {all.length > 0 && (
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <RegionChip active={region === 'ALL'} onClick={() => setRegion('ALL')} label="All regions" count={all.length} on={all.filter((s) => s.enabled).length} />
            {regionsInUse.map((r) => {
              const c = counts.get(r.code)!;
              return <RegionChip key={r.code} active={region === r.code} onClick={() => setRegion(r.code)} label={r.label} count={c.total} on={c.on} />;
            })}
          </div>
          {region !== 'ALL' && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/5">
              <span className="text-sm text-slate-500">
                {regionOf(region).label}: {counts.get(region)?.on ?? 0} of {counts.get(region)?.total ?? 0} on
              </span>
              <div className="flex-1" />
              <Button size="sm" variant="secondary" icon={<Power className="h-3.5 w-3.5" />} loading={bulk.isPending && bulk.variables?.enabled} onClick={() => bulk.mutate({ sources: shown, enabled: true })}>
                Turn all on
              </Button>
              <Button size="sm" variant="secondary" icon={<PowerOff className="h-3.5 w-3.5" />} loading={bulk.isPending && !bulk.variables?.enabled} onClick={() => bulk.mutate({ sources: shown, enabled: false })}>
                Turn all off
              </Button>
            </div>
          )}
        </Card>
      )}

      {list.isLoading ? (
        <Spinner />
      ) : !all.length ? (
        <EmptyState title="No job sources yet" action={<Button onClick={() => setPicking(true)}>Add a source</Button>} />
      ) : (
        <Card padded={false}>
          <Table head={['Source', 'Region', 'On', 'Jobs', 'Last run', '']}>
            {shown.map((s) => (
              <tr key={s.id} className={clsx(!s.enabled && 'opacity-60')}>
                <Td>
                  <div className="flex items-center gap-2 font-medium">
                    {s.name}
                    <Badge tone={s.type === 'HTML_SCRAPE' ? 'amber' : 'blue'}>{s.type === 'HTML_SCRAPE' ? 'Scrape' : 'API'}</Badge>
                  </div>
                  <div className="max-w-xs truncate font-mono text-xs text-slate-500" title={`${s.baseUrl}${s.searchPath ?? ''}`}>
                    {s.code} · {s.baseUrl}
                    {s.searchPath}
                  </div>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-sm">
                    {regionOf(s.region).label}
                  </span>
                </Td>
                <Td>
                  <Toggle checked={s.enabled} disabled={toggle.isPending && toggle.variables?.id === s.id} onChange={() => toggle.mutate(s)} />
                </Td>
                <Td className="tabular-nums">{s.jobCount}</Td>
                <Td>
                  <RunStatusBadge status={s.lastRunStatus} />
                  <div className="text-xs text-slate-500">{timeAgo(s.lastRunAt)}</div>
                  {s.lastRunMessage && <div className="max-w-xs truncate text-xs text-slate-500" title={s.lastRunMessage}>{s.lastRunMessage}</div>}
                  {s.consecutiveFailures > 0 && <div className="text-xs text-rose-600">{s.consecutiveFailures} failures in a row</div>}
                </Td>
                <Td>
                  <div className="flex flex-nowrap justify-end gap-1">
                    <Button size="sm" variant="secondary" icon={<FlaskConical className="h-3.5 w-3.5" />} loading={test.isPending && test.variables === s.id} onClick={() => test.mutate(s.id)} title="Try it without saving anything">
                      Test
                    </Button>
                    <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} loading={fetchNow.isPending && fetchNow.variables === s.id} onClick={() => fetchNow.mutate(s.id)} title="Fetch and save its jobs now">
                      Fetch
                    </Button>
                    <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing({ id: s.id, input: toInput(s) })} title="Edit" aria-label="Edit" />
                    <ConfirmButton variant="ghost" title={`Remove ${s.name}?`} message="Its jobs stay until cleanup closes them." icon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />} onConfirm={() => remove.mutate(s.id)}>
                      <span className="sr-only">Remove</span>
                    </ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {picking && (
        <TemplatePicker
          defaultRegion={region === 'ALL' ? 'IN' : region}
          onClose={() => setPicking(false)}
          onPicked={(input) => {
            setPicking(false);
            setEditing({ id: null, input });
          }}
        />
      )}

      {editing && <SourceEditor initial={editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), refresh())} />}

      <Modal open={!!dryRun} onClose={() => setDryRun(null)} title={`Test of ${dryRun?.sourceCode}: nothing saved`} wide>
        {dryRun && (
          <div className="space-y-3">
            {dryRun.ok ? <Notice tone="green">The source answered and {dryRun.valid} jobs read correctly.</Notice> : <Notice tone="red">{dryRun.error}</Notice>}
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
            {fetched.sourceDisabled && <Notice tone="red">The source failed too many times in a row and was switched off.</Notice>}
            <KeyValue
              items={[
                ['Pages', fetched.pagesFetched],
                ['Received', fetched.received],
                ['New', fetched.inserted],
                ['Updated', fetched.updated],
                ['Already from another source', fetched.duplicates],
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

function RegionChip({ active, onClick, label, count, on }: { active: boolean; onClick: () => void; label: string; count: number; on: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition-all',
        active
          ? 'bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_6px_16px_-6px_rgba(124,58,237,0.6)]'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10',
      )}
    >
      {label}
      <span className={clsx('rounded-lg px-1.5 text-xs tabular-nums', active ? 'bg-white/25' : 'bg-white dark:bg-white/10')} title={`${on} of ${count} on`}>
        {on}/{count}
      </span>
    </button>
  );
}

function toInput(s: JobSource): JobSourceInput {
  return {
    code: s.code, name: s.name, type: s.type, region: s.region, baseUrl: s.baseUrl, searchPath: s.searchPath, method: s.method,
    bodyTemplate: s.bodyTemplate, headers: s.headers ?? {}, queryParams: s.queryParams ?? {}, resultsPath: s.resultsPath,
    fieldMappings: s.fieldMappings ?? {}, enabled: s.enabled, priority: s.priority, timeoutSeconds: s.timeoutSeconds, maxPages: s.maxPages,
    fetchEveryHours: s.fetchEveryHours ?? null,
  };
}

function TemplatePicker({ defaultRegion, onClose, onPicked }: { defaultRegion: string; onClose: () => void; onPicked: (input: JobSourceInput) => void }) {
  const [kind, setKind] = useState<TemplateKind | null>(null);
  const [a, setA] = useState<TemplateAnswers>({ slug: '', company: '', region: defaultRegion, country: 'in', keywords: '', pageUrl: '' });
  const set = <K extends keyof TemplateAnswers>(k: K, v: TemplateAnswers[K]) => setA((x) => ({ ...x, [k]: v }));
  const template = TEMPLATES.find((t) => t.kind === kind);
  const needsSlug = kind === 'greenhouse' || kind === 'lever' || kind === 'ashby';
  const ready = !kind ? false : needsSlug ? a.slug.trim().length > 0 : kind === 'scrape' ? a.pageUrl.trim().startsWith('http') : true;

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={template ? `Add from ${template.name}` : 'Add a job source'}
      footer={
        kind && (
          <>
            <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setKind(null)}>
              Back
            </Button>
            <Button disabled={!ready} onClick={() => onPicked(buildFromTemplate(kind, a))}>
              Continue
            </Button>
          </>
        )
      }
    >
      {!kind ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => setKind(t.kind)}
              className="group rounded-2xl p-4 text-left ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-lift hover:ring-brand-300 dark:ring-white/10"
            >
              <div className="flex items-center gap-2 font-bold">
                {t.name}
                {t.kind === 'scrape' && <Badge tone="amber">robots.txt only</Badge>}
                {t.kind === 'adzuna' && <Badge tone="violet">needs key</Badge>}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.blurb}</div>
              <div className="mt-2 text-xs text-slate-500">{t.how}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Notice>{template?.how}</Notice>
          {needsSlug && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Company slug" hint="From the careers page URL">
                <Input autoFocus value={a.slug} onChange={(e) => set('slug', e.target.value.trim())} placeholder={kind === 'greenhouse' ? 'groww' : kind === 'lever' ? 'cred' : 'sarvam'} />
              </Field>
              <Field label="Company name" hint={kind === 'greenhouse' ? 'Greenhouse sends it; used only for the source name' : 'Lever and Ashby don’t send it, so it is filled in'}>
                <Input value={a.company} onChange={(e) => set('company', e.target.value)} placeholder="Groww" />
              </Field>
            </div>
          )}
          {kind === 'adzuna' && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Country">
                <Select value={a.country} onChange={(e) => set('country', e.target.value)}>
                  {ADZUNA_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Keywords (optional)" hint="Only jobs with these words, e.g. java developer">
                <Input value={a.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="java developer" />
              </Field>
            </div>
          )}
          {kind === 'scrape' && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Careers page URL" className="md:col-span-2">
                <Input autoFocus value={a.pageUrl} onChange={(e) => set('pageUrl', e.target.value)} placeholder="https://www.example.com/careers" />
              </Field>
              <Field label="Company name">
                <Input value={a.company} onChange={(e) => set('company', e.target.value)} placeholder="Example Ltd" />
              </Field>
            </div>
          )}
          {kind !== 'adzuna' && (
            <Field label="Region" hint="Used to switch sources on and off together and to filter jobs">
              <Select value={a.region} onChange={(e) => set('region', e.target.value)}>
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <p className="text-xs text-slate-500">Next you can check every setting, then save and press Test.</p>
        </div>
      )}
    </Modal>
  );
}

function SourceEditor({ initial, onClose, onSaved }: { initial: { id: string | null; input: JobSourceInput }; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<JobSourceInput>(initial.input);
  const save = useMutation({
    mutationFn: () => (initial.id ? jobSources.update(initial.id, form) : jobSources.create(form)),
    onSuccess: () => {
      toast.success(initial.id ? 'Source saved' : 'Source added');
      onSaved();
    },
  });
  const err = save.error instanceof ApiError ? save.error : null;
  const set = <K extends keyof JobSourceInput>(k: K, v: JobSourceInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const html = form.type === 'HTML_SCRAPE';

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={initial.id ? `Edit ${initial.input.name}` : 'Add a job source'}
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
        {html && (
          <Notice tone="amber">
            Scraping reads the page’s HTML. The site’s robots.txt is checked first and a disallowed page is never fetched. Pages built by JavaScript
            come back empty; use an API source for those.
          </Notice>
        )}
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Code" hint="Short id; can't change later" error={err?.field('code')}>
            <Input value={form.code} disabled={!!initial.id} onChange={(e) => set('code', e.target.value)} placeholder="gh-groww" />
          </Field>
          <Field label="Name" error={err?.field('name')}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Region" error={err?.field('region')}>
            <Select value={form.region} onChange={(e) => set('region', e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => {
                const type = e.target.value as JobSourceInput['type'];
                setForm((f) => ({ ...f, type, method: type === 'HTML_SCRAPE' ? 'GET' : f.method }));
              }}
            >
              <option value="REST_JSON">API (JSON)</option>
              <option value="HTML_SCRAPE">Career page (scrape HTML)</option>
            </Select>
          </Field>
          {!html && (
            <Field label="Method">
              <Select value={form.method} onChange={(e) => set('method', e.target.value as 'GET' | 'POST')}>
                <option>GET</option>
                <option>POST</option>
              </Select>
            </Field>
          )}
          <Field label="Priority" error={err?.field('priority')}>
            <Input type="number" value={form.priority} onChange={(e) => set('priority', Number(e.target.value))} />
          </Field>
          <Field label="Base URL" error={err?.field('baseUrl')} className="md:col-span-2">
            <Input value={form.baseUrl} onChange={(e) => set('baseUrl', e.target.value)} />
          </Field>
          <Field label="Path" hint="{page} is the page number" error={err?.field('searchPath')}>
            <Input value={form.searchPath ?? ''} onChange={(e) => set('searchPath', e.target.value)} placeholder="/api/jobs" />
          </Field>
          <Field
            label={html ? 'Each job (CSS selector)' : 'Results path (JSONPath)'}
            hint={html ? 'The element that holds one job, e.g. ul.jobs > li' : 'Where the list of jobs is, e.g. $.data'}
            error={err?.field('resultsPath')}
            className="md:col-span-2"
          >
            <Input className="font-mono" value={form.resultsPath} onChange={(e) => set('resultsPath', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Timeout (s)" error={err?.field('timeoutSeconds')}>
              <Input type="number" min={1} value={form.timeoutSeconds} onChange={(e) => set('timeoutSeconds', Number(e.target.value))} />
            </Field>
            <Field label="Max pages" error={err?.field('maxPages')}>
              <Input type="number" min={1} value={form.maxPages} onChange={(e) => set('maxPages', Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Fetch at most every (hours)" hint="For paid APIs with a small free quota: 24 = once a day, 168 = once a week. Empty: every run." error={err?.field('fetchEveryHours')}>
            <Input type="number" min={1} max={720} value={form.fetchEveryHours ?? ''} placeholder="every run"
              onChange={(e) => set('fetchEveryHours', e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
        <Toggle checked={form.enabled} onChange={(v) => set('enabled', v)} label="Enabled" description="Fetched at 9:00 and 13:00 each day, or less often if set below." />
        <Field label="Query parameters" hint="{query} and {page} are filled in; ${setting:key} reads a secret from config/job-sources-secrets.properties.">
          <KeyValueEditor value={form.queryParams} onChange={(v) => set('queryParams', v)} />
        </Field>
        <Field label="Headers" hint="Secret values should come from settings: ${setting:key}">
          <KeyValueEditor value={form.headers} onChange={(v) => set('headers', v)} keyPlaceholder="Header" />
        </Field>
        {!html && form.method === 'POST' && (
          <Field label="Body template">
            <Textarea rows={4} className="font-mono text-xs" value={form.bodyTemplate ?? ''} onChange={(e) => set('bodyTemplate', e.target.value)} />
          </Field>
        )}
        <Field
          label={html ? 'Field mappings (CSS selector per field)' : 'Field mappings (JSONPath per field)'}
          hint={
            html
              ? 'externalId, title, company and applyUrl are required. h3 = its text; a@href = a link; .about@html = keeps line breaks; @data-id = an attribute of the job element; =Acme = a fixed value.'
              : 'externalId, title, company and applyUrl are required. =Acme puts a fixed value, for boards that leave a field out.'
          }
          error={err?.field('fieldMappings')}
        >
          <KeyValueEditor value={form.fieldMappings} onChange={(v) => set('fieldMappings', v)} keyPlaceholder="field" valuePlaceholder={html ? 'h3.title' : '$.path'} suggestions={FIELDS} />
        </Field>
      </div>
    </Modal>
  );
}
