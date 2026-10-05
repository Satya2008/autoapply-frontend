/** Small, pure display helpers. */

const RTF = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) {
    return '—';
  }
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '—';
  }
  const seconds = Math.round((then - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) {
    return seconds <= 0 ? 'just now' : 'in a few seconds';
  }
  if (abs < 3600) {
    return RTF.format(Math.round(seconds / 60), 'minute');
  }
  if (abs < 86_400) {
    return RTF.format(Math.round(seconds / 3600), 'hour');
  }
  if (abs < 30 * 86_400) {
    return RTF.format(Math.round(seconds / 86_400), 'day');
  }
  return dateOnly(iso);
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function dateOnly(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

/** Indian grouping: 12,00,000. */
export function inr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '—';
  }
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function salary(min: number | null, max: number | null, currency: string | null): string | null {
  if (min === null && max === null) {
    return null;
  }
  const fmt = (n: number) => n.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US');
  const unit = currency ? `${currency} ` : '';
  if (min !== null && max !== null && min !== max) {
    return `${unit}${fmt(min)} – ${fmt(max)}`;
  }
  return `${unit}${fmt((min ?? max) as number)}`;
}

export function bytes(n: number): string {
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function usd(n: number | null | undefined, digits = 4): string {
  if (n === null || n === undefined) {
    return '—';
  }
  return '$' + n.toFixed(digits);
}

export function percent(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) {
    return '—';
  }
  return `${(n * 100).toFixed(digits)}%`;
}

export function duration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) {
    return '—';
  }
  if (ms < 1000) {
    return `${ms} ms`;
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)} s`;
  }
  return `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s`;
}

/** "NEEDS_YOU" → "Needs you", "fullName" → "Full name". */
export function humanize(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const words = value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Splits "a, b,  c" into trimmed, distinct, non-empty items, keeping order. */
export function splitList(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[,\n]/)) {
    const item = raw.trim();
    const key = item.toLowerCase();
    if (item && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}
