import { useSuspenseQuery } from '@tanstack/react-query'
import { Calendar, CircleAlert, CircleCheck, Lock, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import { PlatformLogo } from '@/components/platform-logo'
import { Thumbnail } from '@/components/thumbnail'
import { cn } from '@/lib/utils'
import { accountsQueryOptions, driveFilesQueryOptions } from '../api'
import { useDraft } from '../draft-store'
import { isCarousel, mediaMeta, orderedTargets, scheduleSummary, selectedMedia, targetIssues, targetLabel } from '../model'

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-2">
      <h3 className="text-overline whitespace-nowrap text-tertiary uppercase">{title}</h3>
      {children}
    </section>
  )
}

/**
 * Figma "Post summary" (340px right rail on Media / Accounts / Schedule /
 * Review). Shows the draft as it stands; target ✓ appear once targets have
 * been customized (Schedule and Review).
 */
export function PostSummary({ showStatus = false, className }: { showStatus?: boolean; className?: string }) {
  const draft = useDraft()
  const { data: files } = useSuspenseQuery(driveFilesQueryOptions)
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions)
  const media = selectedMedia(draft, files)
  const targets = orderedTargets(draft, accounts)
  const schedule = draft.schedule

  return (
    <aside aria-label="Post summary" className={cn('w-[340px] shrink-0 flex-col gap-[18px] overflow-y-auto border-l bg-background p-5', className)}>
      <h2 className="text-h3 text-foreground">Post summary</h2>

      <Section title="Media">
        {media.length === 0 ? (
          <p className="text-body-sm text-tertiary">Pick a file from Drive in step 1</p>
        ) : (
          <div className="flex w-full items-center gap-2.5">
            <Thumbnail tone={media[0].tone} ratio={1} className="size-11 rounded-md" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-body-sm font-medium text-foreground">{isCarousel(media) ? `${media.length} ${media.length === 1 ? 'image' : 'images'} · carousel` : media[0].name}</p>
              <p className="truncate text-caption text-tertiary">{mediaMeta(media)}</p>
            </div>
          </div>
        )}
      </Section>

      <Section title={targets.length > 0 ? `Targets · ${targets.length}` : 'Targets'}>
        {targets.length === 0 ? (
          <p className="text-body-sm text-tertiary">Choose accounts in step 2</p>
        ) : (
          <ul className="flex w-full flex-col gap-1.5">
            {targets.map((t) => {
              const invalid = targetIssues(draft, t.id).errors.length > 0
              return (
                <li key={t.id} className="flex w-full items-center gap-2">
                  <PlatformLogo platform={t.platform} size={16} />
                  <span className="min-w-0 flex-1 truncate text-body-sm text-foreground">{targetLabel(t)}</span>
                  {showStatus &&
                    (invalid ? (
                      <CircleAlert aria-label="Needs attention" className="size-3.5 shrink-0 text-warning" />
                    ) : (
                      <CircleCheck aria-label="Ready" className="size-3.5 shrink-0 text-success" />
                    ))}
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section title="Schedule">
        <ScheduleLine schedule={schedule} targets={targets} />
      </Section>

      <div className="min-h-0 flex-1" />
      <div className="flex w-full items-start gap-2 rounded-lg bg-subtle py-2.5 pr-1.5 pl-2.5">
        <Lock aria-hidden className="mt-px size-3.5 shrink-0 text-tertiary" />
        <p className="text-caption text-muted-foreground">Relay stores a reference to your Drive file, not the file. It’s streamed to each platform at publish time.</p>
      </div>
    </aside>
  )
}

function ScheduleLine({ schedule, targets }: { schedule: ReturnType<typeof useDraft>['schedule']; targets: ReturnType<typeof orderedTargets> }) {
  if (!schedule) {
    return (
      <p className="flex w-full items-center gap-2 text-body-sm text-tertiary">
        <Calendar aria-hidden className="size-4 shrink-0 text-tertiary" />
        Not set yet
      </p>
    )
  }
  if (schedule.mode === 'now') {
    return (
      <p className="flex w-full items-center gap-2 text-body-sm text-foreground">
        <Send aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        Publish now
      </p>
    )
  }
  const s = scheduleSummary(schedule, targets)
  return (
    <p className="flex w-full items-center gap-2 text-body-sm text-foreground">
      <Calendar aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">
        {s.day} · {s.range} {s.abbr}
      </span>
    </p>
  )
}
