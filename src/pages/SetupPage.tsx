import { CheckCircle2, ChevronRight, FileUp, Rocket, SlidersHorizontal } from 'lucide-react';
import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { matches, me, resume } from '@/api/endpoints';
import { Button, Card, PageHeader } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

/**
 * Three steps for a new user, so they never land on an empty app: their resume (which fills
 * the profile), a look at what they want, and the first matches.
 */
export default function SetupPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const profile = useQuery({ queryKey: ['profile'], queryFn: me.profile });
  const cv = useQuery({
    queryKey: ['resume'],
    queryFn: () => resume.get().catch((e) => (e instanceof ApiError && e.status === 404 ? null : Promise.reject(e))),
  });
  const upload = useMutation({
    mutationFn: (file: File) => resume.upload(file),
    onSuccess: () => {
      toast.success('Resume uploaded. Your profile is being filled from it.');
      void queryClient.invalidateQueries();
    },
    onError: (e) => toast.error('Resume not uploaded', e),
  });
  const find = useMutation({
    mutationFn: matches.startRun,
    onSuccess: () => {
      toast.success('Finding your matches…');
      navigate('/matches');
    },
    onError: (e) => toast.error('Could not start', e),
  });

  const p = profile.data;
  const hasResume = !!cv.data;
  const profileReady = !!p && p.targetRoles.length > 0 && !!p.filters && p.filters.mustHave.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader icon={<Rocket />} title="Let’s set you up" subtitle="Three quick steps, then NaukriRadar starts finding jobs that fit you." />

      <Step n={1} done={hasResume} icon={<FileUp />} title="Upload your resume"
        text="PDF or Word. We read it to fill in your skills, experience and profile, so you type as little as possible.">
        <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" className="hidden"
          onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
        <Button loading={upload.isPending} variant={hasResume ? 'secondary' : 'primary'} onClick={() => fileInput.current?.click()}>
          {hasResume ? 'Upload a newer one' : 'Choose file'}
        </Button>
      </Step>

      <Step n={2} done={profileReady} icon={<SlidersHorizontal />} title="Check what you’re looking for"
        text="Roles, places, level and the skills a job must have (for example Java). Also answer the questions most forms ask, once.">
        <Link to="/profile" className="link">Open your profile <ChevronRight className="h-4 w-4" /></Link>
      </Step>

      <Step n={3} done={false} icon={<Rocket />} title="Find your matches"
        text="We score every fresh job against your profile and show the best first. New jobs arrive twice a day.">
        <Button loading={find.isPending} disabled={!hasResume} onClick={() => find.mutate()}>
          Find my matches
        </Button>
        {!hasResume && <span className="text-xs text-slate-500">Upload your resume first.</span>}
      </Step>

      <div className="text-center">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">Skip for now</Link>
      </div>
    </div>
  );
}

function Step({ n, done, icon, title, text, children }: {
  n: number; done: boolean; icon: React.ReactNode; title: string; text: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'} [&>svg]:h-5 [&>svg]:w-5`}>
          {done ? <CheckCircle2 /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step {n}{done ? ' · done' : ''}</div>
          <div className="text-lg font-bold">{title}</div>
          <p className="mt-1 text-sm text-slate-500">{text}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">{children}</div>
        </div>
      </div>
    </Card>
  );
}
