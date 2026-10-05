import { RotateCcw, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settings } from '@/api/endpoints';
import type { Setting } from '@/api/types';
import { ChipsInput } from '@/components/ui/editors';
import { ConfirmButton } from '@/components/ui/overlays';
import { Badge, Button, Card, ErrorBox, Input, PageHeader, Spinner, Toggle } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { humanize, splitList, timeAgo } from '@/lib/format';

const TYPE_HINTS: Record<string, string> = {
  CRON: 'Six fields: second minute hour day month weekday, e.g. 0 0 10 * * MON-FRI',
  DURATION: 'e.g. 30m, 2h, 1d',
  DOMAIN_LIST: 'Domains like linkedin.com; subdomains are included',
  SECRET: 'Stored encrypted; the value is never shown again',
};

/** Runtime settings: a change applies at once, on every instance, without a restart. */
export default function SettingsPage() {
  const list = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => settings.list() });
  const groups = useMemo(() => {
    const map = new Map<string, Setting[]>();
    for (const s of list.data ?? []) {
      map.set(s.category, [...(map.get(s.category) ?? []), s]);
    }
    return map;
  }, [list.data]);

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Changed here, used on the next read by every instance (Redis tells the others). Every change is audited." />
      {list.error ? <ErrorBox error={list.error} /> : null}
      {list.isLoading && <Spinner />}
      {[...groups.entries()].map(([category, items]) => (
        <Card key={category} title={humanize(category)} padded={false}>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((s) => <SettingRow key={s.key} setting={s} />)}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function SettingRow({ setting }: { setting: Setting }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [value, setValue] = useState(setting.type === 'SECRET' ? '' : setting.value ?? '');
  const dirty = setting.type === 'SECRET' ? value !== '' : value !== (setting.value ?? '');
  const update = (saved: Setting) => {
    queryClient.setQueryData<Setting[]>(['admin', 'settings'], (all) => all?.map((s) => (s.key === saved.key ? saved : s)));
    setValue(saved.type === 'SECRET' ? '' : saved.value ?? '');
  };
  const save = useMutation({
    mutationFn: (v: string) => settings.update(setting.key, v),
    onSuccess: (saved) => (update(saved), toast.success(`${setting.key} saved`)),
    onError: (e) => toast.error(`${setting.key} not saved`, e),
  });
  const reset = useMutation({
    mutationFn: () => settings.reset(setting.key),
    onSuccess: (saved) => (update(saved), toast.success(`${setting.key} back to default`)),
    onError: (e) => toast.error('Not reset', e),
  });

  let editor;
  switch (setting.type) {
    case 'BOOLEAN':
      editor = <Toggle checked={value === 'true'} onChange={(v) => save.mutate(String(v))} disabled={save.isPending} />;
      break;
    case 'DOMAIN_LIST':
      editor = <ChipsInput value={splitList(value)} onChange={(v) => setValue(v.join(','))} placeholder="add a domain" />;
      break;
    case 'INT':
      editor = <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="max-w-[10rem]" />;
      break;
    case 'SECRET':
      editor = <Input type="password" autoComplete="off" value={value} placeholder={setting.value ? '•••• (set)' : 'not set'} onChange={(e) => setValue(e.target.value)} />;
      break;
    default:
      editor = <Input value={value} className={setting.type === 'CRON' ? 'font-mono' : ''} onChange={(e) => setValue(e.target.value)} />;
  }

  return (
    <li className="grid gap-3 px-4 py-4 md:grid-cols-5">
      <div className="md:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-medium">{setting.key}</span>
          <Badge>{setting.type}</Badge>
          {setting.overridden && <Badge tone="blue">changed</Badge>}
        </div>
        <p className="mt-1 text-xs text-slate-500">{setting.description}</p>
        {setting.overridden && (
          <p className="mt-1 text-xs text-slate-400">
            by {setting.updatedBy ?? 'someone'} {timeAgo(setting.updatedAt)} · default {setting.type === 'SECRET' ? '—' : <code>{setting.defaultValue ?? '—'}</code>}
          </p>
        )}
      </div>
      <div className="md:col-span-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">{editor}</div>
          {setting.type !== 'BOOLEAN' && (
            <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} disabled={!dirty} loading={save.isPending} onClick={() => save.mutate(value)}>
              Save
            </Button>
          )}
          {setting.overridden && (
            <ConfirmButton variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} title={`Reset ${setting.key}?`} message="It goes back to its default value." loading={reset.isPending}
              onConfirm={() => reset.mutate()}>
              Default
            </ConfirmButton>
          )}
        </div>
        {TYPE_HINTS[setting.type] && <p className="mt-1 text-xs text-slate-400">{TYPE_HINTS[setting.type]}</p>}
      </div>
    </li>
  );
}
