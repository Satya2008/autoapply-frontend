import { CheckCircle2, FileSignature, ListChecks, Plus, RefreshCw, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applications } from '@/api/endpoints';
import type { CoverLetter, ScreeningAnswers } from '@/api/types';
import { dateTime } from '@/lib/format';
import { Badge, Button, Card, ErrorBox, Input, Notice } from './ui/primitives';
import { CopyButton } from './ui/editors';

/**
 * The cover letter for one application: built from the parts of the resume that fit the job,
 * checked for claims the resume doesn't back. Without AI it is a plain draft.
 */
export function CoverLetterPanel({ applicationId, saved }: { applicationId: string; saved: string | null }) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<CoverLetter | null>(null);
  const write = useMutation({
    mutationFn: (regenerate: boolean) => applications.coverLetter(applicationId, regenerate),
    onSuccess: (letter) => {
      setResult(letter);
      void queryClient.invalidateQueries({ queryKey: ['applications', 'detail', applicationId] });
    },
  });
  const letter = result?.letter ?? saved;

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <FileSignature className="h-4 w-4" /> Cover letter
        </span>
      }
      actions={
        <>
          {letter && <CopyButton text={letter} />}
          <Button
            size="sm"
            icon={letter ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            loading={write.isPending}
            onClick={() => write.mutate(!!letter)}
          >
            {letter ? 'Write again' : 'Write it'}
          </Button>
        </>
      }
    >
      {write.error ? <ErrorBox error={write.error} /> : null}
      {result && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {result.draft ? <Badge tone="amber">Template draft</Badge> : <Badge tone="violet">Written by {result.writtenBy}</Badge>}
          {result.grounded ? (
            <Badge tone="green">
              <CheckCircle2 className="h-3 w-3" /> Every claim is in your resume
            </Badge>
          ) : (
            <Badge tone="red">
              <ShieldAlert className="h-3 w-3" /> Check before sending
            </Badge>
          )}
          {result.evidence.length > 0 && <span className="text-xs text-slate-500">Built on: {result.evidence.join(', ')}</span>}
          <span className="text-xs text-slate-400">{dateTime(result.writtenAt)}</span>
        </div>
      )}
      {result?.note && <Notice tone="amber">{result.note}</Notice>}
      {result && result.unsupportedClaims.length > 0 && (
        <Notice tone="red" icon={<ShieldAlert className="h-4 w-4" />}>
          These claims were not found in your resume or profile:
          <ul className="mt-1 list-disc pl-5">
            {result.unsupportedClaims.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Notice>
      )}
      {letter ? (
        <div className="prose-letter mt-3 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800/50">{letter}</div>
      ) : (
        !write.isPending && (
          <p className="text-sm text-slate-500">
            No letter yet. It is written from the two or three parts of your resume that fit this job best.
          </p>
        )
      )}
    </Card>
  );
}

const COMMON_QUESTIONS = [
  'What is your notice period?',
  'How many years of experience do you have?',
  'What is your expected CTC?',
  'What is your current location?',
  'Why do you want to join us?',
];

/** Screening questions of an application form, answered from the profile, then the resume. */
export function ScreeningPanel({ applicationId }: { applicationId: string }) {
  const [questions, setQuestions] = useState<string[]>(COMMON_QUESTIONS.slice(0, 3));
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<ScreeningAnswers | null>(null);
  const answer = useMutation({
    mutationFn: () => applications.screeningAnswers(applicationId, questions.filter((q) => q.trim())),
    onSuccess: setResult,
  });

  const add = (q: string) => {
    const text = q.trim();
    if (text && questions.length < 10 && !questions.includes(text)) {
      setQuestions([...questions, text]);
    }
    setDraft('');
  };

  const sourceBadge = (source: string) =>
    source === 'PROFILE' ? <Badge tone="green">From your profile</Badge> : source === 'AI' ? <Badge tone="violet">From your resume (AI)</Badge> : <Badge tone="amber">Needs your answer</Badge>;

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <ListChecks className="h-4 w-4" /> Screening answers
        </span>
      }
      actions={
        <Button size="sm" loading={answer.isPending} disabled={questions.length === 0} onClick={() => answer.mutate()}>
          Answer {questions.length} {questions.length === 1 ? 'question' : 'questions'}
        </Button>
      }
    >
      <p className="mb-3 text-sm text-slate-500">
        Paste the questions the form asks. Exact facts come from your profile, the rest from your resume; nothing is guessed.
      </p>
      <ul className="mb-2 space-y-1.5">
        {questions.map((q) => (
          <li key={q} className="flex items-center gap-2 text-sm">
            <span className="flex-1 rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800/50">{q}</span>
            <button type="button" aria-label="Remove question" onClick={() => setQuestions(questions.filter((x) => x !== q))} className="text-slate-400 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input value={draft} maxLength={300} placeholder="Add a question…" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add(draft)} />
        <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => add(draft)} disabled={questions.length >= 10}>
          Add
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {COMMON_QUESTIONS.filter((q) => !questions.includes(q)).map((q) => (
          <button key={q} type="button" onClick={() => add(q)} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-brand-50 dark:bg-slate-800 dark:text-slate-300">
            + {q}
          </button>
        ))}
      </div>

      {answer.error ? <div className="mt-3"><ErrorBox error={answer.error} /></div> : null}
      {result && (
        <div className="mt-4 space-y-3">
          {result.note && <Notice tone="amber">{result.note}</Notice>}
          {result.answers.map((a) => (
            <div key={a.question} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">{a.question}</div>
                {sourceBadge(a.source)}
              </div>
              {a.answer ? (
                <div className="mt-2 flex items-start gap-2">
                  <p className="flex-1 text-sm">{a.answer}</p>
                  <CopyButton text={a.answer} />
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Nothing in your profile or resume answers this.</p>
              )}
              {a.needsYou && a.answer && <p className="mt-1 text-xs text-amber-600">Check this one before you submit.</p>}
              {a.evidence.length > 0 && (
                <details className="mt-2 text-xs text-slate-500">
                  <summary className="cursor-pointer">What your resume says ({a.evidence.length})</summary>
                  <ul className="mt-1 space-y-1">
                    {a.evidence.map((e) => (
                      <li key={e} className="whitespace-pre-wrap rounded bg-slate-50 p-2 dark:bg-slate-800/50">
                        {e}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
          {result.answeredBy && <p className="text-xs text-slate-400">AI answers by {result.answeredBy}</p>}
        </div>
      )}
    </Card>
  );
}
