import { Briefcase, Clock, MapPin, Search, Sparkles, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { jobs, jobSources } from '@/api/endpoints';
import type { JobSearch } from '@/api/types';
import { useDebounced, useStoredState } from '@/app/hooks';
import { ApplyLink, CompanyAvatar } from '@/components/domain';
import { Drawer } from '@/components/ui/overlays';
import { Badge, Button, Card, EmptyState, ErrorBox, Input, KeyValue, PageHeader, Select, Skeleton, SkeletonList, Spinner } from '@/components/ui/primitives';
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
      <PageHeader icon={<Briefcase />} title="Jobs" subtitle="Every active job from the boards, newest first. Search finds words in the title, company and description." />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-card dark:border-white/[0.06] dark:bg-ink-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Search jobs"
            className="h-12 w-full rounded-xl bg-slate-50 pl-12 pr-4 text-[15px] outline-none ring-1 ring-inset ring-transparent transition placeholder:text-slate-400 focus:bg-white focus:ring-brand-500 dark:bg-white/[0.03] dark:focus:bg-transparent"
            placeholder="Search java, react, data engineer…"
            value={filters.q ?? ''}
            onChange={(e) => set({ q: e.target.value })}
          />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input aria-label="Location" className="pl-9" placeholder="Any location" value={filters.location ?? ''} onChange={(e) => set({ location: e.target.value })} />
          </div>
          <Select
            aria-label="Remote"
            value={filters.remote === undefined ? '' : String(filters.remote)}
            onChange={(e) => set({ remote: e.target.value === '' ? undefined : e.target.value === 'true' })}
          >
            <option value="">Remote or on-site</option>
            <option value="true">Remote only</option>
            <option value="false">On-site only</option>
          </Select>
          <Select aria-label="Posted within" value={filters.postedWithinDays ?? ''} onChange={(e) => set({ postedWithinDays: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Posted any time</option>
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
          <Select aria-label="Board" value={filters.source ?? ''} onChange={(e) => set({ source: e.target.value || undefined })}>
            <option value="">All boards</option>
            {sources.data?.map((s) => (
              <option key={s.id} value={s.code}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {list.error ? <ErrorBox error={list.error} onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && items.length > 0 && (
        <div className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{items.length}</span>
          {list.hasNextPage ? '+' : ''} jobs
        </div>
      )}
      {list.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-white/5 dark:bg-ink-900">
              <SkeletonList rows={1} />
              <Skeleton className="mt-4 h-3 w-3/5" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title="No jobs found" icon={<Briefcase />}>
            Try fewer words, or ask an admin to fetch jobs (Admin console → Fetch runs).
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelected(job.id)}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift dark:border-white/[0.06] dark:bg-ink-900 dark:hover:border-brand-400/30"
            >
              <div className="flex items-start gap-3">
                <CompanyAvatar name={job.company} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">{job.title}</div>
                  <div className="truncate text-sm text-slate-500">{job.company}</div>
                </div>
                <Badge>{job.sourceCode}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                {job.location && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                )}
                {job.remote && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Wifi className="h-3 w-3" /> Remote
                  </span>
                )}
                {salary(job.salaryMin, job.salaryMax, job.currency) && (
                  <span className="rounded-md bg-violet-50 px-2 py-1 font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                    {salary(job.salaryMin, job.salaryMax, job.currency)}
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-slate-400">
                  <Clock className="h-3 w-3" /> {timeAgo(job.postedAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      {list.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
            Load more jobs
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
            <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white p-4 dark:border-violet-400/20 dark:from-violet-500/10 dark:to-transparent">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-800 dark:text-violet-200">
                <Sparkles className="h-4 w-4" /> What the job asks for (read by AI)
              </div>
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
