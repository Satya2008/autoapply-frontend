import { useState, useEffect } from 'react'
import { jobsApi, matchApi } from '../services/api'
import { Briefcase, MapPin, Building2, ExternalLink, Search, RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fetching, setFetching] = useState(false)
  const userId = localStorage.getItem('userId')

  useEffect(() => { loadJobs() }, [])

  const loadJobs = async () => {
    try {
      const res = await jobsApi.getAll()
      setJobs(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!search.trim()) return loadJobs()
    try {
      const res = await jobsApi.search(search)
      setJobs(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchNewJobs = async () => {
    setFetching(true)
    try {
      await jobsApi.fetchNew('Java Developer in India')
      await loadJobs()
    } catch (e) { console.error(e) }
    finally { setFetching(false) }
  }

  const runMatching = async () => {
    try {
      await matchApi.runMatching(userId)
      alert('Matching complete! Check recommended jobs.')
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading jobs...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Dashboard</h1>
          <p className="text-gray-500">{jobs.length} jobs available</p>
        </div>
        <div className="flex gap-3">
          <button onClick={runMatching}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            Run AI Matching
          </button>
          <button onClick={fetchNewJobs} disabled={fetching}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
            Fetch New Jobs
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs by keyword..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg outline-none focus:border-blue-500" />
        </div>
        <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Search
        </button>
      </form>

      <div className="grid gap-4">
        {jobs.map(job => (
          <div key={job.jobId} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {job.jobPublisher}
                  </span>
                  {job.jobIsRemote && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Remote</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{job.jobTitle}</h3>
                <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
                  <span className="flex items-center gap-1"><Building2 size={14} />{job.employerName}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} />{job.jobCity}, {job.jobCountry}</span>
                </div>
                {job.jobMinSalary && (
                  <p className="text-green-600 text-sm mt-1 font-medium">
                    {job.jobSalaryCurrency} {job.jobMinSalary?.toLocaleString()} - {job.jobMaxSalary?.toLocaleString()} / {job.jobSalaryPeriod}
                  </p>
                )}
              </div>
              <a href={job.jobApplyLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Apply <ExternalLink size={14} />
              </a>
            </div>
            <p className="text-gray-600 text-sm mt-3 line-clamp-2">{job.jobDescription}</p>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
            <p>No jobs found. Click "Fetch New Jobs" to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
