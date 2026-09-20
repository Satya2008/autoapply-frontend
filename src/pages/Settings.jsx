import { useEffect, useState } from 'react'
import { Bell, KeyRound, Save, Settings as SettingsIcon, Target, Zap } from 'lucide-react'
import { authApi, errorMessage } from '../services/api'
import { useApp } from '../store/AppContext'
import { Button, Card, Field, PageHeader, TagInput, Toggle } from '../components/ui'

export default function Settings() {
  const { user, refreshProfile, toast } = useApp()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        autoApplyEnabled: user.autoApplyEnabled ?? false,
        notificationsEnabled: user.notificationsEnabled ?? true,
        dailyApplyLimit: user.dailyApplyLimit ?? '',
        minMatchScore: user.minMatchScore ?? '',
        excludedCompanies: user.excludedCompanies || [],
        excludedKeywords: user.excludedKeywords || [],
      })
    }
  }, [user])

  if (!form) return null

  const save = async () => {
    setSaving(true)
    try {
      await authApi.updateProfile({
        ...form,
        dailyApplyLimit: form.dailyApplyLimit === '' ? null : Number(form.dailyApplyLimit),
        minMatchScore: form.minMatchScore === '' ? null : Number(form.minMatchScore),
      })
      await refreshProfile()
      toast('Preferences saved', 'success')
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setChanging(true)
    try {
      await authApi.changePassword(passwords)
      toast('Password changed. Sign in again on your other devices.', 'success')
      setPasswords({ currentPassword: '', newPassword: '' })
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        icon={SettingsIcon}
        title="Preferences"
        subtitle="How aggressively the system works on your behalf."
        actions={
          <Button icon={Save} loading={saving} onClick={save}>
            Save preferences
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Zap size={15} style={{ color: 'rgb(var(--accent))' }} />
            <h2 className="text-sm font-semibold">Automation</h2>
          </div>
          <div className="space-y-5">
            <Toggle
              checked={form.autoApplyEnabled}
              onChange={(autoApplyEnabled) => setForm({ ...form, autoApplyEnabled })}
              label="Auto apply"
              description="Let the scheduler submit applications to roles that clear your score threshold."
            />
            <Toggle
              checked={form.notificationsEnabled}
              onChange={(notificationsEnabled) => setForm({ ...form, notificationsEnabled })}
              label="Notifications"
              description="Get told when an application goes out or new matches land."
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target size={15} style={{ color: 'rgb(var(--accent-2))' }} />
            <h2 className="text-sm font-semibold">Limits</h2>
          </div>
          <div className="space-y-4">
            <Field
              label="Daily application limit"
              hint="Leave empty to use the system default set by your administrator."
            >
              <input
                className="input"
                type="number"
                min="1"
                max="200"
                placeholder="System default"
                value={form.dailyApplyLimit}
                onChange={(e) => setForm({ ...form, dailyApplyLimit: e.target.value })}
              />
            </Field>
            <Field
              label="Minimum match score"
              hint="Only apply to roles scoring at least this. Higher means fewer, better-fitting applications."
            >
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                placeholder="System default"
                value={form.minMatchScore}
                onChange={(e) => setForm({ ...form, minMatchScore: e.target.value })}
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-1 flex items-center gap-2">
            <Bell size={15} style={{ color: 'rgb(var(--warning))' }} />
            <h2 className="text-sm font-semibold">Exclusions</h2>
          </div>
          <p className="mb-4 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            Anything listed here is skipped before a job is even scored.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Companies to skip">
              <TagInput
                value={form.excludedCompanies}
                onChange={(excludedCompanies) => setForm({ ...form, excludedCompanies })}
                placeholder="Companies you do not want…"
              />
            </Field>
            <Field label="Keywords to skip">
              <TagInput
                value={form.excludedKeywords}
                onChange={(excludedKeywords) => setForm({ ...form, excludedKeywords })}
                placeholder="unpaid, commission only, night shift…"
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={15} style={{ color: 'rgb(var(--danger))' }} />
            <h2 className="text-sm font-semibold">Change password</h2>
          </div>
          <form onSubmit={changePassword} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <Field label="Current password">
                <input
                  className="input"
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                />
              </Field>
            </div>
            <div className="min-w-[14rem] flex-1">
              <Field label="New password">
                <input
                  className="input"
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
              </Field>
            </div>
            <Button type="submit" variant="ghost" loading={changing}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
