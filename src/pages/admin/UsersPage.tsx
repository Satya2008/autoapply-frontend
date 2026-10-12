import { ChevronRight, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminUsers } from '@/api/endpoints';
import { Badge, Card, EmptyState, ErrorBox, Input, PageHeader, Spinner, Stat, Table, Td } from '@/components/ui/primitives';
import { dateTime, timeAgo } from '@/lib/format';

/** Every user and how far they got: the admin's monitoring page. */
export default function UsersPage() {
  const list = useQuery({ queryKey: ['admin', 'users'], queryFn: adminUsers.list });
  const [search, setSearch] = useState('');
  const users = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list.data ?? []).filter((u) => !q || u.email.toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q));
  }, [list.data, search]);
  const all = list.data ?? [];
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;

  return (
    <div className="space-y-5">
      <PageHeader icon={<Users />} title="Users" subtitle="Everyone using NaukriRadar: who is active, and how far each one got." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Users" value={all.length} loading={list.isLoading} />
        <Stat label="Active this week" value={all.filter((u) => u.lastLoginAt && Date.parse(u.lastLoginAt) > weekAgo).length} loading={list.isLoading} />
        <Stat label="With a resume" value={all.filter((u) => u.hasResume).length} loading={list.isLoading} />
        <Stat label="Applications sent" value={all.reduce((n, u) => n + u.applied, 0)} loading={list.isLoading} />
      </div>
      <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      {list.error ? <ErrorBox error={list.error} onRetry={() => list.refetch()} /> : null}
      {list.isLoading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <Card><EmptyState title="No users found" icon={<Users />} /></Card>
      ) : (
        <Card padded={false}>
          <Table head={['User', 'Role', 'Status', 'Last sign-in', 'Resume', 'Skills', 'Applications', 'Waiting', 'Sent', '']}>
            {users.map((u) => (
              <tr key={u.id}>
                <Td>
                  <div className="font-semibold">{u.name || '—'}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </Td>
                <Td>{u.role === 'ADMIN' ? <Badge tone="violet">Admin</Badge> : <Badge tone="slate">User</Badge>}</Td>
                <Td>
                  {u.status === 'ACTIVE' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}
                  {!u.hasPassword && <div className="mt-1 text-xs text-amber-700">No password yet</div>}
                </Td>
                <Td className="whitespace-nowrap text-xs" title={u.lastLoginAt ? dateTime(u.lastLoginAt) : ''}>
                  {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'never'}
                  <div className="text-slate-400">joined {timeAgo(u.createdAt)}</div>
                </Td>
                <Td>{u.hasResume ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">No</Badge>}</Td>
                <Td className="tabular-nums">{u.skills}</Td>
                <Td className="tabular-nums">{u.applications}</Td>
                <Td className="tabular-nums">{u.needsYou}</Td>
                <Td className="tabular-nums">{u.applied}</Td>
                <Td>
                  <Link to={`/admin/users/${u.id}`} className="link">
                    Open <ChevronRight className="h-4 w-4" />
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}
