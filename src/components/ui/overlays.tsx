import clsx from 'clsx';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './primitives';

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, children, footer, wide }: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEscape(open, onClose);
  if (!open) {
    return null;
  }
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/50 p-4 pt-[8vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={clsx('w-full animate-fade-up rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 dark:bg-ink-900 dark:ring-white/10', wide ? 'max-w-4xl' : 'max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-6 py-3.5 dark:border-white/5 dark:bg-white/[0.02]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, actions }: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) {
    return null;
  }
  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/40 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-ink-900"
        style={{ animation: 'drawer-in 0.22s ease-out' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-white/5">
          <div className="min-w-0 flex-1 text-lg font-bold tracking-tight">{title}</div>
          <div className="flex items-center gap-2">
            {actions}
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

/** A button that asks before doing something that can't be undone. */
export function ConfirmButton({ onConfirm, title, message, children, variant = 'danger', size = 'sm', loading, icon, confirmLabel = 'Yes, do it' }: {
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  children: ReactNode;
  variant?: 'danger' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} loading={loading} icon={icon} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <div className="text-sm text-slate-600 dark:text-slate-300">{message}</div>
      </Modal>
    </>
  );
}
