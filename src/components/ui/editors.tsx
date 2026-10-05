import { Check, Copy, Plus, Trash2, X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { splitList } from '@/lib/format';
import { Button, Input } from './primitives';

/** A list of short strings edited as removable chips; Enter or comma adds, pasting a list adds all. */
export function ChipsInput({ value, onChange, placeholder, max = 100, maxLength = 100 }: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  max?: number;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState('');

  const add = (text: string) => {
    const known = new Set(value.map((v) => v.toLowerCase()));
    const fresh = splitList(text).filter((v) => v.length <= maxLength && !known.has(v.toLowerCase()));
    if (fresh.length) {
      onChange([...value, ...fresh].slice(0, max));
    }
    setDraft('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-900 dark:ring-slate-700">
      {value.map((item) => (
        <span key={item} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
          {item}
          <button type="button" aria-label={`Remove ${item}`} onClick={() => onChange(value.filter((v) => v !== item))} className="hover:text-rose-600">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => draft && add(draft)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          if (/[,\n]/.test(text)) {
            e.preventDefault();
            add(text);
          }
        }}
        placeholder={value.length >= max ? `Limit of ${max} reached` : placeholder}
        disabled={value.length >= max}
        className="min-w-[8rem] flex-1 border-0 bg-transparent p-1 text-sm focus:outline-none focus:ring-0"
      />
    </div>
  );
}

/** A map of string to string, edited as rows. */
export function KeyValueEditor({ value, onChange, keyPlaceholder = 'key', valuePlaceholder = 'value', suggestions }: {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  suggestions?: string[];
}) {
  const rows = Object.entries(value);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const setRow = (oldKey: string, key: string, val: string) => {
    const nextEntries = rows.map(([k, v]) => (k === oldKey ? [key, val] : [k, v]));
    onChange(Object.fromEntries(nextEntries));
  };
  const add = () => {
    if (!newKey.trim()) {
      return;
    }
    onChange({ ...value, [newKey.trim()]: newValue });
    setNewKey('');
    setNewValue('');
  };
  const missing = (suggestions ?? []).filter((s) => !(s in value));

  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <Input value={k} onChange={(e) => setRow(k, e.target.value, v)} className="w-1/3 font-mono text-xs" />
          <Input value={v} onChange={(e) => setRow(k, k, e.target.value)} className="flex-1 font-mono text-xs" />
          <Button variant="ghost" size="sm" aria-label="Remove" onClick={() => onChange(Object.fromEntries(rows.filter(([key]) => key !== k)))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder={keyPlaceholder} className="w-1/3 font-mono text-xs" list={suggestions ? 'kv-suggestions' : undefined} />
        <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={valuePlaceholder} className="flex-1 font-mono text-xs"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
        <Button variant="secondary" size="sm" onClick={add} icon={<Plus className="h-4 w-4" />}>
          Add
        </Button>
      </div>
      {suggestions && (
        <datalist id="kv-suggestions">
          {missing.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-1 text-xs text-slate-500">
          Usual keys not set:
          {missing.map((s) => (
            <button key={s} type="button" className="rounded bg-slate-100 px-1.5 font-mono hover:bg-brand-50 dark:bg-slate-800" onClick={() => setNewKey(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Pretty JSON, scrollable. */
export function JsonView({ value, maxHeight = '24rem' }: { value: unknown; maxHeight?: string }) {
  const text = typeof value === 'string' ? tryPretty(value) : JSON.stringify(value, null, 2);
  return (
    <pre style={{ maxHeight }} className="overflow-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
      {text}
    </pre>
  );
}

function tryPretty(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? 'Copied' : label}
    </Button>
  );
}
