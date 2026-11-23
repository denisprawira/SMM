import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, Outlet, useNavigate, useRouterState, useSearch } from '@tanstack/react-router'
import { ArrowRight, Check, ChevronLeft, Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { accountsQueryOptions, driveFilesQueryOptions, useSaveDraft, useSchedulePosts, type ScheduleResult } from './api'
import { SuccessDialog, type SuccessAction } from './components/success-dialog'
import { StepBars, Stepper } from './components/stepper'
import { draftStore, markVisited, setShowErrors, useDraft, type Draft } from './draft-store'
import {
  orderedTargets,
  postTitle,
  scheduleError,
  selectedMedia,
  stepComplete,
  stepFromPath,
  stepIndex,
  STEPS,
  targetIssues,
  targetLabel,
  targetsByPlatform,
  targetTimes,
  WORKSPACE_TZ,
  type StepId,
} from './model'

/**
 * Full-screen Create Post flow (outside the app sidebar). Figma "Flow header"
 * (60px: close + title + autosave state, stepper, Save draft), step body,
 * "Flow footer" (64px: Back/Cancel, "Step n of 5", Continue). Mobile (M05):
 * 52px app header, step header with progress bars, sticky footer.
 */
export function CreatePostLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const step = stepFromPath(pathname)
  const draft = useDraft()
  const { mutate: saveDraft, isPending: saving } = useSaveDraft()
  const [saved, setSaved] = useState<Draft>(() => draftStore.get())
  const [result, setResult] = useState<ScheduleResult | null>(null)
  const navigate = useNavigate()

  // Autosave: persist the draft 800ms after the last change.
  useEffect(() => {
    if (!draft.touched || draft === saved) return
    const t = setTimeout(() => saveDraft({ draft }, { onSuccess: () => setSaved(draft) }), 800)
    return () => clearTimeout(t)
  }, [draft, saved, saveDraft])

  const saveNow = () => saveDraft({ draft, manual: true }, { onSuccess: () => setSaved(draft) })
  const saveState = !draft.touched ? null : saving || draft !== saved ? 'Saving…' : 'Draft saved'

  const onSuccessAction = (action: SuccessAction) => {
    const to = action === 'create-another' ? '/create/media' : action === 'monitoring' ? '/monitoring' : action === 'calendar' ? '/calendar' : '/'
    setResult(null)
    void navigate({ to }).then(() => {
      draftStore.reset()
      setSaved(draftStore.get())
    })
  }

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      {/* Desktop / tablet header */}
      <header className="hidden h-[60px] shrink-0 items-center border-b bg-background px-5 md:flex">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5 xl:w-[340px]">
          <Button asChild variant="ghost" size="icon" aria-label="Close" className="text-muted-foreground">
            <Link to="/">
              <X />
            </Link>
          </Button>
          <p className="text-h3 whitespace-nowrap text-foreground">Create post</p>
          {saveState && (
            <p aria-live="polite" className="text-caption whitespace-nowrap text-tertiary">
              {saveState}
            </p>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center px-4">
          <Stepper current={step} draft={draft} />
        </div>
        <div className="flex shrink-0 items-center justify-end xl:w-[340px]">
          <Button variant="ghost" size="sm" onClick={saveNow} disabled={!draft.touched}>
            Save draft
          </Button>
        </div>
      </header>

      {/* Mobile header + step header */}
      <header className="shrink-0 bg-background md:hidden">
        <div className="flex h-[52px] items-center gap-2 border-b pr-3 pl-2">
          <Button asChild variant="ghost" size="icon-lg" aria-label="Close" className="text-foreground">
            <Link to="/">
              <X className="size-5" />
            </Link>
          </Button>
          <p className="text-h3 text-foreground">Create post</p>
        </div>
        <div className={cn('flex flex-col gap-2 px-4 pt-2.5', step === 'customize' ? 'pb-2' : 'border-b pb-3')}>
          <div className="flex w-full items-center gap-2 text-caption font-medium">
            <p className="whitespace-nowrap text-primary-text">
              Step {stepIndex(step) + 1} of {STEPS.length}
            </p>
            <p className="truncate text-muted-foreground">· {STEPS[stepIndex(step)].title}</p>
            <div className="flex-1" />
            <button type="button" onClick={saveNow} disabled={!draft.touched} className="whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:underline disabled:opacity-50">
              {saving ? 'Saving…' : 'Save draft'}
            </button>
          </div>
          <StepBars current={step} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Outlet />
      </div>

      <FlowFooter step={step} draft={draft} onScheduled={setResult} />
      <SuccessDialog result={result} timezone={draft.schedule?.timezone ?? WORKSPACE_TZ} onAction={onSuccessAction} />
    </div>
  )
}

function FlowFooter({ step, draft, onScheduled }: { step: StepId; draft: Draft; onScheduled: (r: ScheduleResult) => void }) {
  const navigate = useNavigate()
  const search: { target?: string } = useSearch({ strict: false })
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions)
  const { data: files } = useSuspenseQuery(driveFilesQueryOptions)
  const schedule = useSchedulePosts()
  const index = stepIndex(step)
  const prev = index > 0 ? STEPS[index - 1] : null
  const targets = orderedTargets(draft, accounts)
  const n = targets.length
  const blocked = (step === 'media' || step === 'accounts') && !stepComplete(draft, step)

  const submit = () => {
    const s = draft.schedule
    if (!s) return
    const times = s.mode === 'schedule' ? targetTimes(s, targets) : null
    const payload: ScheduleResult = {
      title: postTitle(selectedMedia(draft, files)),
      mode: s.mode,
      jobs: targets.map((t) => {
        const time = times?.find((x) => x.account.id === t.id)
        return { id: t.id, accountId: t.id, platform: t.platform, label: targetLabel(t), at: time ? time.instant.toISOString() : null, minutes: time?.minutes ?? null }
      }),
    }
    schedule.mutate(payload, { onSuccess: onScheduled })
  }

  const next = () => {
    switch (step) {
      case 'media':
        return void navigate({ to: '/create/accounts' })
      case 'accounts':
        return void navigate({ to: '/create/customize' })
      case 'customize': {
        if (search.target && search.target !== 'shared') markVisited(search.target)
        const invalid = targetsByPlatform(draft, accounts).find((t) => targetIssues(draft, t.id).errors.length > 0)
        if (invalid) {
          setShowErrors(true)
          toast.error(targetIssues(draft, invalid.id).errors[0], { description: `Fix ${invalid.platform === 'youtube' ? 'YouTube' : targetLabel(invalid)} before scheduling.` })
          return void navigate({ to: '/create/customize', search: { target: invalid.id } })
        }
        setShowErrors(false)
        return void navigate({ to: '/create/schedule' })
      }
      case 'schedule': {
        const error = scheduleError(draft.schedule)
        if (error) {
          setShowErrors(true)
          return void toast.error(error, { description: 'Posts can’t be scheduled in the past.' })
        }
        setShowErrors(false)
        return void navigate({ to: '/create/review' })
      }
      case 'review':
        return submit()
    }
  }

  const nowMode = draft.schedule?.mode === 'now'
  const label = step === 'schedule' ? 'Review' : step === 'review' ? `${nowMode ? 'Publish' : 'Schedule'} ${n} ${n === 1 ? 'post' : 'posts'}` : 'Continue'
  const Icon = step === 'review' ? (nowMode ? Send : Check) : ArrowRight
  const done = schedule.isSuccess

  return (
    <footer className="flex shrink-0 items-center gap-2.5 border-t bg-background px-4 pt-3 pb-7 md:h-16 md:px-5 md:py-0">
      {prev ? (
        <Button asChild variant="outline">
          <Link to={prev.to}>
            <ChevronLeft />
            Back
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link to="/">Cancel</Link>
        </Button>
      )}
      <div className="hidden flex-1 md:block" />
      <p className="hidden text-body-sm whitespace-nowrap text-tertiary md:block">
        Step {index + 1} of {STEPS.length}
      </p>
      <Button className="min-w-0 flex-1 md:flex-none" disabled={blocked || schedule.isPending || done} onClick={next}>
        {schedule.isPending ? <Spinner /> : <Icon />}
        {schedule.isPending ? (nowMode ? 'Publishing…' : 'Scheduling…') : label}
      </Button>
    </footer>
  )
}
