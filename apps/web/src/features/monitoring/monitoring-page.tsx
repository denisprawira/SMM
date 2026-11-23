import { useIsFetching, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Outlet } from '@tanstack/react-router'
import { ArrowUpRight, CircleCheck, Clock, RefreshCw, SearchX } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Banner } from '@/components/banner'
import { EmptyState } from '@/components/empty-state'
import { MobileFilterButton, Topbar } from '@/components/layout/topbar'
import { PageContent, PageHeader } from '@/components/page'
import { SearchInput } from '@/components/search-input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PLATFORM_LABEL, type Platform, type PublishStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_IDS,
  accountLabel,
  DATE_RANGES,
  DEFAULT_EXPANDED,
  DEFAULT_RANGE,
  exportJobsCsv,
  jobsQueryOptions,
  PLATFORMS,
  STATUS_LABEL,
  STATUS_TABS,
  type AccountId,
  type DateRange,
  type JobsPage,
  type MonitoringSearch,
} from './api'
import { JobsPagination } from './components/jobs-pagination'
import { JobsTable } from './components/jobs-table'
import { MobileJobCard, StatusChips } from './components/mobile-jobs'
import { mobilePosts } from './hooks'

const route = getRouteApi('/_app/monitoring')
const NO_SELECTION: ReadonlySet<string> = new Set()

/** `/monitoring` — Figma 11 "Post Monitoring — Desktop" + M04 mobile. The job drawer renders into the <Outlet/>. */
export function MonitoringPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data } = useSuspenseQuery(jobsQueryOptions(search))
  const grouped = search.grouped ?? true

  /** Filter changes replace history and reset to page 1. */
  const setSearch = (patch: Partial<MonitoringSearch>) => navigate({ to: '/monitoring', search: (prev) => ({ ...prev, page: undefined, ...patch }), replace: true })

  // Search box: local value, debounced into the URL.
  const [query, setQuery] = useState(search.q ?? '')
  const debounce = useRef<number>(undefined)
  const onQueryChange = (value: string) => {
    setQuery(value)
    window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(() => setSearch({ q: value.trim() || undefined }), 300)
  }
  const clearFilters = () => {
    setQuery('')
    navigate({ to: '/monitoring', search: (prev) => ({ grouped: prev.grouped }), replace: true })
  }

  // Selection is per result set: changing filters or page clears it.
  const selectionKey = JSON.stringify(search)
  const [selection, setSelection] = useState<{ key: string; ids: Set<string> }>({ key: selectionKey, ids: new Set() })
  const selected = selection.key === selectionKey ? selection.ids : NO_SELECTION
  const onSelect = (ids: string[], checked: boolean) =>
    setSelection((s) => {
      const next = new Set(s.key === selectionKey ? s.ids : [])
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return { key: selectionKey, ids: next }
    })
  const clearSelection = () => setSelection({ key: selectionKey, ids: new Set() })

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(DEFAULT_EXPANDED))
  const toggleExpanded = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const [filtersOpen, setFiltersOpen] = useState(false)
  const empty = data.grouped ? data.posts.length === 0 : data.rows.length === 0
  const showRateLimit = search.status === 'processing' && data.posts.concat(data.rows.map((r) => r.post)).some((p) => p.targets.some((t) => t.platform === 'youtube' && t.status === 'processing'))
  const activeFilters = [search.platform, search.account, search.range, search.q].filter(Boolean).length

  const filterProps = { search, query, onQueryChange, setSearch }

  return (
    <>
      <Topbar
        breadcrumb={[{ label: 'Post Monitoring' }]}
        mobileTitle="Activity"
        mobileActions={<MobileFilterButton activeFilters={activeFilters} onClick={() => setFiltersOpen(true)} />}
      />

      <PageContent className="gap-3 xl:gap-5">
        <PageHeader
          className="hidden md:flex"
          title="Post Monitoring"
          description="Every publishing job, tracked per target. One post can be Published on Instagram and Failed on TikTok."
          actions={<HeaderActions search={search} />}
        />

        <Tabs value={search.status ?? 'all'} onValueChange={(v) => setSearch({ status: v === 'all' ? undefined : (v as PublishStatus) })} className="hidden md:flex">
          <TabsList variant="line" aria-label="Status">
            <TabsTrigger value="all">
              All targets<span className="ml-0.5">{data.counts.all}</span>
            </TabsTrigger>
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s}>
                {STATUS_LABEL[s]}
                <span className="ml-0.5">{data.counts[s]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <Filters {...filterProps} layout="row" />
          <div className="flex-1" />
          <label htmlFor="group-by-post" className="flex items-center gap-2 text-body-sm text-muted-foreground">
            Group by post
            <Switch id="group-by-post" checked={grouped} onCheckedChange={(v) => setSearch({ grouped: v ? undefined : false })} />
          </label>
        </div>

        <StatusChips value={search.status ?? 'all'} counts={data.counts} onChange={(v) => setSearch({ status: v === 'all' ? undefined : v })} className="md:hidden" />

        {showRateLimit && (
          <Banner tone="info" icon={Clock} title="YouTube is rate-limiting uploads" description="Relay will retry automatically. Expected delay: ~20 minutes." />
        )}

        {empty ? (
          <JobsEmpty status={search.status} onClear={clearFilters} />
        ) : (
          <>
            <JobsTable
              className="hidden md:flex"
              data={data}
              expanded={expanded}
              onToggleExpanded={toggleExpanded}
              selected={selected}
              onSelect={onSelect}
              onClear={clearSelection}
              footer={
                <div className="flex items-center gap-2 border-t px-4 py-2.5">
                  <p className="text-caption text-tertiary">{showingLabel(data)}</p>
                  <div className="flex-1" />
                  <JobsPagination page={data.page} pageCount={data.pageCount} />
                </div>
              }
            />
            <div className="flex flex-col gap-3 md:hidden">
              {mobilePosts(data).map((post) => (
                <MobileJobCard key={post.id} post={post} />
              ))}
              {data.pageCount > 1 && (
                <div className="flex flex-col items-center gap-2 pt-1">
                  <JobsPagination page={data.page} pageCount={data.pageCount} />
                  <p className="text-caption text-tertiary">{showingLabel(data)}</p>
                </div>
              )}
            </div>
          </>
        )}
      </PageContent>

      <MobileFilters open={filtersOpen} onOpenChange={setFiltersOpen} onClear={clearFilters} {...filterProps} />
      <Outlet />
    </>
  )
}

const showingLabel = (d: JobsPage) =>
  d.grouped ? `Showing ${d.posts.length} of ${d.totalPosts} posts · ${d.totalTargets} targets` : `Showing ${d.rows.length} of ${d.totalTargets} targets`

/* ── Header ────────────────────────────────────────────────────────── */

function HeaderActions({ search }: { search: MonitoringSearch }) {
  const queryClient = useQueryClient()
  const fetching = useIsFetching({ queryKey: ['monitoring'] }) > 0
  const [exporting, setExporting] = useState(false)
  const onExport = async () => {
    setExporting(true)
    try {
      const n = await exportJobsCsv(search)
      toast.success('CSV exported', { description: `${n} ${n === 1 ? 'target' : 'targets'} · relay-post-monitoring.csv` })
    } catch {
      toast.error('Export failed', { description: 'Please try again.', duration: Infinity })
    } finally {
      setExporting(false)
    }
  }
  return (
    <>
      <Button variant="outline" disabled={exporting} onClick={onExport}>
        <ArrowUpRight />
        Export CSV
      </Button>
      <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['monitoring'] })}>
        <RefreshCw className={cn(fetching && 'animate-spin')} />
        Refresh
      </Button>
    </>
  )
}

/* ── Filters ───────────────────────────────────────────────────────── */

type FilterProps = {
  search: MonitoringSearch
  query: string
  onQueryChange: (v: string) => void
  setSearch: (patch: Partial<MonitoringSearch>) => void
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const PLATFORM_OPTIONS = [{ value: 'all', label: 'All platforms' }, ...PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))] as const
const STATUS_OPTIONS = [{ value: 'all', label: 'All statuses' }, ...STATUS_TABS.map((s) => ({ value: s, label: STATUS_LABEL[s] }))] as const
const ACCOUNT_OPTIONS = [{ value: 'all', label: 'All accounts' }, ...ACCOUNT_IDS.map((a) => ({ value: a, label: accountLabel(a) }))] as const

function Filters({ search, query, onQueryChange, setSearch, layout }: FilterProps & { layout: 'row' | 'stack' }) {
  const stack = layout === 'stack'
  const full = stack ? 'w-full' : undefined
  return (
    <>
      <SearchInput
        aria-label="Search posts or files"
        placeholder="Search posts or files…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        containerClassName={stack ? 'w-full' : 'w-[260px]'}
      />
      <FilterSelect label="Platform" className={full} value={search.platform ?? 'all'} options={PLATFORM_OPTIONS} onChange={(v) => setSearch({ platform: v === 'all' ? undefined : (v as Platform) })} />
      {!stack && (
        <FilterSelect label="Status" value={search.status ?? 'all'} options={STATUS_OPTIONS} onChange={(v) => setSearch({ status: v === 'all' ? undefined : (v as PublishStatus) })} />
      )}
      <FilterSelect<DateRange>
        label="Date range"
        className={full}
        value={search.range ?? DEFAULT_RANGE}
        options={DATE_RANGES}
        onChange={(v) => setSearch({ range: v === DEFAULT_RANGE ? undefined : v })}
      />
      <FilterSelect label="Account" className={full} value={search.account ?? 'all'} options={ACCOUNT_OPTIONS} onChange={(v) => setSearch({ account: v === 'all' ? undefined : (v as AccountId) })} />
    </>
  )
}

function MobileFilters({ open, onOpenChange, onClear, ...props }: FilterProps & { open: boolean; onOpenChange: (o: boolean) => void; onClear: () => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 rounded-t-2xl border-t-0 md:hidden">
        <SheetHeader className="px-4 pt-5 pb-3">
          <SheetTitle className="text-h3">Filters</SheetTitle>
          <SheetDescription className="text-body-sm text-muted-foreground">Narrow the list by file, platform, account or date.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2.5 px-4 pb-2">
          <Filters {...props} layout="stack" />
        </div>
        <SheetFooter className="flex-row gap-2 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          <Button variant="outline" className="flex-1" onClick={onClear}>
            Clear filters
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/* ── Empty states (Figma States 30:924) ────────────────────────────── */

function JobsEmpty({ status, onClear }: { status?: PublishStatus; onClear: () => void }) {
  if (status === 'failed') {
    return (
      <EmptyState
        icon={<CircleCheck aria-hidden className="size-5 text-success" />}
        title="No failed posts"
        description="Every target in the last 30 days published successfully. Nice."
        className="py-12"
      />
    )
  }
  return (
    <EmptyState
      icon={SearchX}
      title="No publishing jobs match"
      description="Try another status, platform, account or date range."
      action={
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      }
      className="py-12"
    />
  )
}
