import clsx from 'clsx';
import { Clock, MapPin, Target, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { matches } from '@/api/endpoints';
import { useDebounced, useStoredState } from '@/app/hooks';
import { AiScoreBadge, CompanyAvatar, ScoreRing } from '@/components/domain';
import { MatchRunPanel } from '@/components/runs';
import { Button, Card, EmptyState, ErrorBox, PageHeader, SkeletonList } from '@/components/ui/primitives';
import { timeAgo } from '@/lib/format';

const PRESETS = [
  { value: 0, label: 'All' },
  { value: 45, label: '45+' },
  { value: 60, label: '60+' },
  { value: 70, label: 'Strong · 70+' },
  { value: 85, label: 'Top · 85+' },
];

export default function MatchesPage() {
  const [minScore, setMinScore] = useStoredState('matches.minScore', 0);
  const settled = useDebounced(minScore, 250);
  const list = useInfiniteQuery({
    queryKey: ['matches', 'list', settled],
    queryFn: ({ pageParam }) => matches.list(settled, pageParam, 20),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Target />}
        title="Matches"
        subtitle="Jobs scored against your profile: skills, title, location, salary, experience, recency and closeness in meaning. The best few are also reviewed by AI when it is set up."
      />
      <Card>
        <MatchRunPanel />
      </Card>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-card dark:border-white/[0.06] dark:bg-ink-900">
        <span className="text-sm font-semibold">Minimum score</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setMinScore(p.value)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                minScore === p.value
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <input
            id="min-score"
            aria-label="Minimum score"
            type="range"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-40"
          />
          <span className="w-8 text-right text-sm font-bold tabular-nums">{minScore}</span>
        </div>
      </div>

      {list.error ? <ErrorBox error={list.error} onRetry={() => list.refetch()} /> : null}
      {list.isLoading ? (
        <Card>
          <SkeletonList rows={6} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={minScore > 0 ? 'No matches at this score' : 'No matches yet'} icon={<Target />}>
            {minScore > 0 ? 'Lower the minimum score.' : 'Fill in your profile and skills, then find matches.'}
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Link
              key={m.id}
              to={`/matches/${m.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift dark:border-white/[0.06] dark:bg-ink-900 dark:hover:border-brand-400/30 sm:p-5"
            >
              <CompanyAvatar name={m.company} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">{m.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{m.company}</span>
                  {m.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {m.location}
                    </span>
                  )}
                  {m.remote && (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                      <Wifi className="h-3 w-3" /> Remote
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> posted {timeAgo(m.postedAt)}
                  </span>
                </div>
              </div>
              <AiScoreBadge score={m.aiScore} />
              <ScoreRing score={m.score} size={56} />
            </Link>
          ))}
        </div>
      )}
      {list.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
            Load more matches
          </Button>
        </div>
      )}
    </div>
  );
}
