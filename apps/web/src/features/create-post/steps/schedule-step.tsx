import { useSuspenseQuery } from '@tanstack/react-query'
import { Calendar as CalendarIcon, ChevronDown, Clock, Globe, Info, Send, TriangleAlert, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PlatformLogo } from '@/components/platform-logo'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { accountsQueryOptions, BEST_TIMES } from '../api'
import { StepBody } from '../components/step-body'
import { ensureSchedule, setSchedule, useDraft, type Schedule } from '../draft-store'
import {
  audienceLocal,
  dateLabel,
  defaultSchedule,
  formatDayShort,
  fromIsoDate,
  minutesLabel,
  mockToday,
  offsetFor,
  orderedTargets,
  scheduleError,
  spacingNote,
  targetLabel,
  targetTimes,
  TIMEZONES,
  toIsoDate,
} from '../model'

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => i * 15)
const RADIO = 'size-[18px] border-strong bg-background shadow-none data-[state=checked]:border-[5px] data-[state=checked]:border-primary [&_[data-slot=radio-group-indicator]]:hidden'
const TRIGGER = 'h-9 w-full justify-start gap-2 px-2.5 text-body-sm font-normal [&>svg:last-child]:ml-auto [&>svg:last-child]:size-3.5 [&>svg:last-child]:text-tertiary'

export function ScheduleStep() {
  const draft = useDraft()
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions)
  const targets = orderedTargets(draft, accounts)
  const schedule: Schedule = draft.schedule ?? defaultSchedule(targets)
  const [dateOpen, setDateOpen] = useState(false)

  // First visit: next best time, staggered by platform (Figma defaults).
  useEffect(() => ensureSchedule(defaultSchedule(orderedTargets(draft, accounts))), [draft, accounts])

  const times = targetTimes(schedule, targets)
  const note = spacingNote(schedule, times)
  const error = draft.showErrors ? scheduleError(schedule) : null

  return (
    <StepBody title="When should it go out?" description="Publish right away or pick a time. Times are shown in your workspace time zone." showStatus>
      <RadioGroup value={schedule.mode} onValueChange={(mode) => setSchedule({ mode: mode as Schedule['mode'] })} aria-label="When to publish" className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ModeCard value="now" checked={schedule.mode === 'now'} icon={Send} title="Publish now" description="Starts immediately. Each platform processes on its own and may take a few minutes." />
        <ModeCard value="schedule" checked={schedule.mode === 'schedule'} icon={CalendarIcon} title="Schedule" description="Pick a date and time. You can reschedule or cancel any target until it starts." />
      </RadioGroup>

      {schedule.mode === 'schedule' ? (
        <section aria-label="Schedule settings" className="flex w-full flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs md:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="schedule-date" className="text-body-sm font-medium text-foreground">
                Date
              </Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button id="schedule-date" variant="outline" aria-invalid={!!error || undefined} className={TRIGGER}>
                    <CalendarIcon className="text-tertiary" />
                    <span className="truncate">{dateLabel(schedule.date)}</span>
                    <ChevronDown />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    required
                    selected={fromIsoDate(schedule.date)}
                    defaultMonth={fromIsoDate(schedule.date)}
                    today={mockToday()}
                    disabled={{ before: mockToday() }}
                    onSelect={(d) => {
                      if (!d) return
                      setSchedule({ date: toIsoDate(d) })
                      setDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="schedule-time" className="text-body-sm font-medium text-foreground">
                Time
              </Label>
              <Select value={String(schedule.minutes)} onValueChange={(v) => setSchedule({ minutes: Number(v) })}>
                <SelectTrigger id="schedule-time" aria-invalid={!!error || undefined} className={TRIGGER}>
                  <Clock className="text-tertiary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  {TIME_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {minutesLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="schedule-tz" className="text-body-sm font-medium text-foreground">
                Time zone
              </Label>
              <Select value={schedule.timezone} onValueChange={(timezone) => setSchedule({ timezone })}>
                <SelectTrigger id="schedule-tz" className={TRIGGER}>
                  <Globe className="text-tertiary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="-mt-2 text-caption text-danger-text">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Zap aria-hidden className="size-3.5 shrink-0 text-primary" />
            <p className="text-caption font-medium text-muted-foreground">Best times from your analytics</p>
            {BEST_TIMES.map((b) => {
              const active = schedule.date === b.date && schedule.minutes === b.minutes
              return (
                <Button
                  key={b.label}
                  variant="outline"
                  size="xs"
                  aria-pressed={active}
                  onClick={() => setSchedule({ date: b.date, minutes: b.minutes })}
                  className={cn('h-[22px] rounded-full px-2.5 shadow-none', active ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover' : 'text-muted-foreground')}
                >
                  {b.label}
                </Button>
              )
            })}
          </div>

          <div className="flex w-full items-center gap-3 border-t pt-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-px">
              <Label htmlFor="schedule-stagger" className="text-body-sm font-medium text-foreground">
                Stagger by platform
              </Label>
              <p className="text-caption text-tertiary">Space targets out instead of publishing everything at once.</p>
            </div>
            <Switch id="schedule-stagger" checked={schedule.stagger} onCheckedChange={(stagger) => setSchedule({ stagger })} />
          </div>

          {schedule.stagger && (
            <div className="w-full overflow-x-auto rounded-[10px] border">
              <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
                <thead className="border-b bg-canvas text-caption font-medium text-tertiary">
                  <tr>
                    <th className="w-[266px] py-2 pr-3 pl-3.5 font-medium">Target</th>
                    <th className="w-[162px] py-2 pr-3 font-medium">Date</th>
                    <th className="w-[142px] py-2 pr-3 font-medium">Time</th>
                    <th className="py-2 pr-3.5 font-medium">Audience local time</th>
                  </tr>
                </thead>
                <tbody>
                  {times.map(({ account, instant }) => {
                    const offset = offsetFor(schedule, account.id, account.platform)
                    return (
                      <tr key={account.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-3 pl-3.5">
                          <span className="flex items-center gap-2">
                            <PlatformLogo platform={account.platform} size={18} />
                            <span className="truncate text-body-sm text-foreground">{targetLabel(account)}</span>
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-body-sm whitespace-nowrap text-muted-foreground">{formatDayShort(instant, schedule.timezone)}</td>
                        <td className="py-2 pr-3">
                          <Select value={String(offset)} onValueChange={(v) => setSchedule({ offsets: { ...schedule.offsets, [account.id]: Number(v) } })}>
                            <SelectTrigger aria-label={`Time for ${targetLabel(account)}`} className="gap-1.5 rounded-md px-2 h-7 text-body-sm shadow-none [&>svg:last-child]:size-3 [&>svg:last-child]:text-tertiary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-64">
                              {Array.from({ length: 13 }, (_, i) => i * 15).map((o) => (
                                <SelectItem key={o} value={String(o)}>
                                  {minutesLabel(schedule.minutes + o)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 pr-3.5 text-caption whitespace-nowrap text-tertiary">{audienceLocal(instant, account)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <div className="flex w-full items-center gap-2.5 rounded-[10px] border bg-card px-3.5 py-2.5 shadow-xs">
          <Send aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-body-sm text-muted-foreground">
            All {targets.length} {targets.length === 1 ? 'target starts' : 'targets start'} publishing as soon as you confirm. Track progress in Post Monitoring.
          </p>
        </div>
      )}

      {note && (
        <div role="status" className={cn('flex w-full items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5', note.tone === 'info' ? 'border-info bg-info-subtle' : 'border-warning bg-warning-subtle')}>
          {note.tone === 'info' ? <Info aria-hidden className="size-4 shrink-0 text-info" /> : <TriangleAlert aria-hidden className="size-4 shrink-0 text-warning" />}
          <p className="text-body-sm text-muted-foreground">{note.text}</p>
        </div>
      )}
    </StepBody>
  )
}

function ModeCard({ value, checked, icon: Icon, title, description }: { value: Schedule['mode']; checked: boolean; icon: typeof Send; title: string; description: string }) {
  return (
    <label
      htmlFor={`mode-${value}`}
      className={cn(
        'flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 transition-colors has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/20',
        checked ? 'border-primary bg-primary-subtle ring-[0.5px] ring-primary' : 'hover:border-strong',
      )}
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[10px]', checked ? 'bg-background' : 'bg-subtle')}>
        <Icon aria-hidden className={cn('size-[18px]', checked ? 'text-primary' : 'text-muted-foreground')} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body font-medium text-foreground">{title}</span>
        <span className="max-w-[330px] text-caption text-muted-foreground">{description}</span>
      </span>
      <RadioGroupItem id={`mode-${value}`} value={value} className={cn(RADIO, 'focus-visible:ring-0')} />
    </label>
  )
}
