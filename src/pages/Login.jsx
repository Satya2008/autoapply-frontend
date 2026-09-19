import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { Briefcase } from 'lucide-react'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = isLogin
        ? await authApi.login({ email: form.email, password: form.password })
        : await authApi.register(form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userId', res.data.userId)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Briefcase className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-800">AutoApply AI</h1>
        </div>
        <h2 className="text-xl font-semibold text-center mb-6">
          {isLogin ? 'Welcome back!' : 'Create account'}
        </h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Full Name" required
              className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500"
              value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
          )}
          <input type="email" placeholder="Email" required
            className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input type="password" placeholder="Password" required
            className="w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-medium">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}
