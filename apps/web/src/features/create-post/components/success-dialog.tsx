import { Calendar, Check, Plus } from 'lucide-react'
import { PlatformLogo } from '@/components/platform-logo'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import type { ScheduleResult } from '../api'
import { clockRange, formatClock, formatDayShort, tzAbbr } from '../model'

export type SuccessAction = 'create-another' | 'monitoring' | 'calendar' | 'dismiss'

/** Figma States "Modal/Posts scheduled" (30:675), 540px. */
export function SuccessDialog({ result, timezone, onAction }: { result: ScheduleResult | null; timezone: string; onAction: (action: SuccessAction) => void }) {
  const jobs = result?.jobs ?? []
  const n = jobs.length
  const now = result?.mode === 'now'
  const instants = jobs.flatMap((j) => (j.at ? [new Date(j.at)] : [])).sort((a, b) => a.getTime() - b.getTime())
  const first = instants[0]
  const last = instants[instants.length - 1]

  let description = ''
  if (result && now) description = `${result.title} is on its way. Each platform processes it on its own and may take a few minutes.`
  else if (result && first && last) {
    const day = formatDayShort(first, timezone)
    const abbr = tzAbbr(first, timezone)
    description =
      first.getTime() === last.getTime()
        ? `${result.title} goes out ${day} at ${formatClock(first, timezone)} ${abbr}.`
        : `${result.title} goes out ${day} between ${clockRange(first, last, timezone, ' and ')} ${abbr}.`
  }

  return (
    <Dialog open={!!result} onOpenChange={(open) => !open && onAction('dismiss')}>
      <DialogContent showCloseButton={false} className="sm:max-w-[540px]">
        <div className="flex flex-col items-center gap-3 px-7 pt-7 pb-5">
          <span className="flex size-[52px] items-center justify-center rounded-full bg-success-subtle">
            <Check aria-hidden className="size-6 text-success" />
          </span>
          <DialogTitle className="text-center">
            {n} {n === 1 ? 'post' : 'posts'} {now ? 'publishing' : 'scheduled'}
          </DialogTitle>
          <DialogDescription className="w-full max-w-[360px] text-center">{description}</DialogDescription>
          <ul className="flex w-full flex-col gap-1.5 rounded-[10px] bg-canvas p-3">
            {jobs.map((job) => (
              <li key={job.id} className="flex w-full items-center gap-2">
                <PlatformLogo platform={job.platform} size={16} />
                <span className="min-w-0 flex-1 truncate text-body-sm text-foreground">{job.label}</span>
                {job.at && <span className="text-caption whitespace-nowrap text-tertiary">{formatClock(new Date(job.at), timezone)}</span>}
                <StatusPill status={now ? 'processing' : 'scheduled'} />
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter className="mt-0 gap-2 px-5 sm:justify-start">
          <Button variant="ghost" className="sm:mr-auto" onClick={() => onAction('create-another')}>
            <Plus />
            Create another
          </Button>
          <Button variant="outline" onClick={() => onAction('monitoring')}>
            Track in Monitoring
          </Button>
          <Button onClick={() => onAction('calendar')}>
            <Calendar />
            View in calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
