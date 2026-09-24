import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  FileUp,
  Rocket,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { authApi, errorMessage, matchApi } from '../services/api'
import { useApp } from '../store/AppContext'
import { Button, Card } from './ui'

/**
 * The first-run path. It only appears while something is still missing, and each step
 * can be finished without leaving the dashboard.
 */
export default function Onboarding({ onDone }) {
  const { user, refreshProfile, toast } = useApp()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(null)

  const steps = useMemo(() => {
    const hasResume = Boolean(user?.resumeFileName)
    const hasSkills = (user?.skills?.length || 0) >= 3
    const hasTargets = (user?.targetRoles?.length || 0) >= 1
    const autoOn = Boolean(user?.autoApplyEnabled)

    return [
      {
        id: 'resume',
        icon: FileUp,
        title: 'Upload your resume',
        body: 'We read it and fill in your skills automatically. Everything after this gets easier.',
        done: hasResume,
        action: (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setBusy('resume')
                try {
                  const updated = await authApi.uploadResume(file)
                  await refreshProfile()
                  toast(`Resume read · ${updated.skills?.length || 0} skills picked up`, 'success')
                } catch (error) {
                  toast(errorMessage(error), 'error')
                } finally {
                  setBusy(null)
                  if (fileRef.current) fileRef.current.value = ''
                }
              }}
            />
            <Button icon={FileUp} loading={busy === 'resume'} onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
          </>
        ),
      },
      {
        id: 'skills',
        icon: Sparkles,
        title: 'Check your skills',
        body: hasSkills
          ? `${user.skills.length} skills on your profile.`
          : 'Add at least three skills so matching has something to work with.',
        done: hasSkills,
        action: (
          <Link to="/profile">
            <Button variant="ghost" icon={ArrowRight}>
              Open profile
            </Button>
          </Link>
        ),
      },
      {
        id: 'targets',
        icon: Target,
        title: 'Say what you are looking for',
        body: hasTargets
          ? `Targeting ${user.targetRoles.join(', ')}.`
          : 'Add the job titles you want. This is what we score every posting against.',
        done: hasTargets,
        action: (
          <Link to="/profile">
            <Button variant="ghost" icon={ArrowRight}>
              Set targets
            </Button>
          </Link>
        ),
      },
      {
        id: 'auto',
        icon: Zap,
        title: 'Turn on auto apply',
        body: autoOn
          ? 'Running. Safe sites are applied to for you; the rest come to you ready to send.'
          : 'Once it is on, applications go out on schedule without you doing anything.',
        done: autoOn,
        action: (
          <Button
            loading={busy === 'auto'}
            onClick={async () => {
              setBusy('auto')
              try {
                await authApi.updateProfile({ autoApplyEnabled: true })
                await refreshProfile()
                toast('Auto apply is on', 'success')
              } catch (error) {
                toast(errorMessage(error), 'error')
              } finally {
                setBusy(null)
              }
            }}
          >
            Turn it on
          </Button>
        ),
      },
    ]
  }, [user, busy, refreshProfile, toast])

  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length
  const current = steps.find((s) => !s.done)

  if (allDone) return null

  return (
    <Card className="mb-6 overflow-hidden">
      <div
        className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
        style={{
          background:
            'linear-gradient(120deg, rgb(var(--accent) / 0.12), rgb(var(--accent-2) / 0.08))',
          borderBottom: '1px solid rgb(var(--border))',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))',
            }}
          >
            <Rocket size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Get set up</h2>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              {doneCount} of {steps.length} done · about two minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {steps.map((step) => (
            <span
              key={step.id}
              className="h-1.5 w-10 rounded-full transition-colors"
              style={{
                background: step.done
                  ? 'linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))'
                  : 'rgb(var(--border-strong))',
              }}
            />
          ))}
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
        {steps.map((step) => {
          const isCurrent = step.id === current?.id
          return (
            <div
              key={step.id}
              className="flex flex-wrap items-center gap-4 px-5 py-4"
              style={{ opacity: step.done || isCurrent ? 1 : 0.5 }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: step.done ? 'rgb(var(--success) / 0.14)' : 'rgb(var(--surface-2))',
                  border: `1px solid ${step.done ? 'rgb(var(--success) / 0.3)' : 'rgb(var(--border))'}`,
                }}
              >
                {step.done ? (
                  <Check size={16} style={{ color: 'rgb(var(--success))' }} />
                ) : (
                  <step.icon
                    size={16}
                    style={{ color: isCurrent ? 'rgb(var(--accent))' : 'rgb(var(--text-dim))' }}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="mt-0.5 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                  {step.body}
                </p>
              </div>

              {!step.done && isCurrent && <div className="shrink-0">{step.action}</div>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
