import { Link } from '@tanstack/react-router'
import { Calendar, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { StatusPill } from '@/components/status-pill'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCalendarActions } from '../actions-context'
import { aggregateStatus, entryStatusLabel, isMovable, type CalendarEntry } from '../api'
import { formatWhen } from '../date-utils'
import { TargetRow } from './parts'

/**
 * Figma "Post popover" (20:3292): thumbnail, title, when, status; every target
 * with its own status; Edit / Reschedule / Delete. Failed posts swap Edit for Retry.
 */
export function PostDetails({ entry, onDone, className }: { entry: CalendarEntry; onDone?: () => void; className?: string }) {
  const actions = useCalendarActions()
  const post = actions.getPost(entry.post.id) ?? entry.post
  const targets = post.targets.filter((t) => t.at === entry.at)
  const shown = targets.length ? targets : entry.targets
  const status = aggregateStatus(shown)
  const canMove = post.targets.some(isMovable)
  const retrying = actions.isRetrying(post.id)

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-start gap-3 p-3.5">
        <Thumbnail tone={post.tone} ratio={1} className="size-14 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[3px]">
          <p className="w-full truncate text-body font-medium text-foreground">{post.title}</p>
          <p className="text-caption text-muted-foreground">{formatWhen(entry.at)}</p>
          <StatusPill status={status} label={entryStatusLabel(shown)} className="max-w-full overflow-hidden" />
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t px-3.5 py-2.5">
        <p className="text-caption font-medium text-tertiary">Targets</p>
        {shown.map((t) => (
          <TargetRow key={t.id} target={t} />
        ))}
      </div>
      <div className="flex items-center gap-1.5 border-t bg-canvas px-3.5 py-2.5">
        {status === 'failed' ? (
          <Button
            variant="outline"
            size="sm"
            disabled={retrying}
            onClick={() => {
              actions.retry(post)
              onDone?.()
            }}
          >
            <RotateCcw />
            {retrying ? 'Retrying…' : 'Retry'}
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link to="/create" onClick={onDone}>
              <Pencil />
              Edit
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={!canMove}
          title={canMove ? undefined : 'Every target has already gone out'}
          onClick={() => {
            onDone?.()
            actions.reschedule(entry)
          }}
        >
          <Calendar />
          Reschedule
        </Button>
        <span className="min-w-0 flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onDone?.()
            actions.remove(post)
          }}
        >
          <Trash2 />
          Delete
        </Button>
      </div>
    </div>
  )
}
