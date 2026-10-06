import { ArrowDown, ArrowUp, Cpu, FlaskConical, KeyRound, ListRestart, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { ai } from '@/api/endpoints';
import type { AiProvider, AiProviderCreate, AiProviderType, AiProviderTypeInfo, AiTestResult } from '@/api/types';
import { JsonView } from '@/components/ui/editors';
import { ConfirmButton, Modal } from '@/components/ui/overlays';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, KeyValue, Notice, PageHeader, Select, Spinner, Toggle } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { usd } from '@/lib/format';

/**
 * Every AI vendor is a row an admin manages here: add any provider with its key and models,
 * pick the primary, set the fallback order. Nothing in the code names a vendor or a model.
 */
export default function AiProvidersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const providers = useQuery({ queryKey: ['admin', 'ai-providers'], queryFn: ai.providers });
  const types = useQuery({ queryKey: ['admin', 'ai-types'], queryFn: ai.types, staleTime: Infinity });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AiProvider | null>(null);
  const [testing, setTesting] = useState<AiProvider | 'router' | null>(null);

  const set = (list: AiProvider[]) => queryClient.setQueryData(['admin', 'ai-providers'], list);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'ai-providers'] });
  const primary = useMutation({ mutationFn: ai.makePrimary, onSuccess: set, onError: (e) => toast.error('Not changed', e) });
  const reorder = useMutation({ mutationFn: ai.reorder, onSuccess: set, onError: (e) => toast.error('Not reordered', e) });
  const toggle = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) => ai.update(name, { enabled }),
    onSuccess: refresh,
    onError: (e) => toast.error('Not changed', e),
  });
  const remove = useMutation({ mutationFn: ai.remove, onSuccess: () => (toast.success('Provider removed'), refresh()), onError: (e) => toast.error('Not removed', e) });

  const list = providers.data ?? [];
  const move = (index: number, delta: number) => {
    const names = list.map((p) => p.name);
    const [item] = names.splice(index, 1);
    names.splice(index + delta, 0, item);
    reorder.mutate(names);
  };
  const embedder = list.find((p) => p.ready && p.embeddingModel);

  return (
    <div className="space-y-5">
      <PageHeader icon={<Cpu />}
        title="AI providers"
        subtitle="Calls go to the primary first; if it fails, is out of circuit or answers in the wrong shape, the next one in this order is tried. A change applies on the very next AI call, on every instance."
        actions={
          <>
            <Button variant="secondary" icon={<FlaskConical className="h-4 w-4" />} onClick={() => setTesting('router')}>Test the chain</Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add a provider</Button>
          </>
        }
      />
      <Notice tone="blue">
        Semantic matching uses {embedder ? <b>{embedder.name} · {embedder.embeddingModel}</b> : <b>the built-in local embedder</b>}
        {embedder ? '' : ' (free, no key)'}: the first ready provider with an embedding model. Set one on any OpenAI-compatible, Gemini or Ollama provider.
      </Notice>
      {providers.error ? <ErrorBox error={providers.error} /> : null}
      {providers.isLoading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState title="No AI providers">Without one, the app still works: matching uses local scores and letters are drafts.</EmptyState>
      ) : (
        <div className="space-y-3">
          {list.map((p, i) => (
            <Card key={p.name}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold">{p.name}</span>
                    {p.primary && <Badge tone="blue"><Star className="h-3 w-3" /> primary</Badge>}
                    <Badge>{p.type}</Badge>
                    {p.ready ? <Badge tone="green">ready</Badge> : <Badge tone="amber">{p.enabled ? 'needs a key' : 'off'}</Badge>}
                  </div>
                  <div className="font-mono text-xs text-slate-500">{p.baseUrl}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span>Model <b>{p.model}</b></span>
                    {p.strongModel && <span>Writing <b>{p.strongModel}</b></span>}
                    {p.embeddingModel && <span>Embeddings <b>{p.embeddingModel}</b></span>}
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <KeyRound className="h-3.5 w-3.5" /> {p.apiKeySet ? `key ${p.apiKeyHint ?? 'set'}` : 'no key'}
                    </span>
                    <span className="text-slate-500">timeout {p.timeoutSeconds}s</span>
                    {(p.inputPrice !== null || p.outputPrice !== null) && (
                      <span className="text-slate-500">${p.inputPrice ?? '?'} / ${p.outputPrice ?? '?'} per 1M tokens</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Toggle checked={p.enabled} onChange={(v) => toggle.mutate({ name: p.name, enabled: v })} label="Enabled" />
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button size="sm" variant="ghost" aria-label="Move up" disabled={i === 0 || reorder.isPending} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" aria-label="Move down" disabled={i === list.length - 1 || reorder.isPending} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                    {!p.primary && <Button size="sm" variant="secondary" icon={<Star className="h-3.5 w-3.5" />} onClick={() => primary.mutate(p.name)}>Make primary</Button>}
                    <Button size="sm" variant="secondary" icon={<FlaskConical className="h-3.5 w-3.5" />} onClick={() => setTesting(p)}>Test</Button>
                    <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(p)}>Edit</Button>
                    <ConfirmButton title={`Remove ${p.name}?`} message="Its key is deleted with it." icon={<Trash2 className="h-3.5 w-3.5" />} onConfirm={() => remove.mutate(p.name)}>Remove</ConfirmButton>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {adding && types.data && <ProviderForm types={types.data} onClose={() => setAdding(false)} onSaved={() => (setAdding(false), refresh())} />}
      {editing && types.data && <ProviderForm types={types.data} existing={editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), refresh())} />}
      {testing && <TestModal target={testing} onClose={() => setTesting(null)} />}
    </div>
  );
}

function ProviderForm({ types, existing, onClose, onSaved }: {
  types: AiProviderTypeInfo[];
  existing?: AiProvider;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [type, setType] = useState<AiProviderType>(existing?.type ?? 'OPENAI');
  const info = types.find((t) => t.type === type) as AiProviderTypeInfo;
  const [name, setName] = useState(existing?.name ?? '');
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl ?? '');
  const [apiKey, setApiKey] = useState('');
  const [removeKey, setRemoveKey] = useState(false);
  const [model, setModel] = useState(existing?.model ?? '');
  const [strongModel, setStrongModel] = useState(existing?.strongModel ?? '');
  const [embeddingModel, setEmbeddingModel] = useState(existing?.embeddingModel ?? '');
  const [timeout, setTimeoutSeconds] = useState(existing?.timeoutSeconds ?? 60);
  const [inputPrice, setInputPrice] = useState(existing?.inputPrice?.toString() ?? '');
  const [outputPrice, setOutputPrice] = useState(existing?.outputPrice?.toString() ?? '');
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const models = useMutation({ mutationFn: () => ai.models(existing!.name) });

  const save = useMutation({
    mutationFn: () => {
      const price = (s: string) => (s.trim() === '' ? undefined : Number(s));
      if (existing) {
        return ai.update(existing.name, {
          baseUrl,
          apiKey: removeKey ? '' : apiKey || undefined,
          model,
          strongModel,
          embeddingModel,
          enabled,
          timeoutSeconds: timeout,
          inputPrice: price(inputPrice),
          outputPrice: price(outputPrice),
        });
      }
      const body: AiProviderCreate = {
        name, type, baseUrl: baseUrl || undefined, apiKey: apiKey || undefined, model, strongModel: strongModel || undefined,
        embeddingModel: embeddingModel || undefined, enabled, timeoutSeconds: timeout, inputPrice: price(inputPrice), outputPrice: price(outputPrice),
      };
      return ai.create(body);
    },
    onSuccess: () => (toast.success(existing ? 'Provider saved' : 'Provider added'), onSaved()),
  });
  const err = save.error instanceof ApiError ? save.error : null;
  const modelOptions = models.data ?? [];

  return (
    <Modal open wide onClose={onClose} title={existing ? `Edit ${existing.name}` : 'Add an AI provider'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="space-y-4">
        {err && <ErrorBox error={err} />}
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Type">
            <Select value={type} disabled={!!existing} onChange={(e) => setType(e.target.value as AiProviderType)}>
              {types.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Name" hint="lowercase letters, digits and dashes" error={err?.field('name')}>
            <Input value={name} disabled={!!existing} placeholder="groq, openrouter, my-claude…" onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        {info && <Notice tone="blue">{info.note}</Notice>}
        <Field label="Base URL" hint={`Leave empty for ${info?.defaultBaseUrl}`} error={err?.field('baseUrl')}>
          <Input value={baseUrl} placeholder={info?.defaultBaseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </Field>
        {info?.needsApiKey && (
          <Field label="API key" hint={existing?.apiKeySet ? `A key ending ${existing.apiKeyHint} is set; type a new one to replace it.` : 'Stored encrypted; never shown again.'} error={err?.field('apiKey')}>
            <Input type="password" autoComplete="off" value={apiKey} disabled={removeKey} onChange={(e) => setApiKey(e.target.value)} />
            {existing?.apiKeySet && (
              <label className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <input type="checkbox" checked={removeKey} onChange={(e) => setRemoveKey(e.target.checked)} /> Remove the key
              </label>
            )}
          </Field>
        )}
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Model" hint="Parsing and scoring" error={err?.field('model')}>
            <Input value={model} list="model-options" placeholder={info?.exampleModels[0]} onChange={(e) => setModel(e.target.value)} />
          </Field>
          <Field label="Strong model" hint="Cover letters; optional" error={err?.field('strongModel')}>
            <Input value={strongModel} list="model-options" placeholder={info?.exampleModels[1]} onChange={(e) => setStrongModel(e.target.value)} />
          </Field>
          <Field label="Embedding model" hint={info?.supportsEmbeddings ? 'Semantic matching; optional' : 'This API has no embeddings'} error={err?.field('embeddingModel')}>
            <Input value={embeddingModel} disabled={!info?.supportsEmbeddings} list="embedding-options" placeholder={info?.exampleEmbeddingModels[0]}
              onChange={(e) => setEmbeddingModel(e.target.value)} />
          </Field>
        </div>
        <datalist id="model-options">
          {[...modelOptions, ...(info?.exampleModels ?? [])].map((m) => <option key={m} value={m} />)}
        </datalist>
        <datalist id="embedding-options">
          {[...(info?.exampleEmbeddingModels ?? []), ...modelOptions.filter((m) => m.includes('embed'))].map((m) => <option key={m} value={m} />)}
        </datalist>
        {existing && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" icon={<ListRestart className="h-3.5 w-3.5" />} loading={models.isPending} onClick={() => models.mutate()}>
              Load models from {existing.name}
            </Button>
            {models.data && <span className="text-xs text-slate-500">{models.data.length} models; pick from the model fields.</span>}
            {models.error ? <span className="text-xs text-rose-600">{(models.error as Error).message}</span> : null}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Timeout (seconds)" error={err?.field('timeoutSeconds')}>
            <Input type="number" min={5} max={600} value={timeout} onChange={(e) => setTimeoutSeconds(Number(e.target.value))} />
          </Field>
          <Field label="Input price" hint="USD per million tokens; optional" error={err?.field('inputPrice')}>
            <Input type="number" min={0} step="0.01" value={inputPrice} onChange={(e) => setInputPrice(e.target.value)} />
          </Field>
          <Field label="Output price" hint="USD per million tokens" error={err?.field('outputPrice')}>
            <Input type="number" min={0} step="0.01" value={outputPrice} onChange={(e) => setOutputPrice(e.target.value)} />
          </Field>
        </div>
        <Toggle checked={enabled} onChange={setEnabled} label="Enabled" description="Ready only with a model and, where needed, a key." />
      </div>
    </Modal>
  );
}

function TestModal({ target, onClose }: { target: AiProvider | 'router'; onClose: () => void }) {
  const [topic, setTopic] = useState('job hunting in India');
  const [model, setModel] = useState('');
  const [result, setResult] = useState<AiTestResult | null>(null);
  const test = useMutation({
    mutationFn: () => ai.test(target === 'router' ? { topic } : { provider: target.name, model: model || undefined, topic }),
    onSuccess: setResult,
  });
  return (
    <Modal open onClose={onClose} title={target === 'router' ? 'Test the provider chain' : `Test ${target.name}`}
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button loading={test.isPending} onClick={() => test.mutate()}>Send a tiny prompt</Button></>}>
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          {target === 'router' ? 'Goes to the primary, falling back in order, exactly like real calls.' : 'Only this provider, even if it is switched off: try before enabling.'}
          {' '}It is never answered from the cache and costs a fraction of a cent.
        </p>
        <Field label="Topic">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
        </Field>
        {target !== 'router' && (
          <Field label="Model" hint={`Leave empty for ${target.model}`}>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
        )}
        {test.error ? <ErrorBox error={test.error} /> : null}
        {result && (
          <>
            <KeyValue
              items={[
                ['Answered by', `${result.provider} · ${result.model}`],
                ['Fallbacks', result.fallbacks],
                ['Tokens in / out', `${result.tokensIn} / ${result.tokensOut}`],
                ['Cost', usd(result.costUsd, 6)],
                ['Latency', `${result.latencyMs} ms`],
              ]}
            />
            <JsonView value={result.answer} maxHeight="10rem" />
          </>
        )}
      </div>
    </Modal>
  );
}
