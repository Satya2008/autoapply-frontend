import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import type { ApplicationStatus } from '@/api/types';
import { APPLICATION_STATUSES } from '@/api/types';
import { useStoredState } from '@/app/hooks';
import { RiskBadge, StatusBadge } from '@/components/domain';
import { ApplyRunPanel } from '@/components/runs';
import { Button, Card, EmptyState, ErrorBox, PageHeader, Spinner, Table, Td } from '@/components/ui/primitives';
import { humanize, timeAgo } from '@/lib/format';

type Filter = ApplicationStatus | 'ALL';

export default function ApplicationsPage() {
  const [filter, setFilter] = useStoredState<Filter>('applications.filter', 'ALL');
  const stats = useQuery({ queryKey: ['applications', 'stats'], queryFn: applications.stats });
  const list = useInfiniteQuery({
    queryKey: ['applications', 'list', filter],
    queryFn: ({ pageParam }) => applications.list(filter === 'ALL' ? undefined : filter, pageParam, 25),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const counts = stats.data?.byStatus ?? {};
  const statuses = APPLICATION_STATUSES.filter((s) => (counts[s] ?? 0) > 0 || s === filter);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Applications"
        subtitle="Everything applied to or waiting, with its history. Applications to sites that ban automation are never sent automatically: they wait for you."
      />
      <Card>
        <ApplyRunPanel />
      </Card>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')} label="All" count={stats.data?.total} />
        {statuses.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={humanize(s)} count={counts[s] ?? 0} />
        ))}
      </div>

      {list.error ? <ErrorBox error={list.error} onRetry={() => list.refetch()} /> : null}
      {list.isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No applications here">Run applying from your matches to create some.</EmptyState>
      ) : (
        <Card padded={false}>
          <Table head={['Job', 'Status', 'Risk', 'Score', 'Sent via', 'Updated']}>
            {items.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <Td>
                  <Link to={`/applications/${a.id}`} className="font-medium text-slate-900 hover:text-brand-600 dark:text-white">
                    {a.title}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {a.company}
                    {a.location ? ` · ${a.location}` : ''}
                  </div>
                </Td>
                <Td>
                  <StatusBadge status={a.status} />
                </Td>
                <Td>
                  <RiskBadge risk={a.riskBand} />
                </Td>
                <Td className="tabular-nums">{a.matchScore}</Td>
                <Td>{a.submittedVia ? humanize(a.submittedVia) : '—'}</Td>
                <Td className="whitespace-nowrap text-xs text-slate-500">{timeAgo(a.updatedAt)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {list.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-brand-600 px-3 py-1 text-sm font-medium text-white'
          : 'rounded-full bg-white px-3 py-1 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
      }
    >
      {label}
      {count !== undefined && <span className="ml-1.5 tabular-nums opacity-75">{count}</span>}
    </button>
  );
}
