import type { KeyboardEvent, ReactNode } from 'react';
import { useId } from 'react';
import type { SuggestFn } from './suggestions';
import { SuggestionList, useSuggestions } from './suggestions';

/** A text input that offers suggestions as you type; picking one fills the input. */
export function Autocomplete({ value, onChange, fetch, queryKey, placeholder, icon, minChars = 2, inputClassName, ariaLabel, onKeyDown, maxLength }: {
  value: string;
  onChange: (value: string) => void;
  fetch: SuggestFn;
  queryKey: string;
  placeholder?: string;
  icon?: ReactNode;
  minChars?: number;
  inputClassName?: string;
  ariaLabel: string;
  /** Keys the suggestion list didn't use, e.g. Enter to submit what was typed. */
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  maxLength?: number;
}) {
  const listId = useId();
  const s = useSuggestions({
    fetch,
    queryKey,
    text: value,
    minChars,
    onPick: (picked) => {
      onChange(picked.label);
      s.close();
    },
  });

  return (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={s.shown}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          s.open();
          s.setActive(-1);
        }}
        onFocus={s.open}
        onBlur={s.close}
        maxLength={maxLength}
        onKeyDown={(e) => {
          if (!s.onKeyDown(e)) {
            onKeyDown?.(e);
          }
        }}
      />
      <SuggestionList id={listId} items={s.items} active={s.active} typed={value} shown={s.shown} onPick={s.pick} onHover={s.setActive} />
    </div>
  );
}
