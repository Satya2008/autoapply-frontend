import { ArrowLeft, Check, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import type { ApplicationStatus, FillReview } from '@/api/types';
import { FillReviewButton, FillReviewSummary, canFillForYou } from '@/components/fillReview';
import { ApplyLink, RiskBadge, StatusBadge } from '@/components/domain';
import { AnswerTiles, friendlyReason } from '@/components/answers';
import { ConfirmButton } from '@/components/ui/overlays';
import { Button, Card, ErrorBox, Field, Input, KeyValue, Notice, PageHeader, Select, Spinner } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { TailoredResumePanel } from '@/components/tailoredResume';
import { CoverLetterPanel, ScreeningPanel } from '@/components/writing';
import { dateTime, humanize, timeAgo } from '@/lib/format';
import { JobDrawer } from './JobsPage';

const OUTCOMES: ApplicationStatus[] = ['INTERVIEW', 'OFFER', 'REJECTED'];
const WAITING: ApplicationStatus[] = ['NEEDS_YOU', 'FAILED', 'PLANNED', 'SIMULATED'];

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showJob, setShowJob] = useState(false);
  const [outcome, setOutcome] = useState<ApplicationStatus>('INTERVIEW');
  const [note, setNote] = useState('');
  const [filled, setFilled] = useState<FillReview | null>(null);
  const detail = useQuery({ queryKey: ['applications', 'detail', id], queryFn: () => applications.get(id as string) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['applications'] });
  const done = useMutation({ mutationFn: () => applications.done(id as string), onSuccess: () => (toast.success('Marked as applied'), refresh()) });
  const skip = useMutation({ mutationFn: () => applications.skip(id as string), onSuccess: () => (toast.success('Skipped'), refresh()) });
  const setStatus = useMutation({
    mutationFn: () => applications.setStatus(id as string, outcome, note),
    onSuccess: () => {
      toast.success(`Marked as ${humanize(outcome).toLowerCase()}`);
      setNote('');
      void refresh();
    },
  });

  const d = detail.data;
  const a = d?.application;
  return (
    <div className="space-y-5">
      <Link to="/applications" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Applications
      </Link>
      {detail.isLoading && <Spinner />}
      {detail.error ? <ErrorBox error={detail.error} /> : null}
      {d && a && (
        <>
          <PageHeader
            title={a.title}
            subtitle={[a.company, a.location].filter(Boolean).join(' · ')}
            actions={
              <>
                <StatusBadge status={a.status} />
                <RiskBadge risk={a.riskBand} />
                <Button variant="secondary" size="sm" onClick={() => setShowJob(true)}>
                  Read the job
                </Button>
                <ApplyLink url={a.applyUrl} label="Apply on the site" />
              </>
            }
          />

          {a.status === 'NEEDS_YOU' && d.needsYouReason && <Notice tone="amber">{friendlyReason(d.needsYouReason)}</Notice>}
          {/* once it waits for the user, an old failed try only confuses */}
          {d.lastError && a.status === 'FAILED' && <Notice tone="red">Last attempt failed: {d.lastError}</Notice>}

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <TailoredResumePanel applicationId={a.id} company={a.company} />
              <CoverLetterPanel applicationId={a.id} saved={d.coverLetter} />
              <ScreeningPanel applicationId={a.id} />
            </div>

            <div className="space-y-5">
              <Card title="What to do">
                {WAITING.includes(a.status) ? (
                  <div className="space-y-3">
                    {canFillForYou(a.riskBand) && (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">
                          We open the form in Chrome and fill it for you. You check it and press Submit.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <FillReviewButton applicationId={a.id} onResult={setFilled} />
                        </div>
                        {filled && <FillReviewSummary result={filled} />}
                      </div>
                    )}
                    <p className="text-sm text-slate-500">Applied on the site yourself? Mark it done. Not interested? Skip it.</p>
                    <div className="flex gap-2">
                      <Button variant="success" icon={<Check className="h-4 w-4" />} loading={done.isPending} onClick={() => done.mutate(undefined, { onError: (e) => toast.error('Could not mark it', e) })}>
                        I applied
                      </Button>
                      <ConfirmButton
                        variant="secondary"
                        size="md"
                        icon={<SkipForward className="h-4 w-4" />}
                        title="Skip this application?"
                        message="It moves to Skipped and won't be suggested again."
                        loading={skip.isPending}
                        onConfirm={() => skip.mutate(undefined, { onError: (e) => toast.error('Could not skip it', e) })}
                      >
                        Skip
                      </ConfirmButton>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">Heard back? Record how it went.</p>
                    <Field label="Outcome">
                      <Select value={outcome} onChange={(e) => setOutcome(e.target.value as ApplicationStatus)}>
                        {OUTCOMES.map((s) => (
                          <option key={s} value={s}>
                            {humanize(s)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Note (optional)">
                      <Input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Round 1 on Monday…" />
                    </Field>
                    <Button loading={setStatus.isPending} onClick={() => setStatus.mutate(undefined, { onError: (e) => toast.error('Could not update', e) })}>
                      Save
                    </Button>
                  </div>
                )}
              </Card>

              <Card title="Details">
                <KeyValue
                  items={[
                    ['Match score', a.matchScore],
                    ['Created', dateTime(a.createdAt)],
                    // sending details only mean something once the app tried to send it
                    ...(a.submittedVia ? [['Sent via', humanize(a.submittedVia)] as [string, string]] : []),
                    ...(d.attempts > 0 ? [['Tries to send', d.attempts] as [string, number]] : []),
                    ...(d.nextAttemptAt && a.status === 'FAILED' ? [['Next try', dateTime(d.nextAttemptAt)] as [string, string]] : []),
                  ]}
                />
                {d.riskReason && friendlyReason(d.riskReason) !== friendlyReason(d.needsYouReason) && (
                  <p className="mt-3 text-xs text-slate-500">{friendlyReason(d.riskReason)}</p>
                )}
              </Card>

              {d.prefill && Object.keys(d.prefill).length > 0 && (
                <Card title="Answers ready to paste">
                  <AnswerTiles answers={d.prefill} compact />
                </Card>
              )}

              <Card title="Timeline">
                <ol className="relative space-y-4 border-l border-slate-200 pl-4 dark:border-slate-700">
                  {d.timeline.map((e, i) => (
                    <li key={i}>
                      <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 dark:border-slate-900" />
                      <div className="flex flex-wrap items-center gap-1 text-sm">
                        {e.fromStatus && <StatusBadge status={e.fromStatus} />}
                        {e.fromStatus && <span className="text-slate-400">→</span>}
                        <StatusBadge status={e.toStatus} />
                      </div>
                      {e.note && <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{e.note}</div>}
                      <div className="text-xs text-slate-400" title={dateTime(e.at)}>
                        {timeAgo(e.at)}
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>
          <JobDrawer id={showJob ? a.jobId : null} onClose={() => setShowJob(false)} />
        </>
      )}
    </div>
  );
}
