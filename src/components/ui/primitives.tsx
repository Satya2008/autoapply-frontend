import clsx from 'clsx';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { ApiError, errorMessage } from '@/api/client';

// ---------- buttons ----------

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-900',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
}

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
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
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

export function Card({ title, actions, children, className, padded = true }: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={clsx('rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-4' : undefined}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone = 'default' }: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const tones = {
    default: 'text-slate-900 dark:text-white',
    good: 'text-emerald-600 dark:text-emerald-400',
    warn: 'text-amber-600 dark:text-amber-400',
    bad: 'text-rose-600 dark:text-rose-400',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className={clsx('mt-1 text-2xl font-semibold tabular-nums', tones[tone])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}

// ---------- badges ----------

export type Tone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'cyan';

const TONES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  blue: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
};

export function Badge({ tone = 'slate', children, className, title }: { tone?: Tone; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  );
}

// ---------- form controls ----------

const CONTROL =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return <input ref={ref} className={clsx(CONTROL, invalid && 'ring-rose-400', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...rest }, ref) {
    return <textarea ref={ref} className={clsx(CONTROL, 'font-[inherit]', invalid && 'ring-rose-400', className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={clsx(CONTROL, 'pr-8', className)} {...rest}>
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
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
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
          {label && <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</div>}
          {description && <div className="text-xs text-slate-500 dark:text-slate-400">{description}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50',
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700',
        )}
      >
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

// ---------- states ----------

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="text-slate-400">{icon ?? <Inbox className="h-8 w-8" />}</div>
      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</div>
      {children && <div className="max-w-md text-sm text-slate-500 dark:text-slate-400">{children}</div>}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) {
    return null;
  }
  const status = error instanceof ApiError ? error.status : undefined;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <div>{errorMessage(error)}</div>
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

export function Notice({ tone = 'blue', children, icon }: { tone?: 'blue' | 'amber' | 'green' | 'red'; children: ReactNode; icon?: ReactNode }) {
  const tones = {
    blue: 'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
    red: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100',
  };
  return (
    <div className={clsx('flex items-start gap-2 rounded-lg border p-3 text-sm', tones[tone])}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
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
    <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/60">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === tab.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded-full bg-slate-200 px-1.5 text-xs tabular-nums dark:bg-slate-700">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ children, className, title }: { children?: ReactNode; className?: string; title?: string }) {
  return <td title={title} className={clsx('px-3 py-2 align-top text-slate-700 dark:text-slate-300', className)}>{children}</td>;
}

export function KeyValue({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {items.map(([k, v], i) => (
        <div key={i} className="flex justify-between gap-3 border-b border-slate-100 py-1 dark:border-slate-800">
          <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
          <dd className="text-right font-medium text-slate-800 dark:text-slate-200">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({ value, max = 1, tone = 'brand' }: { value: number; max?: number; tone?: 'brand' | 'green' | 'amber' | 'red' }) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  const colors = { brand: 'bg-brand-500', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500' };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={clsx('h-full rounded-full transition-all', colors[tone])} style={{ width: `${width}%` }} />
    </div>
  );
}
