import { Check, CheckCircle2, ChevronRight, HandHelping, SkipForward } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import { ApplyLink, CompanyAvatar, RiskBadge } from '@/components/domain';
import { AnswerTiles, friendlyReason } from '@/components/answers';
import { FillReviewButton, canFillForYou } from '@/components/fillReview';
import { Button, Card, EmptyState, ErrorBox, PageHeader, Spinner } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

/**
 * The applications only you can finish: sites that ban automation, unknown sites, or forms
 * the worker couldn't complete. Each comes with your answers ready to paste.
 */
export default function NeedsYouPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const queue = useQuery({ queryKey: ['applications', 'needs-you'], queryFn: applications.needsYou });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['applications'] });
  const done = useMutation({ mutationFn: applications.done, onSuccess: () => (toast.success('Marked as applied'), refresh()) });
  const skip = useMutation({ mutationFn: applications.skip, onSuccess: () => (toast.success('Skipped'), refresh()) });

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<HandHelping />}
        title="Needs you"
        subtitle="Jobs that need your last step. Press “Fill for me” and we fill the form in Chrome; you check it and press Submit. On LinkedIn or Naukri, open the site and copy your answers from here. Then press “I applied” or Skip."
      />
      {queue.error ? <ErrorBox error={queue.error} onRetry={() => queue.refetch()} /> : null}
      {queue.isLoading ? (
        <Spinner />
      ) : !queue.data?.length ? (
        <Card>
          <EmptyState
            title="Nothing to apply to by hand"
            icon={<CheckCircle2 />}
            action={
              <Link to="/applications" className="link">
                Go to Applications <ChevronRight className="h-4 w-4" />
              </Link>
            }
          >
            When you press “Apply to my matches”, jobs on sites that can't be applied to automatically land here, each with your details and answers ready to copy.
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.data.map((n) => {
            const a = n.application;
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <CompanyAvatar name={a.company} size={44} />
                    <div className="min-w-0">
                    <Link to={`/applications/${a.id}`} className="inline-flex items-center gap-1 font-semibold hover:text-brand-600">
                      {a.title} <ChevronRight className="h-4 w-4" />
                    </Link>
                    <div className="text-sm text-slate-500">
                      {a.company}
                      {a.location ? ` · ${a.location}` : ''} · score {a.matchScore}
                    </div>
                    {n.reason && (
                      <div
                        className={
                          /^Ready in Chrome/i.test(n.reason)
                            ? 'mt-2 inline-flex rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 dark:bg-violet-500/10 dark:text-violet-300'
                            : 'mt-2 inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                        }
                      >
                        {friendlyReason(n.reason)}
                      </div>
                    )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge risk={a.riskBand} />
                    {canFillForYou(a.riskBand) && <FillReviewButton applicationId={a.id} size="sm" />}
                    <ApplyLink url={a.applyUrl} label="Open the site" />
                    <Button size="sm" variant="success" icon={<Check className="h-3.5 w-3.5" />} loading={done.isPending && done.variables === a.id}
                      onClick={() => done.mutate(a.id, { onError: (e) => toast.error('Could not mark it', e) })}>
                      I applied
                    </Button>
                    <Button size="sm" variant="secondary" icon={<SkipForward className="h-3.5 w-3.5" />} loading={skip.isPending && skip.variables === a.id}
                      onClick={() => skip.mutate(a.id, { onError: (e) => toast.error('Could not skip it', e) })}>
                      Skip
                    </Button>
                  </div>
                </div>
                {n.prefill && Object.keys(n.prefill).length > 0 && (
                  <div className="mt-4">
                    <AnswerTiles answers={n.prefill} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
