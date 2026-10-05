import { Plus, Save, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { me } from '@/api/endpoints';
import type { Profile, ProfileUpdate, Skill } from '@/api/types';
import { ChipsInput } from '@/components/ui/editors';
import { Badge, Button, Card, ErrorBox, Field, Input, Notice, PageHeader, Spinner, Toggle } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { inr, timeAgo } from '@/lib/format';

function toForm(p: Profile): ProfileUpdate {
  const { userId: _u, updatedAt: _t, ...rest } = p;
  return rest;
}

/** Empty text boxes go to the server as "not set", not as empty strings it would reject (URLs, phone). */
function clean(form: ProfileUpdate): ProfileUpdate {
  const blank = (s: string | null) => (s && s.trim() ? s.trim() : null);
  return {
    ...form,
    fullName: blank(form.fullName),
    phone: blank(form.phone),
    location: blank(form.location),
    currentTitle: blank(form.currentTitle),
    linkedinUrl: blank(form.linkedinUrl),
    githubUrl: blank(form.githubUrl),
    portfolioUrl: blank(form.portfolioUrl),
  };
}

export default function ProfilePage() {
  const profile = useQuery({ queryKey: ['profile'], queryFn: me.profile });
  const skills = useQuery({ queryKey: ['skills'], queryFn: me.skills });
  return (
    <div className="space-y-6">
      <PageHeader title="Profile & skills" subtitle="Matching, applying and the AI writing all work from what you put here." />
      {profile.error ? <ErrorBox error={profile.error} onRetry={() => profile.refetch()} /> : null}
      {profile.isLoading ? <Spinner /> : profile.data && <ProfileForm profile={profile.data} />}
      {skills.error ? <ErrorBox error={skills.error} /> : null}
      {skills.data && <SkillsEditor skills={skills.data} />}
    </div>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<ProfileUpdate>(() => toForm(profile));
  useEffect(() => setForm(toForm(profile)), [profile]);

  const save = useMutation({
    mutationFn: () => me.updateProfile(clean(form)),
    onSuccess: (saved) => {
      queryClient.setQueryData(['profile'], saved);
      toast.success('Profile saved');
    },
  });
  const err = save.error instanceof ApiError ? save.error : null;
  const fieldError = (name: string) => err?.field(name);
  const set = <K extends keyof ProfileUpdate>(key: K, value: ProfileUpdate[K]) => setForm((f) => ({ ...f, [key]: value }));
  const num = (v: string) => (v === '' ? null : Number(v));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-6"
    >
      {err && (err.status === 422 ? <Notice tone="amber">{err.message}</Notice> : <ErrorBox error={err} />)}

      <Section title="About you">
        <Field label="Full name" error={fieldError('fullName')}>
          <Input value={form.fullName ?? ''} maxLength={100} onChange={(e) => set('fullName', e.target.value)} />
        </Field>
        <Field label="Current title" error={fieldError('currentTitle')}>
          <Input value={form.currentTitle ?? ''} maxLength={100} placeholder="Backend Developer" onChange={(e) => set('currentTitle', e.target.value)} />
        </Field>
        <Field label="Phone" error={fieldError('phone')}>
          <Input value={form.phone ?? ''} placeholder="+91 98765 43210" onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Where you live" error={fieldError('location')}>
          <Input value={form.location ?? ''} maxLength={100} placeholder="Pune" onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label="Years of experience" error={fieldError('experienceYears')}>
          <Input type="number" min={0} max={60} value={form.experienceYears ?? ''} onChange={(e) => set('experienceYears', num(e.target.value))} />
        </Field>
        <Field label="Expected salary (per year)" hint={form.expectedSalary ? inr(form.expectedSalary) : undefined} error={fieldError('expectedSalary')}>
          <Input type="number" min={0} step={10000} value={form.expectedSalary ?? ''} onChange={(e) => set('expectedSalary', num(e.target.value))} />
        </Field>
        <Field label="Notice period (days)" error={fieldError('noticePeriodDays')}>
          <Input type="number" min={0} max={365} value={form.noticePeriodDays ?? ''} onChange={(e) => set('noticePeriodDays', num(e.target.value))} />
        </Field>
      </Section>

      <Section title="Links">
        <Field label="LinkedIn" error={fieldError('linkedinUrl')}>
          <Input type="url" value={form.linkedinUrl ?? ''} placeholder="https://linkedin.com/in/…" onChange={(e) => set('linkedinUrl', e.target.value)} />
        </Field>
        <Field label="GitHub" error={fieldError('githubUrl')}>
          <Input type="url" value={form.githubUrl ?? ''} placeholder="https://github.com/…" onChange={(e) => set('githubUrl', e.target.value)} />
        </Field>
        <Field label="Portfolio" error={fieldError('portfolioUrl')}>
          <Input type="url" value={form.portfolioUrl ?? ''} onChange={(e) => set('portfolioUrl', e.target.value)} />
        </Field>
      </Section>

      <Section title="What you are looking for">
        <Field label="Target roles" hint="Up to 20. Titles that contain these count as a full title match." error={fieldError('targetRoles')} className="md:col-span-2">
          <ChipsInput value={form.targetRoles} max={20} placeholder="Backend Developer, Java Developer…" onChange={(v) => set('targetRoles', v)} />
        </Field>
        <Field label="Preferred locations" hint="Up to 20 cities." error={fieldError('preferredLocations')} className="md:col-span-2">
          <ChipsInput value={form.preferredLocations} max={20} placeholder="Pune, Bengaluru…" onChange={(v) => set('preferredLocations', v)} />
        </Field>
        <div className="md:col-span-2">
          <Toggle checked={form.remoteOk} onChange={(v) => set('remoteOk', v)} label="Open to remote jobs" description="Remote jobs count as a location match." />
        </div>
      </Section>

      <Section title="Never show me">
        <Field label="Companies to exclude" hint="Their jobs are never matched or applied to." error={fieldError('excludedCompanies')} className="md:col-span-2">
          <ChipsInput value={form.excludedCompanies} placeholder="Company names…" onChange={(v) => set('excludedCompanies', v)} />
        </Field>
        <Field label="Words to exclude" hint="A job whose title or description has one of these is skipped." error={fieldError('excludedKeywords')} className="md:col-span-2">
          <ChipsInput value={form.excludedKeywords} placeholder="unpaid, night shift…" onChange={(v) => set('excludedKeywords', v)} />
        </Field>
      </Section>

      <Section title="Applying for you">
        <Field label={`Minimum match score: ${form.minMatchScore}`} hint="Matches below this are never applied to." error={fieldError('minMatchScore')}>
          <input type="range" min={0} max={100} step={5} value={form.minMatchScore} onChange={(e) => set('minMatchScore', Number(e.target.value))} className="w-full accent-brand-600" />
        </Field>
        <Field label="Daily limit" hint="At most this many automatic applications a day (1–50)." error={fieldError('dailyApplyLimit')}>
          <Input type="number" min={1} max={50} value={form.dailyApplyLimit} onChange={(e) => set('dailyApplyLimit', Number(e.target.value) || 1)} />
        </Field>
        <div className="md:col-span-2">
          <Toggle
            checked={form.autoApplyEnabled}
            onChange={(v) => set('autoApplyEnabled', v)}
            label="Apply automatically"
            description="Only on sites that allow it (low risk). Needs at least one target role and three skills."
          />
        </div>
      </Section>

      <div className="flex items-center justify-end gap-3">
        {profile.updatedAt && <span className="text-xs text-slate-500">Last saved {timeAgo(profile.updatedAt)}</span>}
        <Button type="button" variant="secondary" onClick={() => setForm(toForm(profile))}>
          Undo changes
        </Button>
        <Button type="submit" icon={<Save className="h-4 w-4" />} loading={save.isPending}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card title={title}>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

function SkillsEditor({ skills }: { skills: Skill[] }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [rows, setRows] = useState(() => skills.map((s) => ({ name: s.name, years: s.years, source: s.source as Skill['source'] | null })));
  const [name, setName] = useState('');
  const [years, setYears] = useState('');
  useEffect(() => setRows(skills.map((s) => ({ name: s.name, years: s.years, source: s.source }))), [skills]);

  const save = useMutation({
    mutationFn: () => me.replaceSkills(rows.map((r) => ({ name: r.name, years: r.years }))),
    onSuccess: (saved) => {
      queryClient.setQueryData(['skills'], saved);
      void queryClient.invalidateQueries({ queryKey: ['skill-gap'] });
      toast.success('Skills saved');
    },
    onError: (e) => toast.error('Skills not saved', e),
  });

  const add = () => {
    const n = name.trim().toLowerCase();
    if (!n || rows.some((r) => r.name.toLowerCase() === n)) {
      setName('');
      return;
    }
    setRows([...rows, { name: n, years: years === '' ? null : Number(years), source: null }]);
    setName('');
    setYears('');
  };

  return (
    <Card
      title={`Skills (${rows.length})`}
      actions={
        <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} loading={save.isPending} onClick={() => save.mutate()}>
          Save skills
        </Button>
      }
    >
      <p className="mb-3 text-sm text-slate-500">Years make matching and screening answers more precise. Skills found in your resume are marked.</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r, i) => (
          <div key={r.name} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
            <span className="flex-1 truncate text-sm font-medium">{r.name}</span>
            {r.source === 'RESUME' && <Badge tone="cyan">resume</Badge>}
            {r.source === null && <Badge tone="amber">unsaved</Badge>}
            <input
              type="number"
              min={0}
              max={50}
              value={r.years ?? ''}
              placeholder="yrs"
              aria-label={`Years of ${r.name}`}
              onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, years: e.target.value === '' ? null : Number(e.target.value) } : x)))}
              className="w-14 rounded-md border-0 bg-slate-50 px-2 py-1 text-right text-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
            />
            <button type="button" aria-label={`Remove ${r.name}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Add a skill, e.g. kafka" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
        <Input className="w-24" type="number" min={0} max={50} placeholder="years" value={years} onChange={(e) => setYears(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
        <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={add}>
          Add
        </Button>
      </div>
    </Card>
  );
}
