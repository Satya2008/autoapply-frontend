import clsx from 'clsx';
import { Briefcase, MapPin, Sparkles } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Suggestion } from '@/api/types';
import { useDebounced } from '@/app/hooks';

const KIND_ICON: Record<Suggestion['kind'], ReactNode> = {
  place: <MapPin className="h-4 w-4" />,
  skill: <Sparkles className="h-4 w-4" />,
  title: <Briefcase className="h-4 w-4" />,
};

export type SuggestFn = (q: string) => Promise<Suggestion[]>;

/**
 * Suggestions for what is being typed, asked once typing pauses, plus the keyboard state of
 * the list: arrow keys move, Enter picks, Escape closes.
 */
export function useSuggestions({ fetch, queryKey, text, minChars = 2, exclude = [], onPick }: {
  fetch?: SuggestFn;
  queryKey: string;
  text: string;
  minChars?: number;
  exclude?: string[];
  onPick: (s: Suggestion) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const typed = useDebounced(text.trim(), 200);
  const enabled = !!fetch && typed.length >= minChars;
  const query = useQuery({
    queryKey: ['suggest', queryKey, typed],
    queryFn: () => fetch!(typed),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
  const skip = new Set(exclude.map((e) => e.toLowerCase()));
  const items = enabled ? (query.data ?? []).filter((s) => !skip.has(s.label.toLowerCase())) : [];
  const shown = open && items.length > 0 && text.trim().length >= minChars;

  const pick = (s: Suggestion) => {
    onPick(s);
    setActive(-1);
  };

  /** Returns true when the key was used by the list. */
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): boolean => {
    if (!shown) {
      return false;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
      return true;
    }
    if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(items[active]);
      return true;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return true;
    }
    return false;
  };

  return { items, shown, active, setActive, open: () => setOpen(true), close: () => setOpen(false), pick, onKeyDown };
}

export function SuggestionList({ id, items, active, typed, shown, onPick, onHover }: {
  id: string;
  items: Suggestion[];
  active: number;
  typed: string;
  shown: boolean;
  onPick: (s: Suggestion) => void;
  onHover: (i: number) => void;
}) {
  return (
    <AnimatePresence>
      {shown && (
        <motion.ul
          id={id}
          role="listbox"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 dark:bg-ink-800 dark:ring-white/10"
        >
          {items.map((s, i) => (
            <li
              key={`${s.kind}-${s.label}`}
              role="option"
              aria-selected={i === active}
              // keep focus in the input so the click lands before blur closes the list
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(s)}
              onMouseEnter={() => onHover(i)}
              className={clsx(
                'flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm',
                i === active ? 'bg-brand-50 text-brand-800 dark:bg-white/10 dark:text-white' : 'text-slate-700 dark:text-slate-200',
              )}
            >
              <span className={clsx('shrink-0', i === active ? 'text-brand-500' : 'text-slate-400')}>{KIND_ICON[s.kind]}</span>
              <span className="min-w-0 flex-1 truncate">
                <Highlight text={s.label} typed={typed} />
              </span>
              {s.count != null && (
                <span className="shrink-0 rounded-md bg-slate-100 px-1.5 text-xs tabular-nums text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  {s.count} {s.count === 1 ? 'job' : 'jobs'}
                </span>
              )}
            </li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}

/** Bolds the part of the label that starts a word with what was typed. */
function Highlight({ text, typed }: { text: string; typed: string }) {
  const lower = text.toLowerCase();
  const t = typed.trim().toLowerCase();
  let at = t ? lower.indexOf(t) : -1;
  while (at > 0 && /[\p{L}\p{N}]/u.test(lower[at - 1])) {
    at = lower.indexOf(t, at + 1);
  }
  if (at < 0) {
    return <>{text}</>;
  }
  return (
    <>
      {text.slice(0, at)}
      <b className="font-bold">{text.slice(at, at + t.length)}</b>
      {text.slice(at + t.length)}
    </>
  );
}
