import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate, type ErrorComponentProps } from '@tanstack/react-router'
import { Ban, CircleAlert, ExternalLink, Folder, Pencil, RefreshCw, RotateCcw, SearchX, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GoogleDriveLogo } from '@/components/brand'
import { EmptyState } from '@/components/empty-state'
import { PlatformLogo } from '@/components/platform-logo'
import { StatusPill } from '@/components/status-pill'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { PLATFORM_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ACCOUNTS,
  buildTimeline,
  driveUrl,
  fileMeta,
  formatSize,
  jobDetailQueryOptions,
  publishedLabel,
  scheduledLabel,
  useCancelTargets,
  useRetryTargets,
  type JobPost,
  type JobTarget,
  type TimelineEvent,
} from '../api'
import { useOpenJob } from '../hooks'
import { PostMenu } from './job-parts'

const route = getRouteApi('/_app/monitoring/$jobId')

/** Sheet chrome shared by the drawer, its pending and its error state. Closing animates out, then returns to the list. */
function DrawerFrame({ children, label }: { children: ReactNode; label?: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const onOpenChange = (next: boolean) => {
    if (next) return
    setOpen(false)
    timer.current = window.setTimeout(() => navigate({ to: '/monitoring', search: true }), 300)
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-label={label} showCloseButton={false} className="w-full gap-0 border-l-0 sm:max-w-[500px]">
        {children}
      </SheetContent>
    </Sheet>
  )
}

function CloseButton() {
  return (
    <SheetClose asChild>
      <Button variant="ghost" size="icon" aria-label="Close">
        <X />
      </Button>
    </SheetClose>
  )
}

/** `/monitoring/$jobId` — Figma 12 "Post Monitoring · Job details (drawer)". */
export function JobDrawerRoute() {
  const { jobId } = route.useParams()
  const { data } = useSuspenseQuery(jobDetailQueryOptions(jobId))
  const { post, focusId } = data
  const focus = post.targets.find((t) => t.id === focusId) ?? post.targets[0]
  const ordered = [focus, ...post.targets.filter((t) => t.id !== focus.id)]

  return (
    <DrawerFrame>
      <SheetHeader className="flex-row items-center gap-2.5 border-b px-5 py-4">
        <Thumbnail tone={post.tone} ratio={1} className="size-10 rounded-md" />
        <div className="flex min-w-0 flex-col gap-px">
          <SheetTitle className="truncate text-h3 text-foreground">{post.title}</SheetTitle>
          <SheetDescription className="truncate text-caption text-tertiary">
            {post.day == null ? 'Draft' : `Scheduled ${scheduledLabel(post)}`} · by {post.createdBy}
          </SheetDescription>
        </div>
        <div className="flex-1" />
        <PostMenu post={post} showDetails={false} size="icon" />
        <CloseButton />
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
        <div className="flex items-center gap-2 rounded-lg bg-subtle px-2.5 py-2">
          <GoogleDriveLogo size={14} />
          <p className="min-w-0 truncate text-caption font-medium text-muted-foreground">{fileMeta(post)}</p>
          <div className="flex-1" />
          <Button asChild variant="ghost" size="sm">
            <a href={driveUrl(post)} target="_blank" rel="noreferrer">
              <ExternalLink />
              Open in Drive
            </a>
          </Button>
        </div>

        <h3 className="text-overline text-tertiary uppercase">Targets</h3>
        {ordered.map((t) => (
          <TargetCard key={t.id} post={post} target={t} focused={t.id === focus.id} />
        ))}

        <h3 className="text-overline text-tertiary uppercase">{PLATFORM_LABEL[focus.platform]} job timeline</h3>
        <Timeline events={buildTimeline(post, focus)} />
      </div>
    </DrawerFrame>
  )
}

/* ── Target cards ──────────────────────────────────────────────────── */

/** "159 of 248 MB" · "0.9 of 1.8 GB". */
function streamed(post: JobPost, pct: number) {
  const done = (post.sizeMb * pct) / 100
  return `${post.sizeMb >= 1024 ? (done / 1024).toFixed(1) : Math.round(done)} of ${formatSize(post.sizeMb)}`
}

function TargetCard({ post, target, focused }: { post: JobPost; target: JobTarget; focused: boolean }) {
  const openJob = useOpenJob()
  const account = ACCOUNTS[target.account]
  const identity = (
    <>
      <PlatformLogo platform={target.platform} size={22} />
      <span className="flex min-w-0 flex-col text-left">
        <span className="truncate text-body-sm font-medium text-foreground">{account.handle}</span>
        <span className="truncate text-caption text-tertiary">{PLATFORM_LABEL[target.platform]}</span>
      </span>
    </>
  )
  return (
    <section
      aria-label={`${PLATFORM_LABEL[target.platform]} · ${account.handle}`}
      className={cn('shrink-0 overflow-hidden rounded-[10px] border', target.status === 'failed' ? 'border-danger' : focused && 'border-strong')}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {focused ? (
          <div className="flex min-w-0 items-center gap-2.5">{identity}</div>
        ) : (
          <button
            type="button"
            onClick={() => openJob(target.id, true)}
            title="Show this job’s timeline"
            className="flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            {identity}
          </button>
        )}
        <div className="flex-1" />
        <StatusPill status={target.status} />
      </div>
      <TargetCardBody post={post} target={target} />
    </section>
  )
}

function TargetCardBody({ post, target }: { post: JobPost; target: JobTarget }) {
  const retry = useRetryTargets()
  const cancel = useCancelTargets()
  const platform = PLATFORM_LABEL[target.platform]
  const cancelButton = (
    <Button variant="ghost" size="sm" onClick={() => cancel.mutate([target.id])}>
      <Ban />
      Cancel target
    </Button>
  )

  if (target.status === 'failed' && target.error) {
    const e = target.error
    return (
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        <div className="flex flex-col gap-1.5 rounded-lg bg-danger-subtle p-3">
          <p className="flex items-center gap-1.5 text-body-sm font-medium text-danger-text">
            <CircleAlert aria-hidden className="size-3.5 shrink-0 text-danger" />
            {e.title}
          </p>
          <p className="text-caption text-muted-foreground">{e.detail}</p>
          <p className="font-mono text-caption text-tertiary">
            {e.code} · {target.id}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-caption text-muted-foreground">
          <p className="font-medium">How to fix</p>
          <p>{e.howToFix}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={retry.isPending} onClick={() => retry.mutate([target.id])}>
            <RotateCcw />
            Retry now
          </Button>
          {e.remedy === 'replace-media' && (
            <Button asChild variant="outline" size="sm">
              <Link to="/library">
                <Folder />
                Replace media
              </Link>
            </Button>
          )}
          {e.remedy === 'reconnect' && (
            <Button asChild variant="outline" size="sm">
              <Link to="/accounts">
                <RefreshCw />
                Reconnect account
              </Link>
            </Button>
          )}
          {cancelButton}
        </div>
      </div>
    )
  }

  if (target.status === 'processing') {
    const pct = target.progress ?? 0
    return (
      <div className="flex flex-col gap-2 px-3 pb-2.5">
        <div className="flex items-center gap-2">
          <p className="text-body-sm font-medium text-foreground">{target.retried && pct === 0 ? 'Queued for retry' : `Uploading to ${platform}`}</p>
          <div className="flex-1" />
          <p className="text-caption font-medium text-muted-foreground">{pct}%</p>
        </div>
        <Progress value={pct} aria-label={`Upload progress ${pct}%`} className="h-1.5 [&>[data-slot=progress-indicator]]:bg-info" />
        <div className="flex items-center gap-2">
          <p className="text-caption text-tertiary">Streaming from Google Drive · {streamed(post, pct)}</p>
          <div className="flex-1" />
          {cancelButton}
        </div>
      </div>
    )
  }

  const row = (text: string, action?: ReactNode) => (
    <div className="flex items-center gap-2 px-3 pb-2.5">
      <p className="text-caption text-tertiary">{text}</p>
      <div className="flex-1" />
      {action ?? <div className="h-[30px]" />}
    </div>
  )

  if (target.status === 'published') {
    return row(
      `Published ${publishedLabel(post, target)}`,
      <Button asChild variant="ghost" size="sm">
        <a href={ACCOUNTS[target.account].url} target="_blank" rel="noreferrer">
          <ExternalLink />
          Open post
        </a>
      </Button>,
    )
  }
  if (target.status === 'scheduled') return row(`Publishes ${scheduledLabel(post)}`, cancelButton)
  if (target.status === 'draft') {
    return row(
      'Not scheduled yet',
      <Button asChild variant="ghost" size="sm">
        <Link to="/create">
          <Pencil />
          Edit post
        </Link>
      </Button>,
    )
  }
  return row('Cancelled — this target won’t be published')
}

/* ── Timeline ──────────────────────────────────────────────────────── */

const DOT: Record<TimelineEvent['tone'], string> = {
  done: 'bg-[var(--border-strong)]',
  info: 'bg-info',
  success: 'bg-success',
  danger: 'bg-danger',
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const lastItem = i === events.length - 1
        return (
          <li key={`${e.title}-${i}`} className="flex gap-3">
            <div aria-hidden className="flex w-3 shrink-0 flex-col items-center">
              <span className={cn('size-2.5 shrink-0 rounded-full', DOT[e.tone])} />
              {!lastItem && <span className="h-[30px] w-0.5 bg-border" />}
            </div>
            <div className="flex min-w-0 flex-col gap-px pb-1">
              <p className={cn('text-body-sm font-medium', e.tone === 'danger' ? 'text-danger-text' : 'text-foreground')}>{e.title}</p>
              <p className="text-caption text-tertiary">{e.meta}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ── Pending / error ───────────────────────────────────────────────── */

export function JobDrawerPending() {
  return (
    <DrawerFrame label="Loading job details">
      <SheetHeader className="flex-row items-center gap-2.5 border-b px-5 py-4">
        <Skeleton className="size-10 rounded-md" />
        <div className="flex flex-col gap-1.5">
          <SheetTitle className="sr-only">Loading job details</SheetTitle>
          <SheetDescription className="sr-only">Fetching the publishing job.</SheetDescription>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex-1" />
        <CloseButton />
      </SheetHeader>
      <div className="flex flex-col gap-5 p-5">
        <Skeleton className="h-[46px] w-full rounded-lg" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-[180px] w-full rounded-[10px]" />
        <Skeleton className="h-24 w-full rounded-[10px]" />
      </div>
    </DrawerFrame>
  )
}

export function JobDrawerError({ error }: ErrorComponentProps) {
  return (
    <DrawerFrame label="Job not found">
      <SheetHeader className="flex-row items-center justify-end border-b px-5 py-4">
        <SheetTitle className="sr-only">Job not found</SheetTitle>
        <CloseButton />
      </SheetHeader>
      <EmptyState
        variant="plain"
        icon={SearchX}
        title="Job not found"
        description={error instanceof Error ? error.message : 'This publishing job no longer exists.'}
        action={
          <SheetClose asChild>
            <Button variant="outline" size="sm">
              Back to Post Monitoring
            </Button>
          </SheetClose>
        }
        className="flex-1 justify-center p-10"
      />
    </DrawerFrame>
  )
}
