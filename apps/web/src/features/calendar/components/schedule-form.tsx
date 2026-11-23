import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { Calendar as CalendarIcon, Clock, Globe, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useCalendarActions } from '../actions-context'
import { CALENDAR_TODAY, isMovable, TIMEZONES, useReschedulePost, type CalendarEntry, type CalendarPost } from '../api'
import { formatLongDate, formatMinutes, minutesOf, toDateKey } from '../date-utils'
import { useScheduleDraft, type ScheduleDraftState } from '../use-schedule-draft'
import { TargetRow } from './parts'

const FIELD = 'h-9 w-full justify-start gap-2 rounded-lg px-2.5 text-body-sm font-normal text-foreground shadow-xs'
const QUARTERS = Array.from({ length: 96 }, (_, i) => i * 15)

function timeOptions(current: number) {
  return QUARTERS.includes(current) ? QUARTERS : [...QUARTERS, current].sort((a, b) => a - b)
}

/** Time picker styled as the Figma field (clock icon, no chevron). */
function TimeSelect({ value, onChange, disabled, id, className, compact }: { value: number; onChange: (m: number) => void; disabled?: boolean; id?: string; className?: string; compact?: boolean }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))} disabled={disabled}>
      <SelectTrigger id={id} aria-label="Time" size={compact ? 'sm' : 'default'} className={cn(compact ? 'w-[104px] gap-1.5 px-2 text-caption' : cn(FIELD, 'pl-2.5'), '[&>svg:last-child]:hidden', className)}>
        <Clock className="size-4 text-tertiary" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-64">
        {timeOptions(value).map((m) => (
          <SelectItem key={m} value={String(m)}>
            {formatMinutes(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DateField({ value, onChange, disabled, id }: { value: string; onChange: (dateKey: string) => void; disabled?: boolean; id?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" disabled={disabled} className={cn(FIELD, 'justify-start hover:bg-background')}>
          <CalendarIcon className="text-tertiary" />
          {formatLongDate(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          weekStartsOn={1}
          selected={parseISO(value)}
          defaultMonth={parseISO(value)}
          disabled={{ before: parseISO(CALENDAR_TODAY) }}
          onSelect={(d) => {
            if (!d) return
            onChange(toDateKey(d))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Date · Time · Time zone · "Same time for all targets" · target list (Figma "Edit schedule" body). */
export function ScheduleFields({ post, state, idPrefix }: { post: CalendarPost; state: ScheduleDraftState; idPrefix: string }) {
  const { draft } = state
  const locked = !state.canMove
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-date`} className="text-caption font-medium text-muted-foreground">
            Date
          </Label>
          <DateField id={`${idPrefix}-date`} value={draft.date} onChange={(date) => state.update({ date })} disabled={locked} />
        </div>
        <div className="flex w-[120px] shrink-0 flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-time`} className="text-caption font-medium text-muted-foreground">
            Time
          </Label>
          <TimeSelect id={`${idPrefix}-time`} value={draft.minutes} onChange={(minutes) => state.update({ minutes })} disabled={locked || !draft.sameTime} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-tz`} className="text-caption font-medium text-muted-foreground">
          Time zone
        </Label>
        <Select value={draft.timezone} onValueChange={(timezone) => state.update({ timezone })} disabled={locked}>
          <SelectTrigger id={`${idPrefix}-tz`} className={cn(FIELD, '[&>svg:last-child]:hidden')}>
            <Globe className="size-4 text-tertiary" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch id={`${idPrefix}-same`} checked={draft.sameTime} onCheckedChange={state.setSameTime} disabled={locked || post.targets.length < 2} />
        <Label htmlFor={`${idPrefix}-same`} className="text-body-sm font-normal text-foreground">
          Same time for all targets
        </Label>
      </div>
      <div className="flex flex-col gap-1.5 rounded-lg bg-canvas p-2.5">
        {post.targets.map((t) => (
          <TargetRow key={t.id} target={t}>
            {!draft.sameTime && (
              <TimeSelect
                compact
                value={isMovable(t) ? (draft.perTarget[t.id] ?? draft.minutes) : minutesOf(t.at)}
                onChange={(m) => state.setTargetMinutes(t.id, m)}
                disabled={!isMovable(t)}
                className="mr-1.5 bg-background"
              />
            )}
          </TargetRow>
        ))}
      </div>
      {state.dirty && state.error && <p className="text-caption text-danger-text">{state.error}</p>}
      {!state.canMove && <p className="text-caption text-tertiary">Every target has already gone out, so this post can’t be moved.</p>}
    </div>
  )
}

/** Day view side panel — Figma "Edit schedule" (21:3400). Keyed by entry so it resets on selection. */
export function EditScheduleCard({ entry, className }: { entry: CalendarEntry; className?: string }) {
  const actions = useCalendarActions()
  const post = actions.getPost(entry.post.id) ?? entry.post
  const state = useScheduleDraft(post, entry.at)
  const reschedule = useReschedulePost()

  return (
    <section aria-label="Edit schedule" className={cn('flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs', className)}>
      <div className="flex items-start gap-2.5 p-4">
        <Thumbnail tone={post.tone} ratio={1} className="size-11 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-body font-medium text-foreground">{post.title}</p>
          <p className="truncate text-caption text-tertiary">{post.fileName} · from Drive</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <ScheduleFields post={post} state={state} idPrefix={`edit-${post.id}`} />
      </div>
      <div className="flex items-center gap-2 border-t bg-canvas px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => actions.remove(post)}>
          <Trash2 />
          Delete
        </Button>
        <span className="min-w-0 flex-1" />
        <Button asChild variant="outline" size="sm">
          <Link to="/create">
            <Pencil />
            Edit post
          </Link>
        </Button>
        <Button
          size="sm"
          disabled={Boolean(state.dirty && state.error) || !state.canMove || reschedule.isPending}
          onClick={() => (state.dirty ? reschedule.mutate(state.input) : toast.info('No changes to save', { description: 'Pick a new date, time or time zone first.' }))}
        >
          {reschedule.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </section>
  )
}

function RescheduleForm({ entry, onClose }: { entry: CalendarEntry; onClose: () => void }) {
  const actions = useCalendarActions()
  const post = actions.getPost(entry.post.id) ?? entry.post
  const state = useScheduleDraft(post, entry.at)
  const reschedule = useReschedulePost()
  return (
    <>
      <DialogHeader>
        <DialogTitle>Reschedule post</DialogTitle>
        <DialogDescription>
          {post.title} · currently {format(parseISO(entry.at), 'EEE, MMM d · h:mm a')}
        </DialogDescription>
      </DialogHeader>
      <div className="px-6 pt-5">
        <ScheduleFields post={post} state={state} idPrefix={`dialog-${post.id}`} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!state.canSave}
          onClick={() => {
            reschedule.mutate(state.input)
            onClose()
          }}
        >
          Save
        </Button>
      </DialogFooter>
    </>
  )
}

/** Reschedule dialog opened from the post popover / mobile sheet / day "more" menu. */
export function RescheduleDialog({ entry, onOpenChange }: { entry: CalendarEntry | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">{entry && <RescheduleForm key={entry.key} entry={entry} onClose={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  )
}
