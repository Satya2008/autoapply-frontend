import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Lock, Search, ShieldCheck, Trash2, Unlock, Users } from 'lucide-react'
import { adminApi, errorMessage } from '../../services/api'
import { useApp } from '../../store/AppContext'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Skeleton,
  Toggle,
} from '../../components/ui'

export default function AdminUsers() {
  const { toast, isSuperAdmin, user: me } = useApp()
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [stats, setStats] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await adminApi.users({ q: search || undefined, page, size: 20 }))
    } catch (error) {
      toast(errorMessage(error, 'Could not load users'), 'error')
    } finally {
      setLoading(false)
    }
  }, [search, page, toast])

  useEffect(() => {
    load()
  }, [load])

  const openEditor = async (user) => {
    setEditing(user)
    setNewPassword('')
    setStats(null)
    try {
      setStats(await adminApi.userStats(user.id))
    } catch {
      // stats are supplementary
    }
  }

  const patch = async (changes) => {
    try {
      const updated = await adminApi.updateUser(editing.id, changes)
      setEditing(updated)
      toast('User updated', 'success')
      load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        icon={Users}
        title="Users"
        subtitle={`${data.totalElements?.toLocaleString() || 0} accounts`}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setPage(0)
          setSearch(query)
        }}
        className="mb-5 flex gap-2"
      >
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-dim))' }} />
          <input className="input pl-9" placeholder="Search by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button type="submit" variant="ghost">Search</Button>
      </form>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : data.content.length === 0 ? (
        <Card><EmptyState icon={Users} title="No users found" description="Try a different search." /></Card>
      ) : (
        <Card>
          <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
            {data.content.map((user) => (
              <button
                key={user.id}
                onClick={() => openEditor(user)}
                className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, rgb(var(--accent) / 0.22), rgb(var(--accent-2) / 0.18))',
                    color: 'rgb(var(--accent))',
                  }}
                >
                  {(user.fullName || user.email)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.fullName || '—'}</p>
                  <p className="truncate text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{user.email}</p>
                </div>
                <div className="hidden shrink-0 gap-1.5 sm:flex">
                  {user.role !== 'USER' && <Badge tone="accent"><ShieldCheck size={10} />{user.role.replace('_', ' ')}</Badge>}
                  {user.autoApplyEnabled && <Badge tone="success">auto apply</Badge>}
                  {!user.enabled && <Badge tone="danger">disabled</Badge>}
                  {user.lockedUntil && new Date(user.lockedUntil) > new Date() && <Badge tone="warning"><Lock size={10} />locked</Badge>}
                </div>
                <span className="hidden shrink-0 text-xs sm:block" style={{ color: 'rgb(var(--text-dim))' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {data.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>Page {page + 1} of {data.totalPages}</span>
          <Button variant="ghost" disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.fullName || editing?.email || 'User'}
        footer={
          isSuperAdmin && editing?.email !== me?.email ? (
            <Button variant="danger" icon={Trash2} onClick={() => setDeleting(editing)}>
              Delete account
            </Button>
          ) : null
        }
      >
        {editing && (
          <div className="space-y-5">
            {stats && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Matches', value: stats.totalMatches },
                  { label: 'Applications', value: stats.totalApplications },
                  { label: 'Success rate', value: `${stats.successRate}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: 'rgb(var(--surface-2))' }}>
                    <p className="text-lg font-semibold">{item.value}</p>
                    <p className="text-[11px]" style={{ color: 'rgb(var(--text-dim))' }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            <Field label="Role">
              <select className="input" value={editing.role} onChange={(e) => patch({ role: e.target.value })}>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                {isSuperAdmin && <option value="SUPER_ADMIN">Super admin</option>}
              </select>
            </Field>

            <div className="space-y-4">
              <Toggle
                checked={editing.enabled}
                onChange={(enabled) => patch({ enabled })}
                label="Account enabled"
                description="Disabling signs them out everywhere immediately."
              />
              <Toggle
                checked={editing.autoApplyEnabled}
                onChange={(autoApplyEnabled) => patch({ autoApplyEnabled })}
                label="Auto apply"
                description="Include this user in scheduled apply runs."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Daily apply limit" hint="Empty uses the global default">
                <input
                  className="input"
                  type="number"
                  defaultValue={editing.dailyApplyLimit ?? ''}
                  onBlur={(e) => patch({ dailyApplyLimit: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </Field>
              <Field label="Minimum match score" hint="Empty uses the global default">
                <input
                  className="input"
                  type="number"
                  defaultValue={editing.minMatchScore ?? ''}
                  onBlur={(e) => patch({ minMatchScore: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </Field>
            </div>

            {editing.lockedUntil && new Date(editing.lockedUntil) > new Date() && (
              <Button
                variant="ghost"
                icon={Unlock}
                onClick={async () => {
                  await adminApi.unlockUser(editing.id)
                  toast('Account unlocked', 'success')
                  setEditing({ ...editing, lockedUntil: null })
                  load()
                }}
              >
                Unlock account
              </Button>
            )}

            {isSuperAdmin && (
              <div>
                <p className="label">Reset password</p>
                <div className="flex gap-2">
                  <input
                    className="input"
                    type="text"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    icon={KeyRound}
                    disabled={!newPassword}
                    onClick={async () => {
                      try {
                        await adminApi.resetUserPassword(editing.id, newPassword)
                        toast('Password reset', 'success')
                        setNewPassword('')
                      } catch (error) {
                        toast(errorMessage(error), 'error')
                      }
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this account?"
        message={`${deleting?.email} and all of their data will be removed. This cannot be undone.`}
        confirmLabel="Delete permanently"
        onConfirm={async () => {
          try {
            await adminApi.deleteUser(deleting.id)
            toast('Account deleted', 'success')
            setDeleting(null)
            setEditing(null)
            load()
          } catch (error) {
            toast(errorMessage(error), 'error')
          }
        }}
      />
    </div>
  )
}
