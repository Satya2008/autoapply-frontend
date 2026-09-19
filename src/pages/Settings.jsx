import { useState, useEffect } from 'react'
import { authApi } from '../services/api'
import api from '../services/api'

export default function Settings() {
  const [settings, setSettings] = useState({ autoApplyEnabled: false, preferredJobType: 'FULLTIME' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    authApi.getProfile().then(res => {
      setSettings({
        autoApplyEnabled: res.data.autoApplyEnabled || false,
        preferredJobType: res.data.preferredJobType || 'FULLTIME',
      })
    })
  }, [])

  const handleSave = async () => {
    try {
      await api.put('/auth/profile', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Auto Apply</h3>
            <p className="text-sm text-gray-500">Automatically apply to matched jobs (max 15/day)</p>
          </div>
          <button onClick={() => setSettings({...settings, autoApplyEnabled: !settings.autoApplyEnabled})}
            className={`relative w-14 h-7 rounded-full transition-colors ${settings.autoApplyEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoApplyEnabled ? 'left-8' : 'left-1'}`} />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Type</label>
          <select value={settings.preferredJobType} onChange={e => setSettings({...settings, preferredJobType: e.target.value})}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500">
            <option value="FULLTIME">Full Time</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="PARTTIME">Part Time</option>
          </select>
        </div>
        <button onClick={handleSave}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
