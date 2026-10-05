import { MapPin, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { matches } from '@/api/endpoints';
import { useDebounced, useStoredState } from '@/app/hooks';
import { AiScoreBadge, ScoreRing } from '@/components/domain';
import { MatchRunPanel } from '@/components/runs';
import { Button, Card, EmptyState, ErrorBox, PageHeader, Spinner } from '@/components/ui/primitives';
import { timeAgo } from '@/lib/format';

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
        title="Matches"
        subtitle="Jobs scored against your profile: skills, title, location, salary, experience, recency and closeness in meaning. The best few are also reviewed by AI when it is set up."
      />
      <Card>
        <MatchRunPanel />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="min-score" className="text-sm font-medium">
          Minimum score
        </label>
        <input
          id="min-score"
          type="range"
          min={0}
          max={100}
          step={5}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="w-56 accent-brand-600"
        />
        <span className="w-10 text-sm tabular-nums">{minScore}</span>
      </div>

      {list.error ? <ErrorBox error={list.error} onRetry={() => list.refetch()} /> : null}
      {list.isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title={minScore > 0 ? 'No matches at this score' : 'No matches yet'}>
          {minScore > 0 ? 'Lower the minimum score.' : 'Fill in your profile and skills, then find matches.'}
        </EmptyState>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((m) => (
              <li key={m.id}>
                <Link to={`/matches/${m.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <ScoreRing score={m.score} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{m.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                      <span>{m.company}</span>
                      {m.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {m.location}
                        </span>
                      )}
                      {m.remote && (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <Wifi className="h-3 w-3" /> Remote
                        </span>
                      )}
                      <span>posted {timeAgo(m.postedAt)}</span>
                    </div>
                  </div>
                  <AiScoreBadge score={m.aiScore} />
                </Link>
              </li>
            ))}
          </ul>
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
