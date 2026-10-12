import { KeyRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { auth } from '@/api/endpoints';
import { RadarMark } from '@/app/AppShell';
import { useSession } from '@/app/session';
import { Button, Card, ErrorBox, Field, Input } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

/**
 * Change the password. Shown alone, before anything else, when the current one was set by
 * someone else (the first admin password, or an admin's reset); also reachable from the profile.
 */
export default function ChangePasswordPage({ forced }: { forced?: boolean }) {
  const { passwordChanged, signOut } = useSession();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== again) {
      setError(new Error('The two new passwords are different.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await auth.changePassword(current, next);
      passwordChanged();
      setCurrent('');
      setNext('');
      setAgain('');
      toast.success('Password changed');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <Field label={forced ? 'Temporary password' : 'Current password'}>
        <Input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password" hint="At least 8 characters.">
        <Input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Field label="New password again">
        <Input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
      </Field>
      {error ? <ErrorBox error={error} /> : null}
      <div className="flex gap-2">
        <Button type="submit" loading={busy} icon={<KeyRound className="h-4 w-4" />}>
          Change password
        </Button>
        {forced && (
          <Button variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        )}
      </div>
    </form>
  );

  if (!forced) {
    return <Card title="Change password">{form}</Card>;
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <RadarMark size={40} />
          <span className="text-lg font-extrabold tracking-tight">NaukriRadar</span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Choose your own password</h1>
          <p className="mt-1 text-sm text-slate-500">You signed in with a temporary password. Pick a new one to continue.</p>
        </div>
        <Card>{form}</Card>
      </div>
    </div>
  );
}
