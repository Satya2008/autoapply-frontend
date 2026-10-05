import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ai } from '@/api/endpoints';
import { Card, EmptyState, ErrorBox, Field, Input, PageHeader, Select, Spinner, Stat, Table, Td } from '@/components/ui/primitives';
import { usd } from '@/lib/format';

const GROUPS = [
  ['provider', 'Provider'],
  ['model', 'Model'],
  ['purpose', 'Purpose (prompt)'],
  ['user', 'User'],
  ['day', 'Day'],
] as const;

function isoDay(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export default function AiUsagePage() {
  const [groupBy, setGroupBy] = useState<string>('provider');
  const [from, setFrom] = useState(isoDay(-30));
  const [to, setTo] = useState(isoDay(1));
  const usage = useQuery({
    queryKey: ['admin', 'ai-usage', groupBy, from, to],
    queryFn: () => ai.usage(groupBy, `${from}T00:00:00Z`, `${to}T00:00:00Z`),
  });
  const rows = usage.data ?? [];
  const totals = rows.reduce(
    (t, r) => ({ calls: t.calls + r.calls, failed: t.failed + r.failed, cost: t.cost + r.costUsd, tokens: t.tokens + r.tokensIn + r.tokensOut }),
    { calls: 0, failed: 0, cost: 0, tokens: 0 },
  );
  const chartRows = groupBy === 'day' ? [...rows].sort((a, b) => a.group.localeCompare(b.group)) : rows.slice(0, 15);

  return (
    <div className="space-y-5">
      <PageHeader title="AI usage & cost" subtitle="Every AI call is recorded with its tokens, cost and latency, usable answer or not. Each user also has a daily budget." />
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Group by">
            <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              {GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To (exclusive)">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Calls" value={totals.calls} />
        <Stat label="Failed" value={totals.failed} tone={totals.failed ? 'warn' : 'default'} />
        <Stat label="Tokens" value={totals.tokens.toLocaleString('en-IN')} />
        <Stat label="Cost" value={usd(totals.cost, 4)} tone="good" />
      </div>
      {usage.error ? <ErrorBox error={usage.error} /> : null}
      {usage.isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No AI calls in this period">Add a provider with a key, then match or write a letter.</EmptyState>
      ) : (
        <>
          <Card title="Cost">
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="group" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip formatter={(v: number) => usd(v, 6)} />
                  <Bar dataKey="costUsd" name="Cost" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card padded={false}>
            <Table head={[GROUPS.find(([v]) => v === groupBy)?.[1] ?? 'Group', 'Calls', 'Failed', 'Tokens in', 'Tokens out', 'Cost', 'Avg latency']}>
              {rows.map((r) => (
                <tr key={r.group}>
                  <Td className="font-mono text-xs">{r.group}</Td>
                  <Td>{r.calls}</Td>
                  <Td className={r.failed ? 'text-rose-600' : ''}>{r.failed}</Td>
                  <Td>{r.tokensIn.toLocaleString('en-IN')}</Td>
                  <Td>{r.tokensOut.toLocaleString('en-IN')}</Td>
                  <Td>{usd(r.costUsd, 6)}</Td>
                  <Td>{r.averageLatencyMs} ms</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
