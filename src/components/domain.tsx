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
export function ScoreRing({ score, size = 48, label }: { score: number; size?: number; label?: string }) {
  const stroke = size >= 72 ? 7 : 4.5;
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 70 ? 'stroke-emerald-500' : score >= 45 ? 'stroke-amber-500' : 'stroke-rose-400';
  const text = score >= 70 ? 'text-emerald-700 dark:text-emerald-300' : score >= 45 ? 'text-amber-700 dark:text-amber-300' : 'text-rose-600 dark:text-rose-300';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={label ?? `Score ${score}/100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} className="fill-none stroke-slate-100 dark:stroke-white/10" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={clsx('fill-none transition-all duration-700', color)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, score)) / 100)}
        />
      </svg>
      <span
        className={clsx('absolute inset-0 flex items-center justify-center font-bold tabular-nums', text)}
        style={{ fontSize: Math.max(12, Math.round(size * 0.3)) }}
      >
        {score}
      </span>
    </div>
  );
}

const AVATAR_COLORS = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400',
  'from-fuchsia-500 to-purple-500',
  'from-slate-600 to-slate-500',
];

/** A company's initials on a colour picked from its name, so the same company always looks the same. */
export function CompanyAvatar({ name, size = 40 }: { name: string | null | undefined; size?: number }) {
  const label = (name ?? '?').trim() || '?';
  const words = label.split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : label.slice(0, 2)).toUpperCase();
  let hash = 0;
  for (const ch of label) {
    hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  }
  return (
    <div
      className={clsx('flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-sm', AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length])}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      aria-hidden="true"
    >
      {initials}
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
    <a href={url} target="_blank" rel="noopener noreferrer" className="link">
      {label} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
