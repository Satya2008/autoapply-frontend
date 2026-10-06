import { Brain, RefreshCw, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ai } from '@/api/endpoints';
import { ConfirmButton } from '@/components/ui/overlays';
import { Badge, Button, Card, ErrorBox, KeyValue, Notice, PageHeader, Spinner, Table, Td } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

export default function SemanticPage() {
  const toast = useToast();
  const status = useQuery({ queryKey: ['admin', 'embeddings'], queryFn: ai.embeddings, refetchInterval: 10_000 });
  const reindex = useMutation({
    mutationFn: ai.reindex,
    onSuccess: () => toast.info('Indexing in the background', 'Watch "Jobs with vectors" grow; it refreshes every 10 seconds.'),
    onError: (e) => toast.error('Not started', e),
  });
  const batch = useMutation({
    mutationFn: ai.runBatch,
    onSuccess: () => toast.info('Nightly batch started', 'Index catch-up, then every active user is rematched.'),
    onError: (e) => toast.error('Not started', e),
  });
  const s = status.data;

  return (
    <div className="space-y-5">
      <PageHeader icon={<Brain />}
        title="Semantic search"
        subtitle="Jobs and profiles as vectors, so “Spring Microservices Engineer” is found for a “Java Backend Developer”. The shortlist merges keyword search and the nearest jobs by meaning (reciprocal rank fusion)."
        actions={
          <>
            <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} loading={reindex.isPending} onClick={() => reindex.mutate()}>
              Embed missing jobs
            </Button>
            <ConfirmButton variant="primary" size="md" icon={<Workflow className="h-4 w-4" />} title="Run the nightly batch now?"
              message="Catches up the vector index, then rematches every user active in the last 30 days. AI reviews are cached, so unchanged matches cost nothing."
              onConfirm={() => batch.mutate()} loading={batch.isPending}>
              Run nightly batch now
            </ConfirmButton>
          </>
        }
      />
      {status.error ? <ErrorBox error={status.error} /> : null}
      {status.isLoading ? (
        <Spinner />
      ) : (
        s && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title={<span className="inline-flex items-center gap-2"><Brain className="h-4 w-4" /> Embedding model</span>}>
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-base font-semibold">{s.currentModel}</span>
                {s.local ? <Badge tone="amber">built-in, free</Badge> : <Badge tone="green">provider</Badge>}
              </div>
              {s.local && (
                <Notice tone="blue">
                  No provider has an embedding model, so the local embedder (word and concept hashing) is used. A hosted model
                  understands much more: set “Embedding model” on a provider in <Link to="/admin/ai/providers" className="underline">AI providers</Link>,
                  then compare with the matcher eval.
                </Notice>
              )}
              <div className="mt-3">
                <KeyValue
                  items={[
                    ['Jobs with vectors (this model)', s.jobsWithVectors],
                    ['In this instance’s index', `${s.indexSize} · ${s.indexModel ?? 'not loaded yet'}`],
                  ]}
                />
              </div>
            </Card>
            <Card title="Stored vectors by model">
              <Table head={['Model', 'Jobs']}>
                {Object.entries(s.storedByModel).map(([model, count]) => (
                  <tr key={model}>
                    <Td className="font-mono text-xs">
                      {model} {model === s.currentModel && <Badge tone="green">current</Badge>}
                    </Td>
                    <Td className="tabular-nums">{count}</Td>
                  </tr>
                ))}
              </Table>
              <p className="mt-3 text-xs text-slate-500">
                Vectors of different models are never compared: switching models starts a new index, and old vectors stay for switching back.
              </p>
            </Card>
          </div>
        )
      )}
    </div>
  );
}
