import { ArrowLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { matches } from '@/api/endpoints';
import { ApplyLink, ScoreRing } from '@/components/domain';
import { Badge, Button, Card, ErrorBox, KeyValue, PageHeader, ProgressBar, Spinner } from '@/components/ui/primitives';
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
      <Link to="/matches" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Matches
      </Link>
      {detail.isLoading && <Spinner />}
      {detail.error ? <ErrorBox error={detail.error} /> : null}
      {d && (
        <>
          <PageHeader
            title={d.match.title}
            subtitle={[d.match.company, d.match.location, d.match.remote ? 'remote' : null].filter(Boolean).join(' · ')}
            actions={
              <>
                <Button variant="secondary" onClick={() => setShowJob(true)}>
                  Read the job
                </Button>
                <ApplyLink url={d.match.applyUrl} />
              </>
            }
          />
          <div className="grid gap-5 lg:grid-cols-3">
            <Card title="Score">
              <div className="flex items-center gap-4">
                <ScoreRing score={d.match.score} size={80} />
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <div>Local score out of 100</div>
                  {d.match.aiScore !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone="violet">
                        <Sparkles className="h-3 w-3" /> AI {d.match.aiScore}
                      </Badge>
                      <span className="text-xs text-slate-500">{d.aiScoredBy}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <KeyValue
                  items={[
                    ['Matched', dateTime(d.match.matchedAt)],
                    ['Posted', dateTime(d.match.postedAt)],
                    ['Status', humanize(d.status)],
                  ]}
                />
              </div>
            </Card>

            <Card title="Why this score" className="lg:col-span-2">
              <ul className="space-y-4">
                {d.breakdown.map((f) => (
                  <li key={f.factor}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <div>
                        <span className="text-sm font-medium">{humanize(f.factor)}</span>
                        <span className="ml-2 text-xs text-slate-500">{FACTOR_HELP[f.factor]}</span>
                      </div>
                      <span className="whitespace-nowrap text-xs tabular-nums text-slate-500">
                        +{f.points.toFixed(1)} pts · weight {f.weight}
                      </span>
                    </div>
                    <ProgressBar value={f.score} tone={f.score >= 0.7 ? 'green' : f.score >= 0.4 ? 'amber' : 'red'} />
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{f.detail}</div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {d.aiReasons && d.aiReasons.length > 0 && (
            <Card title="What the AI said">
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
