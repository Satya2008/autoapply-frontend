import clsx from 'clsx';
import { ExternalLink, Sparkles } from 'lucide-react';
import type { ApplicationStatus, RiskBand } from '@/api/types';
import { humanize } from '@/lib/format';
import type { Tone } from './ui/primitives';
import { Badge } from './ui/primitives';

const STATUS_TONES: Record<ApplicationStatus, Tone> = {
  PLANNED: 'slate',
  QUEUED: 'cyan',
  SENDING: 'cyan',
  SIMULATED: 'violet',
  SUBMITTED: 'green',
  FAILED: 'red',
  NEEDS_YOU: 'amber',
  APPLIED: 'green',
  INTERVIEW: 'blue',
  OFFER: 'green',
  REJECTED: 'red',
  SKIPPED: 'slate',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{humanize(status)}</Badge>;
}

export function RiskBadge({ risk }: { risk: RiskBand }) {
  const tone: Tone = risk === 'LOW' ? 'green' : risk === 'MEDIUM' ? 'amber' : 'red';
  const title = risk === 'LOW' ? 'Can be applied to automatically' : risk === 'MEDIUM' ? 'Unknown site: you apply' : 'Bans automation: you apply';
  return (
    <Badge tone={tone} title={title}>
      {humanize(risk)} risk
    </Badge>
  );
}

export function RunStatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === 'SUCCESS' || status === 'SUCCEEDED' ? 'green'
      : status === 'RUNNING' || status === 'QUEUED' ? 'blue'
        : status === 'PARTIAL' ? 'amber'
          : status === 'NEVER' ? 'slate' : 'red';
  return <Badge tone={tone}>{humanize(status)}</Badge>;
}

/** A score out of 100 as a coloured ring: green from 70, amber from 45. */
export function ScoreRing({ score, size = 44, label }: { score: number; size?: number; label?: string }) {
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 70 ? 'stroke-emerald-500' : score >= 45 ? 'stroke-amber-500' : 'stroke-rose-400';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={label ?? `Score ${score}/100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} className="fill-none stroke-slate-100 dark:stroke-slate-800" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={clsx('fill-none transition-all', color)}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, score)) / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">{score}</span>
    </div>
  );
}

export function AiScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return null;
  }
  return (
    <Badge tone="violet" title="Score the AI gave after reading the job">
      <Sparkles className="h-3 w-3" /> AI {score}
    </Badge>
  );
}

export function ApplyLink({ url, label = 'Open posting' }: { url: string | null; label?: string }) {
  if (!url) {
    return null;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
      {label} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
