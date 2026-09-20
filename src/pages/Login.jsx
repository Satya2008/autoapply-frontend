import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bot, Radar, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { errorMessage } from '../services/api'
import { Button, Field } from '../components/ui'

const highlights = [
  {
    icon: Radar,
    title: 'Every board, one pool',
    body: 'Pull roles from any job API. New sources are added from the dashboard, never in code.',
  },
  {
    icon: Bot,
    title: 'Scored by AI you choose',
    body: 'Gemini, OpenAI, Claude or a local model. Swap providers with a single setting.',
  },
  {
    icon: Zap,
    title: 'Applies while you sleep',
    body: 'Paced like a human, capped daily, and every attempt is logged for you to review.',
  },
]

export default function Login() {
  const navigate = useNavigate()
  const { config, signIn, signUp, toast } = useApp()
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const profile =
        mode === 'login'
          ? await signIn({ email: form.email, password: form.password })
          : await signUp(form)
      toast(`Welcome${profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}`, 'success')
      navigate(profile?.role === 'USER' ? '/dashboard' : '/admin')
    } catch (error) {
      toast(errorMessage(error, 'Could not sign you in'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="aurora" />

      {/* ------------------------------------------------------ narrative */}
      <div className="relative z-10 hidden flex-1 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))',
              boxShadow: '0 10px 28px -12px rgb(var(--glow))',
            }}
          >
            <Radar size={20} className="text-white" />
          </div>
          <span className="text-lg font-semibold">{config.appName || 'AutoApply AI'}</span>
        </div>

        <div className="max-w-lg">
          <div className="chip chip-accent mb-6">
            <Sparkles size={12} />
            Job hunting, on autopilot
          </div>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">
            Stop applying.
            <br />
            <span className="gradient-text">Start interviewing.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
            One system that watches every job board, scores each opening against your real
            profile, and submits the applications worth your time.
          </p>

          <div className="mt-10 space-y-5">
            {highlights.map((item) => (
              <div key={item.title} className="flex gap-3.5">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: 'rgb(var(--accent) / 0.12)',
                    border: '1px solid rgb(var(--accent) / 0.22)',
                  }}
                >
                  <item.icon size={16} style={{ color: 'rgb(var(--accent))' }} />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs" style={{ color: 'rgb(var(--text-dim))' }}>
          <ShieldCheck size={13} />
          Your credentials and API keys are encrypted at rest.
        </p>
      </div>

      {/* ---------------------------------------------------------- form */}
      <div className="relative z-10 flex w-full items-center justify-center p-6 lg:w-[480px] lg:border-l"
           style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(20px)' }}>
        <div className="w-full max-w-sm animate-in">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))' }}
              >
                <Radar size={20} className="text-white" />
              </div>
              <span className="text-lg font-semibold">{config.appName || 'AutoApply AI'}</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            {mode === 'login'
              ? 'Sign in to pick up where your search left off.'
              : 'A profile takes a minute. The applications take care of themselves.'}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'register' && (
              <Field label="Full name">
                <input
                  className="input"
                  required
                  value={form.fullName}
                  onChange={set('fullName')}
                  placeholder="Satyanand Shrivastava"
                />
              </Field>
            )}

            <Field label="Email">
              <input
                className="input"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
              />
            </Field>

            <Field
              label="Password"
              hint={
                mode === 'register' && config.passwordMinLength
                  ? `At least ${config.passwordMinLength} characters`
                  : undefined
              }
            >
              <input
                className="input"
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
              />
            </Field>

            <Button type="submit" loading={busy} className="w-full" icon={ArrowRight}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          {config.registrationEnabled !== false && (
            <p className="mt-6 text-center text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="font-medium transition-opacity hover:opacity-80"
                style={{ color: 'rgb(var(--accent))' }}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          )}

          {config.maintenanceMode && (
            <div
              className="mt-6 rounded-xl px-3.5 py-3 text-xs"
              style={{
                background: 'rgb(var(--warning) / 0.1)',
                border: '1px solid rgb(var(--warning) / 0.3)',
                color: 'rgb(var(--warning))',
              }}
            >
              {config.maintenanceMessage || 'The system is under maintenance.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
