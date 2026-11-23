import { ChartColumn, ExternalLink, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { PlatformLogo } from '@/components/platform-logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useRetryPlatformSync, type SyncStatus } from './api'
import { relativeTime } from './format'

/** Figma States 30:965 bar heights (of a 120px plot), repeated to fill wide cards. */
const BARS = [60, 90, 40, 110, 70, 95, 50, 80, 100, 65]

/** Figma "Chart loading skeleton" (States 30:965). */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card role="status" aria-label="Loading chart" className={cn('min-h-[186px] gap-4 p-5', className)}>
      <Skeleton className="h-3 w-[140px] shrink-0 rounded-sm" />
      <div className="flex min-h-[120px] flex-1 items-end gap-2 overflow-hidden">
        {[...BARS, ...BARS].map((h, i) => (
          <Skeleton key={i} className="w-7 shrink-0 rounded-sm" style={{ height: `${(h / 120) * 100}%` }} />
        ))}
      </div>
    </Card>
  )
}

export function MetricSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5 rounded-xl border bg-card px-3.5 pt-4 pb-3.5 shadow-xs', className)}>
      <Skeleton className="my-[3px] h-3 w-16 rounded-sm" />
      <Skeleton className="my-1.5 h-[22px] w-20 rounded-sm" />
      <Skeleton className="h-4 w-24 rounded-sm" />
    </div>
  )
}

/** Card header + table rows placeholder for the comparison / top-content cards. */
export function TableSkeleton({ rows, className }: { rows: number; className?: string }) {
  return (
    <Card role="status" aria-label="Loading table" className={className}>
      <div className="flex flex-col gap-2 px-5 py-4">
        <Skeleton className="h-3 w-[140px] rounded-sm" />
        <Skeleton className="h-3 w-[100px] rounded-sm" />
      </div>
      <div className="h-9 border-y bg-canvas" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-12 items-center gap-3 border-b px-5 last:border-b-0">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-28 rounded-sm" />
          <div className="flex-1" />
          <Skeleton className="h-3 w-1/2 rounded-sm" />
        </div>
      ))}
    </Card>
  )
}

/** Figma "API error card" (States 30:861) — one platform's API failed; the rest of the page is current. */
export function ApiErrorCard({ platform, sync, now, className }: { platform: Platform; sync: SyncStatus; now: number; className?: string }) {
  const retry = useRetryPlatformSync()
  const label = PLATFORM_LABEL[platform]
  const pending = retry.isPending && retry.variables === platform
  return (
    <Card role="alert" className={cn('gap-3 p-5', className)}>
      <div className="flex items-center gap-2">
        <PlatformLogo platform={platform} size={20} />
        <p className="text-body font-medium text-foreground">Couldn’t load {label} analytics</p>
      </div>
      <p className="max-w-[640px] text-body-sm text-muted-foreground">
        {label}’s API didn’t respond ({sync.code ?? 503}). Other platforms are up to date. Last successful sync: {relativeTime(sync.lastSyncAt, now)}.
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={pending} onClick={() => retry.mutate(platform)}>
          {pending ? <Spinner /> : <RefreshCw />}
          {pending ? 'Trying again…' : 'Try again'}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a href={STATUS_PAGES[platform]} target="_blank" rel="noreferrer">
            <ExternalLink />
            Status page
          </a>
        </Button>
      </div>
    </Card>
  )
}

const STATUS_PAGES: Record<Platform, string> = {
  youtube: 'https://www.google.com/appsstatus/dashboard/',
  tiktok: 'https://developers.tiktok.com/status',
  instagram: 'https://metastatus.com/',
  facebook: 'https://metastatus.com/',
}

/** Figma "Analytics — new workspace" (States 30:945), or filters that match no connected platform. */
export function AnalyticsEmpty({ reason, onClearFilters }: { reason: 'no-data' | 'no-match'; onClearFilters: () => void }) {
  if (reason === 'no-data') {
    return <EmptyState icon={ChartColumn} title="Not enough data yet" description="Analytics appear 24 hours after your first post publishes." className="mx-auto mt-6 w-full max-w-[340px]" />
  }
  return (
    <EmptyState
      icon={SlidersHorizontal}
      title="No data for these filters"
      description="This account doesn’t publish to the selected platform."
      action={
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      }
      className="mx-auto mt-6 w-full max-w-[340px]"
    />
  )
}
