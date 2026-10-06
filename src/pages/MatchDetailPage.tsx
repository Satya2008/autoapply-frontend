import { ArrowLeft, FileText, MapPin, Sparkles, Wifi } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { matches } from '@/api/endpoints';
import { ApplyLink, CompanyAvatar, ScoreRing } from '@/components/domain';
import { Badge, Button, Card, ErrorBox, ProgressBar, SkeletonList } from '@/components/ui/primitives';
import { dateTime, humanize } from '@/lib/format';
import { JobDrawer } from './JobsPage';

const FACTOR_HELP: Record<string, string> = {
  skills: 'Your skills against what the job asks for',
  title: 'The job title against the roles you want',
  location: 'Where the job is against where you want to work',
  salary: 'The salary against what you expect',
  experience: 'Your years against the years the job asks for',
  recency: 'How fresh the posting is',
  semantic: 'How close the job is in meaning to your roles and skills',
};

export default function MatchDetailPage() {
  const { id } = useParams();
  const [showJob, setShowJob] = useState(false);
  const detail = useQuery({ queryKey: ['matches', 'detail', id], queryFn: () => matches.get(id as string) });
  const d = detail.data;

  return (
    <div className="space-y-5">
      <Link to="/matches" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All matches
      </Link>
      {detail.isLoading && (
        <Card>
          <SkeletonList rows={5} />
        </Card>
      )}
      {detail.error ? <ErrorBox error={detail.error} /> : null}
      {d && (
        <>
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-white/[0.06] dark:bg-ink-900 animate-fade-up">
            <div className="flex flex-wrap items-center gap-5">
              <CompanyAvatar name={d.match.company} size={56} />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight">{d.match.title}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{d.match.company}</span>
                  {d.match.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {d.match.location}
                    </span>
                  )}
                  {d.match.remote && (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                      <Wifi className="h-3.5 w-3.5" /> Remote
                    </span>
                  )}
                  <Badge>{humanize(d.status)}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button variant="secondary" icon={<FileText className="h-4 w-4" />} onClick={() => setShowJob(true)}>
                    Read the job
                  </Button>
                  <ApplyLink url={d.match.applyUrl} />
                </div>
              </div>
              <div className="flex items-center gap-5 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                <div className="text-center">
                  <ScoreRing score={d.match.score} size={88} />
                  <div className="mt-1.5 text-xs font-medium text-slate-500">Match score</div>
                </div>
                {d.match.aiScore !== null && (
                  <div className="text-center">
                    <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-glow">
                      <Sparkles className="h-4 w-4 opacity-80" />
                      <span className="text-2xl font-bold tabular-nums">{d.match.aiScore}</span>
                    </div>
                    <div className="mt-1.5 max-w-[88px] truncate text-xs font-medium text-slate-500" title={d.aiScoredBy ?? undefined}>
                      AI review
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 border-t border-dashed border-slate-200 pt-4 text-xs text-slate-500 dark:border-white/10">
              <span>Matched {dateTime(d.match.matchedAt)}</span>
              <span>Posted {dateTime(d.match.postedAt)}</span>
              {d.aiScoredBy && <span>AI review by {d.aiScoredBy}</span>}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card title="Why this score" subtitle="Each factor, its weight and the points it gave" className="lg:col-span-2">
              <ul className="space-y-5">
                {d.breakdown.map((f) => (
                  <li key={f.factor}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold">{humanize(f.factor)}</span>
                        <span className="ml-2 text-xs text-slate-500">{FACTOR_HELP[f.factor]}</span>
                      </div>
                      <span className="whitespace-nowrap text-xs tabular-nums text-slate-500">
                        <span className="font-bold text-slate-800 dark:text-slate-200">+{f.points.toFixed(1)}</span> / {f.weight}
                      </span>
                    </div>
                    <ProgressBar value={f.score} tone={f.score >= 0.7 ? 'green' : f.score >= 0.4 ? 'amber' : 'red'} />
                    <div className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{f.detail}</div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Points by factor" subtitle="Out of 100">
              <ul className="space-y-2">
                {[...d.breakdown]
                  .sort((a, b) => b.points - a.points)
                  .map((f) => (
                    <li key={f.factor} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 truncate text-slate-600 dark:text-slate-400">{humanize(f.factor)}</span>
                      <div className="h-6 flex-1 overflow-hidden rounded-md bg-slate-100 dark:bg-white/5">
                        <div className="h-full rounded-md bg-gradient-to-r from-brand-500 to-violet-500" style={{ width: `${Math.min(100, (f.points / Math.max(1, f.weight)) * 100)}%` }} />
                      </div>
                      <span className="w-10 text-right font-semibold tabular-nums">{f.points.toFixed(1)}</span>
                    </li>
                  ))}
              </ul>
            </Card>
          </div>
          {d.aiReasons && d.aiReasons.length > 0 && (
            <Card title="What the AI said" icon={<Sparkles />}>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {d.aiReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Card>
          )}
          <JobDrawer id={showJob ? d.match.jobId : null} onClose={() => setShowJob(false)} />
        </>
      )}
    </div>
  );
}
