import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import activityIcon from '@/assets/figma/icons/activity.svg'
import alertCircleDanger from '@/assets/figma/icons/alert-circle-danger.svg'
import alertTriangle from '@/assets/figma/icons/alert-triangle.svg'
import alertTriangleWarning from '@/assets/figma/icons/alert-triangle-warning.svg'
import arrowRight from '@/assets/figma/icons/arrow-right.svg'
import calendarIcon from '@/assets/figma/icons/calendar.svg'
import chevronRightWarning from '@/assets/figma/icons/chevron-right-warning.svg'
import eyeIcon from '@/assets/figma/icons/eye.svg'
import heartIcon from '@/assets/figma/icons/heart.svg'
import plusInverse from '@/assets/figma/icons/plus-inverse.svg'
import refreshWarning from '@/assets/figma/icons/refresh-warning.svg'
import sendIcon from '@/assets/figma/icons/send.svg'
import chartEngagement from '@/assets/figma/overview/chart-engagement.svg'
import chartTablet from '@/assets/figma/overview/chart-tablet.svg'
import chartViews from '@/assets/figma/overview/chart-views.svg'
import sparklineMobile from '@/assets/figma/overview/sparkline-mobile.svg'
import { PageContent } from '@/components/layout/app-shell'
import { Topbar } from '@/components/layout/topbar'
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  Icon,
  MetricCard,
  PlatformLogo,
  PlatformStack,
  SegmentedControl,
  Select,
  StatusPill,
  Thumbnail,
} from '@/components/ui'
import { useSession } from '@/features/session/api'
import { cn } from '@/lib/cn'
import { PLATFORM_LABEL } from '@/lib/types'
import {
  ACCOUNT_OPTIONS,
  overviewQueryOptions,
  useResolveAttention,
  type AttentionItem,
  type OverviewData,
  type OverviewRange,
} from './api'

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

  const setRange = (value: OverviewRange) =>
    navigate({ search: (prev) => ({ ...prev, range: value === '30d' ? undefined : value }), replace: true })
  const setAccount = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, account: value === 'all' ? undefined : value }), replace: true })

  const days = RANGE_DAYS[range]

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
          <PerformanceCard data={data} days={days} account={account} className="flex-1" />
          <AttentionCard items={data.attention} className="w-[372px] shrink-0" />
        </div>
        <TrendCard variant="tablet" days={days} className="hidden md:flex xl:hidden" />
        <AttentionListCompact items={data.attention} className="hidden md:flex xl:hidden" />
        <TrendCard variant="mobile" days={days} className="md:hidden" />

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
        <h1 className="text-h2 text-primary md:text-h1">
          {greeting()}, {session.user.firstName}
        </h1>
        <p className="text-body-sm text-secondary md:text-body">
          <span className="md:hidden">
            {n} accounts · {session.workspace.name}
          </span>
          <span className="hidden md:inline xl:hidden">{n} connected accounts</span>
          <span className="hidden xl:inline">Here’s what’s happening across {n} connected accounts this month.</span>
        </p>
      </div>
      <div className="hidden min-w-0 flex-1 md:block" />
      <Select aria-label="Account" value={account} options={ACCOUNT_OPTIONS} onChange={onAccountChange} className="hidden xl:inline-flex" />
      <SegmentedControl aria-label="Date range" value={range} options={RANGE_LONG} onChange={onRangeChange} className="hidden xl:inline-flex" />
      <SegmentedControl aria-label="Date range" value={range} options={RANGE_SHORT} onChange={onRangeChange} className="hidden md:inline-flex xl:hidden" />
      <ButtonLink to="/create" icon={plusInverse} className="hidden md:inline-flex xl:hidden">
        Create post
      </ButtonLink>
      <SegmentedControl aria-label="Date range" value={range} options={RANGE_SHORT} onChange={onRangeChange} fill className="md:hidden" />
    </header>
  )
}

function AttentionBanner({ data, className }: { data: OverviewData; className?: string }) {
  const { failed, reauth } = data.metrics.attention
  const total = failed + reauth
  if (total === 0) return null
  return (
    <Link to="/monitoring" className={cn('flex items-center gap-3 rounded-xl border border-warning bg-warning-subtle px-3.5 py-3', className)}>
      <Icon src={alertTriangleWarning} size={18} />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-body-sm font-medium text-warning-text">
          {total} {total === 1 ? 'item needs' : 'items need'} attention
        </span>
        <span className="truncate text-caption text-secondary">
          {failed} failed · {reauth} accounts need reauth
        </span>
      </span>
      <Icon src={chevronRightWarning} size={16} />
    </Link>
  )
}

/* ── Metrics ───────────────────────────────────────────────────────── */

function DesktopMetrics({ data, days, className }: { data: OverviewData; days: number; className?: string }) {
  const m = data.metrics
  const total = m.attention.failed + m.attention.reauth
  return (
    <div className={cn('items-stretch gap-4', className)}>
      <MetricCard className="flex-1" label="Published" icon={sendIcon} value={String(m.published.value)} trend="up" delta={`+${m.published.delta}`} compare={`posts vs. prev. ${days} days`} />
      <MetricCard className="flex-1" label="Scheduled" icon={calendarIcon} value={String(m.scheduled.value)} trend="neutral" delta="Next" compare={m.scheduled.nextLabel} />
      <MetricCard
        className="flex-1"
        label="Needs attention"
        icon={alertTriangle}
        value={String(total)}
        trend="down"
        delta={`${m.attention.failed} failed`}
        compare={`${m.attention.reauth} need reauth`}
        tone={total > 0 ? 'warning' : 'default'}
      />
      <MetricCard className="flex-1" label="Total views" icon={eyeIcon} value={m.views.value} trend="up" delta={`+${m.views.deltaPct}%`} compare={`vs. prev. ${days} days`} />
      <MetricCard className="flex-1" label="Total engagement" icon={heartIcon} value={m.engagement.value} trend="up" delta={`+${m.engagement.deltaPct}%`} compare={`vs. prev. ${days} days`} />
    </div>
  )
}

function TabletMetrics({ data, className }: { data: OverviewData; className?: string }) {
  const m = data.metrics
  const card = 'w-[298px]'
  return (
    <div className={cn('flex-wrap gap-3', className)}>
      <MetricCard className={card} label="Published" icon={sendIcon} value={String(m.published.value)} trend="up" delta={`+${m.published.delta}`} compare="posts" />
      <MetricCard className={card} label="Scheduled" icon={calendarIcon} value={String(m.scheduled.value)} trend="neutral" delta="Next" compare={m.scheduled.nextAt} />
      <MetricCard className={card} label="Needs attention" icon={alertTriangle} value={String(m.attention.failed + m.attention.reauth)} trend="down" delta={`${m.attention.failed} failed`} compare={`${m.attention.reauth} reauth`} />
      <MetricCard className={card} label="Total views" icon={eyeIcon} value={m.views.value} trend="up" delta={`+${m.views.deltaPct}%`} compare="vs prev." />
      <MetricCard className={card} label="Engagement" icon={heartIcon} value={m.engagement.value} trend="up" delta={`+${m.engagement.deltaPct}%`} compare="vs prev." />
      <MetricCard className={card} label="Eng. rate" icon={activityIcon} value={`${m.engagementRate.value}%`} trend="up" delta={`+${m.engagementRate.deltaPt} pt`} compare="vs prev." />
    </div>
  )
}

function CompactMetric({ label, value, note, positive }: { label: string; value: string; note: string; positive?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border bg-surface p-3.5 shadow-xs">
      <p className="text-caption font-medium text-secondary">{label}</p>
      <p className="text-h1 whitespace-nowrap text-primary">{value}</p>
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

/* ── Charts ────────────────────────────────────────────────────────── */

const Y_TICKS = [
  { label: '77K', line: 0.5, text: -7.5 },
  { label: '58K', line: 55.5, text: 47.5 },
  { label: '39K', line: 109.5, text: 101.5 },
  { label: '19K', line: 164.5, text: 156.5 },
  { label: '0K', line: 218.5, text: 210.5 },
]
/** x positions as a share of the 700px design width. */
const X_TICKS = [
  { label: 'Oct 23', left: 44 / 700 },
  { label: 'Oct 30', left: 188.5 / 700 },
  { label: 'Nov 6', left: 355 / 700 },
  { label: 'Nov 13', left: 516 / 700 },
  { label: 'Nov 21', left: 661 / 700 },
]

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-[2px]', className)} />
      <span className="text-caption font-medium text-secondary">{label}</span>
    </span>
  )
}

function PerformanceCard({ data, days, account, className }: { data: OverviewData; days: number; account: string; className?: string }) {
  const scope = ACCOUNT_OPTIONS.find((a) => a.value === account)?.label ?? 'All platforms'
  return (
    <Card className={className}>
      <CardHeader
        title="Views & engagement"
        description={`${account === 'all' ? 'All platforms' : scope} · last ${days} days`}
        actions={
          <div className="flex items-center gap-4">
            <LegendDot className="bg-chart-1" label="Views" />
            <LegendDot className="bg-chart-2" label="Engagement" />
          </div>
        }
      />
      <div className="px-5 pt-2.5 pb-4">
        <div className="relative h-60 w-full" role="img" aria-label={`Views and engagement over the last ${days} days`}>
          {Y_TICKS.map((t) => (
            <div key={t.label}>
              <div className="absolute right-0 left-11 h-px bg-chart-grid" style={{ top: t.line }} />
              <span className="absolute left-0 text-caption text-tertiary" style={{ top: t.text }}>
                {t.label}
              </span>
            </div>
          ))}
          <img src={chartViews} alt="" className="absolute inset-0 block size-full max-w-none" draggable={false} />
          <img src={chartEngagement} alt="" className="absolute inset-0 block size-full max-w-none" draggable={false} />
          {X_TICKS.map((t, i) => (
            <span
              key={t.label}
              className="absolute top-56 text-caption whitespace-nowrap text-tertiary"
              style={i === X_TICKS.length - 1 ? { right: 0 } : { left: `${t.left * 100}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex border-t">
        {data.platformSplit.map((p) => (
          <div key={p.platform} className="flex min-w-0 flex-1 items-center gap-2.5 px-5 py-3.5">
            <PlatformLogo platform={p.platform} size={20} />
            <div className="flex min-w-0 flex-col">
              <span className="text-caption text-tertiary">{PLATFORM_LABEL[p.platform]}</span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="text-body text-primary">{p.value}</span>
                <span className={cn('text-caption', p.deltaPct >= 0 ? 'text-success-text' : 'text-danger-text')}>{pct(p.deltaPct)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function TrendCard({ variant, days, className }: { variant: 'tablet' | 'mobile'; days: number; className?: string }) {
  const tablet = variant === 'tablet'
  return (
    <Card className={cn(tablet ? 'gap-3 p-5' : 'gap-2.5 p-3.5', className)}>
      <div className="flex items-center gap-2">
        <h3 className={tablet ? 'text-h3 text-primary' : 'text-body-sm font-medium text-primary'}>{tablet ? 'Views & engagement' : 'Views'}</h3>
        <div className="flex-1" />
        <span className="text-caption text-tertiary">Last {days} days</span>
      </div>
      <img
        src={tablet ? chartTablet : sparklineMobile}
        alt={`Views over the last ${days} days`}
        className={cn('block w-full max-w-none', tablet ? 'h-[200px]' : 'h-[110px]')}
        draggable={false}
      />
    </Card>
  )
}

/* ── Needs attention ───────────────────────────────────────────────── */

function AttentionAction({ item, size = 'sm' }: { item: AttentionItem; size?: 'sm' }) {
  const resolve = useResolveAttention()
  const pending = resolve.isPending && resolve.variables?.id === item.id
  if (item.action === 'details') {
    return (
      <ButtonLink to="/monitoring" variant="secondary" size={size}>
        Details
      </ButtonLink>
    )
  }
  return (
    <Button variant="secondary" size={size} disabled={pending} onClick={() => resolve.mutate(item)}>
      {item.action === 'retry' ? (pending ? 'Retrying…' : 'Retry') : pending ? 'Reconnecting…' : 'Reconnect'}
    </Button>
  )
}

function AttentionCard({ items, className }: { items: AttentionItem[]; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader
        title="Needs attention"
        description={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        actions={
          <ButtonLink to="/monitoring" variant="ghost" size="sm">
            View all
          </ButtonLink>
        }
      />
      {items.length === 0 && <p className="border-t px-5 py-6 text-center text-body-sm text-tertiary">You’re all caught up.</p>}
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 border-t px-5 py-3">
          <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', item.kind === 'failed' ? 'bg-danger-subtle' : 'bg-warning-subtle')}>
            <Icon src={item.kind === 'failed' ? alertCircleDanger : refreshWarning} size={16} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-body-sm font-medium text-primary">{item.title}</p>
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
        <h3 className="text-h3 text-primary">Needs attention</h3>
        <div className="flex-1" />
        <Link to="/monitoring" className="text-caption font-medium text-accent-text hover:underline">
          View all
        </Link>
      </div>
      {actionable.length === 0 && <p className="border-t px-5 py-6 text-center text-body-sm text-tertiary">You’re all caught up.</p>}
      {actionable.map((item) => (
        <div key={item.id} className="flex items-center gap-3 border-t px-5 py-3">
          <PlatformLogo platform={item.platform} size={22} />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <p className="truncate text-body-sm font-medium text-primary">{item.title}</p>
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
        <p className="truncate text-body-sm font-medium text-primary">{post.title}</p>
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
      <CardHeader
        title="Upcoming scheduled"
        description={`Next 7 days · ${total} posts`}
        actions={
          <ButtonLink to="/calendar" variant="ghost" size="sm" icon={arrowRight}>
            Open calendar
          </ButtonLink>
        }
      />
      {posts.map((post) => (
        <PostRow key={post.id} post={post} meta={post.when} />
      ))}
    </Card>
  )
}

function RecentCard({ posts, className }: { posts: OverviewData['recent']; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader
        title="Recently published"
        description="Last 24 hours"
        actions={
          <ButtonLink to="/monitoring" variant="ghost" size="sm" icon={arrowRight}>
            Monitoring
          </ButtonLink>
        }
      />
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
        <h3 className="text-body-sm font-medium text-primary">Upcoming</h3>
        <div className="flex-1" />
        <Link to="/calendar" className="text-caption font-medium text-accent-text hover:underline">
          See all
        </Link>
      </div>
      {posts.slice(0, 3).map((post) => (
        <div key={post.id} className="flex items-center gap-2.5 border-t px-3.5 py-2.5">
          <Thumbnail tone={post.tone} ratio={1} className="size-10 rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <p className="truncate text-body-sm font-medium text-primary">{post.title}</p>
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
