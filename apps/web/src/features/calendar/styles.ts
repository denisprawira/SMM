import type { CalendarStatus } from './api'

/** Figma status colours: chip bar, week/day block (left border + fill) and block time text. */
export const STATUS_TONE: Record<CalendarStatus, { bar: string; block: string; text: string }> = {
  scheduled: { bar: 'bg-primary', block: 'border-primary bg-primary-subtle', text: 'text-primary-text' },
  processing: { bar: 'bg-info', block: 'border-info bg-info-subtle', text: 'text-info-text' },
  published: { bar: 'bg-success', block: 'border-success bg-success-subtle', text: 'text-success-text' },
  failed: { bar: 'bg-danger', block: 'border-danger bg-danger-subtle', text: 'text-danger-text' },
  draft: { bar: 'bg-[var(--border-strong)]', block: 'border-strong bg-subtle', text: 'text-muted-foreground' },
}

/** Week grid: 56px per hour, 8 AM – 10 PM visible (extends if a post falls outside). */
export const WEEK_HOUR_PX = 56
/** Day grid: 72px per hour, 8 AM – 9 PM visible. */
export const DAY_HOUR_PX = 72

/** Visible hour window for a set of times (minutes since midnight). */
export function hourWindow(minutes: number[], start: number, end: number) {
  const lo = Math.min(start, ...minutes.map((m) => Math.floor(m / 60)))
  const hi = Math.max(end, ...minutes.map((m) => Math.ceil(m / 60) + 2))
  return { start: Math.max(0, lo), end: Math.min(24, hi) }
}

/**
 * Side-by-side lanes for overlapping blocks in one column. Returns, per item,
 * its lane index and the lane count of its overlap cluster.
 */
export function layoutLanes<T>(items: T[], top: (t: T) => number, height: (t: T) => number) {
  const sorted = [...items].sort((a, b) => top(a) - top(b))
  const result = new Map<T, { lane: number; lanes: number }>()
  let cluster: T[] = []
  let laneEnds: number[] = []
  let clusterEnd = -Infinity
  const flush = () => {
    for (const item of cluster) result.get(item)!.lanes = laneEnds.length
    cluster = []
    laneEnds = []
  }
  for (const item of sorted) {
    const t = top(item)
    const bottom = t + height(item)
    if (cluster.length && t >= clusterEnd) {
      flush()
      clusterEnd = -Infinity
    }
    let lane = laneEnds.findIndex((end) => end <= t)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = bottom
    clusterEnd = Math.max(clusterEnd, bottom)
    result.set(item, { lane, lanes: 1 })
    cluster.push(item)
  }
  flush()
  return result
}
