import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react'

/* ------------------------------------------------------------------ atoms */

export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }
  return (
    <button
      className={`btn ${variants[variant] || variants.primary} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  )
}

export function Field({ label, hint, error, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs" style={{ color: 'rgb(var(--text-dim))' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs" style={{ color: 'rgb(var(--danger))' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'chip',
    accent: 'chip chip-accent',
    success: 'chip chip-success',
    warning: 'chip chip-warning',
    danger: 'chip chip-danger',
  }
  return <span className={tones[tone] || tones.default}>{children}</span>
}

export function StatusBadge({ status }) {
  const map = {
    APPLIED: 'success',
    DRY_RUN: 'accent',
    PENDING: 'warning',
    RETRY_SCHEDULED: 'warning',
    SKIPPED: 'default',
    FAILED: 'danger',
    INTERVIEW: 'accent',
    OFFER: 'success',
    REJECTED: 'danger',
    SUCCESS: 'success',
  }
  return <Badge tone={map[status] || 'default'}>{String(status || '—').replace(/_/g, ' ')}</Badge>
}

/* ---------------------------------------------------------------- layout */

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div className={`card ${hover ? 'card-hover sheen' : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              background:
                'linear-gradient(135deg, rgb(var(--accent) / 0.18), rgb(var(--accent-2) / 0.14))',
              border: '1px solid rgb(var(--accent) / 0.25)',
            }}
          >
            <Icon size={20} style={{ color: 'rgb(var(--accent))' }} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: 'rgb(var(--surface-2))',
            border: '1px solid rgb(var(--border))',
          }}
        >
          <Icon size={24} style={{ color: 'rgb(var(--text-dim))' }} />
        </div>
      )}
      <h3 className="text-base font-medium">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} />
}

/* ----------------------------------------------------------------- modal */

export function Modal({ open, onClose, title, children, footer, width = 'max-w-2xl' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[6vh]">
      <div
        className="fixed inset-0"
        style={{ background: 'rgb(0 0 0 / 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div className={`card animate-in relative z-10 w-full ${width}`}>
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            style={{ color: 'rgb(var(--text-dim))' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div
            className="flex justify-end gap-2 border-t px-5 py-4"
            style={{ borderColor: 'rgb(var(--border))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm' }) {
  const [busy, setBusy] = useState(false)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm()
              } finally {
                setBusy(false)
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
        {message}
      </p>
    </Modal>
  )
}

/* ---------------------------------------------------------------- toasts */

export function ToastHost({ toasts, onDismiss }) {
  const icons = { success: CheckCircle2, error: XCircle, warning: AlertCircle, info: Info }
  const colors = {
    success: 'var(--success)',
    error: 'var(--danger)',
    warning: 'var(--warning)',
    info: 'var(--accent-2)',
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.tone] || Info
        return (
          <div
            key={toast.id}
            className="card animate-in pointer-events-auto flex items-start gap-3 px-4 py-3"
            style={{ borderColor: `rgb(${colors[toast.tone] || colors.info} / 0.35)` }}
          >
            <Icon
              size={17}
              className="mt-0.5 shrink-0"
              style={{ color: `rgb(${colors[toast.tone] || colors.info})` }}
            />
            <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded p-0.5 transition-colors hover:bg-white/5"
              style={{ color: 'rgb(var(--text-dim))' }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------- animated number */

export function CountUp({ value = 0, duration = 900, decimals = 0, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const previous = useRef(0)

  useEffect(() => {
    const from = previous.current
    const to = Number(value) || 0
    previous.current = to
    if (from === to) {
      setDisplay(to)
      return
    }
    const start = performance.now()
    let frame
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return (
    <span>
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

export function StatTile({ label, value, icon: Icon, tone = 'accent', suffix = '', decimals = 0, hint }) {
  const tones = {
    accent: 'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    cyan: 'var(--accent-2)',
    pink: 'var(--accent-3)',
  }
  const color = tones[tone] || tones.accent

  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="section-title truncate">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            <CountUp value={value} suffix={suffix} decimals={decimals} />
          </p>
          {hint && (
            <p className="mt-1 text-xs" style={{ color: 'rgb(var(--text-dim))' }}>
              {hint}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `rgb(${color} / 0.14)`, border: `1px solid rgb(${color} / 0.25)` }}
          >
            <Icon size={18} style={{ color: `rgb(${color})` }} />
          </div>
        )}
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, rgb(${color} / 0.5), transparent)` }}
      />
    </Card>
  )
}

/* ------------------------------------------------------------ score ring */

export function ScoreRing({ score = 0, size = 44, stroke = 4 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, Number(score) || 0))
  const offset = circumference - (clamped / 100) * circumference
  const color = clamped >= 80 ? 'var(--success)' : clamped >= 60 ? 'var(--warning)' : 'var(--text-dim)'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="rgb(var(--border))"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke={`rgb(${color})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold"
        style={{ color: `rgb(${color})` }}
      >
        {Math.round(clamped)}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------ tag editor */

export function TagInput({ value = [], onChange, placeholder = 'Type and press Enter' }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (!value.includes(trimmed)) onChange([...value, trimmed])
    setDraft('')
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 rounded-xl p-2"
      style={{ background: 'rgb(var(--bg) / 0.6)', border: '1px solid rgb(var(--border))' }}
    >
      {value.map((tag) => (
        <span key={tag} className="chip chip-accent">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="opacity-60 transition-opacity hover:opacity-100"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add()
          }
          if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={add}
        placeholder={value.length ? '' : placeholder}
        className="min-w-[9rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none"
        style={{ color: 'rgb(var(--text))' }}
      />
    </div>
  )
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={() => onChange(!checked)}
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{
          background: checked
            ? 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))'
            : 'rgb(var(--border-strong))',
        }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium">{label}</span>}
          {description && (
            <span className="mt-0.5 block text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  )
}
