import { ArrowRight, Brain, ShieldCheck, Target } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ApiError } from '@/api/client';
import { users } from '@/api/endpoints';
import { RadarMark } from '@/app/AppShell';
import { useSession } from '@/app/session';
import { Button, ErrorBox, Field, Input, Notice } from '@/components/ui/primitives';

const POINTS = [
  { icon: <Target className="h-5 w-5" />, title: 'Matches that explain themselves', text: 'Every score is broken down factor by factor, so you know why a job fits.' },
  { icon: <Brain className="h-5 w-5" />, title: 'AI that sticks to your resume', text: 'Cover letters and screening answers built on what you actually did, with a claim check.' },
  { icon: <ShieldCheck className="h-5 w-5" />, title: 'Safe by default', text: 'Sites that ban automation are never applied to for you. They wait, answers ready to paste.' },
];

/**
 * Sign-in until Phase 8: an email picks the user, and a new email creates one with an empty
 * profile. No password yet, so this runs only against a local backend.
 */
export function SignInPage() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [created, setCreated] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await users.findByEmail(email.trim()).catch(async (err) => {
        if (err instanceof ApiError && err.status === 404) {
          setCreated(true);
          return users.create(email.trim());
        }
        throw err;
      });
      signIn({ id: user.id, email: user.email });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-3xl" />
        <BigRadar />
        <div className="relative flex items-center gap-3">
          <RadarMark size={40} />
          <span className="text-lg font-bold tracking-tight">NaukriRadar</span>
        </div>
        <div className="relative mt-auto max-w-lg">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Find the jobs that fit you.
            <span className="block bg-gradient-to-r from-brand-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">Apply where it’s safe.</span>
          </h1>
          <ul className="mt-10 space-y-6">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-200 ring-1 ring-inset ring-white/10">{p.icon}</span>
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="mt-0.5 text-sm leading-relaxed text-slate-400">{p.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <RadarMark size={40} />
            <span className="text-lg font-bold tracking-tight">NaukriRadar</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in with your email to see your matches.</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Email" hint="A new email creates an account with an empty profile.">
              <Input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            {error ? <ErrorBox error={error} /> : null}
            <Button type="submit" size="lg" loading={busy} className="w-full">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
            {created && !error && <p className="text-center text-xs text-slate-500">Creating your account…</p>}
          </form>
          <div className="mt-8">
            <Notice tone="amber">
              Development sign-in: there is no password until login arrives (Phase 8), so only run this against your own local backend.
            </Notice>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigRadar() {
  return (
    <div className="pointer-events-none absolute -right-48 top-1/2 h-[640px] w-[640px] -translate-y-1/2 opacity-50" aria-hidden="true">
      <svg viewBox="0 0 640 640" className="absolute inset-0">
        {[300, 230, 160, 90].map((r) => (
          <circle key={r} cx="320" cy="320" r={r} fill="none" stroke="white" strokeOpacity="0.1" />
        ))}
        <circle cx="430" cy="210" r="6" fill="#6ee7b7" />
        <circle cx="230" cy="420" r="5" fill="#a5b4fc" />
        <circle cx="480" cy="400" r="4" fill="#fcd34d" />
        <circle cx="260" cy="190" r="3.5" fill="white" fillOpacity="0.6" />
      </svg>
      <div className="absolute inset-0 animate-sweep rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(129,140,248,0.35), transparent 18%)', animationDuration: '7s' }} />
    </div>
  );
}
