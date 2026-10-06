import { FlaskConical, Play, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { evals, prompts } from '@/api/endpoints';
import type { EvalMetrics, EvalRun, Json } from '@/api/types';
import { isRunning, useRunPolling } from '@/app/hooks';
import { RunStatusBadge } from '@/components/domain';
import { ChipsInput } from '@/components/ui/editors';
import { ConfirmButton, Modal } from '@/components/ui/overlays';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, Notice, PageHeader, Select, Spinner, Table, Tabs, Td, Textarea } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { percent, timeAgo, usd } from '@/lib/format';

export default function EvalsPage() {
  const [tab, setTab] = useState<'runs' | 'cases'>('runs');
  return (
    <div className="space-y-5">
      <PageHeader icon={<FlaskConical />}
        title="Evals"
        subtitle="AI quality measured, not guessed: a golden set of hand-scored (candidate, job) pairs, run against the matcher or a prompt version. A new job-fit version can only go live after its eval passes."
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'runs', label: 'Runs' }, { value: 'cases', label: 'Golden set' }]} />
      {tab === 'runs' ? <Runs /> : <Cases />}
    </div>
  );
}

function Runs() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const runs = useQuery({ queryKey: ['admin', 'eval-runs'], queryFn: () => evals.runs(30) });
  const promptList = useQuery({ queryKey: ['admin', 'prompts'], queryFn: prompts.list });
  const [selected, setSelected] = useState<string | null>(null);
  const [promptCode, setPromptCode] = useState('job-fit');
  const [promptVersion, setPromptVersion] = useState<string>('');
  const live = useRunPolling<EvalRun>('eval', selected, evals.run);

  const gatedCodes = useMemo(() => [...new Set((promptList.data ?? []).filter((p) => p.evalGated).map((p) => p.code))], [promptList.data]);
  const versions = (promptList.data ?? []).filter((p) => p.code === promptCode).map((p) => p.version);

  const start = useMutation({
    mutationFn: evals.start,
    onSuccess: (run) => {
      setSelected(run.id);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'eval-runs'] });
    },
    onError: (e) => toast.error('Eval not started', e),
  });
  const shown = live.data ?? runs.data?.find((r) => r.id === selected) ?? null;
  const finished = live.data && !isRunning(live.data.status) ? live.data.id : null;
  useEffect(() => {
    if (finished) {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'eval-runs'] });
    }
  }, [finished, queryClient]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Matcher: keyword vs hybrid">
          <p className="mb-3 text-sm text-slate-500">Scores every case twice, without and with semantic matching. Free: no AI call.</p>
          <Button icon={<Play className="h-4 w-4" />} loading={start.isPending && start.variables?.kind === 'MATCHER'} onClick={() => start.mutate({ kind: 'MATCHER' })}>
            Run matcher eval
          </Button>
        </Card>
        <Card title="Prompt version">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Prompt">
              <Select value={promptCode} onChange={(e) => (setPromptCode(e.target.value), setPromptVersion(''))}>
                {(gatedCodes.length ? gatedCodes : ['job-fit']).map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Version">
              <Select value={promptVersion} onChange={(e) => setPromptVersion(e.target.value)}>
                <option value="">newest</option>
                {versions.map((v) => <option key={v} value={v}>v{v}</option>)}
              </Select>
            </Field>
            <div className="flex items-end">
              <Button icon={<FlaskConical className="h-4 w-4" />} loading={start.isPending && start.variables?.kind === 'PROMPT'}
                onClick={() => start.mutate({ kind: 'PROMPT', promptCode, promptVersion: promptVersion ? Number(promptVersion) : undefined })}>
                Run
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Goes through the real providers: one call per case (cached answers are free).</p>
        </Card>
      </div>

      {shown && <RunDetail run={shown} />}

      <Card title="Recent runs" padded={false}>
        {runs.error ? <div className="p-4"><ErrorBox error={runs.error} /></div> : null}
        {runs.isLoading ? (
          <Spinner />
        ) : !runs.data?.length ? (
          <EmptyState title="No evals run yet" />
        ) : (
          <Table head={['Started', 'Kind', 'Prompt', 'Status', 'Passed', 'Cases', 'Summary']}>
            {runs.data.map((r) => (
              <tr key={r.id} onClick={() => setSelected(r.id)}
                className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${selected === r.id ? 'bg-brand-50/60 dark:bg-brand-900/20' : ''}`}>
                <Td>{timeAgo(r.createdAt)}</Td>
                <Td>{r.kind}</Td>
                <Td className="font-mono text-xs">{r.promptCode ? `${r.promptCode} v${r.promptVersion}` : '—'}</Td>
                <Td><RunStatusBadge status={r.status} /></Td>
                <Td>{r.passed === null ? '—' : r.passed ? <Badge tone="green">passed</Badge> : <Badge tone="red">no</Badge>}</Td>
                <Td>{r.caseCount}</Td>
                <Td className="max-w-md truncate text-xs" title={r.error ?? r.metrics?.verdict ?? ''}>
                  {r.error ?? r.metrics?.verdict ?? (r.metrics?.ai ? `MAE ${r.metrics.ai.mae}, valid ${percent(r.metrics.validRate)}` : '')}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

function RunDetail({ run }: { run: EvalRun }) {
  const m = run.metrics;
  const columns: [string, EvalMetrics][] = [];
  if (m?.keyword) columns.push(['Keyword only', m.keyword]);
  if (m?.hybrid) columns.push(['Hybrid (keyword + meaning)', m.hybrid]);
  if (m?.ai) columns.push([`AI · ${m.prompt} v${m.version}`, m.ai]);
  const rows: [string, (x: EvalMetrics) => string][] = [
    ['Average miss (MAE, points)', (x) => x.mae.toFixed(1)],
    ['Within 15 points', (x) => percent(x.within15)],
    ['Ranking (Spearman)', (x) => (x.spearman === null ? '—' : x.spearman.toFixed(3))],
    ['Precision', (x) => percent(x.precision)],
    ['Recall', (x) => percent(x.recall)],
    ['F1', (x) => x.f1.toFixed(3)],
  ];
  const caseKeys = m?.cases?.length ? Object.keys(m.cases[0]) : [];

  return (
    <Card title={<span className="flex items-center gap-2">Run {run.kind.toLowerCase()} <RunStatusBadge status={run.status} />
      {run.passed !== null && (run.passed ? <Badge tone="green">passed</Badge> : <Badge tone="red">did not pass</Badge>)}</span>}>
      {isRunning(run.status) && <Spinner label={`Scoring ${run.caseCount} cases…`} />}
      {run.error && <Notice tone="red">{run.error}</Notice>}
      {m && (
        <div className="space-y-4">
          {m.verdict && <Notice tone={run.passed ? 'green' : 'amber'}>{m.verdict}</Notice>}
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {m.embeddingModel && <span>Embedding model: <b>{m.embeddingModel}</b>{m.embeddingFellBack ? ' (fell back to local)' : ''}</span>}
            {m.validRate !== undefined && <span>Usable answers: <b>{percent(m.validRate)}</b></span>}
            {m.costUsd !== undefined && <span>Cost: <b>{usd(m.costUsd, 4)}</b></span>}
            {m.averageLatencyMs !== undefined && <span>Avg latency: <b>{m.averageLatencyMs} ms</b></span>}
            {m.passWhen && <span>Passes at MAE ≤ {m.passWhen.maxMae} and ≥ {percent(m.passWhen.minValidRate)} usable</span>}
          </div>
          <Table head={['', ...columns.map(([label]) => label)]}>
            {rows.map(([label, fn]) => (
              <tr key={label}>
                <Td className="font-medium">{label}</Td>
                {columns.map(([c, x]) => <Td key={c} className="tabular-nums">{fn(x)}</Td>)}
              </tr>
            ))}
          </Table>
          {m.cases && (
            <details>
              <summary className="cursor-pointer text-sm text-slate-500">Per case ({m.cases.length})</summary>
              <div className="mt-2">
                <Table head={caseKeys}>
                  {m.cases.map((c, i) => (
                    <tr key={i}>
                      {caseKeys.map((k) => <Td key={k} className="text-xs">{formatCell(c[k])}</Td>)}
                    </tr>
                  ))}
                </Table>
              </div>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

function formatCell(v: Json | undefined): string {
  if (v === null || v === undefined) return '—';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

function Cases() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const cases = useQuery({ queryKey: ['admin', 'eval-cases'], queryFn: evals.cases });
  const [adding, setAdding] = useState(false);
  const remove = useMutation({
    mutationFn: evals.removeCase,
    onSuccess: () => (toast.success('Case removed'), queryClient.invalidateQueries({ queryKey: ['admin', 'eval-cases'] })),
    onError: (e) => toast.error('Not removed', e),
  });
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add a case</Button>
      </div>
      {cases.error ? <ErrorBox error={cases.error} /> : null}
      {cases.isLoading ? (
        <Spinner />
      ) : (
        <Card padded={false}>
          <Table head={['Case', 'Candidate', 'Job', 'Expected', '']}>
            {cases.data?.map((c) => (
              <tr key={c.id}>
                <Td>
                  <div className="font-mono text-xs font-medium">{c.name}</div>
                  {c.notes && <div className="max-w-xs text-xs text-slate-500">{c.notes}</div>}
                </Td>
                <Td className="text-xs">
                  <div>{c.profile.targetRoles.join(', ')}</div>
                  <div className="text-slate-500">{c.profile.skills.join(', ')}{c.profile.experienceYears !== null ? ` · ${c.profile.experienceYears}y` : ''}</div>
                </Td>
                <Td className="text-xs">
                  <div className="font-medium">{c.job.title}</div>
                  <div className="max-w-sm truncate text-slate-500" title={c.job.description ?? ''}>{c.job.description}</div>
                </Td>
                <Td className="text-lg font-semibold tabular-nums">{c.expectedScore}</Td>
                <Td>
                  <ConfirmButton title={`Remove ${c.name}?`} message="Evals run after this won't include it." icon={<Trash2 className="h-3.5 w-3.5" />} onConfirm={() => remove.mutate(c.id)}>
                    Remove
                  </ConfirmButton>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {adding && <CaseForm onClose={() => setAdding(false)} onSaved={() => (setAdding(false), queryClient.invalidateQueries({ queryKey: ['admin', 'eval-cases'] }))} />}
    </div>
  );
}

function CaseForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [years, setYears] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState<string[]>([]);
  const [minYears, setMinYears] = useState('');
  const [expected, setExpected] = useState(70);
  const [notes, setNotes] = useState('');
  const save = useMutation({
    mutationFn: () =>
      evals.addCase({
        name,
        profile: { skills, targetRoles: roles, experienceYears: years ? Number(years) : null },
        job: { title, company: company || null, description: description || null, requiredSkills: required, minYearsExperience: minYears ? Number(minYears) : null },
        expectedScore: expected,
        notes: notes || undefined,
      }),
    onSuccess: () => (toast.success('Case added'), onSaved()),
  });
  const err = save.error instanceof ApiError ? save.error : null;
  return (
    <Modal open wide onClose={onClose} title="Add a golden-set case"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="space-y-4">
        {err && <ErrorBox error={err} />}
        <Field label="Name" hint="Unique, e.g. java-backend-vs-spring" error={err?.field('name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Candidate</div>
            <Field label="Target roles"><ChipsInput value={roles} onChange={setRoles} max={10} /></Field>
            <Field label="Skills"><ChipsInput value={skills} onChange={setSkills} max={50} /></Field>
            <Field label="Years of experience"><Input type="number" min={0} max={50} value={years} onChange={(e) => setYears(e.target.value)} /></Field>
          </div>
          <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Job</div>
            <Field label="Title" error={err?.field('job.title')}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
            <Field label="Description"><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            <Field label="Required skills (optional)"><ChipsInput value={required} onChange={setRequired} /></Field>
            <Field label="Minimum years (optional)"><Input type="number" min={0} max={40} value={minYears} onChange={(e) => setMinYears(e.target.value)} /></Field>
          </div>
        </div>
        <Field label={`Expected score: ${expected}`} hint="What a careful recruiter would give this pair.">
          <input type="range" min={0} max={100} value={expected} onChange={(e) => setExpected(Number(e.target.value))} className="w-full accent-brand-600" />
        </Field>
        <Field label="Notes"><Input value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
