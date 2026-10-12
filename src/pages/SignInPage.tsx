import { ArrowLeft, ArrowRight, Brain, ShieldCheck, Target } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { auth } from '@/api/endpoints';
import { NEW_USER_KEY } from '@/lib/onboarding';
import { RadarMark } from '@/app/AppShell';
import { useSession } from '@/app/session';
import { ErrorBox } from '@/components/ui/primitives';

const POINTS = [
  { icon: <Target className="h-5 w-5" />, tone: 'bg-brand-100 text-brand-700', title: 'Matches that explain themselves', text: 'Every score is broken down factor by factor, so you know why a job fits.' },
  { icon: <Brain className="h-5 w-5" />, tone: 'bg-fuchsia-100 text-fuchsia-700', title: 'AI that sticks to your resume', text: 'Cover letters and screening answers built on what you actually did, with a claim check.' },
  { icon: <ShieldCheck className="h-5 w-5" />, tone: 'bg-emerald-100 text-emerald-700', title: 'Safe by default', text: 'Sites that ban automation are never applied to for you. They wait, answers ready to paste.' },
];

const INPUT =
  'block h-12 w-full rounded-2xl border-0 bg-slate-50 px-4 text-[15px] text-slate-900 ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 hover:ring-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500';

/** Sign in with email and password, or create an account. */
export function SignInPage() {
  const { signIn } = useSession();
  const [mode, setMode] = useState<'signin' | 'signup'>(() => (window.location.pathname.includes('signup') ? 'signup' : 'signin'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = mode === 'signup'
        ? await auth.register(name.trim(), email.trim(), password)
        : await auth.login(email.trim(), password);
      if (mode === 'signup') {
        try {
          localStorage.setItem(NEW_USER_KEY, '1');
        } catch {
          // private window: no setup redirect, the dashboard checklist still shows
        }
      }
      signIn(session);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-white text-slate-900 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-50 via-white to-fuchsia-50 p-12 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-drift rounded-full bg-fuchsia-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 animate-drift rounded-full bg-sky-300/40 blur-3xl" style={{ animationDelay: '-8s' }} />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 animate-drift rounded-full bg-amber-200/50 blur-3xl" style={{ animationDelay: '-14s' }} />
        <span className="pointer-events-none absolute right-24 top-28 h-6 w-6 animate-float rounded-full bg-amber-300" />
        <span className="pointer-events-none absolute bottom-40 left-20 h-4 w-4 animate-float rounded-full bg-emerald-400" style={{ animationDelay: '-2s' }} />
        <span className="pointer-events-none absolute right-40 top-1/2 h-8 w-8 animate-float rounded-full bg-fuchsia-400/70" style={{ animationDelay: '-1s' }} />

        <Link to="/" className="relative flex w-fit items-center gap-3">
          <RadarMark size={40} />
          <span className="text-lg font-extrabold tracking-tight">NaukriRadar</span>
        </Link>
        <div className="relative mt-auto max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-[44px] font-extrabold leading-[1.08] tracking-tight"
          >
            Find the jobs that fit you.
            <span className="block bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Apply where it’s safe.</span>
          </motion.h1>
          <ul className="mt-10 space-y-4">
            {POINTS.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 200, damping: 24 }}
                className="flex gap-4 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/70 backdrop-blur"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${p.tone}`}>{p.icon}</span>
                <div>
                  <div className="font-bold">{p.title}</div>
                  <div className="mt-0.5 text-sm leading-relaxed text-slate-500">{p.text}</div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative flex items-center justify-center p-6 sm:p-12">
        <Link to="/" className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <RadarMark size={40} />
            <span className="text-lg font-extrabold tracking-tight">NaukriRadar</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">{mode === 'signup' ? 'Create your account' : 'Welcome back 👋'}</h2>
          <p className="mt-2 text-slate-500">
            {mode === 'signup' ? 'A minute to set up, then we find the jobs that fit you.' : 'Sign in to see your matches and applications.'}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Your name</span>
                <input required autoFocus maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Asha Rao" className={INPUT} />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
              <input type="email" required autoFocus={mode === 'signin'} autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={INPUT} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password</span>
              <input type="password" required minLength={mode === 'signup' ? 8 : undefined} maxLength={72}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : ''} className={INPUT} />
            </label>
            {error ? <ErrorBox error={error} /> : null}
            <button
              type="submit"
              disabled={busy}
              className="shine group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 bg-[length:200%_100%] bg-left font-bold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.6)] transition-all duration-500 hover:-translate-y-0.5 hover:bg-right disabled:opacity-60"
            >
              {busy ? (mode === 'signup' ? 'Creating…' : 'Signing in…') : mode === 'signup' ? 'Create account' : 'Sign in'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
            <button type="button" className="font-semibold text-brand-600 hover:underline" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); }}>
              {mode === 'signup' ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="mt-4 text-center text-xs text-slate-400">Forgot your password? Ask the admin for a temporary one.</p>
        </motion.div>
      </div>
    </div>
  );
}
