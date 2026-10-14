import { Briefcase, Clock, MapPin, Search, Sparkles, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { jobs } from '@/api/endpoints';
import type { JobSearch } from '@/api/types';
import { useDebounced, useStoredState } from '@/app/hooks';
import { ApplyLink, CompanyAvatar } from '@/components/domain';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { ChipsInput } from '@/components/ui/editors';
import { Drawer } from '@/components/ui/overlays';
import { Badge, Button, Card, CONTROL, EmptyState, ErrorBox, KeyValue, PageHeader, Select, Skeleton, SkeletonList, Spinner } from '@/components/ui/primitives';
import { dateTime, salary, timeAgo } from '@/lib/format';
import { REGIONS } from './admin/sourceTemplates';

export default function JobsPage() {
  const [filters, setFilters] = useStoredState<JobSearch>('jobs.filters', { postedWithinDays: 30 });
  const [selected, setSelected] = useState<string | null>(null);
  const settled = useDebounced(filters);

  const list = useInfiniteQuery({
    queryKey: ['jobs', settled],
    queryFn: ({ pageParam }) => jobs.search(settled, pageParam, 20),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const set = (patch: Partial<JobSearch>) => setFilters({ ...filters, ...patch });
  // the search box holds keywords as chips; the API reads them comma-separated
  const keywords = (filters.q ?? '').split(',').map((k) => k.trim()).filter(Boolean);
  const POSTED: Record<number, string> = { 1: 'the last 24 hours', 7: 'the last 7 days', 30: 'the last 30 days', 90: 'the last 90 days' };
  // what narrows the list, so an empty result can say what to loosen
  const narrowing = [
    filters.postedWithinDays ? `posted in ${POSTED[filters.postedWithinDays] ?? `${filters.postedWithinDays} days`}` : null,
    filters.location ? `in ${filters.location}` : null,
    filters.region ? (REGIONS.find((r) => r.code === filters.region)?.label ?? filters.region) : null,
    filters.remote === true ? 'remote only' : filters.remote === false ? 'on-site only' : null,
    keywords.length ? `matching ${keywords.join(' or ')}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <PageHeader icon={<Briefcase />} title="Jobs" subtitle="Every active job from the boards, newest first. Search finds words in the title, company and description." />

      <div className="relative z-20 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-card dark:border-white/[0.06] dark:bg-ink-900">
        <ChipsInput
          ariaLabel="Search jobs"
          suggest={jobs.suggestKeywords}
          suggestKey="keywords"
          addOnBlur={false}
          max={10}
          icon={<Search className="ml-1.5 h-5 w-5" />}
          className="flex min-h-[3rem] flex-wrap items-center gap-1.5 rounded-xl bg-slate-50 px-2 py-1.5 ring-1 ring-inset ring-transparent transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500 dark:bg-white/[0.03]"
          placeholder={keywords.length ? 'Add another keyword…' : 'Type a keyword and press Enter: java, spring boot…'}
          value={keywords}
          onChange={(v) => set({ q: v.length ? v.join(', ') : undefined })}
        />
        {keywords.length > 1 && <p className="mt-1.5 px-1 text-xs text-slate-500">Showing jobs that match any of these keywords.</p>}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Select aria-label="Sort by" value={filters.sort ?? 'NEWEST'} onChange={(e) => set({ sort: e.target.value as JobSearch['sort'] })}>
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
            <option value="SALARY">Highest salary</option>
          </Select>
          <Select aria-label="Region" value={filters.region ?? ''} onChange={(e) => set({ region: e.target.value || undefined, source: undefined })}>
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </Select>
          <Autocomplete
            ariaLabel="Location"
            queryKey="locations"
            fetch={jobs.suggestLocations}
            icon={<MapPin className="h-4 w-4" />}
            inputClassName={`${CONTROL} pl-9`}
            placeholder="City, state, India, Remote…"
            value={filters.location ?? ''}
            onChange={(location) => set({ location })}
          />
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
          <EmptyState
            title="No jobs found"
            icon={<Briefcase />}
            action={
              narrowing.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {filters.postedWithinDays && filters.postedWithinDays < 90 && (
                    <Button variant="secondary" size="sm" onClick={() => set({ postedWithinDays: undefined })}>
                      Any time
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => setFilters({})}>
                    Clear all filters
                  </Button>
                </div>
              )
            }
          >
            {narrowing.length ? (
              <>
                No job is <b>{narrowing.join(', ')}</b>. Loosen one of these.
              </>
            ) : (
              'No jobs yet. New jobs arrive every few hours; check back soon.'
            )}
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
          ) : null}
          <div>
            <div className="mb-2 text-sm font-semibold">Description</div>
            <div className="prose-letter text-sm text-slate-700 dark:text-slate-300">{j.description || 'No description.'}</div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
