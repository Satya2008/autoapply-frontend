import { ArrowLeft, Ban, CheckCircle2, KeyRound, ShieldCheck, ShieldOff, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUsers } from '@/api/endpoints';
import { useSession } from '@/app/session';
import { StatusBadge } from '@/components/domain';
import { CopyButton } from '@/components/ui/editors';
import { ConfirmButton } from '@/components/ui/overlays';
import { Badge, Card, ErrorBox, KeyValue, Notice, PageHeader, Spinner, Stat, Table, Td } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { dateTime, timeAgo } from '@/lib/format';

/** One user, read-only, with the few things an admin may change. */
export default function UserDetailPage() {
  const { id } = useParams();
  const { user: me } = useSession();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [temporary, setTemporary] = useState<string | null>(null);
  const detail = useQuery({ queryKey: ['admin', 'users', id], queryFn: () => adminUsers.get(id as string) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const setStatus = useMutation({
    mutationFn: (status: 'ACTIVE' | 'DISABLED') => adminUsers.setStatus(id as string, status),
    onSuccess: (u) => (toast.success(u.status === 'ACTIVE' ? 'User enabled' : 'User disabled and signed out'), refresh()),
    onError: (e) => toast.error('Could not change the status', e),
  });
  const setRole = useMutation({
    mutationFn: (role: 'USER' | 'ADMIN') => adminUsers.setRole(id as string, role),
    onSuccess: (u) => (toast.success(u.role === 'ADMIN' ? 'Now an admin' : 'Now a regular user'), refresh()),
    onError: (e) => toast.error('Could not change the role', e),
  });
  const reset = useMutation({
    mutationFn: () => adminUsers.resetPassword(id as string),
    onSuccess: (r) => (setTemporary(r.temporaryPassword), refresh()),
    onError: (e) => toast.error('Could not reset the password', e),
  });

  const d = detail.data;
  const u = d?.user;
  const self = u?.id === me?.id;
  return (
    <div className="space-y-5">
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Users
      </Link>
      {detail.isLoading && <Spinner />}
      {detail.error ? <ErrorBox error={detail.error} /> : null}
      {d && u && (
        <>
          <PageHeader
            icon={<User />}
            title={u.name || u.email}
            subtitle={`${u.email} · joined ${dateTime(u.createdAt)}`}
            actions={
              <>
                {u.role === 'ADMIN' ? <Badge tone="violet">Admin</Badge> : <Badge tone="slate">User</Badge>}
                {u.status === 'ACTIVE' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}
              </>
            }
          />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Last sign-in" value={u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'never'} />
            <Stat label="Matches" value={d.matches < 0 ? '—' : d.matches} />
            <Stat label="Waiting for them" value={u.needsYou} />
            <Stat label="Applications sent" value={u.applied} />
          </div>

          {temporary && (
            <Notice tone="amber">
              <div className="flex flex-wrap items-center gap-2">
                Temporary password (shown once): <code className="rounded bg-white px-2 py-0.5 font-mono">{temporary}</code>
                <CopyButton text={temporary} label="Copy" />
              </div>
              <div className="mt-1 text-xs">Pass it on privately. They must choose their own password at their next sign-in.</div>
            </Notice>
          )}

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Card title="Profile">
                <KeyValue
                  items={[
                    ['Current title', d.profile.currentTitle ?? '—'],
                    ['Experience', d.profile.experienceYears != null ? `${d.profile.experienceYears} years` : '—'],
                    ['Location', d.profile.location ?? '—'],
                    ['Looking for', d.profile.targetRoles.join(', ') || '—'],
                    ['Preferred places', d.profile.preferredLocations.join(', ') || '—'],
                    ['Resume', d.resumeFileName ?? 'not uploaded'],
                    ['Auto apply', d.profile.autoApplyEnabled ? `on, ${d.profile.dailyApplyLimit} a day` : 'off'],
                  ]}
                />
                {d.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.skills.map((s) => <Badge key={s.name}>{s.name}</Badge>)}
                  </div>
                )}
              </Card>
              <Card title="Recent applications" padded={false}>
                <Table head={['Job', 'Status', 'Score', 'When']} empty={d.recentApplications.length === 0 ? 'No applications yet.' : undefined}>
                  {d.recentApplications.map((a) => (
                    <tr key={a.id}>
                      <Td>
                        <div className="font-semibold">{a.title}</div>
                        <div className="text-xs text-slate-500">{a.company}</div>
                      </Td>
                      <Td><StatusBadge status={a.status} /></Td>
                      <Td className="tabular-nums">{a.matchScore}</Td>
                      <Td className="text-xs">{timeAgo(a.createdAt)}</Td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </div>

            <Card title="Manage">
              {self ? (
                <p className="text-sm text-slate-500">This is your own account. Another admin can manage it.</p>
              ) : (
                <div className="space-y-3">
                  {u.status === 'ACTIVE' ? (
                    <ConfirmButton variant="danger" size="md" icon={<Ban className="h-4 w-4" />} loading={setStatus.isPending}
                      title="Disable this user?" message="They are signed out everywhere and can't sign in until enabled again."
                      onConfirm={() => setStatus.mutate('DISABLED')}>
                      Disable
                    </ConfirmButton>
                  ) : (
                    <ConfirmButton variant="primary" size="md" icon={<CheckCircle2 className="h-4 w-4" />} loading={setStatus.isPending}
                      title="Enable this user?" message="They can sign in again." onConfirm={() => setStatus.mutate('ACTIVE')}>
                      Enable
                    </ConfirmButton>
                  )}
                  {u.role === 'ADMIN' ? (
                    <ConfirmButton variant="secondary" size="md" icon={<ShieldOff className="h-4 w-4" />} loading={setRole.isPending}
                      title="Remove admin rights?" message="They keep their account but lose the admin console." onConfirm={() => setRole.mutate('USER')}>
                      Make regular user
                    </ConfirmButton>
                  ) : (
                    <ConfirmButton variant="secondary" size="md" icon={<ShieldCheck className="h-4 w-4" />} loading={setRole.isPending}
                      title="Make this user an admin?" message="They can see every user and change the whole system." onConfirm={() => setRole.mutate('ADMIN')}>
                      Make admin
                    </ConfirmButton>
                  )}
                  <ConfirmButton variant="secondary" size="md" icon={<KeyRound className="h-4 w-4" />} loading={reset.isPending}
                    title="Give a temporary password?" message="Their current password stops working and they are signed out everywhere."
                    onConfirm={() => reset.mutate()}>
                    Reset password
                  </ConfirmButton>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
