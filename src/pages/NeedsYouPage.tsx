import { Check, CheckCircle2, ChevronRight, HandHelping, SkipForward } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import { ApplyLink, CompanyAvatar, RiskBadge } from '@/components/domain';
import { CopyButton } from '@/components/ui/editors';
import { Button, Card, EmptyState, ErrorBox, PageHeader, Spinner } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { humanize } from '@/lib/format';

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
        subtitle="These can't be sent automatically. Open the site, paste your answers, then mark each one done, or skip it."
      />
      {queue.error ? <ErrorBox error={queue.error} onRetry={() => queue.refetch()} /> : null}
      {queue.isLoading ? (
        <Spinner />
      ) : !queue.data?.length ? (
        <Card><EmptyState title="All clear" icon={<CheckCircle2 />}>Nothing is waiting for you.</EmptyState></Card>
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
                      <div className="mt-2 inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">{n.reason}</div>
                    )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge risk={a.riskBand} />
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
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(n.prefill).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 dark:border-white/5 dark:bg-white/[0.03]">
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500">{humanize(k)}</div>
                          <div className="truncate text-sm font-medium">{v}</div>
                        </div>
                        <CopyButton text={v} label="" />
                      </div>
                    ))}
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
