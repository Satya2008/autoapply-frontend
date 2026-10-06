import { ScrollText } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { audit } from '@/api/endpoints';
import { useDebounced, useStoredState } from '@/app/hooks';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, PageHeader, Spinner, Table, Td } from '@/components/ui/primitives';
import { dateTime, timeAgo } from '@/lib/format';

interface Filters {
  actor: string;
  action: string;
  targetType: string;
}

/** Who changed what, from where, and whether it worked. Secret values never appear here. */
export default function AuditPage() {
  const [filters, setFilters] = useStoredState<Filters>('audit.filters', { actor: '', action: '', targetType: '' });
  const settled = useDebounced(filters);
  const list = useInfiniteQuery({
    queryKey: ['admin', 'audit', settled],
    queryFn: ({ pageParam }) => audit.list({ actor: settled.actor || undefined, action: settled.action || undefined, targetType: settled.targetType || undefined }, pageParam, 50),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader icon={<ScrollText />} title="Audit log" subtitle="Every admin change: settings, portals, storage moves, scheduler runs." />
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Actor (user id)"><Input value={filters.actor} onChange={(e) => setFilters({ ...filters, actor: e.target.value })} /></Field>
          <Field label="Action"><Input value={filters.action} placeholder="setting.update" onChange={(e) => setFilters({ ...filters, action: e.target.value })} /></Field>
          <Field label="Target type"><Input value={filters.targetType} placeholder="setting" onChange={(e) => setFilters({ ...filters, targetType: e.target.value })} /></Field>
        </div>
      </Card>
      {list.error ? <ErrorBox error={list.error} /> : null}
      {list.isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing recorded" />
      ) : (
        <Card padded={false}>
          <Table head={['When', 'Actor', 'Action', 'Target', 'Detail', 'From', 'Result']}>
            {items.map((e) => (
              <tr key={e.id}>
                <Td className="whitespace-nowrap" title={dateTime(e.at)}>{timeAgo(e.at)}</Td>
                <Td className="max-w-[10rem] truncate font-mono text-xs" title={e.actor ?? ''}>{e.actor ?? 'system'}</Td>
                <Td className="font-mono text-xs">{e.action}</Td>
                <Td className="text-xs">{e.targetType}{e.targetId ? `: ${e.targetId}` : ''}</Td>
                <Td className="max-w-sm truncate text-xs" title={e.detail ?? ''}>{e.detail}</Td>
                <Td className="text-xs">{e.ip}</Td>
                <Td>{e.success ? <Badge tone="green">ok</Badge> : <Badge tone="red" title={e.error ?? ''}>failed</Badge>}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {list.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>Older entries</Button>
        </div>
      )}
    </div>
  );
}
