import { Download, FileText, RefreshCw, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import type { DragEvent } from 'react';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { resume } from '@/api/endpoints';
import type { ResumeUpload } from '@/api/types';
import { ConfirmButton } from '@/components/ui/overlays';
import { Badge, Button, Card, EmptyState, ErrorBox, KeyValue, Notice, PageHeader, Spinner, Toggle } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { bytes, dateTime, timeAgo } from '@/lib/format';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export default function ResumePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [direct, setDirect] = useState(false);
  const [last, setLast] = useState<ResumeUpload | null>(null);

  const current = useQuery({
    queryKey: ['resume'],
    queryFn: () => resume.get().catch((e) => (e instanceof ApiError && e.status === 404 ? null : Promise.reject(e))),
  });

  const upload = useMutation({
    mutationFn: (file: File) => (direct ? resume.uploadDirect(file) : resume.upload(file)),
    onSuccess: (result) => {
      setLast(result);
      queryClient.setQueryData(['resume'], result.resume);
      void queryClient.invalidateQueries({ queryKey: ['skills'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Resume uploaded', `${result.skillsFound.length} skills found, ${result.skillsAdded.length} new.`);
    },
    onError: (e) => toast.error('Upload failed', e),
  });
  const parse = useMutation({
    mutationFn: resume.parseAgain,
    onSuccess: () => {
      toast.info('AI is reading your resume', 'New skills and years show up on your profile in a minute.');
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['resume'] });
        void queryClient.invalidateQueries({ queryKey: ['skills'] });
      }, 8000);
    },
    onError: (e) => toast.error('Could not start', e),
  });
  const remove = useMutation({
    mutationFn: resume.remove,
    onSuccess: () => {
      setLast(null);
      queryClient.setQueryData(['resume'], null);
      toast.success('Resume deleted');
    },
    onError: (e) => toast.error('Could not delete', e),
  });
  const download = useMutation({
    mutationFn: (fileName: string) => resume.download(fileName),
    onError: (e) => toast.error('Download failed', e),
  });

  const pick = (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('File too large', 'Resumes can be at most 10 MB.');
      return;
    }
    upload.mutate(file);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  };

  const r = current.data;
  const ai = r?.aiParsed;
  return (
    <div className="space-y-5">
      <PageHeader icon={<FileText />} title="Resume" subtitle="PDF or Word (.docx), up to 10 MB. Skills are read from it and added to your profile; AI then adds years per skill." />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
        }`}
      >
        <UploadCloud className="h-10 w-10 text-brand-500" />
        <div className="text-sm">
          <span className="font-medium">Drop your resume here</span> or
        </div>
        <Button loading={upload.isPending} onClick={() => input.current?.click()}>
          {r ? 'Replace resume' : 'Choose a file'}
        </Button>
        <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ''))} />
        <div className="w-full max-w-sm pt-2">
          <Toggle
            checked={direct}
            onChange={setDirect}
            label="Upload straight to storage"
            description="Uses a short-lived signed link (S3 storage only); the file skips our servers."
          />
        </div>
      </div>

      {last && (
        <Card title="What we found">
          <div className="space-y-3">
            {last.autoApplyTurnedOff && (
              <Notice tone="amber">Automatic applying was turned off: your profile now has fewer than three skills.</Notice>
            )}
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">Skills found ({last.skillsFound.length})</div>
              <div className="flex flex-wrap gap-1">
                {last.skillsFound.map((s) => (
                  <Badge key={s} tone={last.skillsAdded.includes(s) ? 'green' : 'slate'} title={last.skillsAdded.includes(s) ? 'Added to your profile' : 'Already on your profile'}>
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {current.error ? <ErrorBox error={current.error} /> : null}
      {current.isLoading ? (
        <Spinner />
      ) : !r ? (
        <EmptyState title="No resume yet" icon={<FileText className="h-8 w-8" />}>
          Upload one: it fills your skills and lets cover letters and screening answers use your real experience.
        </EmptyState>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card
            title="Current resume"
            actions={
              <>
                <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} loading={download.isPending} onClick={() => download.mutate(r.fileName)}>
                  Download
                </Button>
                <ConfirmButton title="Delete your resume?" message="The file and its text are removed. Skills already on your profile stay." loading={remove.isPending}
                  icon={<Trash2 className="h-3.5 w-3.5" />} onConfirm={() => remove.mutate()}>
                  Delete
                </ConfirmButton>
              </>
            }
          >
            <KeyValue
              items={[
                ['File', r.fileName],
                ['Type', r.contentType],
                ['Size', bytes(r.sizeBytes)],
                ['Uploaded', dateTime(r.uploadedAt)],
                ['Text read', r.textExtracted ? 'Yes' : 'No (scanned image?)'],
                ['Read by AI', r.aiParsedAt ? timeAgo(r.aiParsedAt) : 'Not yet'],
              ]}
            />
          </Card>

          <Card
            title={
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" /> What AI read
              </span>
            }
            actions={
              <Button size="sm" variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" />} loading={parse.isPending} onClick={() => parse.mutate()}>
                Read again
              </Button>
            }
          >
            {ai ? (
              <div className="space-y-3 text-sm">
                {ai.summary && <p>{ai.summary}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {ai.seniority && <span>Seniority: {ai.seniority}</span>}
                  {ai.totalYearsExperience !== undefined && <span>{ai.totalYearsExperience} years in total</span>}
                </div>
                {ai.roles && ai.roles.length > 0 && <div className="text-xs">Roles: {ai.roles.join(', ')}</div>}
                <div className="flex flex-wrap gap-1">
                  {ai.skills?.map((s) => (
                    <Badge key={s.name} tone="violet">
                      {s.name}
                      {s.years !== undefined ? ` · ${s.years}y` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Not read by AI yet. It happens in the background after upload when an AI provider is set up; dictionary skills work without it.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
