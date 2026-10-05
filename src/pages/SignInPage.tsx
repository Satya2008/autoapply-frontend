import { Radar } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ApiError } from '@/api/client';
import { users } from '@/api/endpoints';
import { useSession } from '@/app/session';
import { Button, ErrorBox, Field, Input, Notice } from '@/components/ui/primitives';

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Radar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">NaukriRadar</h1>
            <p className="text-sm text-slate-500">Jobs that fit you, applied to where it is safe.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Field label="Email" hint="A new email creates an account with an empty profile.">
            <Input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          {error ? <ErrorBox error={error} /> : null}
          <Button type="submit" loading={busy} className="w-full">
            Continue
          </Button>
          {created && !error && <p className="text-xs text-slate-500">Creating your account…</p>}
          <Notice tone="amber">
            Development sign-in: there is no password until login arrives (Phase 8), so only run this against your
            own local backend.
          </Notice>
        </form>
      </div>
    </div>
  );
}
