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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-[8vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={clsx('w-full rounded-xl bg-white shadow-xl dark:bg-slate-900', wide ? 'max-w-4xl' : 'max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">{footer}</div>}
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
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onMouseDown={onClose}>
      <aside
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-slate-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0 flex-1 text-base font-semibold">{title}</div>
          <div className="flex items-center gap-2">
            {actions}
            <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
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
