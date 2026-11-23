import { ArrowRight, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { PlatformLogo } from '@/components/platform-logo'
import { SegmentedControl } from '@/components/segmented-control'
import { StatusPill } from '@/components/status-pill'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import { listFormat, SORT_KEYS, SORT_LABEL, type ContentRow, type PlatformRow, type SortKey } from './api'
import { compact, kOne, kWhole, percent, shortDate } from './format'
import { ChartSkeleton } from './states'

/** Header actions move under the title on phones instead of squeezing it. */
const stackActionOnMobile = 'max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:justify-self-start max-sm:pt-2.5'

const NotAvailable = () => <StatusPill status="not-available" label="N/A" />

/* ── Performance by platform ───────────────────────────────────────── */

const BAR_FILL: Record<Platform, string> = {
  tiktok: '*:data-[slot=progress-indicator]:bg-platform-tiktok',
  instagram: '*:data-[slot=progress-indicator]:bg-platform-instagram',
  youtube: '*:data-[slot=progress-indicator]:bg-platform-youtube',
  facebook: '*:data-[slot=progress-indicator]:bg-platform-facebook',
}

type Breakdown = 'views' | 'engagement'
const BREAKDOWN_OPTIONS = [
  { value: 'views', label: 'Views' },
  { value: 'engagement', label: 'Engagement' },
] as const

export function PerformanceByPlatformCard({ rows, loading, className }: { rows: PlatformRow[]; loading?: boolean; className?: string }) {
  const [metric, setMetric] = useState<Breakdown>('views')
  if (loading) return <ChartSkeleton className={cn('h-[220px]', className)} />
  const value = (r: PlatformRow) => (metric === 'views' ? r.views : r.engagements)
  const sorted = [...rows].sort((a, b) => value(b) - value(a))
  const max = Math.max(...sorted.map(value), 1)
  return (
    <Card className={className}>
      <CardHeader className="max-sm:grid-cols-1">
        <CardTitle className="col-start-1">Performance by platform</CardTitle>
        <CardDescription className="col-start-1">{metric === 'views' ? 'Share of views' : 'Share of engagements'} · engagement rate</CardDescription>
        <CardAction className={stackActionOnMobile}>
          <SegmentedControl aria-label="Breakdown metric" value={metric} options={BREAKDOWN_OPTIONS} onValueChange={setMetric} />
        </CardAction>
      </CardHeader>
      <ul className="flex flex-col gap-4 px-5 pt-1 pb-5">
        {sorted.map((r) => (
          <li key={r.platform} className="flex items-center gap-3">
            <div className="flex w-[120px] shrink-0 items-center gap-2 max-sm:w-[100px]">
              <PlatformLogo platform={r.platform} size={18} />
              <span className="truncate text-body-sm font-medium text-foreground">{PLATFORM_LABEL[r.platform]}</span>
            </div>
            <Progress value={(value(r) / max) * 100} aria-label={`${PLATFORM_LABEL[r.platform]} ${metric}`} className={cn('h-2.5 min-w-0 flex-1', BAR_FILL[r.platform])} />
            <div className="flex w-[110px] shrink-0 items-center justify-end gap-2 whitespace-nowrap max-sm:w-[92px]">
              <span className="text-body-sm font-medium text-foreground">{metric === 'views' ? kWhole(r.views) : compact(r.engagements)}</span>
              <span className="text-caption text-tertiary">{percent(r.engRate)}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ── Platform comparison ───────────────────────────────────────────── */

const head = 'h-9 px-0 text-right text-caption font-medium text-tertiary'
const cell = 'px-0 py-0 text-right text-body-sm text-muted-foreground'

function comparisonNote(rows: PlatformRow[]) {
  const noun = (list: Platform[]) => `${listFormat(list.map((p) => PLATFORM_LABEL[p]))} ${list.length === 1 ? 'doesn’t' : 'don’t'}`
  const noReach = rows.filter((r) => r.reach === null).map((r) => r.platform)
  const noSaves = rows.filter((r) => r.saves === null).map((r) => r.platform)
  const parts: string[] = []
  if (noReach.length) parts.push(`${noun(noReach)} report reach.`)
  if (noSaves.length) parts.push(`${noun(noSaves)} report saves for these formats.`)
  parts.push(parts.length ? 'Totals only include platforms that report the metric.' : 'Every platform in this view reports all metrics.')
  return parts.join(' ')
}

export function PlatformComparisonCard({ rows, description, className }: { rows: PlatformRow[]; description: string; className?: string }) {
  const value = (v: number | null, fmt: (n: number) => string) => (v === null ? <NotAvailable /> : fmt(v))
  return (
    <Card className={className}>
      <CardHeader className="max-sm:grid-cols-1">
        <CardTitle className="col-start-1">Platform comparison</CardTitle>
        <CardDescription className="col-start-1">{description}</CardDescription>
        <CardAction className={cn('gap-1.5', stackActionOnMobile)}>
          <NotAvailable />
          <span className="text-caption whitespace-nowrap text-tertiary">= not provided by the platform API</span>
        </CardAction>
      </CardHeader>
      <Table className="min-w-[880px] table-fixed">
        <TableHeader className="bg-canvas">
          <TableRow className="border-t hover:bg-transparent">
            <TableHead className={cn(head, 'w-[220px] pl-5 text-left')}>Platform</TableHead>
            <TableHead className={head}>Views</TableHead>
            <TableHead className={head}>Reach</TableHead>
            <TableHead className={head}>Likes</TableHead>
            <TableHead className={head}>Comments</TableHead>
            <TableHead className={head}>Shares</TableHead>
            <TableHead className={head}>Saves</TableHead>
            <TableHead className={head}>Eng. rate</TableHead>
            <TableHead className={cn(head, 'w-[130px] pr-5')}>Posts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.platform} className="h-12">
              <TableCell className="py-0 pl-5">
                <span className="flex items-center gap-2">
                  <PlatformLogo platform={r.platform} size={20} />
                  <span className="truncate text-body-sm font-medium text-foreground">{PLATFORM_LABEL[r.platform]}</span>
                </span>
              </TableCell>
              <TableCell className={cell}>{kWhole(r.views)}</TableCell>
              <TableCell className={cell}>{value(r.reach, kWhole)}</TableCell>
              <TableCell className={cell}>{kOne(r.likes)}</TableCell>
              <TableCell className={cell}>{kOne(r.comments)}</TableCell>
              <TableCell className={cell}>{kOne(r.shares)}</TableCell>
              <TableCell className={cell}>{value(r.saves, kOne)}</TableCell>
              <TableCell className={cn(cell, 'text-foreground')}>{percent(r.engRate)}</TableCell>
              <TableCell className={cn(cell, 'pr-5')}>{Math.round(r.posts)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-start gap-1.5 border-t bg-canvas px-5 py-2.5">
        <Info aria-hidden className="mt-px size-3.5 shrink-0 text-tertiary" />
        <p className="text-caption text-tertiary">{comparisonNote(rows)}</p>
      </div>
    </Card>
  )
}

/* ── Top-performing content ────────────────────────────────────────── */

const SORT_PHRASE: Record<SortKey, string> = { views: 'views', engRate: 'engagement rate', likes: 'likes', comments: 'comments', shares: 'shares' }
const TOP_N = 5

function sortContent(rows: ContentRow[], key: SortKey) {
  return [...rows].sort((a, b) => (b[key] ?? -1) - (a[key] ?? -1) || b.views - a.views)
}

function SortHead({ column, sort, onSort, className, children }: { column: SortKey; sort: SortKey; onSort: (k: SortKey) => void; className?: string; children: ReactNode }) {
  const active = column === sort
  return (
    <TableHead aria-sort={active ? 'descending' : 'none'} className={cn(head, className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn('inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20', active ? 'text-foreground' : 'hover:text-muted-foreground')}
      >
        {children}
        {active && <ChevronDown aria-hidden className="size-3" />}
      </button>
    </TableHead>
  )
}

export function TopContentCard({ rows, sort, onSortChange, className }: { rows: ContentRow[]; sort: SortKey; onSortChange: (k: SortKey) => void; className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const sorted = sortContent(rows, sort)
  const visible = expanded ? sorted : sorted.slice(0, TOP_N)
  const num = (column: SortKey) => cn(cell, column === sort && 'text-foreground')
  return (
    <Card className={className}>
      <CardHeader className="max-sm:grid-cols-1">
        <CardTitle className="col-start-1">Top-performing content</CardTitle>
        <CardDescription className="col-start-1">Ranked by {SORT_PHRASE[sort]}</CardDescription>
        <CardAction className={stackActionOnMobile}>
          <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
            <SelectTrigger aria-label="Sort by">
              <SelectValue>Sort: {SORT_LABEL[sort]}</SelectValue>
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {SORT_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {SORT_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sorted.length > TOP_N && (
            <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)}>
              {expanded ? <ChevronUp /> : <ArrowRight />}
              {expanded ? `Top ${TOP_N}` : 'View all'}
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <Table className="min-w-[1000px] table-fixed">
        <TableHeader className="bg-canvas">
          <TableRow className="border-t hover:bg-transparent">
            <TableHead className={cn(head, 'w-[60px] pl-5 text-left')}>#</TableHead>
            <TableHead className={cn(head, 'pr-3 text-left')}>Content</TableHead>
            <TableHead className={cn(head, 'w-[122px] pr-3 text-left')}>Platforms</TableHead>
            <TableHead className={cn(head, 'w-[122px] pr-3 text-left')}>Published</TableHead>
            <SortHead column="views" sort={sort} onSort={onSortChange} className="w-[102px] pr-3">
              Views
            </SortHead>
            <SortHead column="engRate" sort={sort} onSort={onSortChange} className="w-[102px] pr-3">
              Eng. rate
            </SortHead>
            <SortHead column="likes" sort={sort} onSort={onSortChange} className="w-[92px] pr-3">
              Likes
            </SortHead>
            <SortHead column="comments" sort={sort} onSort={onSortChange} className="w-[92px] pr-3">
              Comments
            </SortHead>
            <SortHead column="shares" sort={sort} onSort={onSortChange} className="w-[100px] pr-5">
              Shares
            </SortHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="py-8 text-center text-body-sm text-tertiary">
                No posts published in this period.
              </TableCell>
            </TableRow>
          )}
          {visible.map((r, i) => (
            <TableRow key={r.id}>
              <TableCell className="py-2 pl-5 text-caption font-medium text-tertiary">{i + 1}</TableCell>
              <TableCell className="py-2 pr-3 pl-0">
                <span className="flex min-w-0 items-center gap-2.5">
                  <Thumbnail tone={r.tone} ratio={1} className="size-10 rounded-md" />
                  <span className="truncate text-body-sm font-medium text-foreground">{r.title}</span>
                </span>
              </TableCell>
              <TableCell className="py-2 pr-3 pl-0">
                <span className="flex items-center gap-1">
                  {r.platforms.map((p) => (
                    <PlatformLogo key={p} platform={p} size={18} />
                  ))}
                </span>
              </TableCell>
              <TableCell className="py-2 pr-3 pl-0 text-body-sm text-muted-foreground">{shortDate(r.publishedAt)}</TableCell>
              <TableCell className={cn(num('views'), 'pr-3')}>{compact(r.views)}</TableCell>
              <TableCell className={cn(num('engRate'), 'pr-3')}>{percent(r.engRate)}</TableCell>
              <TableCell className={cn(num('likes'), 'pr-3')}>{compact(r.likes)}</TableCell>
              <TableCell className={cn(num('comments'), 'pr-3')}>{compact(r.comments)}</TableCell>
              <TableCell className={cn(num('shares'), 'pr-5')}>{r.shares === null ? <NotAvailable /> : compact(r.shares)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
