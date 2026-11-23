import { Link } from '@tanstack/react-router'
import { Ban, CircleAlert, Copy, Ellipsis, ExternalLink, Eye, Pencil, RotateCcw, type LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { toast } from 'sonner'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PLATFORM_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ACCOUNTS, cancellableIds, driveUrl, failedIds, focusJobId, statusSummary, useCancelTargets, useRetryTargets, type JobPost, type JobTarget } from '../api'
import { useOpenJob } from '../hooks'

/** Post row "Status": one pill per status, e.g. "2 published" + "1 failed". */
export function StatusSummary({ post, className }: { post: JobPost; className?: string }) {
  return (
    <div className={cn('flex flex-wrap content-center items-center gap-1', className)}>
      {statusSummary(post).map((s) => (
        <StatusPill key={s.status} status={s.status} label={s.label} />
      ))}
    </div>
  )
}

/** Target row "Status": pill, plus the inline upload bar while processing. */
export function TargetStatus({ target }: { target: JobTarget }) {
  if (target.status !== 'processing') return <StatusPill status={target.status} />
  const pct = target.progress ?? 0
  return (
    <div className="flex flex-col items-start gap-[3px]">
      <StatusPill status="processing" />
      <Progress value={pct} aria-label={`Upload progress ${pct}%`} className="w-[110px] [&>[data-slot=progress-indicator]]:bg-info" />
      <span className="text-caption text-tertiary">{target.retried && pct === 0 ? 'Queued for retry' : `Uploading · ${pct}%`}</span>
    </div>
  )
}

export const Dash = () => <span className="text-caption text-tertiary">—</span>

/** Danger caption with alert icon (table "Error" column). */
export function ErrorText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-start gap-1.5 text-caption text-danger-text', className)}>
      <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0 text-danger" />
      <span className="min-w-0 whitespace-normal">{children}</span>
    </p>
  )
}

/** 28px ghost icon button with a tooltip (row actions). */
export function IconAction({ label, icon: Icon, className, ...props }: { label: string; icon: LucideIcon } & ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} className={cn('rounded-lg', className)} {...props}>
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function OpenPostButton({ target, className }: { target: JobTarget; className?: string }) {
  const label = `Open post on ${PLATFORM_LABEL[target.platform]}`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild variant="ghost" size="icon-sm" className={cn('rounded-lg', className)}>
          <a href={ACCOUNTS[target.account].url} target="_blank" rel="noreferrer" aria-label={label}>
            <ExternalLink />
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function copyJobId(id: string) {
  void navigator.clipboard?.writeText(id).catch(() => undefined)
  toast.success('Job ID copied', { description: id })
}

function MoreTrigger({ label, size = 'icon-sm' }: { label: string; size?: 'icon-sm' | 'icon' }) {
  return (
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size={size} aria-label={label} className="rounded-lg">
        <Ellipsis />
      </Button>
    </DropdownMenuTrigger>
  )
}

/** "More" menu on a target row / card. */
export function TargetMenu({ target, showDetails = true }: { target: JobTarget; showDetails?: boolean }) {
  const openJob = useOpenJob()
  const retry = useRetryTargets()
  const cancel = useCancelTargets()
  const platform = PLATFORM_LABEL[target.platform]
  return (
    <DropdownMenu>
      <MoreTrigger label={`More actions for ${platform} · ${ACCOUNTS[target.account].handle}`} />
      <DropdownMenuContent align="end" className="w-48">
        {showDetails && (
          <DropdownMenuItem onSelect={() => openJob(target.id)}>
            <Eye />
            View job details
          </DropdownMenuItem>
        )}
        {target.status === 'published' && (
          <DropdownMenuItem asChild>
            <a href={ACCOUNTS[target.account].url} target="_blank" rel="noreferrer">
              <ExternalLink />
              Open post
            </a>
          </DropdownMenuItem>
        )}
        {target.status === 'failed' && (
          <DropdownMenuItem onSelect={() => retry.mutate([target.id])}>
            <RotateCcw />
            Retry now
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/create">
            <Pencil />
            Edit post
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => copyJobId(target.id)}>
          <Copy />
          Copy job ID
        </DropdownMenuItem>
        {(target.status === 'scheduled' || target.status === 'processing' || target.status === 'failed') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => cancel.mutate([target.id])}>
              <Ban />
              Cancel target
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "More" menu on a post row / card / drawer header. */
export function PostMenu({ post, showDetails = true, size }: { post: JobPost; showDetails?: boolean; size?: 'icon-sm' | 'icon' }) {
  const openJob = useOpenJob()
  const retry = useRetryTargets()
  const cancel = useCancelTargets()
  const failed = failedIds(post.targets)
  const cancellable = cancellableIds(post.targets)
  return (
    <DropdownMenu>
      <MoreTrigger label={`More actions for ${post.title}`} size={size} />
      <DropdownMenuContent align="end" className="w-52">
        {showDetails && (
          <DropdownMenuItem onSelect={() => openJob(focusJobId(post))}>
            <Eye />
            View job details
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/create">
            <Pencil />
            Edit post
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={driveUrl(post)} target="_blank" rel="noreferrer">
            <ExternalLink />
            Open in Drive
          </a>
        </DropdownMenuItem>
        {failed.length > 0 && (
          <DropdownMenuItem onSelect={() => retry.mutate(failed)}>
            <RotateCcw />
            Retry failed ({failed.length})
          </DropdownMenuItem>
        )}
        {cancellable.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => cancel.mutate(cancellable)}>
              <Ban />
              Cancel {cancellable.length === 1 ? 'pending target' : `${cancellable.length} pending targets`}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
