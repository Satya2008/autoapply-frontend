import { useState, useEffect } from 'react'
import { authApi } from '../services/api'
import api from '../services/api'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    authApi.getProfile().then(res => { setProfile(res.data); setLoading(false) })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await api.put('/auth/profile', profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading profile...</div>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>
      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={profile?.fullName || ''} onChange={e => setProfile({...profile, fullName: e.target.value})}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
            <input value={profile?.currentRole || ''} onChange={e => setProfile({...profile, currentRole: e.target.value})}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
            <input type="number" value={profile?.experienceYears || ''} onChange={e => setProfile({...profile, experienceYears: e.target.value})}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input value={profile?.location || ''} onChange={e => setProfile({...profile, location: e.target.value})}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
          <input value={profile?.skills?.join(', ') || ''} onChange={e => setProfile({...profile, skills: e.target.value.split(',').map(s => s.trim())})}
            placeholder="Java, Spring Boot, Microservices, PostgreSQL"
            className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Roles (comma separated)</label>
          <input value={profile?.targetRoles?.join(', ') || ''} onChange={e => setProfile({...profile, targetRoles: e.target.value.split(',').map(s => s.trim())})}
            placeholder="Java Developer, Backend Engineer, Spring Boot Developer"
            className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
        </div>
        <button type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
          {saved ? 'Saved!' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
