import { CheckCircle2, ExternalLink, MousePointerClick, Sparkles, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import { askAfterApply } from '@/components/applyCheck';
import type { FillReview, RiskBand } from '@/api/types';
import { Button } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

/** Sites that ban automation: we never open those in a controlled browser. */
export function canFillForYou(risk: RiskBand | null | undefined) {
  return risk !== 'HIGH';
}

/**
 * "Fill & Review": opens the job's form in Chrome on this computer, fills it, and leaves only
 * Submit for the user. Takes a minute or two, so the button says what's happening.
 */
export function FillReviewButton({
  applicationId,
  size = 'md',
  onResult,
}: {
  applicationId: string;
  size?: 'sm' | 'md';
  onResult?: (result: FillReview) => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const fill = useMutation({
    mutationFn: () => applications.fillReview(applicationId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      onResult?.(result);
      if (!result.opened) {
        toast.error('Could not open the form', new Error(result.note ?? 'The page did not load.'));
      } else if (result.leftForYou.length) {
        toast.success(`Filled in Chrome. ${result.leftForYou.length} left for you, then press Submit.`);
      } else {
        toast.success('Filled in Chrome. Check it and press Submit.');
      }
    },
    onError: (e) => toast.error('Could not fill the form', e),
  });
  return (
    <Button size={size} icon={<Wand2 className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />} loading={fill.isPending} onClick={() => fill.mutate()}>
      {fill.isPending ? 'Filling in Chrome…' : 'Fill for me'}
    </Button>
  );
}

/** Sites that ban automated tools, told from the apply link (the server checks again). */
export function bannedSite(applyUrl: string | null | undefined) {
  if (!applyUrl) {
    return true;
  }
  try {
    return /(^|\.)(linkedin\.com|naukri\.com|indeed\.com)$/i.test(new URL(applyUrl).hostname);
  } catch {
    return true;
  }
}

/**
 * "Fill for me" on a match: makes the application and fills its form in one go. Lives inside
 * a row that is a link, so its clicks don't open the match.
 */
export function MatchFillButton({ jobId }: { jobId: string }) {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fill = useMutation({
    mutationFn: () => applications.fillMatch(jobId),
    onSuccess: ({ applicationId, fill: result }) => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      if (!result.opened) {
        toast.error('Could not open the form', new Error(result.note ?? 'The page did not load.'));
      } else if (!result.filled.length && !Object.keys(result.aiAnswered).length) {
        toast.success(result.note ?? 'Opened in Chrome.');
      } else {
        toast.success(
          result.leftForYou.length
            ? `Filled in Chrome. ${result.leftForYou.length} left for you, then press Submit.`
            : 'Filled in Chrome. Check it and press Submit.',
        );
      }
      navigate(`/applications/${applicationId}`);
    },
    onError: (e) => toast.error('Could not fill the form', e),
  });
  return (
    <Button
      size="sm"
      icon={<Wand2 className="h-3.5 w-3.5" />}
      loading={fill.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        fill.mutate();
      }}
    >
      {fill.isPending ? 'Filling…' : 'Fill for me'}
    </Button>
  );
}

/**
 * "Apply" on any match: opens the job's application page in a new tab and tracks it under
 * Applications; back in the app we ask whether it was sent. The tab opens at once, before the server answers,
 * so the browser doesn't block it as a pop-up.
 */
export function MatchApplyButton({ jobId, title, company, size = 'sm' }: {
  jobId: string;
  title: string;
  company: string | null;
  size?: 'sm' | 'md';
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const open = useMutation({
    mutationFn: async () => {
      const tab = window.open('', '_blank');
      try {
        const { applicationId, applyUrl } = await applications.openMatch(jobId);
        if (tab) {
          tab.opener = null;
          tab.location.href = applyUrl;
        } else {
          window.open(applyUrl, '_blank', 'noopener');
        }
        askAfterApply(applicationId, title, company);
      } catch (e) {
        tab?.close();
        throw e;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Opened in a new tab. When you come back, we’ll ask if you applied.');
    },
    onError: (e) => toast.error('Could not open the job', e),
  });
  return (
    <Button
      size={size}
      variant="secondary"
      icon={<ExternalLink className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      loading={open.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open.mutate();
      }}
    >
      Apply
    </Button>
  );
}

/** What the last "Fill & Review" did, under the button. */
export function FillReviewSummary({ result }: { result: FillReview }) {
  if (!result.opened) {
    return <p className="text-sm text-red-600">{result.note ?? 'The form could not be opened.'}</p>;
  }
  const ai = Object.entries(result.aiAnswered);
  return (
    <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 font-medium">
        <MousePointerClick className="h-4 w-4 text-brand-600" />
        {result.leftForYou.length ? 'Almost ready in Chrome' : 'Ready in Chrome: only Submit is left'}
      </div>
      {result.filled.length > 0 && (
        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>Filled {result.filled.length}: {result.filled.join(', ')}</span>
        </div>
      )}
      {ai.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Sparkles className="h-4 w-4 shrink-0 text-violet-600" /> AI answered {ai.length} (please check):
          </div>
          <ul className="ml-6 list-disc space-y-0.5 text-slate-600 dark:text-slate-300">
            {ai.map(([q, a]) => (
              <li key={q}>
                <span className="text-slate-500">{q}</span> → <span className="font-medium">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.leftForYou.length > 0 && (
        <div className="text-amber-800 dark:text-amber-300">You still answer: {result.leftForYou.join(', ')}</div>
      )}
      {result.note && <div className="text-xs text-slate-500">{result.note}</div>}
    </div>
  );
}
