import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Info, Loader2, Radar, TriangleAlert, XCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { ApiError, errorMessage } from '@/api/client';

// ---------- buttons ----------

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-brand-600/30 hover:bg-brand-700 hover:shadow-glow disabled:bg-brand-300 disabled:shadow-none dark:bg-brand-500 dark:hover:bg-brand-400 dark:disabled:bg-brand-900',
  secondary:
    'bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/10',
  ghost: 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10',
  danger: 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 hover:bg-rose-700 disabled:bg-rose-300',
  success: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 disabled:bg-emerald-300',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

const SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:active:scale-100 dark:focus-visible:ring-offset-ink-950',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});

// ---------- surfaces ----------

export function Card({ title, subtitle, icon, actions, children, className, padded = true }: {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={clsx(
        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-white/[0.06] dark:bg-ink-900',
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-1 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <IconChip>{icon}</IconChip>}
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : title || actions ? 'pt-2' : undefined}>{children}</div>
    </section>
  );
}

const CHIP_TONES = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20',
  red: 'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/20',
  cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10',
};

export type ChipTone = keyof typeof CHIP_TONES;

/** A small rounded square holding an icon, used to give cards and stats a recognisable mark. */
export function IconChip({ children, tone = 'brand', size = 'md' }: { children: ReactNode; tone?: ChipTone; size?: 'md' | 'lg' }) {
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset [&>svg]:h-[18px] [&>svg]:w-[18px]',
        size === 'lg' ? 'h-11 w-11 [&>svg]:h-5 [&>svg]:w-5' : 'h-9 w-9',
        CHIP_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions, icon, eyebrow }: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div className="flex min-w-0 items-start gap-4">
        {icon && (
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow sm:inline-flex [&>svg]:h-6 [&>svg]:w-6">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">{eyebrow}</div>}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const STAT_TONES = {
  default: { text: 'text-slate-900 dark:text-white', chip: 'brand' as ChipTone },
  good: { text: 'text-emerald-600 dark:text-emerald-400', chip: 'green' as ChipTone },
  warn: { text: 'text-amber-600 dark:text-amber-400', chip: 'amber' as ChipTone },
  bad: { text: 'text-rose-600 dark:text-rose-400', chip: 'red' as ChipTone },
};

export function Stat({ label, value, hint, tone = 'default', icon, loading }: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  icon?: ReactNode;
  loading?: boolean;
}) {
  const t = STAT_TONES[tone];
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card dark:border-white/[0.06] dark:bg-ink-900">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</div>
        {icon && <IconChip tone={t.chip}>{icon}</IconChip>}
      </div>
      {loading ? (
        <div className="skeleton mt-2 h-8 w-16" />
      ) : (
        <div className={clsx('mt-1 text-[28px] font-bold leading-tight tracking-tight tabular-nums', t.text)}>{value}</div>
      )}
      {hint && <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}

// ---------- badges ----------

export type Tone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'cyan';

const TONES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10',
  blue: 'bg-brand-50 text-brand-700 ring-brand-200/70 dark:bg-brand-500/15 dark:text-brand-200 dark:ring-brand-400/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200/70 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-400/20',
};

export function Badge({ tone = 'slate', children, className, title }: { tone?: Tone; children: ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', TONES[tone], className)}
    >
      {children}
    </span>
  );
}

// ---------- form controls ----------

const CONTROL =
  'block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 dark:bg-white/[0.03] dark:text-slate-100 dark:ring-white/10 dark:hover:ring-white/20 dark:focus:ring-brand-400';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return <input ref={ref} className={clsx(CONTROL, invalid && '!ring-rose-400', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...rest }, ref) {
    return <textarea ref={ref} className={clsx(CONTROL, 'font-[inherit] leading-relaxed', invalid && '!ring-rose-400', className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={clsx(CONTROL, 'cursor-pointer pr-9', className)} {...rest}>
      {children}
    </select>
  );
});

export function Field({ label, hint, error, children, className }: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-rose-600 dark:text-rose-400">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      )}
    </label>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <div>
          {label && <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</div>}
          {description && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50',
          checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-slate-200 dark:bg-white/10',
        )}
      >
        <span
          className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-0.5')}
        />
      </button>
    </div>
  );
}

// ---------- states ----------

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

/** Placeholder rows shaped like a list of items, shown while the real ones load. */
export function SkeletonList({ rows = 4, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="space-y-4 p-1" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          {avatar && <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading state. Without a label it draws skeleton rows (the usual case: a list is on its way);
 * with a label it says what is happening, for work that takes a while.
 */
export function Spinner({ label }: { label?: string }) {
  if (!label) {
    return (
      <div className="py-4">
        <SkeletonList rows={3} />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-slate-500 dark:text-slate-400">
      <span className="relative inline-flex h-10 w-10 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/30" />
        <Radar className="relative h-6 w-6 text-brand-600 dark:text-brand-300" />
      </span>
      {label}
    </div>
  );
}

export function EmptyState({ title, children, icon, action }: { title: string; children?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <div className="relative">
        <div className="absolute inset-0 -m-3 rounded-full bg-brand-100/60 blur-xl dark:bg-brand-500/10" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-card ring-1 ring-slate-200/80 dark:bg-ink-800 dark:text-brand-300 dark:ring-white/10 [&>svg]:h-6 [&>svg]:w-6">
          {icon ?? <Radar />}
        </div>
      </div>
      <div className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{title}</div>
      {children && <div className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{children}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) {
    return null;
  }
  const status = error instanceof ApiError ? error.status : undefined;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <div className="font-medium">{errorMessage(error)}</div>
        {status === 503 && <div className="mt-1 text-xs opacity-80">The service is busy or a dependency is down; try again shortly.</div>}
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

const NOTICE = {
  blue: { box: 'border-brand-200/80 bg-brand-50/70 text-brand-900 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-100', icon: <Info /> },
  amber: { box: 'border-amber-200/80 bg-amber-50/70 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100', icon: <TriangleAlert /> },
  green: { box: 'border-emerald-200/80 bg-emerald-50/70 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100', icon: <CheckCircle2 /> },
  red: { box: 'border-rose-200/80 bg-rose-50/70 text-rose-900 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100', icon: <XCircle /> },
};

export function Notice({ tone = 'blue', children, icon }: { tone?: 'blue' | 'amber' | 'green' | 'red'; children: ReactNode; icon?: ReactNode }) {
  const n = NOTICE[tone];
  return (
    <div className={clsx('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed', n.box)}>
      <span className="mt-0.5 shrink-0 opacity-80 [&>svg]:h-4 [&>svg]:w-4">{icon ?? n.icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ---------- tabs and tables ----------

export function Tabs<T extends string>({ value, onChange, tabs }: {
  value: T;
  onChange: (value: T) => void;
  tabs: { value: T; label: ReactNode; count?: number }[];
}) {
  return (
    <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-slate-900/[0.04] p-1 dark:bg-white/5">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
            value === tab.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={clsx(
                'rounded-md px-1.5 text-xs tabular-nums',
                value === tab.value ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : 'bg-slate-900/5 dark:bg-white/10',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50/80 dark:border-white/5 dark:bg-white/[0.02]">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold text-slate-500 first:pl-5 last:pr-5 dark:text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5 [&>tr]:transition-colors [&>tr:hover]:bg-slate-50/70 dark:[&>tr:hover]:bg-white/[0.02]">
          {children}
        </tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ children, className, title }: { children?: ReactNode; className?: string; title?: string }) {
  return (
    <td title={title} className={clsx('px-4 py-3 align-middle text-slate-700 first:pl-5 last:pr-5 dark:text-slate-300', className)}>
      {children}
    </td>
  );
}

export function KeyValue({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 text-sm sm:grid-cols-2">
      {items.map(([k, v], i) => (
        <div key={i} className="flex justify-between gap-3 border-b border-dashed border-slate-200 py-2 dark:border-white/10">
          <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
          <dd className="text-right font-semibold text-slate-800 dark:text-slate-200">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({ value, max = 1, tone = 'brand' }: { value: number; max?: number; tone?: 'brand' | 'green' | 'amber' | 'red' }) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  const colors = {
    brand: 'bg-gradient-to-r from-brand-500 to-violet-500',
    green: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-400',
    red: 'bg-gradient-to-r from-rose-500 to-pink-400',
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
      <div className={clsx('h-full rounded-full transition-all duration-500', colors[tone])} style={{ width: `${width}%` }} />
    </div>
  );
}
