import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Activity, Bell, CircleCheck, Clock, Cloud, Pencil, TriangleAlert } from 'lucide-react'
import { PlatformLogo } from '@/components/platform-logo'
import { Thumbnail } from '@/components/thumbnail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PLATFORM_LABEL } from '@/lib/types'
import { accountsQueryOptions, driveFilesQueryOptions } from '../api'
import { StepBody } from '../components/step-body'
import { useDraft } from '../draft-store'
import { captionFor, excerpt, formatClock, formatLabel, formatWeekday, isCarousel, orderedTargets, selectedMedia, targetIssues, targetLabel, targetTimes } from '../model'

export function ReviewStep() {
  const draft = useDraft()
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions)
  const { data: files } = useSuspenseQuery(driveFilesQueryOptions)
  const media = selectedMedia(draft, files)
  const targets = orderedTargets(draft, accounts)
  const schedule = draft.schedule
  const times = schedule?.mode === 'schedule' ? targetTimes(schedule, targets) : []
  const issues = targets.map((t) => targetIssues(draft, t.id))
  const ready = issues.filter((i) => i.errors.length === 0).length
  const suggestions = issues.reduce((n, i) => n + i.suggestions.length, 0)
  const m = media[0]
  const n = targets.length

  return (
    <StepBody title="Review and confirm" description="Each target becomes a separate publishing job you can track in Post Monitoring." showStatus>
      <div className="flex w-full flex-col items-start gap-4 lg:flex-row">
        {m && (
          <section aria-label="Media" className="flex w-full shrink-0 flex-col gap-3.5 rounded-xl border bg-card p-4 shadow-xs lg:w-[300px]">
            <div className="flex w-full items-start gap-3.5">
              <Thumbnail tone={m.tone} ratio={96 / 170} className="h-[170px] w-24 rounded-lg" />
              <dl className="flex min-w-0 flex-1 flex-col gap-1.5 text-caption">
                <Detail label="File" value={isCarousel(media) ? media.map((f) => f.name).join(', ') : m.name} />
                {isCarousel(media) ? <Detail label="Images" value={`${media.length} · carousel`} /> : <Detail label="Duration" value={m.duration ?? ''} />}
                <Detail label="Size" value={`${media.reduce((s, f) => s + f.sizeMb, 0).toLocaleString('en-US', { maximumFractionDigits: 1 })} MB`} />
                <Detail label="Format" value={`${m.resolution} · ${m.format}`} />
                <Detail label="Source" value="Google Drive" />
              </dl>
            </div>
            <div className="flex w-full items-start gap-2 rounded-lg bg-warning-subtle py-2.5 pr-0 pl-2.5">
              <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0 text-warning" />
              <p className="text-caption text-warning-text">Keep this file in place in Drive until every target has published.</p>
            </div>
          </section>
        )}

        <section aria-label="Targets" className="flex w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
          <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <h2 className="text-body font-medium text-foreground">Targets</h2>
            <Badge>{n}</Badge>
            <div className="flex-1" />
            <p className="flex items-center gap-1.5 text-caption font-medium whitespace-nowrap">
              <CircleCheck aria-hidden className="size-3.5 text-success" />
              <span className="text-success-text">{ready} ready</span>
              {ready < n && <span className="text-danger-text">· {n - ready} need fixes</span>}
              {suggestions > 0 && (
                <span className="text-warning-text">
                  · {suggestions} {suggestions === 1 ? 'suggestion' : 'suggestions'}
                </span>
              )}
            </p>
          </header>
          {targets.map((t, i) => {
            const s = draft.settings[t.id]
            const time = times.find((x) => x.account.id === t.id)
            const issue = issues[i]
            return (
              <div key={t.id} className="flex w-full flex-wrap items-start gap-3 border-b px-4 py-3 last:border-b-0 md:flex-nowrap">
                <div className="flex w-[180px] shrink-0 items-start gap-2.5">
                  <PlatformLogo platform={t.platform} size={22} />
                  <div className="flex min-w-0 flex-col gap-px">
                    <p className="truncate text-body-sm font-medium text-foreground">{targetLabel(t)}</p>
                    <p className="truncate text-caption text-tertiary">
                      {PLATFORM_LABEL[t.platform]} · {formatLabel(t.platform, media, s)}
                    </p>
                  </div>
                </div>
                <div className="order-last flex min-w-0 basis-full flex-col gap-[3px] md:order-none md:basis-auto md:flex-1">
                  {s?.platform === 'youtube' ? (
                    <>
                      <p className="text-caption font-medium text-tertiary">Title</p>
                      <p className="text-body-sm text-foreground">{s.title || '—'}</p>
                    </>
                  ) : (
                    <p className="line-clamp-2 text-body-sm text-muted-foreground">{excerpt(captionFor(draft, t.id))}</p>
                  )}
                  {[...issue.errors, ...issue.suggestions].map((msg) => (
                    <p key={msg} className={issue.errors.includes(msg) ? 'flex items-start gap-1 text-caption text-danger-text' : 'flex items-start gap-1 text-caption text-warning-text'}>
                      <TriangleAlert aria-hidden className="mt-0.5 size-3 shrink-0" />
                      {msg}
                    </p>
                  ))}
                </div>
                <p className="ml-auto flex w-[110px] shrink-0 items-center gap-1.5 text-caption font-medium whitespace-nowrap text-muted-foreground md:ml-0">
                  <Clock aria-hidden className="size-3.5 shrink-0 text-tertiary" />
                  {time && schedule ? `${formatWeekday(time.instant, schedule.timezone)} · ${formatClock(time.instant, schedule.timezone)}` : 'Now'}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${PLATFORM_LABEL[t.platform]} · ${targetLabel(t)}`} className="-my-1 text-muted-foreground">
                      <Link to="/create/customize" search={{ target: t.id }}>
                        <Pencil />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
              </div>
            )
          })}
        </section>
      </div>

      <section aria-label="What happens next" className="flex w-full flex-col gap-3 rounded-xl border bg-subtle p-4 shadow-xs">
        <h2 className="text-body-sm font-medium text-foreground">What happens next</h2>
        <div className="flex w-full flex-col gap-4 md:flex-row md:gap-5">
          <NextItem icon={Activity} title={`${n} publishing ${n === 1 ? 'job is' : 'jobs are'} created`} text="One per target, each with its own status." />
          <NextItem icon={Cloud} title="Streamed from Drive at publish time" text="Nothing is uploaded to Relay ahead of time." />
          <NextItem icon={Bell} title="You’re notified on failure" text="Retry from Post Monitoring in one click." />
        </div>
      </section>
    </StepBody>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-tertiary">{label}</dt>
      <dd className="font-medium break-all text-foreground">{value}</dd>
    </div>
  )
}

function NextItem({ icon: Icon, title, text }: { icon: typeof Bell; title: string; text: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-2.5">
      <Icon aria-hidden className="mt-px size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-body-sm font-medium text-foreground">{title}</p>
        <p className="max-w-[200px] text-caption text-tertiary">{text}</p>
      </div>
    </div>
  )
}
