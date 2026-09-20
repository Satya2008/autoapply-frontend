import { useCallback, useEffect, useState } from 'react'
import {
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react'
import { errorMessage, jobsApi } from '../services/api'
import { useApp } from '../store/AppContext'
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from '../components/ui'

export default function Jobs() {
  const { toast } = useApp()
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await jobsApi.list({ q: search || undefined, page, size: 18 }))
    } catch (error) {
      toast(errorMessage(error, 'Could not load jobs'), 'error')
    } finally {
      setLoading(false)
    }
  }, [search, page, toast])

  useEffect(() => {
    load()
  }, [load])

  const fetchNew = async () => {
    setFetching(true)
    toast('Fetching from every enabled source…', 'info')
    try {
      const result = await jobsApi.fetchNew()
      toast(`${result.saved} new jobs saved · ${result.skipped} duplicates skipped`, 'success')
      setPage(0)
      await load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        icon={Briefcase}
        title="Job pool"
        subtitle={`${data.totalElements?.toLocaleString() || 0} postings collected from your sources`}
        actions={
          <Button icon={RefreshCw} loading={fetching} onClick={fetchNew}>
            Fetch fresh jobs
          </Button>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setPage(0)
          setSearch(query)
        }}
        className="mb-5 flex gap-2"
      >
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgb(var(--text-dim))' }}
          />
          <input
            className="input pl-9"
            placeholder="Search titles and companies…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" variant="ghost">
          Search
        </Button>
      </form>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : data.content.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="No jobs in the pool"
            description="Fetch from your configured sources to start filling it up."
            action={
              <Button icon={RefreshCw} loading={fetching} onClick={fetchNew}>
                Fetch fresh jobs
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.content.map((job) => (
              <JobCard key={job.jobId} job={job} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="ghost" icon={ChevronLeft} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                Page {page + 1} of {data.totalPages}
              </span>
              <Button
                variant="ghost"
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function JobCard({ job }) {
  return (
    <Card hover className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        {job.employerLogo ? (
          <img
            src={job.employerLogo}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
            style={{ background: 'rgb(var(--surface-2))' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgb(var(--surface-2))' }}
          >
            <Building2 size={16} style={{ color: 'rgb(var(--text-dim))' }} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{job.jobTitle}</h3>
          <p className="mt-0.5 truncate text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            {job.employerName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.jobIsRemote && <Badge tone="accent">Remote</Badge>}
        {job.jobCity && (
          <Badge>
            <MapPin size={10} />
            {job.jobCity}
          </Badge>
        )}
        {job.jobEmploymentType && <Badge>{job.jobEmploymentType}</Badge>}
        {job.sourceCode && <Badge>{job.sourceCode}</Badge>}
      </div>

      {job.jobDescription && (
        <p
          className="mt-3 line-clamp-2 text-xs leading-relaxed"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          {job.jobDescription.replace(/<[^>]*>/g, '').slice(0, 180)}
        </p>
      )}

      {job.jobApplyLink && (
        <a
          href={job.jobApplyLink}
          target="_blank"
          rel="noreferrer"
          className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ color: 'rgb(var(--accent))' }}
        >
          Open posting
          <ExternalLink size={12} />
        </a>
      )}
    </Card>
  )
}
