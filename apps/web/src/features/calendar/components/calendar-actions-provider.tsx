import { Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CalendarActionsContext, type CalendarActions } from '../actions-context'
import { useDeletePost, useRetryPost, type CalendarEntry, type CalendarPost } from '../api'
import { RescheduleDialog } from './schedule-form'

/** Owns the Reschedule dialog, the delete confirmation and retry, for every view. */
export function CalendarActionsProvider({ posts, children }: { posts: CalendarPost[]; children: ReactNode }) {
  const [rescheduling, setRescheduling] = useState<CalendarEntry | null>(null)
  const [deleting, setDeleting] = useState<CalendarPost | null>(null)
  const del = useDeletePost()
  const retry = useRetryPost()

  const byId = useMemo(() => new Map(posts.map((p) => [p.id, p])), [posts])
  const value: CalendarActions = {
    getPost: (id) => byId.get(id),
    reschedule: setRescheduling,
    remove: (post) => setDeleting(byId.get(post.id) ?? post),
    retry: (post) => retry.mutate(byId.get(post.id) ?? post),
    isRetrying: (id) => retry.isPending && retry.variables?.id === id,
  }

  const n = deleting?.targets.length ?? 0
  return (
    <CalendarActionsContext.Provider value={value}>
      {children}
      <RescheduleDialog entry={rescheduling} onOpenChange={(open) => !open && setRescheduling(null)} />
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be removed from {n} {n === 1 ? 'target' : 'targets'}. Anything already published stays live, and the file stays in your Drive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleting && del.mutate(deleting)}>
              Delete post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CalendarActionsContext.Provider>
  )
}
