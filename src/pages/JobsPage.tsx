import { MapPin, Search, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { jobs, jobSources } from '@/api/endpoints';
import type { JobSearch } from '@/api/types';
import { useDebounced, useStoredState } from '@/app/hooks';
import { ApplyLink } from '@/components/domain';
import { Drawer } from '@/components/ui/overlays';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, KeyValue, PageHeader, Select, Spinner } from '@/components/ui/primitives';
import { dateTime, humanize, salary, timeAgo } from '@/lib/format';

export default function JobsPage() {
  const [filters, setFilters] = useStoredState<JobSearch>('jobs.filters', { postedWithinDays: 30 });
  const [selected, setSelected] = useState<string | null>(null);
  const settled = useDebounced(filters);
  const sources = useQuery({ queryKey: ['job-sources'], queryFn: jobSources.list, staleTime: 300_000 });

  const list = useInfiniteQuery({
    queryKey: ['jobs', settled],
    queryFn: ({ pageParam }) => jobs.search(settled, pageParam, 20),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const set = (patch: Partial<JobSearch>) => setFilters({ ...filters, ...patch });

  return (
    <div className="space-y-5">
      <PageHeader title="Jobs" subtitle="Every active job from the boards, newest first; search finds words in title, company and description." />

      <Card>
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Search" className="md:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="java, react, data engineer…" value={filters.q ?? ''} onChange={(e) => set({ q: e.target.value })} />
            </div>
          </Field>
          <Field label="Location">
            <Input placeholder="Pune, Berlin…" value={filters.location ?? ''} onChange={(e) => set({ location: e.target.value })} />
          </Field>
          <Field label="Remote">
            <Select
              value={filters.remote === undefined ? '' : String(filters.remote)}
              onChange={(e) => set({ remote: e.target.value === '' ? undefined : e.target.value === 'true' })}
            >
              <option value="">Any</option>
              <option value="true">Remote only</option>
              <option value="false">On-site only</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Posted within">
              <Select value={filters.postedWithinDays ?? ''} onChange={(e) => set({ postedWithinDays: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">Any time</option>
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </Select>
            </Field>
            <Field label="Board">
              <Select value={filters.source ?? ''} onChange={(e) => set({ source: e.target.value || undefined })}>
                <option value="">All</option>
                {sources.data?.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Card>

      {list.error ? <ErrorBox error={list.error} onRetry={() => list.refetch()} /> : null}
      {list.isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No jobs found">Try fewer words, or ask an admin to fetch jobs (Admin → Fetch runs).</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelected(job.id)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300 hover:shadow dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{job.title}</div>
                  <div className="truncate text-sm text-slate-500">{job.company}</div>
                </div>
                <Badge>{job.sourceCode}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                )}
                {job.remote && (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <Wifi className="h-3 w-3" /> Remote
                  </span>
                )}
                {salary(job.salaryMin, job.salaryMax, job.currency) && <span>{salary(job.salaryMin, job.salaryMax, job.currency)}</span>}
                <span>{timeAgo(job.postedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {list.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
            Load more
          </Button>
        </div>
      )}

      <JobDrawer id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export function JobDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const job = useQuery({ queryKey: ['job', id], queryFn: () => jobs.get(id as string), enabled: !!id });
  const j = job.data;
  const r = j?.requirements;
  return (
    <Drawer open={!!id} onClose={onClose} title={j ? j.title : 'Job'} actions={j && <ApplyLink url={j.applyUrl} />}>
      {job.isLoading && <Spinner />}
      {job.error ? <ErrorBox error={job.error} /> : null}
      {j && (
        <div className="space-y-5">
          <KeyValue
            items={[
              ['Company', j.company],
              ['Location', j.location],
              ['Remote', j.remote ? 'Yes' : 'No'],
              ['Salary', salary(j.salaryMin, j.salaryMax, j.currency)],
              ['Posted', dateTime(j.postedAt)],
              ['Board', j.sourceCode],
              ['Status', humanize(j.status)],
              ['Last seen on the board', timeAgo(j.lastSeenAt)],
            ]}
          />
          {r ? (
            <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900 dark:bg-violet-950/30">
              <div className="mb-2 text-sm font-semibold text-violet-800 dark:text-violet-200">What the job asks for (read by AI)</div>
              {r.summary && <p className="mb-2 text-sm">{r.summary}</p>}
              <div className="flex flex-wrap gap-1">
                {r.requiredSkills?.map((s) => (
                  <Badge key={s} tone="violet">
                    {s}
                  </Badge>
                ))}
                {r.niceToHaveSkills?.map((s) => (
                  <Badge key={s} tone="slate" title="Nice to have">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                {r.minYearsExperience !== undefined && <span>Min {r.minYearsExperience} years</span>}
                {r.seniority && <span>Seniority: {r.seniority}</span>}
                {r.workMode && <span>Work mode: {r.workMode}</span>}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Not read by AI yet: requirements appear once the job is parsed.</p>
          )}
          <div>
            <div className="mb-2 text-sm font-semibold">Description</div>
            <div className="prose-letter text-sm text-slate-700 dark:text-slate-300">{j.description || 'No description.'}</div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
