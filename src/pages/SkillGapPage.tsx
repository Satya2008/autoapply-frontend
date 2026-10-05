import { Plus, TrendingUp } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { matches, me } from '@/api/endpoints';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, Card, EmptyState, ErrorBox, Notice, PageHeader, Spinner, Stat } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

export default function SkillGapPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const gap = useQuery({ queryKey: ['skill-gap'], queryFn: matches.skillGap, staleTime: 60_000 });
  const skills = useQuery({ queryKey: ['skills'], queryFn: me.skills });

  const add = useMutation({
    mutationFn: async (skill: string) => {
      const current = (skills.data ?? []).map((s) => ({ name: s.name, years: s.years }));
      return me.replaceSkills([...current, { name: skill, years: null }]);
    },
    onSuccess: (_, skill) => {
      toast.success(`Added ${skill} to your skills`, 'Run matching again to see the new matches.');
      void queryClient.invalidateQueries({ queryKey: ['skills'] });
      void queryClient.invalidateQueries({ queryKey: ['skill-gap'] });
    },
    onError: (e) => toast.error('Could not add the skill', e),
  });

  const g = gap.data;
  return (
    <div className="space-y-5">
      <PageHeader
        title="Skill gap"
        subtitle="The skills the jobs on your shortlist ask for that your profile doesn't have, ranked by how many extra jobs would become matches if you had them."
      />
      {gap.isLoading && <Spinner label="Scoring your shortlist with each missing skill…" />}
      {gap.error ? (
        gap.error instanceof ApiError && gap.error.status === 422 ? (
          <Notice tone="amber">{gap.error.message}</Notice>
        ) : (
          <ErrorBox error={gap.error} onRetry={() => gap.refetch()} />
        )
      ) : null}
      {g && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Jobs analysed" value={g.jobsAnalysed} />
            <Stat label="Matching now" value={g.currentMatches} tone="good" />
            <Stat label="Match threshold" value={g.threshold} hint="your minimum score" />
          </div>
          {g.gaps.length === 0 ? (
            <EmptyState title="No gaps found" icon={<TrendingUp className="h-8 w-8" />}>
              Your skills already cover what these jobs ask for.
            </EmptyState>
          ) : (
            <>
              <Card title="Extra matches per skill">
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={g.gaps} margin={{ left: 0, right: 10 }}>
                      <XAxis dataKey="skill" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="extraMatches" name="Extra matches" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="jobsAsking" name="Jobs asking" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <div className="grid gap-3 md:grid-cols-2">
                {g.gaps.map((gp) => (
                  <Card key={gp.skill}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold capitalize">{gp.skill}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-emerald-600">+{gp.extraMatches}</span> matches · asked by {gp.jobsAsking}{' '}
                          {gp.jobsAsking === 1 ? 'job' : 'jobs'}
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} loading={add.isPending && add.variables === gp.skill}
                        onClick={() => add.mutate(gp.skill)}>
                        I know this
                      </Button>
                    </div>
                    {gp.exampleJobs.length > 0 && (
                      <ul className="mt-3 space-y-0.5 text-xs text-slate-500">
                        {gp.exampleJobs.map((j) => (
                          <li key={j}>· {j}</li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
