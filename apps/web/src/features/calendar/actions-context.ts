import { createContext, useContext } from 'react'
import type { CalendarEntry, CalendarPost } from './api'

export type CalendarActions = {
  /** Full (unfiltered) post record by id. */
  getPost: (id: string) => CalendarPost | undefined
  /** Opens the Reschedule dialog for an entry. */
  reschedule: (entry: CalendarEntry) => void
  /** Opens the delete confirmation. */
  remove: (post: CalendarPost) => void
  /** Re-sends the post's failed targets. */
  retry: (post: CalendarPost) => void
  isRetrying: (postId: string) => boolean
}

export const CalendarActionsContext = createContext<CalendarActions | null>(null)

export function useCalendarActions() {
  const ctx = useContext(CalendarActionsContext)
  if (!ctx) throw new Error('useCalendarActions must be used inside <CalendarActionsProvider>')
  return ctx
}
