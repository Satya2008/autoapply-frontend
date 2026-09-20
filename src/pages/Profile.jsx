import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, FileUp, Github, Globe, Linkedin, Save, Sparkles, User } from 'lucide-react'
import { authApi, errorMessage } from '../services/api'
import { useApp } from '../store/AppContext'
import { Button, Card, Field, PageHeader, TagInput } from '../components/ui'

export default function Profile() {
  const { user, refreshProfile, toast } = useApp()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        location: user.location || '',
        currentRole: user.currentRole || '',
        experienceYears: user.experienceYears ?? '',
        expectedSalary: user.expectedSalary ?? '',
        preferredJobType: user.preferredJobType || '',
        noticePeriod: user.noticePeriod || '',
        linkedinUrl: user.linkedinUrl || '',
        githubUrl: user.githubUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        coverLetterTemplate: user.coverLetterTemplate || '',
        willingToRelocate: user.willingToRelocate ?? false,
        skills: user.skills || [],
        targetRoles: user.targetRoles || [],
        preferredLocations: user.preferredLocations || [],
      })
    }
  }, [user])

  if (!form) return null

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const save = async () => {
    setSaving(true)
    try {
      await authApi.updateProfile({
        ...form,
        experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
        expectedSalary: form.expectedSalary === '' ? null : Number(form.expectedSalary),
      })
      await refreshProfile()
      toast('Profile saved', 'success')
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    toast('Reading your resume…', 'info')
    try {
      const updated = await authApi.uploadResume(file)
      await refreshProfile()
      const count = updated.skills?.length || 0
      toast(`Resume parsed · ${count} skills on your profile`, 'success')
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        icon={User}
        title="Your profile"
        subtitle="Everything matching and auto-apply use to represent you."
        actions={
          <Button icon={Save} loading={saving} onClick={save}>
            Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input className="input" value={form.fullName} onChange={set('fullName')} />
              </Field>
              <Field label="Phone">
                <input className="input" value={form.phone} onChange={set('phone')} placeholder="+91…" />
              </Field>
              <Field label="Current role">
                <input className="input" value={form.currentRole} onChange={set('currentRole')} placeholder="Backend Developer" />
              </Field>
              <Field label="Location">
                <input className="input" value={form.location} onChange={set('location')} placeholder="Bengaluru" />
              </Field>
              <Field label="Experience (years)">
                <input className="input" type="number" min="0" value={form.experienceYears} onChange={set('experienceYears')} />
              </Field>
              <Field label="Expected salary (annual)">
                <input className="input" type="number" min="0" value={form.expectedSalary} onChange={set('expectedSalary')} />
              </Field>
              <Field label="Preferred job type">
                <select className="input" value={form.preferredJobType} onChange={set('preferredJobType')}>
                  <option value="">No preference</option>
                  <option value="FULLTIME">Full time</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
              </Field>
              <Field label="Notice period">
                <input className="input" value={form.noticePeriod} onChange={set('noticePeriod')} placeholder="30 days" />
              </Field>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.willingToRelocate}
                onChange={set('willingToRelocate')}
                className="h-4 w-4 rounded"
              />
              Open to relocating for the right role
            </label>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold">Skills and targets</h2>
            <p className="mb-4 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              These drive the match score. Upload a resume and we fill the skills for you.
            </p>
            <div className="space-y-4">
              <Field label="Skills">
                <TagInput value={form.skills} onChange={(skills) => setForm({ ...form, skills })} placeholder="Java, Spring Boot, Kafka…" />
              </Field>
              <Field label="Target roles">
                <TagInput value={form.targetRoles} onChange={(targetRoles) => setForm({ ...form, targetRoles })} placeholder="Backend Engineer, Java Developer…" />
              </Field>
              <Field label="Preferred locations" hint="Leave empty to consider anywhere">
                <TagInput value={form.preferredLocations} onChange={(preferredLocations) => setForm({ ...form, preferredLocations })} placeholder="Bengaluru, Pune, Remote…" />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold">Cover letter</h2>
            <p className="mb-3 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              Used as-is when AI is off, and as a fallback when a generated letter is unavailable.
            </p>
            <textarea
              className="input min-h-[140px] resize-y font-mono text-xs leading-relaxed"
              value={form.coverLetterTemplate}
              onChange={set('coverLetterTemplate')}
              placeholder="Dear hiring team, …"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold">Resume</h2>
            <p className="mb-4 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              PDF or Word. We extract the text and pick up skills automatically.
            </p>

            {user?.resumeFileName && (
              <div
                className="mb-3 flex items-center gap-2.5 rounded-xl px-3.5 py-3"
                style={{
                  background: 'rgb(var(--success) / 0.08)',
                  border: '1px solid rgb(var(--success) / 0.25)',
                }}
              >
                <CheckCircle2 size={16} style={{ color: 'rgb(var(--success))' }} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{user.resumeFileName}</p>
                  <p className="text-[11px]" style={{ color: 'rgb(var(--text-dim))' }}>
                    Uploaded {new Date(user.resumeUploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => upload(e.target.files?.[0])}
            />
            <Button
              variant="ghost"
              icon={FileUp}
              loading={uploading}
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              {user?.resumeFileName ? 'Replace resume' : 'Upload resume'}
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Links</h2>
            <div className="space-y-3">
              <LinkField icon={Linkedin} label="LinkedIn" value={form.linkedinUrl} onChange={set('linkedinUrl')} />
              <LinkField icon={Github} label="GitHub" value={form.githubUrl} onChange={set('githubUrl')} />
              <LinkField icon={Globe} label="Portfolio" value={form.portfolioUrl} onChange={set('portfolioUrl')} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-2.5">
              <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: 'rgb(var(--accent))' }} />
              <div>
                <p className="text-sm font-medium">Why this matters</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
                  Skills and target roles carry the most weight when scoring a job. The more
                  accurate they are, the fewer irrelevant applications get sent.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function LinkField({ icon: Icon, label, value, onChange }) {
  return (
    <div className="relative">
      <Icon
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: 'rgb(var(--text-dim))' }}
      />
      <input className="input pl-9" placeholder={label} value={value} onChange={onChange} />
    </div>
  )
}
