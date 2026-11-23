import { useIsMutating, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Activity, Eye, Heart, MessageCircle, Send, Share2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { MetricCard } from '@/components/metric-card'
import { PageContent, PageHeader } from '@/components/page'
import { PLATFORM_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'
import { accountLabel, analyticsQueryOptions, resolveFilters, type AnalyticsData, type SortKey } from './api'
import { PerformanceByPlatformCard, PlatformComparisonCard, TopContentCard } from './breakdowns'
import { EngagementOverTimeCard, PublishingFrequencyCard, ViewsOverTimeCard } from './charts'
import { AnalyticsFilterBar } from './filters'
import { compact, percent, rangeLabel, signedInt, signedPct, signedPt, trendOf } from './format'
import { AnalyticsEmpty, ApiErrorCard, ChartSkeleton, MetricSkeleton, TableSkeleton } from './states'

const route = getRouteApi('/_app/analytics')

/** Re-renders every 30s so "Data refreshed 14 min ago" stays truthful. */
function useNow(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}

function AnalyticsHeader() {
  return <PageHeader title="Analytics" description="Performance pulled from each platform’s API. Metrics a platform doesn’t report are marked N/A, never estimated." />
}

export function AnalyticsPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const filters = resolveFilters(search)
  const { data } = useSuspenseQuery(analyticsQueryOptions(filters))
  const refreshing = useIsMutating({ mutationKey: ['analytics', 'refresh'] }) > 0
  const now = useNow()

  const sort = search.sort ?? 'views'
  const setSort = (value: SortKey) => navigate({ search: (prev) => ({ ...prev, sort: value === 'views' ? undefined : value }), replace: true, resetScroll: false })
  const clearFilters = () => navigate({ search: (prev) => ({ ...prev, platform: undefined, account: undefined }), replace: true })

  const failing = data.platforms.filter((p) => data.sync[p].status === 'error')
  const period = search.range === 'custom' ? rangeLabel(data.window.from, data.window.to) : `Last ${data.window.days} days`
  const scope = filters.account === 'all' ? 'all accounts' : accountLabel(filters.account)

  return (
    <>
      <Topbar breadcrumb={[{ label: 'Analytics' }]} />
      <PageContent className="xl:gap-5">
        <AnalyticsHeader />
        <AnalyticsFilterBar refreshedAt={data.refreshedAt} now={now} />
        {data.empty ? (
          <AnalyticsEmpty reason={data.empty} onClearFilters={clearFilters} />
        ) : (
          <>
            {failing.map((p) => (
              <ApiErrorCard key={p} platform={p} sync={data.sync[p]} now={now} />
            ))}
            <MetricsRow data={data} />
            <div className="grid gap-4 xl:grid-cols-2">
              <ViewsOverTimeCard daily={data.daily} platforms={data.platforms} loading={refreshing} />
              <EngagementOverTimeCard daily={data.daily} loading={refreshing} />
            </div>
            <div className="grid items-start gap-4 xl:grid-cols-2">
              <PublishingFrequencyCard daily={data.daily} loading={refreshing} />
              <PerformanceByPlatformCard rows={data.byPlatform} loading={refreshing} />
            </div>
            <PlatformComparisonCard rows={data.byPlatform} description={`${period} · ${scope}`} />
            <TopContentCard rows={data.content} sort={sort} onSortChange={setSort} />
          </>
        )}
      </PageContent>
    </>
  )
}

/* ── KPI row ───────────────────────────────────────────────────────── */

const metricsGrid = 'grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3 xl:flex'
const metricCell = 'px-3.5 max-md:last:col-span-2 xl:flex-1 [&_p.truncate]:-mr-4'

function MetricsRow({ data }: { data: AnalyticsData }) {
  const m = data.metrics
  const pct = (d: number | null) => (d === null ? '—' : signedPct(d))
  const reachNote = data.reachExcludes.length ? `excl. ${data.reachExcludes.map((p) => PLATFORM_LABEL[p]).join(', ')}` : 'vs prev.'
  return (
    <div className={metricsGrid}>
      <MetricCard className={metricCell} label="Views" icon={Eye} value={compact(m.views.value ?? 0)} trend={trendOf(m.views.delta)} delta={pct(m.views.delta)} compare="vs prev." />
      {m.reach.value === null ? (
        <MetricCard className={metricCell} label="Reach" icon={Users} value="N/A" trend="neutral" delta="—" compare="Not reported" />
      ) : (
        <MetricCard className={metricCell} label="Reach" icon={Users} value={compact(m.reach.value)} trend={trendOf(m.reach.delta)} delta={pct(m.reach.delta)} compare={reachNote} />
      )}
      <MetricCard className={metricCell} label="Likes" icon={Heart} value={compact(m.likes.value ?? 0)} trend={trendOf(m.likes.delta)} delta={pct(m.likes.delta)} compare="vs prev." />
      <MetricCard className={metricCell} label="Comments" icon={MessageCircle} value={compact(m.comments.value ?? 0)} trend={trendOf(m.comments.delta)} delta={pct(m.comments.delta)} compare="vs prev." />
      <MetricCard className={metricCell} label="Shares" icon={Share2} value={compact(m.shares.value ?? 0)} trend={trendOf(m.shares.delta)} delta={pct(m.shares.delta)} compare="vs prev." />
      <MetricCard className={metricCell} label="Eng. rate" icon={Activity} value={percent(m.engRate.value ?? 0)} trend={trendOf(m.engRate.delta)} delta={signedPt(m.engRate.delta ?? 0)} compare="vs prev." />
      <MetricCard className={metricCell} label="Published" icon={Send} value={String(m.posts.value ?? 0)} trend={trendOf(m.posts.delta, 0)} delta={signedInt(m.posts.delta ?? 0)} compare="posts" />
    </div>
  )
}

/* ── Route pending state ───────────────────────────────────────────── */

/** Shown while the platform APIs respond (route `pendingComponent`): live filters, skeleton body. */
export function AnalyticsPending() {
  const now = useNow()
  return (
    <>
      <Topbar breadcrumb={[{ label: 'Analytics' }]} />
      <PageContent className="xl:gap-5">
        <AnalyticsHeader />
        <AnalyticsFilterBar now={now} />
        <div className={metricsGrid} role="status" aria-label="Loading metrics">
          {Array.from({ length: 7 }, (_, i) => (
            <MetricSkeleton key={i} className={cn(metricCell)} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartSkeleton className="h-[312px]" />
          <ChartSkeleton className="h-[312px]" />
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <ChartSkeleton className="h-[272px]" />
          <ChartSkeleton className="h-[220px]" />
        </div>
        <TableSkeleton rows={4} />
        <TableSkeleton rows={5} />
      </PageContent>
    </>
  )
}
