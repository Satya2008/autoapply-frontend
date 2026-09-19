import { useState, useEffect } from 'react'
import { applyApi } from '../services/api'
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react'

const statusConfig = {
  APPLIED:   { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  FAILED:    { color: 'bg-red-100 text-red-700', icon: XCircle },
  PENDING:   { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  INTERVIEW: { color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  REJECTED:  { color: 'bg-gray-100 text-gray-600', icon: XCircle },
}

export default function Applications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const userId = localStorage.getItem('userId')

  useEffect(() => { loadApps() }, [])

  const loadApps = async () => {
    try {
      const res = await applyApi.getHistory(userId)
      setApps(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const startAutoApply = async () => {
    setRunning(true)
    try {
      await applyApi.startAutoApply(userId)
      alert('Auto apply started! Check back in a few minutes.')
      setTimeout(loadApps, 5000)
    } catch (e) { console.error(e) }
    finally { setRunning(false) }
  }

  const stats = {
    total: apps.length,
    applied: apps.filter(a => a.status === 'APPLIED').length,
    interview: apps.filter(a => a.status === 'INTERVIEW').length,
    rejected: apps.filter(a => a.status === 'REJECTED').length,
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Applications</h1>
        <button onClick={startAutoApply} disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          <Play size={16} />
          {running ? 'Starting...' : 'Start Auto Apply'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700' },
          { label: 'Applied', value: stats.applied, color: 'bg-green-50 text-green-700' },
          { label: 'Interview', value: stats.interview, color: 'bg-purple-50 text-purple-700' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Job Title', 'Company', 'Portal', 'Status', 'Applied At'].map(h => (
                <th key={h} className="text-left px-6 py-4 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.map(app => {
              const sc = statusConfig[app.status] || statusConfig.PENDING
              return (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{app.jobTitle}</td>
                  <td className="px-6 py-4 text-gray-600">{app.employerName}</td>
                  <td className="px-6 py-4 text-gray-600">{app.portal}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {apps.length === 0 && (
          <div className="text-center py-16 text-gray-400">No applications yet. Run auto apply!</div>
        )}
      </div>
    </div>
  )
}
