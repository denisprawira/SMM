import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { Activity, ArrowRight, Calendar, ChevronRight, CircleAlert, Eye, Heart, Plus, RefreshCw, Send, TriangleAlert } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Topbar } from '@/components/layout/topbar'
import { MetricCard } from '@/components/metric-card'
import { PageContent } from '@/components/page'
import { PlatformLogo, PlatformStack } from '@/components/platform-logo'
import { SegmentedControl } from '@/components/segmented-control'
import { StatusPill } from '@/components/status-pill'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from '@/features/session/api'
import { PLATFORM_LABEL } from '@/lib/types'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { ACCOUNT_OPTIONS, overviewQueryOptions, useResolveAttention, type AttentionItem, type OverviewData, type OverviewRange, type TrendPoint } from './api'

const route = getRouteApi('/_app/')

const RANGE_DAYS: Record<OverviewRange, number> = { '7d': 7, '30d': 30, '90d': 90 }
const RANGE_LONG = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
] as const
const RANGE_SHORT = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
] as const

function greeting(date = new Date()) {
  const h = date.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const pct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n)}%`

export function OverviewPage() {
  const { range = '30d', account = 'all' } = route.useSearch()
  const navigate = route.useNavigate()
  const { data } = useSuspenseQuery(overviewQueryOptions({ range, account }))

  const setRange = (value: OverviewRange) => navigate({ search: (prev) => ({ ...prev, range: value === '30d' ? undefined : value }), replace: true })
  const setAccount = (value: string) => navigate({ search: (prev) => ({ ...prev, account: value === 'all' ? undefined : value }), replace: true })

  const days = RANGE_DAYS[range]
  const trend = data.trend.slice(-Math.min(days, data.trend.length))
  // Charts measure their box, so only the breakpoint's variant is mounted (a display:none chart is 0×0).
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const isTablet = useMediaQuery('(min-width: 768px)') && !isDesktop

  return (
    <>
      <Topbar breadcrumb={[{ label: 'Overview' }]} />
      <PageContent>
        <OverviewHeader range={range} account={account} onRangeChange={setRange} onAccountChange={setAccount} />
        <AttentionBanner data={data} className="md:hidden" />

        <DesktopMetrics data={data} days={days} className="hidden xl:flex" />
        <TabletMetrics data={data} className="hidden md:flex xl:hidden" />
        <MobileMetrics data={data} className="md:hidden" />

        <div className="hidden items-start gap-4 xl:flex">
          {isDesktop && <PerformanceCard data={data} trend={trend} days={days} account={account} className="flex-1" />}
          <AttentionCard items={data.attention} className="w-[372px] shrink-0" />
        </div>
        {isTablet && <TrendCard variant="tablet" trend={trend} days={days} className="hidden md:flex xl:hidden" />}
        <AttentionListCompact items={data.attention} className="hidden md:flex xl:hidden" />
        {!isDesktop && !isTablet && <TrendCard variant="mobile" trend={trend} days={days} className="md:hidden" />}

        <div className="hidden items-start gap-4 xl:flex">
          <UpcomingCard posts={data.upcoming} total={data.metrics.scheduled.value} className="flex-1" />
          <RecentCard posts={data.recent} className="flex-1" />
        </div>
        <UpcomingCompact posts={data.upcoming} className="md:hidden" />
      </PageContent>
    </>
  )
}

/* ── Header ────────────────────────────────────────────────────────── */

function OverviewHeader({
  range,
  account,
  onRangeChange,
  onAccountChange,
}: {
  range: OverviewRange
  account: string
  onRangeChange: (r: OverviewRange) => void
  onAccountChange: (a: string) => void
}) {
  const session = useSession()
  const n = session.workspace.connectedAccounts
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:gap-2.5 xl:gap-3">
      <div className="flex min-w-0 flex-col gap-0.5 md:gap-1">
        <h1 className="text-h2 text-foreground md:text-h1">
          {greeting()}, {session.user.firstName}
        </h1>
        <p className="text-body-sm text-muted-foreground md:text-body">
          <span className="md:hidden">
            {n} accounts · {session.workspace.name}
          </span>
          <span className="hidden md:inline xl:hidden">{n} connected accounts</span>
          <span className="hidden xl:inline">Here’s what’s happening across {n} connected accounts this month.</span>
        </p>
      </div>
      <div className="hidden min-w-0 flex-1 md:block" />
      <Select value={account} onValueChange={onAccountChange}>
        <SelectTrigger aria-label="Account" className="hidden xl:flex">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {ACCOUNT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SegmentedControl aria-label="Date range" value={range} options={RANGE_LONG} onValueChange={onRangeChange} className="hidden xl:inline-flex" />
      <SegmentedControl aria-label="Date range" value={range} options={RANGE_SHORT} onValueChange={onRangeChange} className="hidden md:inline-flex xl:hidden" />
      <Button asChild className="hidden md:inline-flex xl:hidden">
        <Link to="/create">
          <Plus />
          Create post
        </Link>
      </Button>
      <SegmentedControl aria-label="Date range" value={range} options={RANGE_SHORT} onValueChange={onRangeChange} fill className="md:hidden" />
    </header>
  )
}

function AttentionBanner({ data, className }: { data: OverviewData; className?: string }) {
  const { failed, reauth } = data.metrics.attention
  const total = failed + reauth
  if (total === 0) return null
  return (
    <Link to="/monitoring" className={cn('flex items-center gap-3 rounded-xl border border-warning bg-warning-subtle px-3.5 py-3', className)}>
      <TriangleAlert aria-hidden className="size-[18px] shrink-0 text-warning" />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-body-sm font-medium text-warning-text">
          {total} {total === 1 ? 'item needs' : 'items need'} attention
        </span>
        <span className="truncate text-caption text-muted-foreground">
          {failed} failed · {reauth} accounts need reauth
        </span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-warning" />
    </Link>
  )
}

/* ── Metrics ───────────────────────────────────────────────────────── */

function DesktopMetrics({ data, days, className }: { data: OverviewData; days: number; className?: string }) {
  const m = data.metrics
  const total = m.attention.failed + m.attention.reauth
  return (
    <div className={cn('items-stretch gap-4', className)}>
      <MetricCard className="flex-1" label="Published" icon={Send} value={String(m.published.value)} trend="up" delta={`+${m.published.delta}`} compare={`posts vs. prev. ${days} days`} />
      <MetricCard className="flex-1" label="Scheduled" icon={Calendar} value={String(m.scheduled.value)} trend="neutral" delta="Next" compare={m.scheduled.nextLabel} />
      <MetricCard
        className="flex-1"
        label="Needs attention"
        icon={TriangleAlert}
        value={String(total)}
        trend="down"
        delta={`${m.attention.failed} failed`}
        compare={`${m.attention.reauth} need reauth`}
        tone={total > 0 ? 'warning' : 'default'}
      />
      <MetricCard className="flex-1" label="Total views" icon={Eye} value={m.views.value} trend="up" delta={`+${m.views.deltaPct}%`} compare={`vs. prev. ${days} days`} />
      <MetricCard className="flex-1" label="Total engagement" icon={Heart} value={m.engagement.value} trend="up" delta={`+${m.engagement.deltaPct}%`} compare={`vs. prev. ${days} days`} />
    </div>
  )
}

function TabletMetrics({ data, className }: { data: OverviewData; className?: string }) {
  const m = data.metrics
  const card = 'w-[298px]'
  return (
    <div className={cn('flex-wrap gap-3', className)}>
      <MetricCard className={card} label="Published" icon={Send} value={String(m.published.value)} trend="up" delta={`+${m.published.delta}`} compare="posts" />
      <MetricCard className={card} label="Scheduled" icon={Calendar} value={String(m.scheduled.value)} trend="neutral" delta="Next" compare={m.scheduled.nextAt} />
      <MetricCard className={card} label="Needs attention" icon={TriangleAlert} value={String(m.attention.failed + m.attention.reauth)} trend="down" delta={`${m.attention.failed} failed`} compare={`${m.attention.reauth} reauth`} />
      <MetricCard className={card} label="Total views" icon={Eye} value={m.views.value} trend="up" delta={`+${m.views.deltaPct}%`} compare="vs prev." />
      <MetricCard className={card} label="Engagement" icon={Heart} value={m.engagement.value} trend="up" delta={`+${m.engagement.deltaPct}%`} compare="vs prev." />
      <MetricCard className={card} label="Eng. rate" icon={Activity} value={`${m.engagementRate.value}%`} trend="up" delta={`+${m.engagementRate.deltaPt} pt`} compare="vs prev." />
    </div>
  )
}

function CompactMetric({ label, value, note, positive }: { label: string; value: string; note: string; positive?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border bg-card p-3.5 shadow-xs">
      <p className="text-caption font-medium text-muted-foreground">{label}</p>
      <p className="text-h1 whitespace-nowrap text-foreground">{value}</p>
      <p className={cn('truncate text-caption font-medium', positive ? 'text-success-text' : 'text-tertiary')}>{note}</p>
    </div>
  )
}

function MobileMetrics({ data, className }: { data: OverviewData; className?: string }) {
  const m = data.metrics
  return (
    <div className={cn('grid grid-cols-2 gap-2.5', className)}>
      <CompactMetric label="Published" value={String(m.published.value)} note={`+${m.published.delta}`} positive />
      <CompactMetric label="Scheduled" value={String(m.scheduled.value)} note={`Next ${m.scheduled.nextAt}`} />
      <CompactMetric label="Views" value={m.views.value} note={`+${m.views.deltaPct}%`} positive />
      <CompactMetric label="Engagement" value={m.engagement.value} note={`+${m.engagement.deltaPct}%`} positive />
    </div>
  )
}

/* ── Charts (shadcn Chart + Recharts) ──────────────────────────────── */

const chartConfig = {
  views: { label: 'Views', color: 'var(--chart-1)' },
  spark: { label: 'Views', color: 'var(--chart-1)' },
  engagement: { label: 'Engagement', color: 'var(--chart-2)' },
} satisfies ChartConfig

const Y_MAX = 77_000
const Y_TICKS = [0, Y_MAX / 4, Y_MAX / 2, (Y_MAX * 3) / 4, Y_MAX]
const formatK = (v: number) => `${Math.round(v / 1000)}K`
const formatDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** Five weekly x-axis labels, first and last included (Figma: Oct 23, Oct 30, Nov 6, Nov 13, Nov 21). */
function xTicks(trend: TrendPoint[]) {
  const last = trend.length - 1
  return [0, 1, 2, 3, 4].map((i) => trend[i === 4 ? last : Math.floor((last * i) / 4)].date)
}

type AxisTickProps = { x?: number; y?: number; index?: number; visibleTicksCount?: number; payload?: { value: string } }

/** Y labels sit flush left of the 44px gutter, vertically centred on their grid line. */
function ValueTick({ y = 0, payload }: { y?: number; payload?: { value: number } }) {
  return (
    <text x={0} y={y} dy={4} textAnchor="start" className="fill-tertiary text-caption">
      {formatK(payload?.value ?? 0)}
    </text>
  )
}

/** Figma pins the first date to the plot's left edge and the last to its right edge. */
function DateTick({ x = 0, y = 0, index = 0, visibleTicksCount = 0, payload }: AxisTickProps) {
  const anchor = index === 0 ? 'start' : index === visibleTicksCount - 1 ? 'end' : 'middle'
  return (
    <text x={x} y={y} dy={12} textAnchor={anchor} className="fill-tertiary text-caption">
      {formatDay(payload?.value ?? '')}
    </text>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-[2px]', className)} />
      <span className="text-caption font-medium text-muted-foreground">{label}</span>
    </span>
  )
}

function PerformanceCard({ data, trend, days, account, className }: { data: OverviewData; trend: TrendPoint[]; days: number; account: string; className?: string }) {
  const scope = ACCOUNT_OPTIONS.find((a) => a.value === account)?.label ?? 'All platforms'
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Views &amp; engagement</CardTitle>
        <CardDescription>
          {account === 'all' ? 'All platforms' : scope} · last {days} days
        </CardDescription>
        <CardAction className="gap-4">
          <LegendDot className="bg-chart-1" label="Views" />
          <LegendDot className="bg-chart-2" label="Engagement" />
        </CardAction>
      </CardHeader>
      <div className="px-5 pt-2.5 pb-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full [&_.recharts-cartesian-axis-tick_text]:fill-tertiary" aria-label={`Views and engagement over the last ${days} days`}>
          <AreaChart data={trend} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <YAxis width={44} domain={[0, Y_MAX]} ticks={Y_TICKS} tickFormatter={formatK} axisLine={false} tickLine={false} tick={<ValueTick />} />
            <XAxis dataKey="date" ticks={xTicks(trend)} tick={<DateTick />} axisLine={false} tickLine={false} tickMargin={4} interval={0} />
            <ChartTooltip cursor={{ stroke: 'var(--border-strong)' }} content={<ChartTooltipContent indicator="dot" labelFormatter={(_, payload) => formatDay(String(payload?.[0]?.payload?.date ?? ''))} />} />
            <Area dataKey="views" type="monotone" stroke="var(--color-views)" strokeWidth={2} fill="var(--color-views)" fillOpacity={0.08} activeDot={{ r: 3 }} />
            <Area dataKey="engagement" type="monotone" stroke="var(--color-engagement)" strokeWidth={2} fill="var(--color-engagement)" fillOpacity={0.08} activeDot={{ r: 3 }} />
          </AreaChart>
        </ChartContainer>
      </div>
      <div className="flex border-t">
        {data.platformSplit.map((p) => (
          <div key={p.platform} className="flex min-w-0 flex-1 items-center gap-2.5 px-5 py-3.5">
            <PlatformLogo platform={p.platform} size={20} />
            <div className="flex min-w-0 flex-col">
              <span className="text-caption text-tertiary">{PLATFORM_LABEL[p.platform]}</span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="text-body text-foreground">{p.value}</span>
                <span className={cn('text-caption', p.deltaPct >= 0 ? 'text-success-text' : 'text-danger-text')}>{pct(p.deltaPct)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/** Tablet "Views & engagement" (200px) and mobile "Views" sparkline (110px): one views area, straight segments, no axes. */
function TrendCard({ variant, trend, days, className }: { variant: 'tablet' | 'mobile'; trend: TrendPoint[]; days: number; className?: string }) {
  const tablet = variant === 'tablet'
  return (
    <Card className={cn(tablet ? 'gap-3 p-5' : 'gap-2.5 p-3.5', className)}>
      <div className="flex items-center gap-2">
        <h3 className={tablet ? 'text-h3 text-foreground' : 'text-body-sm font-medium text-foreground'}>{tablet ? 'Views & engagement' : 'Views'}</h3>
        <div className="flex-1" />
        <span className="text-caption text-tertiary">Last {days} days</span>
      </div>
      <ChartContainer config={chartConfig} className={cn('aspect-auto w-full', tablet ? 'h-[200px]' : 'h-[110px]')} aria-label={`Views over the last ${days} days`}>
        <AreaChart data={trend} margin={{ top: 1, right: 1, bottom: 0, left: 1 }}>
          <YAxis hide domain={[0, 200]} />
          <Area dataKey="spark" type="linear" stroke="var(--color-views)" strokeWidth={2} strokeLinejoin="round" fill="var(--color-views)" fillOpacity={0.08} />
        </AreaChart>
      </ChartContainer>
    </Card>
  )
}

/* ── Needs attention ───────────────────────────────────────────────── */

function AttentionAction({ item }: { item: AttentionItem }) {
  const resolve = useResolveAttention()
  const pending = resolve.isPending && resolve.variables?.id === item.id
  if (item.action === 'details') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/monitoring/$jobId" params={{ jobId: item.id }}>
          Details
        </Link>
      </Button>
    )
  }
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => resolve.mutate(item)}>
      {item.action === 'retry' ? (pending ? 'Retrying…' : 'Retry') : pending ? 'Reconnecting…' : 'Reconnect'}
    </Button>
  )
}

function AttentionCard({ items, className }: { items: AttentionItem[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link to="/monitoring">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      {items.length === 0 && <p className="border-t px-5 py-6 text-center text-body-sm text-tertiary">You’re all caught up.</p>}
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 border-t px-5 py-3">
          <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', item.kind === 'failed' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning')}>
            {item.kind === 'failed' ? <CircleAlert aria-hidden className="size-4" /> : <RefreshCw aria-hidden className="size-4" />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-body-sm font-medium text-foreground">{item.title}</p>
            <p className="truncate text-caption text-tertiary">{item.context}</p>
            {item.kind === 'failed' && <p className="truncate text-caption text-danger-text">{item.reason}</p>}
          </div>
          <AttentionAction item={item} />
        </div>
      ))}
    </Card>
  )
}

/** Tablet: only items with a one-tap fix (retry / reconnect), top 3. */
function AttentionListCompact({ items, className }: { items: AttentionItem[]; className?: string }) {
  const actionable = items.filter((i) => i.action !== 'details').slice(0, 3)
  return (
    <Card className={className}>
      <div className="flex items-center px-5 py-3.5">
        <h3 className="text-h3 text-foreground">Needs attention</h3>
        <div className="flex-1" />
        <Link to="/monitoring" className="text-caption font-medium text-primary-text hover:underline">
          View all
        </Link>
      </div>
      {actionable.length === 0 && <p className="border-t px-5 py-6 text-center text-body-sm text-tertiary">You’re all caught up.</p>}
      {actionable.map((item) => (
        <div key={item.id} className="flex items-center gap-3 border-t px-5 py-3">
          <PlatformLogo platform={item.platform} size={22} />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <p className="truncate text-body-sm font-medium text-foreground">{item.title}</p>
            <p className={cn('truncate text-caption', item.kind === 'failed' ? 'text-danger-text' : 'text-warning-text')}>{item.reason}</p>
          </div>
          <AttentionAction item={item} />
        </div>
      ))}
    </Card>
  )
}

/* ── Post lists ────────────────────────────────────────────────────── */

function PostRow({ post, meta, published }: { post: OverviewData['upcoming'][number]; meta: string; published?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-t px-5 py-2.5">
      <Thumbnail tone={post.tone} ratio={1} className="size-11 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body-sm font-medium text-foreground">{post.title}</p>
        <p className="truncate text-caption text-tertiary">{meta}</p>
      </div>
      <PlatformStack platforms={post.platforms} size={20} />
      <StatusPill status={published ? 'published' : 'scheduled'} />
    </div>
  )
}

function UpcomingCard({ posts, total, className }: { posts: OverviewData['upcoming']; total: number; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Upcoming scheduled</CardTitle>
        <CardDescription>Next 7 days · {total} posts</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link to="/calendar">
              <ArrowRight />
              Open calendar
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      {posts.map((post) => (
        <PostRow key={post.id} post={post} meta={post.when} />
      ))}
    </Card>
  )
}

function RecentCard({ posts, className }: { posts: OverviewData['recent']; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recently published</CardTitle>
        <CardDescription>Last 24 hours</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link to="/monitoring">
              <ArrowRight />
              Monitoring
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      {posts.map((post) => (
        <PostRow key={post.id} post={post} meta={post.meta} published />
      ))}
    </Card>
  )
}

function UpcomingCompact({ posts, className }: { posts: OverviewData['upcoming']; className?: string }) {
  return (
    <Card className={className}>
      <div className="flex items-center px-3.5 py-3">
        <h3 className="text-body-sm font-medium text-foreground">Upcoming</h3>
        <div className="flex-1" />
        <Link to="/calendar" className="text-caption font-medium text-primary-text hover:underline">
          See all
        </Link>
      </div>
      {posts.slice(0, 3).map((post) => (
        <div key={post.id} className="flex items-center gap-2.5 border-t px-3.5 py-2.5">
          <Thumbnail tone={post.tone} ratio={1} className="size-10 rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <p className="truncate text-body-sm font-medium text-foreground">{post.title}</p>
            <p className="truncate text-caption text-tertiary">{post.whenShort}</p>
          </div>
          <div className="flex shrink-0 items-center gap-[3px]">
            {post.platforms.map((p) => (
              <PlatformLogo key={p} platform={p} size={16} />
            ))}
          </div>
        </div>
      ))}
    </Card>
  )
}
