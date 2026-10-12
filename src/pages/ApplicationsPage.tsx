import { ClipboardList, Send, Target, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import type { ApplicationStatus } from '@/api/types';
import { APPLICATION_STATUSES } from '@/api/types';
import { useStoredState } from '@/app/hooks';
import { CompanyAvatar, RiskBadge, ScoreRing, STATUS_TEXT, StatusBadge } from '@/components/domain';
import { ApplyRunPanel } from '@/components/runs';
import { Button, Card, EmptyState, ErrorBox, PageHeader, Spinner, Table, Td } from '@/components/ui/primitives';
import { timeAgo } from '@/lib/format';

type Filter = ApplicationStatus | 'ALL';

// Only jobs actually applied to live here; the ones still being prepared stay under Matches.
const APPLIED_STATUSES: ApplicationStatus[] = ['SUBMITTED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

export default function ApplicationsPage() {
  const [filter, setFilter] = useStoredState<Filter>('applications.filter', 'ALL');
  const stats = useQuery({ queryKey: ['applications', 'stats'], queryFn: applications.stats });
  const list = useInfiniteQuery({
    queryKey: ['applications', 'list', filter],
    // 'ALL' means every applied status; a specific chip narrows to that one.
    queryFn: ({ pageParam }) => applications.list(filter === 'ALL' ? undefined : filter, pageParam, 25, filter === 'ALL'),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const counts = stats.data?.byStatus ?? {};
  const appliedTotal = APPLIED_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const statuses = APPLICATION_STATUSES.filter((s) => APPLIED_STATUSES.includes(s) && ((counts[s] ?? 0) > 0 || s === filter));

  return (
    <div className="space-y-5">
      <PageHeader icon={<ClipboardList />} title="Applications" subtitle="Jobs you've applied to, and where each one stands. Jobs still being prepared stay under Matches until you apply." />

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Step n={1} icon={<Target />} title="Pick from your matches">
            “Apply to my matches” takes your matches that score at least your minimum (Profile), up to your daily limit.
          </Step>
          <Step n={2} icon={<Send />} title="Filled for you, you press Submit">
            In{' '}
            <Link to="/matches" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
              Matches
            </Link>{' '}
            press “Fill for me”: we fill the form in Chrome and you only check it and press Submit. On LinkedIn and Naukri you apply yourself, with your answers ready to copy.
          </Step>
          <Step n={3} icon={<TrendingUp />} title="Tracked here once applied">
            When you apply, the job moves out of Matches and lands here. Move it on: Applied → Interview → Offer. Open any row for the cover letter and its history.
          </Step>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/5">
          <ApplyRunPanel />
        </div>
      </Card>

      {appliedTotal > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')} label="All" count={appliedTotal} />
          {statuses.map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={STATUS_TEXT[s].label} title={STATUS_TEXT[s].hint} count={counts[s] ?? 0} />
          ))}
        </div>
      )}

      {list.error ? <ErrorBox error={list.error} onRetry={() => list.refetch()} /> : null}
      {list.isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={filter === 'ALL' ? 'Nothing applied yet' : `Nothing is “${STATUS_TEXT[filter].label}”`} icon={<ClipboardList />}>
            {filter === 'ALL' ? 'Apply from your Matches — auto-apply on safe sites, or “Fill for me” elsewhere. Applied jobs show up here.' : STATUS_TEXT[filter].hint}
          </EmptyState>
        </Card>
      ) : (
        <Card padded={false}>
          <Table head={['Job', 'Status', 'How', 'Match', 'Updated']}>
            {items.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <Td>
                  <Link to={`/applications/${a.id}`} className="group flex items-center gap-3" title={a.title}>
                    <CompanyAvatar name={a.company} size={36} />
                    <div className="min-w-0 max-w-[16rem] lg:max-w-[24rem]">
                      <div className="truncate font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">{a.title}</div>
                      <div className="truncate text-xs text-slate-500">
                        {a.company}
                        {a.location ? ` · ${a.location}` : ''}
                      </div>
                    </div>
                  </Link>
                </Td>
                <Td>
                  <StatusBadge status={a.status} />
                </Td>
                <Td>
                  <RiskBadge risk={a.riskBand} />
                </Td>
                <Td><ScoreRing score={a.matchScore} size={34} /></Td>
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

function Step({ n, icon, title, children }: { n: number; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-md [&>svg]:h-5 [&>svg]:w-5">
        {icon}
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-900 shadow ring-1 ring-slate-100">
          {n}
        </span>
      </span>
      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-white">{title}</div>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{children}</p>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, count, title }: { active: boolean; onClick: () => void; label: string; count?: number; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={
        active
          ? 'rounded-lg bg-ink-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-ink-900'
          : 'rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10'
      }
    >
      {label}
      {count !== undefined && <span className="ml-1.5 tabular-nums opacity-75">{count}</span>}
    </button>
  );
}
