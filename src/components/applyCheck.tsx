import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import { Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/toast';

/**
 * After "Apply" opens a job's site we can't see whether the form was sent, so we ask once the
 * user is back in the app. Kept in sessionStorage so moving between pages doesn't lose it.
 */
const KEY = 'naukriradar.applyCheck';

type Pending = { applicationId: string; title: string; company: string | null; openedAt: number };

/** Ask about this job when the user comes back from its site. */
export function askAfterApply(applicationId: string, title: string, company: string | null) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ applicationId, title, company, openedAt: Date.now() } satisfies Pending));
  } catch {
    // no storage: the job stays under "Waiting for you" and can be marked there
  }
}

function pending(): Pending | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    return null;
  }
}

function clear() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing stored
  }
}

/** The "Did you apply?" question, shown when the app's tab is in front again. Lives in the shell. */
export function ApplyCheckPrompt() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState<Pending | null>(null);

  useEffect(() => {
    const back = () => {
      const p = pending();
      // a few seconds on the site at least, so the switch to the new tab itself doesn't ask
      if (p && document.visibilityState === 'visible' && Date.now() - p.openedAt > 3000) {
        setAsking(p);
      }
    };
    window.addEventListener('focus', back);
    document.addEventListener('visibilitychange', back);
    return () => {
      window.removeEventListener('focus', back);
      document.removeEventListener('visibilitychange', back);
    };
  }, []);

  const done = useMutation({
    mutationFn: (id: string) => applications.done(id),
    onSuccess: () => {
      clear();
      setAsking(null);
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Moved to Applied.');
    },
    onError: (e) => toast.error('Could not mark it', e),
  });

  const notYet = () => {
    clear();
    setAsking(null);
  };

  return (
    <Modal
      open={!!asking}
      onClose={notYet}
      title="Did you apply?"
      footer={
        <>
          <Button variant="secondary" onClick={notYet}>
            Not yet
          </Button>
          <Button variant="success" icon={<Check className="h-4 w-4" />} loading={done.isPending}
            onClick={() => asking && done.mutate(asking.applicationId)}>
            Yes, I applied
          </Button>
        </>
      }
    >
      {asking && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">{asking.title}</span>
          {asking.company && <> at <span className="font-semibold text-slate-900 dark:text-white">{asking.company}</span></>}. If you sent the form, we move it
          to Applied. If not, it stays under “Waiting for you”.
        </p>
      )}
    </Modal>
  );
}
