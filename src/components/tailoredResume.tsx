import { Download, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { applications } from '@/api/endpoints';
import type { TailoredResume } from '@/api/types';
import { Badge, Button, Card, ErrorBox, Notice, Spinner } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { timeAgo } from '@/lib/format';

/**
 * The resume rewritten for this job: same facts, the job's most relevant first. Shows how much
 * of the job's skills it covers before and after, and what the job asks for that the resume
 * doesn't have (never added). This is the resume uploaded when the form is filled.
 */
export function TailoredResumePanel({ applicationId, company }: { applicationId: string; company: string | null }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const key = ['applications', 'tailored-resume', applicationId];
  const saved = useQuery({
    queryKey: key,
    queryFn: () => applications.tailoredResume(applicationId),
    retry: false,
  });
  const tailor = useMutation({
    mutationFn: () => applications.tailorResume(applicationId),
    onSuccess: (result) => {
      queryClient.setQueryData(key, result);
      toast.success('Resume tailored for this job');
    },
    onError: (e) => toast.error('Could not tailor the resume', e),
  });

  const none = saved.error instanceof ApiError && saved.error.status === 404;
  const data: TailoredResume | undefined = saved.data;

  return (
    <Card
      title="Resume for this job"
      icon={<FileText />}
      actions={
        <Button
          size="sm"
          variant={data ? 'secondary' : 'primary'}
          icon={data ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          loading={tailor.isPending}
          onClick={() => tailor.mutate()}
        >
          {tailor.isPending ? 'Tailoring…' : data ? 'Tailor again' : 'Tailor my resume'}
        </Button>
      }
    >
      {saved.isLoading ? (
        <Spinner />
      ) : saved.error && !none ? (
        <ErrorBox error={saved.error} />
      ) : !data ? (
        <p className="text-sm text-slate-500">
          AI rewrites your resume for this job: the parts that matter most come first, in the job&rsquo;s words. Nothing is
          added that your resume doesn&rsquo;t say. Once made, it is the resume we upload when you press &ldquo;Fill for me&rdquo;.
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <AtsMeter label="Your resume" value={data.atsBefore} />
            <span className="text-slate-400">→</span>
            <AtsMeter label="Tailored" value={data.atsAfter} strong />
            <span className="text-xs text-slate-500">of the job&rsquo;s skills shown · written {timeAgo(data.at)}</span>
          </div>

          {data.unsupported.length > 0 && (
            <Notice tone="amber">
              Check before using: these lines say something your resume doesn&rsquo;t: {data.unsupported.join('; ')}. Tailor again or edit
              the PDF.
            </Notice>
          )}

          {data.missing.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-semibold text-slate-500">The job asks for, your resume doesn&rsquo;t show (not added):</div>
              <div className="flex flex-wrap gap-1.5">
                {data.missing.map((s) => (
                  <Badge key={s} tone="amber">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/5 dark:bg-white/[0.03]">
            <p className="leading-relaxed">{data.resume.summary}</p>
            {data.resume.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.resume.skills.map((s) => (
                  <Badge key={s} tone={data.matched.includes(s.toLowerCase()) ? 'green' : 'slate'}>
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {data.resume.experience.map((job) => (
              <div key={`${job.title}-${job.company}`}>
                <div className="font-semibold">
                  {job.title} · {job.company}
                  {job.dates && <span className="font-normal text-slate-500"> · {job.dates}</span>}
                </div>
                <ul className="ml-5 mt-1 list-disc space-y-0.5 text-slate-600 dark:text-slate-300">
                  {job.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Download className="h-3.5 w-3.5" />}
              loading={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  await applications.downloadTailoredResume(applicationId, `Resume${company ? `_${company.replace(/[^A-Za-z0-9]+/g, '_')}` : ''}.pdf`);
                } catch (e) {
                  toast.error('PDF not downloaded', e);
                } finally {
                  setDownloading(false);
                }
              }}
            >
              Download PDF
            </Button>
            <span className="text-xs text-slate-500">This is the resume uploaded when you press &ldquo;Fill for me&rdquo;.</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function AtsMeter({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="min-w-[120px]">
      <div className="flex items-baseline justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className={strong ? 'text-base font-bold text-emerald-600' : 'font-semibold'}>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
        <div className={`h-1.5 rounded-full ${strong ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
