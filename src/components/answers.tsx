import clsx from 'clsx';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { resume } from '@/api/endpoints';
import { CopyButton } from '@/components/ui/editors';
import { useToast } from '@/components/ui/toast';
import { humanize } from '@/lib/format';

/**
 * Why an application waits for the user, in plain words. The server names the job board's
 * host and the technical error; neither helps someone who just wants to apply.
 */
export function friendlyReason(reason: string | null | undefined): string | null {
  if (!reason) {
    return null;
  }
  // older reasons named the site; users are never told where a job came from
  if (/isn't a known site|we don't know yet/i.test(reason)) {
    return 'A site we don’t know yet: press “Fill for me” and we fill what we can, then you send it.';
  }
  if (/(doesn't allow|bans) automated applications/i.test(reason)) {
    return 'This site doesn’t allow automatic applying: press “Apply” and use your answers below.';
  }
  if (/risk by an admin|applicant tracking system|We know this site/i.test(reason)) {
    return 'We know this site’s application form, so it can be filled and sent for you.';
  }
  if (/^Ready in Chrome: everything is filled/i.test(reason)) {
    return 'Only the last step is left: the form is filled in Chrome. Check it and press Submit.';
  }
  const ready = reason.match(/^Ready in Chrome: filled (\d+) fields; still to answer: (.*?)\.?$/i);
  if (ready) {
    return `Almost done: we filled ${ready[1]} fields in Chrome. You answer: ${ready[2]}, then press Submit.`;
  }
  const asks = reason.match(/^Filled what we could; the form also asks: (.*?)\.?$/i);
  if (asks) {
    return `Almost done: we filled the form, and it still asks you: ${asks[1]}.`;
  }
  if (/Automatic applying is switched off/i.test(reason)) {
    return 'Automatic applying is off, so you send this one yourself. Your answers are ready below.';
  }
  const failed = reason.match(/Automatic apply failed (\d+) times/i);
  if (failed) {
    return `We tried to apply for you ${failed[1]} times and it didn’t go through. Please apply yourself.`;
  }
  return reason;
}

/** The candidate's prepared answers, each with a copy button; the resume is a download. */
export function AnswerTiles({ answers, compact }: { answers: Record<string, string>; compact?: boolean }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const entries = Object.entries(answers);
  if (!entries.length) {
    return null;
  }
  return (
    <div className={clsx('grid gap-2', compact ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3')}>
      {entries.map(([key, value]) => {
        const isResume = key === 'resume';
        // the server writes "file.pdf (download from /api/...)"; the name is what matters
        const shown = isResume ? value.replace(/\s*\(download from [^)]*\)\s*$/i, '') : value;
        return (
          <div
            key={key}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 dark:border-white/5 dark:bg-white/[0.03]"
          >
            <div className="min-w-0">
              <div className="text-xs text-slate-500">{humanize(key)}</div>
              <div className="truncate text-sm font-medium" title={shown}>
                {shown}
              </div>
            </div>
            {isResume ? (
              <button
                type="button"
                title="Download your resume"
                aria-label="Download your resume"
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  try {
                    await resume.download(shown);
                  } catch (e) {
                    toast.error('Resume not downloaded', e);
                  } finally {
                    setDownloading(false);
                  }
                }}
                className="shrink-0 rounded-lg p-2 text-slate-500 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-white hover:text-brand-600 disabled:opacity-50 dark:ring-white/10 dark:hover:bg-white/5"
              >
                <Download className="h-4 w-4" />
              </button>
            ) : (
              <CopyButton text={value} label="" />
            )}
          </div>
        );
      })}
    </div>
  );
}
