import { Link } from '@tanstack/react-router'
import { CircleAlert } from 'lucide-react'
import { PlatformLogo } from '@/components/platform-logo'
import { StatusPill } from '@/components/status-pill'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { PublishStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ACCOUNTS, focusJobId, scheduledShort, STATUS_LABEL, targetsLabel, useRetryTargets, type JobPost, type JobTarget, type StatusCounts } from '../api'
import { isFromControl, useOpenJob } from '../hooks'
import { PostMenu } from './job-parts'

/** Mobile chip order (Figma M04): All · Failed · Processing · Scheduled, then the rest. */
const CHIPS: (PublishStatus | 'all')[] = ['all', 'failed', 'processing', 'scheduled', 'published', 'cancelled', 'draft']

export function StatusChips({ value, counts, onChange, className }: { value: PublishStatus | 'all'; counts: StatusCounts; onChange: (v: PublishStatus | 'all') => void; className?: string }) {
  return (
    <div className={cn('-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      <ToggleGroup type="single" spacing={2} value={value} onValueChange={(v) => v && onChange(v as PublishStatus | 'all')} aria-label="Status" className="w-max">
        {CHIPS.map((chip) => (
          <ToggleGroupItem
            key={chip}
            value={chip}
            className="group h-[30px] min-w-0 gap-1.5 rounded-full border bg-background px-3 text-caption font-medium text-muted-foreground shadow-none hover:bg-subtle hover:text-foreground data-[state=on]:border-inverse data-[state=on]:bg-inverse data-[state=on]:text-primary-foreground"
          >
            {chip === 'all' ? 'All' : STATUS_LABEL[chip]}
            <span className="text-tertiary group-data-[state=on]:text-primary-foreground">{counts[chip]}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

/** Failed targets first, then the rest in post order (Figma M04). */
const orderTargets = (targets: JobTarget[]) => [...targets.filter((t) => t.status === 'failed'), ...targets.filter((t) => t.status !== 'failed')]

export function MobileJobCard({ post }: { post: JobPost }) {
  const openJob = useOpenJob()
  return (
    <Card className="gap-0 overflow-hidden">
      <div className="flex cursor-pointer items-center gap-2.5 p-3" onClick={(e) => !isFromControl(e.target) && openJob(focusJobId(post))}>
        <Thumbnail tone={post.tone} ratio={1} className="size-11 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Link to="/monitoring/$jobId" params={{ jobId: focusJobId(post) }} search className="truncate text-body-sm font-medium text-foreground outline-none focus-visible:underline">
            {post.title}
          </Link>
          <p className="truncate text-caption text-tertiary">
            {scheduledShort(post)} · {targetsLabel(post.targets.length)}
          </p>
        </div>
        <PostMenu post={post} />
      </div>
      {orderTargets(post.targets).map((t) => (
        <MobileTarget key={t.id} target={t} />
      ))}
    </Card>
  )
}

function MobileTarget({ target }: { target: JobTarget }) {
  const retry = useRetryTargets()
  const openJob = useOpenJob()
  return (
    <div className="flex cursor-pointer flex-col gap-1.5 border-t px-3 py-2.5" onClick={(e) => !isFromControl(e.target) && openJob(target.id)}>
      <div className="flex items-center gap-2">
        <PlatformLogo platform={target.platform} size={18} />
        <span className="min-w-0 flex-1 truncate text-body-sm text-foreground">{ACCOUNTS[target.account].handle}</span>
        <StatusPill status={target.status} />
      </div>
      {target.status === 'failed' && target.error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-subtle px-2.5 py-2">
          <CircleAlert aria-hidden className="size-3.5 shrink-0 text-danger" />
          <p className="min-w-0 flex-1 text-caption text-danger-text">{target.error.short}</p>
          {target.error.remedy === 'reconnect' ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/accounts">Fix</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => retry.mutate([target.id])}>
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
