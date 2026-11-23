import type { ReactNode } from 'react'
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, Rectangle, XAxis, YAxis, type BarShapeProps } from 'recharts'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { DailyPoint } from './api'
import { shortDate } from './format'
import { ChartSkeleton } from './states'

/* ── Shared chart chrome ───────────────────────────────────────────── */

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
      <span className="text-caption font-medium whitespace-nowrap text-muted-foreground">{label}</span>
    </span>
  )
}

type LegendItem = { color: string; label: string }

/** Figma "Card header" with the legend on the right; the legend drops under the title on phones. */
export function ChartCardHeader({ title, description, legend, action }: { title: string; description: ReactNode; legend?: LegendItem[]; action?: ReactNode }) {
  const items = legend?.map((l) => <LegendDot key={l.label} {...l} />)
  return (
    <>
      <CardHeader className="max-sm:grid-cols-1">
        <CardTitle className="col-start-1">{title}</CardTitle>
        <CardDescription className="col-start-1 truncate">{description}</CardDescription>
        {items && <CardAction className="hidden gap-3.5 sm:flex">{items}</CardAction>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      {items && <div className="-mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 px-5 pb-3 sm:hidden">{items}</div>}
    </>
  )
}

/** Data max × 1.14, split into quarters — reproduces Figma's 36K / 4.1K axes. */
function quarterTicks(max: number) {
  const top = Math.max(max, 1) * 1.14
  return [0, top / 4, top / 2, (top * 3) / 4, top]
}

/** Five date labels for line charts (first and last pinned), three for bars. */
function dateTicks(daily: DailyPoint[], count: number) {
  const last = daily.length - 1
  if (last < 1) return daily.map((d) => d.date)
  const idx = Array.from({ length: count }, (_, i) => (i === count - 1 ? last : Math.floor((last * i) / (count - 1))))
  return [...new Set(idx)].map((i) => daily[i].date)
}

type TickProps = { x?: number; y?: number; index?: number; visibleTicksCount?: number; payload?: { value: string | number; offset?: number } }

/** Y labels flush left in the gutter, vertically centred on their grid line. */
function ValueTick({ y = 0, payload, format }: TickProps & { format: (v: number) => string }) {
  return (
    <text x={0} y={y} dy={4} textAnchor="start" className="fill-tertiary text-caption">
      {format(Number(payload?.value ?? 0))}
    </text>
  )
}

/** First date pinned to the plot's left edge, last to its right edge (band charts use the band edges). */
function DateTick({ x = 0, y = 0, index = 0, visibleTicksCount = 0, payload, dy }: TickProps & { dy: number }) {
  const offset = payload?.offset ?? 0
  const first = index === 0
  const last = index === visibleTicksCount - 1
  return (
    <text x={first ? x - offset : last ? x + offset : x} y={y} dy={dy} textAnchor={first ? 'start' : last ? 'end' : 'middle'} className="fill-tertiary text-caption">
      {shortDate(String(payload?.value ?? ''))}
    </text>
  )
}

const tooltipDate = (_: unknown, payload: readonly { payload?: { date?: string } }[] | undefined) => shortDate(String(payload?.[0]?.payload?.date ?? ''))

/** Tooltip row with a coloured dot, config label and formatted value. */
function tooltipRow(config: ChartConfig, format: (value: number, key: string) => string) {
  return (value: unknown, name: unknown, item: { color?: string; payload?: { fill?: string } }) => {
    const key = String(name)
    return (
      <div className="flex w-full items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color ?? item.payload?.fill }} />
        <span className="flex-1 text-muted-foreground">{config[key]?.label ?? key}</span>
        <span className="font-mono font-medium text-foreground tabular-nums">{format(Number(value), key)}</span>
      </div>
    )
  }
}

const containerClass = 'aspect-auto w-full [&_.recharts-cartesian-axis-tick_text]:fill-tertiary'
const kTick = (top: number) => (v: number) => (top >= 10_000 ? `${Math.round(v / 1000)}K` : top >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(Math.round(v)))

/* ── Views over time ───────────────────────────────────────────────── */

const PLATFORM_COLOR: Record<Platform, string> = {
  tiktok: 'var(--platform-tiktok)',
  instagram: 'var(--platform-instagram)',
  youtube: 'var(--platform-youtube)',
  facebook: 'var(--platform-facebook)',
}
const viewsConfig = Object.fromEntries(Object.entries(PLATFORM_COLOR).map(([p, color]) => [p, { label: PLATFORM_LABEL[p as Platform], color }])) satisfies ChartConfig

export function ViewsOverTimeCard({ daily, platforms, loading, className }: { daily: DailyPoint[]; platforms: Platform[]; loading?: boolean; className?: string }) {
  if (loading) return <ChartSkeleton className={cn('h-[312px]', className)} />
  const max = Math.max(...daily.flatMap((d) => platforms.map((p) => d[p] ?? 0)))
  const ticks = quarterTicks(max)
  return (
    <Card className={className}>
      <ChartCardHeader
        title="Views over time"
        description={platforms.length === 1 ? PLATFORM_LABEL[platforms[0]] : 'By platform'}
        legend={platforms.map((p) => ({ color: PLATFORM_COLOR[p], label: PLATFORM_LABEL[p] }))}
      />
      <div className="px-5 pb-4">
        <ChartContainer config={viewsConfig} className={cn(containerClass, 'h-[220px]')} aria-label="Daily views by platform">
          <LineChart data={daily} margin={{ top: 9, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <YAxis width={44} domain={[0, ticks[4]]} ticks={ticks} axisLine={false} tickLine={false} tick={<ValueTick format={kTick(ticks[4])} />} />
            <XAxis dataKey="date" ticks={dateTicks(daily, 5)} interval={0} height={21} tickSize={0} tickMargin={0} axisLine={false} tickLine={false} tick={<DateTick dy={17} />} />
            <ChartTooltip cursor={{ stroke: 'var(--border-strong)' }} content={<ChartTooltipContent labelFormatter={tooltipDate} formatter={tooltipRow(viewsConfig, (v) => v.toLocaleString('en-US'))} />} />
            {platforms.map((p) => (
              <Line key={p} dataKey={p} type="monotone" stroke={`var(--color-${p})`} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            ))}
          </LineChart>
        </ChartContainer>
      </div>
    </Card>
  )
}

/* ── Engagement over time ──────────────────────────────────────────── */

const engagementConfig = {
  engagements: { label: 'Engagements', color: 'var(--chart-1)' },
  rate: { label: 'Eng. rate', color: 'var(--chart-3)' },
} satisfies ChartConfig

/** The rate line shares the plot on a hidden 0–16% axis. */
const RATE_DOMAIN: [number, number] = [0, 16]

export function EngagementOverTimeCard({ daily, loading, className }: { daily: DailyPoint[]; loading?: boolean; className?: string }) {
  if (loading) return <ChartSkeleton className={cn('h-[312px]', className)} />
  const ticks = quarterTicks(Math.max(...daily.map((d) => d.engagements)))
  return (
    <Card className={className}>
      <ChartCardHeader
        title="Engagement over time"
        description="Likes + comments + shares, and engagement rate"
        legend={[
          { color: 'var(--chart-1)', label: 'Engagements' },
          { color: 'var(--chart-3)', label: 'Eng. rate' },
        ]}
      />
      <div className="px-5 pb-4">
        <ChartContainer config={engagementConfig} className={cn(containerClass, 'h-[220px]')} aria-label="Daily engagements and engagement rate">
          <ComposedChart data={daily} margin={{ top: 9, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <YAxis width={44} domain={[0, ticks[4]]} ticks={ticks} axisLine={false} tickLine={false} tick={<ValueTick format={kTick(Math.min(ticks[4], 9999))} />} />
            <YAxis yAxisId="rate" orientation="right" hide domain={RATE_DOMAIN} />
            <XAxis dataKey="date" ticks={dateTicks(daily, 5)} interval={0} height={21} tickSize={0} tickMargin={0} axisLine={false} tickLine={false} tick={<DateTick dy={17} />} />
            <ChartTooltip
              cursor={{ stroke: 'var(--border-strong)' }}
              content={<ChartTooltipContent labelFormatter={tooltipDate} formatter={tooltipRow(engagementConfig, (v, k) => (k === 'rate' ? `${v.toFixed(1)}%` : v.toLocaleString('en-US')))} />}
            />
            <Area dataKey="engagements" type="monotone" stroke="var(--color-engagements)" strokeWidth={2} fill="var(--color-engagements)" fillOpacity={0.08} activeDot={{ r: 3 }} />
            <Line yAxisId="rate" dataKey="rate" type="monotone" stroke="var(--color-rate)" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          </ComposedChart>
        </ChartContainer>
      </div>
    </Card>
  )
}

/* ── Publishing frequency ──────────────────────────────────────────── */

const publishingConfig = {
  published: { label: 'Published', color: 'var(--chart-1)' },
  failed: { label: 'Failed', color: 'var(--danger)' },
} satisfies ChartConfig

/** Failed segment floats 1px above the published one (Figma). */
function FailedBar(props: BarShapeProps) {
  return <Rectangle {...props} y={Number(props.y ?? 0) - 1} />
}

/** 0–12 style axis: three equal steps above the tallest day. */
function countTicks(max: number) {
  const step = Math.max(1, Math.ceil((max * 1.05) / 3))
  return [0, step, step * 2, step * 3]
}

export function PublishingFrequencyCard({ daily, loading, className }: { daily: DailyPoint[]; loading?: boolean; className?: string }) {
  if (loading) return <ChartSkeleton className={cn('h-[272px]', className)} />
  const ticks = countTicks(Math.max(...daily.map((d) => d.published + d.failed)))
  return (
    <Card className={className}>
      <ChartCardHeader
        title="Publishing frequency"
        description="Targets published per day"
        legend={[
          { color: 'var(--chart-1)', label: 'Published' },
          { color: 'var(--danger)', label: 'Failed' },
        ]}
      />
      <div className="px-5 pb-4">
        <ChartContainer config={publishingConfig} className={cn(containerClass, '-mt-1 h-[184px]')} aria-label="Targets published and failed per day">
          <BarChart data={daily} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="15.5%">
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <YAxis width={28} domain={[0, ticks[3]]} ticks={ticks} allowDecimals={false} axisLine={false} tickLine={false} tick={<ValueTick format={String} />} />
            <XAxis dataKey="date" ticks={dateTicks(daily, 3)} interval={0} height={26} tickSize={0} tickMargin={0} axisLine={false} tickLine={false} tick={<DateTick dy={18} />} />
            <ChartTooltip cursor={{ fill: 'var(--subtle)' }} content={<ChartTooltipContent labelFormatter={tooltipDate} formatter={tooltipRow(publishingConfig, String)} />} />
            <Bar dataKey="published" stackId="day" fill="var(--color-published)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="failed" stackId="day" fill="var(--color-failed)" radius={[3, 3, 0, 0]} shape={FailedBar} />
          </BarChart>
        </ChartContainer>
      </div>
    </Card>
  )
}
