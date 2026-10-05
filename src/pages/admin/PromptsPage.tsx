import { CheckCircle2, FlaskConical, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { prompts } from '@/api/endpoints';
import type { Json, Prompt } from '@/api/types';
import { JsonView } from '@/components/ui/editors';
import { Modal } from '@/components/ui/overlays';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, Notice, PageHeader, Spinner, Textarea } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { dateTime } from '@/lib/format';

/**
 * Prompts are versioned data: a change is a new version, saved switched off; activating an
 * older version is the rollback. Gated prompts need a passing eval before a new version goes live.
 */
export default function PromptsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const list = useQuery({ queryKey: ['admin', 'prompts'], queryFn: prompts.list });
  const [code, setCode] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ code: string; from?: Prompt } | null>(null);
  const [gated, setGated] = useState<string | null>(null);

  const byCode = useMemo(() => {
    const map = new Map<string, Prompt[]>();
    for (const p of list.data ?? []) {
      map.set(p.code, [...(map.get(p.code) ?? []), p]);
    }
    return map;
  }, [list.data]);
  const selected = code ?? [...byCode.keys()][0] ?? null;
  const versions = selected ? byCode.get(selected) ?? [] : [];

  const activate = useMutation({
    mutationFn: ({ c, v }: { c: string; v: number }) => prompts.activate(c, v),
    onSuccess: (p) => {
      toast.success(`${p.code} v${p.version} is live`);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'prompts'] });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 422) {
        setGated(e.message);
      } else {
        toast.error('Not activated', e);
      }
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prompts"
        subtitle="What the AI is asked, versioned. Postings and resumes go inside tags marked as untrusted data, and every answer must match the version's JSON Schema."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding({ code: '' })}>New prompt</Button>}
      />
      {gated && (
        <Notice tone="amber" icon={<FlaskConical className="h-4 w-4" />}>
          {gated}{' '}
          <Link to="/admin/ai/evals" className="font-medium underline">Open evals</Link>
          <button type="button" className="ml-3 text-xs underline" onClick={() => setGated(null)}>dismiss</button>
        </Notice>
      )}
      {list.error ? <ErrorBox error={list.error} /> : null}
      {list.isLoading ? (
        <Spinner />
      ) : byCode.size === 0 ? (
        <EmptyState title="No prompts" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-4">
          <Card padded={false} className="lg:col-span-1">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...byCode.entries()].map(([c, vs]) => {
                const active = vs.find((v) => v.active);
                return (
                  <li key={c}>
                    <button type="button" onClick={() => setCode(c)}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selected === c ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}>
                      <div className="font-mono text-sm font-medium">{c}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        live v{active?.version ?? '–'} · {vs.length} versions {vs[0]?.evalGated && <Badge tone="violet">eval-gated</Badge>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="space-y-3 lg:col-span-3">
            {selected && (
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-lg font-semibold">{selected}</h2>
                <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAdding({ code: selected, from: versions.find((v) => v.active) ?? versions[0] })}>
                  New version
                </Button>
              </div>
            )}
            {versions.map((v) => (
              <Card
                key={v.version}
                title={
                  <span className="flex items-center gap-2">
                    v{v.version}
                    {v.active && <Badge tone="green"><CheckCircle2 className="h-3 w-3" /> live</Badge>}
                    {!v.active && v.activatedAt && <Badge>was live</Badge>}
                    <span className="text-xs font-normal text-slate-500">created {dateTime(v.createdAt)}</span>
                  </span>
                }
                actions={
                  !v.active && (
                    <Button size="sm" variant={v.activatedAt ? 'secondary' : 'primary'} loading={activate.isPending && activate.variables?.v === v.version}
                      onClick={() => activate.mutate({ c: v.code, v: v.version })}>
                      {v.activatedAt ? 'Roll back to this' : 'Make live'}
                    </Button>
                  )
                }
              >
                <details open={v.active}>
                  <summary className="cursor-pointer text-sm text-slate-500">Show the prompt</summary>
                  <div className="mt-3 space-y-3">
                    {v.system && (
                      <div>
                        <div className="mb-1 text-xs font-semibold uppercase text-slate-500">System</div>
                        <div className="prose-letter rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">{v.system}</div>
                      </div>
                    )}
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Template</div>
                      <div className="prose-letter rounded-lg bg-slate-50 p-3 font-mono text-xs dark:bg-slate-800/50">{v.template}</div>
                    </div>
                    {v.outputSchema && (
                      <div>
                        <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Answer schema</div>
                        <JsonView value={v.outputSchema} maxHeight="14rem" />
                      </div>
                    )}
                  </div>
                </details>
              </Card>
            ))}
          </div>
        </div>
      )}
      {adding && (
        <VersionForm initial={adding} onClose={() => setAdding(null)}
          onSaved={(p) => {
            setAdding(null);
            setCode(p.code);
            toast.success(`${p.code} v${p.version} saved`, p.active ? 'It is live (first version).' : 'Saved switched off; make it live when ready.');
            void queryClient.invalidateQueries({ queryKey: ['admin', 'prompts'] });
          }} />
      )}
    </div>
  );
}

function VersionForm({ initial, onClose, onSaved }: { initial: { code: string; from?: Prompt }; onClose: () => void; onSaved: (p: Prompt) => void }) {
  const [code, setCode] = useState(initial.code);
  const [system, setSystem] = useState(initial.from?.system ?? '');
  const [template, setTemplate] = useState(initial.from?.template ?? '');
  const [schema, setSchema] = useState(initial.from?.outputSchema ? JSON.stringify(JSON.parse(initial.from.outputSchema), null, 2) : '');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => {
      let outputSchema: Record<string, Json> | undefined;
      if (schema.trim()) {
        outputSchema = JSON.parse(schema) as Record<string, Json>;
      }
      return prompts.addVersion(code.trim(), { system: system || undefined, template, outputSchema });
    },
    onSuccess: onSaved,
  });
  const err = save.error instanceof ApiError ? save.error : save.error;
  const variables = [...new Set([...template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*}}/g)].map((m) => m[1]))];

  return (
    <Modal open wide onClose={onClose} title={initial.code ? `New version of ${initial.code}` : 'New prompt'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} disabled={!code.trim() || !template.trim()}
            onClick={() => {
              try {
                if (schema.trim()) JSON.parse(schema);
                setSchemaError(null);
                save.mutate();
              } catch (e) {
                setSchemaError((e as Error).message);
              }
            }}>
            Save version
          </Button>
        </>
      }>
      <div className="space-y-4">
        {err ? <ErrorBox error={err} /> : null}
        {!initial.code && (
          <Field label="Code" hint="lowercase letters, digits and dashes">
            <Input value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
        )}
        <Field label="System">
          <Textarea rows={4} value={system} onChange={(e) => setSystem(e.target.value)} />
        </Field>
        <Field label="Template" hint={variables.length ? `Variables: ${variables.map((v) => `{{${v}}}`).join(', ')}` : 'Use {{name}} for variables.'}>
          <Textarea rows={8} className="font-mono text-xs" value={template} onChange={(e) => setTemplate(e.target.value)} />
        </Field>
        <Field label="Answer JSON Schema (optional)" error={schemaError ?? undefined}>
          <Textarea rows={10} className="font-mono text-xs" value={schema} onChange={(e) => setSchema(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
