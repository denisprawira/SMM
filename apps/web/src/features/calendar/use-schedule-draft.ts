import { useState } from 'react'
import { isMovable, isPast, type CalendarPost, type RescheduleInput } from './api'
import { dateOf, minutesOf, withMinutes } from './date-utils'

export type ScheduleDraft = {
  date: string
  /** Minutes since midnight for every target when `sameTime`. */
  minutes: number
  timezone: string
  sameTime: boolean
  /** Per-target minutes when `sameTime` is off. */
  perTarget: Record<string, number>
}

function initialDraft(post: CalendarPost, at: string): ScheduleDraft {
  return {
    date: dateOf(at),
    minutes: minutesOf(at),
    timezone: post.timezone,
    sameTime: new Set(post.targets.map((t) => t.at)).size <= 1,
    perTarget: Object.fromEntries(post.targets.map((t) => [t.id, minutesOf(t.at)])),
  }
}

/**
 * Local edit state for "Edit schedule" / Reschedule. Only targets that haven't
 * gone out yet (scheduled, draft, failed) move; published/processing keep their time.
 */
export function useScheduleDraft(post: CalendarPost, at: string) {
  const [draft, setDraft] = useState(() => initialDraft(post, at))

  const movable = post.targets.filter(isMovable)
  const changes = movable
    .map((t) => ({ targetId: t.id, at: withMinutes(draft.date, draft.sameTime ? draft.minutes : (draft.perTarget[t.id] ?? draft.minutes)), from: t.at }))
    .filter((c) => c.at !== c.from)
  const timezoneChanged = draft.timezone !== post.timezone
  const dirty = changes.length > 0 || timezoneChanged
  const error = movable.length === 0 ? 'Every target has already gone out.' : changes.some((c) => isPast(c.at)) ? 'Pick a time in the future.' : null

  const input: RescheduleInput = {
    postId: post.id,
    changes: changes.map(({ targetId, at: next }) => ({ targetId, at: next })),
    timezone: timezoneChanged ? draft.timezone : undefined,
  }

  return {
    draft,
    update: (patch: Partial<ScheduleDraft>) => setDraft((d) => ({ ...d, ...patch })),
    setSameTime: (sameTime: boolean) =>
      setDraft((d) => ({ ...d, sameTime, perTarget: Object.fromEntries(Object.keys(d.perTarget).map((id) => [id, d.minutes])) })),
    setTargetMinutes: (targetId: string, minutes: number) => setDraft((d) => ({ ...d, perTarget: { ...d.perTarget, [targetId]: minutes } })),
    canMove: movable.length > 0,
    dirty,
    error,
    canSave: dirty && !error,
    input,
  }
}

export type ScheduleDraftState = ReturnType<typeof useScheduleDraft>
