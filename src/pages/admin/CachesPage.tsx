import { Eraser } from 'lucide-react';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { platform } from '@/api/endpoints';
import type { ServiceName } from '@/api/types';
import { ConfirmButton } from '@/components/ui/overlays';
import { Card, EmptyState, ErrorBox, PageHeader, Spinner, Table, Td } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { percent } from '@/lib/format';

const SERVICES: ServiceName[] = ['core-api', 'job-service', 'matching-service'];

/** Two-level caches (memory, then Redis) per service, with hit rates; clearing one clears it on every instance. */
export default function CachesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const caches = useQueries({
    queries: SERVICES.map((s) => ({ queryKey: ['admin', 'caches', s], queryFn: () => platform.caches(s), refetchInterval: 10_000 })),
  });
  const clear = useMutation({
    mutationFn: ({ service, name }: { service: ServiceName; name: string }) => platform.clearCache(service, name),
    onSuccess: (_, v) => {
      toast.success(`${v.name} cleared`, 'On every instance.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'caches', v.service] });
    },
    onError: (e) => toast.error('Not cleared', e),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Caches" subtitle="Memory first (seconds), then Redis (minutes), then the database. Hit ratio counts both levels." />
      {SERVICES.map((service, i) => {
        const q = caches[i];
        return (
          <Card key={service} title={service} padded={false}>
            {q.error ? (
              <div className="p-4"><ErrorBox error={q.error} /></div>
            ) : q.isLoading ? (
              <Spinner />
            ) : !q.data?.length ? (
              <EmptyState title="No caches in this service" />
            ) : (
              <Table head={['Cache', 'Hit ratio', 'Memory hits', 'Redis hits', 'Misses', 'Loads', 'Waited on a load', 'Errors', 'Avg load', 'In memory', 'TTL', '']}>
                {q.data.map((c) => (
                  <tr key={c.name}>
                    <Td className="font-mono text-xs font-medium">{c.name}</Td>
                    <Td className="font-semibold">{percent(c.hitRatio, 1)}</Td>
                    <Td>{c.localHits}</Td>
                    <Td>{c.sharedHits}</Td>
                    <Td>{c.misses}</Td>
                    <Td>{c.loads}</Td>
                    <Td title="Requests that waited for another one's load instead of hitting the database too">{c.waits}</Td>
                    <Td className={c.errors ? 'text-rose-600' : ''}>{c.errors}</Td>
                    <Td>{c.averageLoadMillis.toFixed(1)} ms</Td>
                    <Td>{c.localSize}</Td>
                    <Td className="whitespace-nowrap text-xs">{c.localTtl} / {c.sharedTtl}</Td>
                    <Td>
                      <ConfirmButton variant="ghost" icon={<Eraser className="h-3.5 w-3.5" />} title={`Clear ${c.name}?`} message="The next reads go to the database." onConfirm={() => clear.mutate({ service, name: c.name })}>
                        Clear
                      </ConfirmButton>
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        );
      })}
    </div>
  );
}
