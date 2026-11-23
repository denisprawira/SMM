import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mockRequest } from '@/lib/api'
import { PLATFORM_LABEL, type Platform, type ThumbnailTone } from '@/lib/types'

/* ── URL state ─────────────────────────────────────────────────────── */

export const ANALYTICS_RANGES = ['7d', '30d', '90d', 'custom'] as const
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]
export const PLATFORMS: Platform[] = ['tiktok', 'instagram', 'youtube', 'facebook']
export const SORT_KEYS = ['views', 'engRate', 'likes', 'comments', 'shares'] as const
export type SortKey = (typeof SORT_KEYS)[number]
export const SORT_LABEL: Record<SortKey, string> = { views: 'Views', engRate: 'Eng. rate', likes: 'Likes', comments: 'Comments', shares: 'Shares' }

/** Everything optional; defaults (30d, all platforms, all accounts, sort by views) are omitted from the URL. */
export type AnalyticsSearch = {
  range?: AnalyticsRange
  /** ISO dates (yyyy-mm-dd), only with `range=custom`. */
  from?: string
  to?: string
  platform?: Platform
  account?: string
  sort?: SortKey
}

/** Server-side filters (the query key). Sorting is client-side. */
export type AnalyticsFilters = { from: string; to: string; platform: Platform | 'all'; account: string }

/* ── Calendar ──────────────────────────────────────────────────────── */

/** Analytics keep 180 days of daily history; the picker exposes the last 90. */
const HISTORY_DAYS = 180
export const MAX_RANGE_DAYS = 90
/** Last complete day of data (platform APIs report with a one-day lag). Matches Overview. */
export const DATA_END = '2025-11-21'
const END_MS = Date.parse(`${DATA_END}T00:00:00Z`)
const DAY_MS = 86_400_000

export const isoFromIndex = (i: number) => new Date(END_MS - (HISTORY_DAYS - 1 - i) * DAY_MS).toISOString().slice(0, 10)
const indexFromIso = (iso: string) => HISTORY_DAYS - 1 - Math.round((END_MS - Date.parse(`${iso}T00:00:00Z`)) / DAY_MS)
export const DATA_START = isoFromIndex(HISTORY_DAYS - MAX_RANGE_DAYS)
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/
export const isSelectableDay = (iso: string) => ISO_RE.test(iso) && !Number.isNaN(Date.parse(iso)) && iso >= DATA_START && iso <= DATA_END

const PRESET_DAYS: Record<Exclude<AnalyticsRange, 'custom'>, number> = { '7d': 7, '30d': 30, '90d': 90 }

/** Resolves URL search → concrete server filters. Invalid custom ranges fall back to 30 days. */
export function resolveFilters(search: AnalyticsSearch): AnalyticsFilters {
  const platform = search.platform ?? 'all'
  const account = search.account ?? 'all'
  const range = search.range ?? '30d'
  if (range === 'custom' && search.from && search.to) return { from: search.from, to: search.to, platform, account }
  const days = PRESET_DAYS[range === 'custom' ? '30d' : range]
  return { from: isoFromIndex(HISTORY_DAYS - days), to: DATA_END, platform, account }
}

/* ── Accounts ──────────────────────────────────────────────────────── */

export type AnalyticsAccount = {
  value: string
  label: string
  /** Fraction of each platform's workspace totals this account contributes. */
  share: Partial<Record<Platform, number>>
}

/** Same values as the Overview account filter, plus the Facebook Page and a just-connected account. */
export const ACCOUNTS: AnalyticsAccount[] = [
  { value: 'northwind.studio', label: '@northwind.studio', share: { tiktok: 1, instagram: 0.62 } },
  { value: 'northwind.shop', label: '@northwind.shop', share: { instagram: 0.38 } },
  { value: 'northwind-yt', label: 'Northwind Studio (YouTube)', share: { youtube: 1 } },
  { value: 'northwind-fb', label: 'Northwind Studio (Facebook)', share: { facebook: 1 } },
  /** Connected yesterday, nothing published yet → "Not enough data yet". */
  { value: 'northwind.kids', label: '@northwind.kids', share: { tiktok: 0 } },
]
export const accountLabel = (value: string) => ACCOUNTS.find((a) => a.value === value)?.label ?? 'All accounts'
export const accountPlatforms = (value: string): Platform[] => {
  const account = ACCOUNTS.find((a) => a.value === value)
  return account ? PLATFORMS.filter((p) => p in account.share) : PLATFORMS
}

/* ── Response types ────────────────────────────────────────────────── */

export type SyncStatus = { status: 'ok' | 'error'; lastSyncAt: number; code?: number }

/** One day across the four charts. Platform keys are views; only visible platforms are present. */
export type DailyPoint = Partial<Record<Platform, number>> & {
  date: string
  engagements: number
  /** Engagement rate, %. */
  rate: number
  published: number
  failed: number
}

export type PlatformRow = {
  platform: Platform
  views: number
  /** `null` = not provided by the platform API (rendered N/A, never estimated). */
  reach: number | null
  likes: number
  comments: number
  shares: number
  saves: number | null
  engagements: number
  engRate: number
  posts: number
}

export type Metric = { value: number | null; delta: number | null }

export type ContentRow = {
  id: string
  title: string
  tone: ThumbnailTone
  publishedAt: string
  platforms: Platform[]
  views: number
  engRate: number
  likes: number
  comments: number
  shares: number | null
}

export type AnalyticsData = {
  /** `no-data` = account/workspace has nothing published yet; `no-match` = filters exclude every platform. */
  empty: false | 'no-data' | 'no-match'
  window: { from: string; to: string; days: number }
  refreshedAt: number
  sync: Record<Platform, SyncStatus>
  platforms: Platform[]
  metrics: { views: Metric; reach: Metric; likes: Metric; comments: Metric; shares: Metric; engRate: Metric; posts: Metric }
  /** Platforms visible in this view that don't report reach (excluded from the Reach total). */
  reachExcludes: Platform[]
  daily: DailyPoint[]
  byPlatform: PlatformRow[]
  content: ContentRow[]
}

/* ── Mock database ─────────────────────────────────────────────────── */

/** Daily views (thousands), Oct 23 – Nov 21 — the curves drawn in Figma "Views over time". */
const VIEWS_K: Record<Platform, number[]> = {
  tiktok: [18.05, 18.95, 19.01, 20.59, 23.29, 23.96, 21.82, 19.23, 18.76, 19.7, 19.43, 17.58, 17.02, 19.42, 23.07, 25.16, 25.39, 26.28, 29.03, 31.54, 31.06, 28.53, 26.98, 27.47, 27.86, 26.38, 24.32, 24.82, 27.93, 30.6],
  instagram: [12.04, 10.38, 10.94, 11.92, 13.63, 11.46, 9.68, 8.72, 9.93, 10.23, 10.46, 10.0, 12.46, 15.21, 15.83, 16.75, 14.23, 17.04, 17.65, 18.47, 14.56, 12.46, 13.61, 14.17, 15.39, 13.74, 14.1, 16.81, 18.89, 18.52],
  youtube: [7.37, 7.16, 7.43, 7.47, 6.44, 5.32, 4.97, 5.43, 6.51, 7.36, 6.93, 7.75, 9.46, 11.56, 10.91, 9.79, 10.36, 10.3, 11.31, 8.68, 9.17, 8.28, 9.1, 9.62, 9.8, 9.9, 10.66, 13.39, 13.87, 13.36],
  facebook: [2.98, 2.83, 2.94, 2.69, 2.12, 1.98, 2.59, 3.39, 3.71, 3.61, 3.82, 4.48, 4.91, 4.52, 3.78, 3.38, 3.41, 3.37, 2.84, 2.26, 2.4, 3.1, 3.69, 3.78, 3.78, 4.24, 4.98, 5.12, 4.57, 4.02],
}
/** Daily engagements (thousands) and engagement rate (%) — Figma "Engagement over time". */
const ENGAGEMENTS_K = [2.63, 2.6, 2.59, 2.77, 2.97, 2.82, 2.43, 2.17, 2.2, 2.32, 2.24, 2.07, 2.18, 2.6, 3.02, 3.12, 3.1, 3.22, 3.5, 3.6, 3.33, 2.96, 2.84, 2.94, 2.93, 2.72, 2.6, 2.85, 3.3, 3.55]
const RATE = [6.99, 6.56, 6.64, 6.64, 6.17, 5.44, 5.2, 5.67, 6.21, 6.33, 6.29, 6.72, 7.57, 8.08, 7.88, 7.42, 7.34, 7.5, 7.3, 6.52, 5.94, 5.98, 6.49, 6.72, 6.64, 6.72, 7.5, 8.31, 8.54, 8.27]
/** Targets published / failed per day — Figma "Publishing frequency". */
const PUBLISHED = [4, 6, 3, 8, 5, 2, 1, 7, 6, 9, 5, 4, 2, 3, 8, 7, 6, 10, 5, 3, 2, 6, 9, 7, 8, 4, 3, 5, 11, 6]
const FAILED: Record<number, Platform> = { 3: 'tiktok', 15: 'youtube', 22: 'facebook' }

/** Last-30-day totals per platform — Figma "Platform comparison". Other windows scale from the daily series. */
const BASE: Record<Platform, Omit<PlatformRow, 'platform' | 'engagements'>> = {
  tiktok: { views: 612_000, reach: null, likes: 31_800, comments: 2_400, shares: 4_200, saves: 3_900, engRate: 7.9, posts: 52 },
  instagram: { views: 384_000, reach: 402_000, likes: 21_600, comments: 2_100, shares: 1_900, saves: 5_200, engRate: 6.4, posts: 46 },
  youtube: { views: 198_000, reach: 286_000, likes: 7_900, comments: 1_100, shares: 700, saves: null, engRate: 5.1, posts: 24 },
  facebook: { views: 86_000, reach: 154_000, likes: 2_900, comments: 300, shares: 300, saves: null, engRate: 3.2, posts: 26 },
}
/** Workspace-level KPI row for the default view (30d, all) — Figma "Metrics". */
const DESIGN_KPI = { views: 12.4, reach: 6.2, likes: 9.8, comments: -3.1, shares: 15.0, engRatePt: 0.4, engRate: 6.8, prevPosts: 130 }

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Series = { views: number[]; engagements: number[]; published: number[]; failed: number[] }

/** 180 days per platform: the Figma month at the end, seeded history before it (prev. 30 days ≈ −11% views). */
function buildHistory() {
  const rand = mulberry32(20261121)
  const lead = HISTORY_DAYS - 30
  const series = {} as Record<Platform, Series>
  const baseRate: Record<Platform, number> = { tiktok: 0.079, instagram: 0.064, youtube: 0.051, facebook: 0.032 }
  const postWeight: Record<Platform, number> = { tiktok: 52, instagram: 46, youtube: 24, facebook: 26 }

  for (const p of PLATFORMS) {
    const recent = VIEWS_K[p].map((v) => v * 1000)
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length
    const phase = rand() * Math.PI * 2
    const views: number[] = []
    for (let i = 0; i < lead; i++) {
      const monthsBack = (lead - i) / 30
      const level = (mean / 1.124) * Math.pow(0.965, monthsBack - 1)
      const wave = 0.12 * Math.sin(i / 4.3 + phase) + 0.07 * Math.sin(i / 1.7 + phase * 2)
      views.push(level * (1 + wave + (rand() - 0.5) * 0.12))
    }
    // Calibrate the 30 days before the Figma month to exactly −11.03% (→ +12.4% growth).
    const prevSum = views.slice(lead - 30).reduce((a, b) => a + b, 0)
    const k = recent.reduce((a, b) => a + b, 0) / 1.124 / prevSum
    for (let i = lead - 30; i < lead; i++) views[i] *= k
    series[p] = { views: [...views, ...recent], engagements: [], published: new Array(HISTORY_DAYS).fill(0), failed: new Array(HISTORY_DAYS).fill(0) }
  }

  // Engagements: split the Figma total by views × platform rate; history keeps the same blend.
  for (let i = 0; i < HISTORY_DAYS; i++) {
    const weighted = PLATFORMS.map((p) => series[p].views[i] * baseRate[p])
    const sum = weighted.reduce((a, b) => a + b, 0)
    const total = i >= lead ? ENGAGEMENTS_K[i - lead] * 1000 : sum * 0.83 * (1 + (rand() - 0.5) * 0.1)
    PLATFORMS.forEach((p, j) => series[p].engagements.push((total * weighted[j]) / sum))
  }

  // Published targets: Figma bars at the end, Poisson-ish history before.
  const totalWeight = PLATFORMS.reduce((a, p) => a + postWeight[p], 0)
  const pick = () => {
    let r = rand() * totalWeight
    for (const p of PLATFORMS) if ((r -= postWeight[p]) < 0) return p
    return 'tiktok' as Platform
  }
  for (let i = 0; i < HISTORY_DAYS; i++) {
    const count = i >= lead ? PUBLISHED[i - lead] : Math.max(0, Math.round(4.8 + (rand() - 0.5) * 7))
    for (let n = 0; n < count; n++) series[pick()].published[i]++
    const failedOn = i >= lead ? FAILED[i - lead] : rand() < 0.07 ? pick() : undefined
    if (failedOn) series[failedOn].failed[i]++
  }

  const rate = Array.from({ length: HISTORY_DAYS }, (_, i) => (i >= lead ? RATE[i - lead] : 6.4 * (1 + 0.08 * Math.sin(i / 3.1) + (rand() - 0.5) * 0.08)))
  return { series, rate }
}

const HISTORY = buildHistory()

type ContentPost = Omit<ContentRow, 'platforms' | 'views' | 'likes' | 'comments' | 'shares'> & {
  views: number
  likes: number
  comments: number
  shares: number | null
  /** Per target: platform, posting account and its share of the post's totals. */
  targets: { platform: Platform; account: string; weight: number }[]
}

const POSTS: ContentPost[] = [
  { id: 'c1', title: 'Morning routine with Lena', tone: 'forest', publishedAt: '2025-11-21', views: 218_000, engRate: 9.4, likes: 14_200, comments: 1_100, shares: 2_300, targets: [{ platform: 'tiktok', account: 'northwind.studio', weight: 0.62 }, { platform: 'instagram', account: 'northwind.studio', weight: 0.38 }] },
  { id: 'c2', title: 'Studio tour — 60s cut', tone: 'ocean', publishedAt: '2025-11-14', views: 164_000, engRate: 6.1, likes: 7_800, comments: 612, shares: 1_400, targets: [{ platform: 'youtube', account: 'northwind-yt', weight: 0.48 }, { platform: 'facebook', account: 'northwind-fb', weight: 0.17 }, { platform: 'tiktok', account: 'northwind.studio', weight: 0.35 }] },
  { id: 'c3', title: 'Fabric care tips #2', tone: 'sand', publishedAt: '2025-11-09', views: 131_000, engRate: 8.8, likes: 9_600, comments: 804, shares: 1_100, targets: [{ platform: 'tiktok', account: 'northwind.studio', weight: 1 }] },
  { id: 'c4', title: 'Night shoot BTS', tone: 'night', publishedAt: '2025-11-06', views: 92_400, engRate: 7.2, likes: 5_900, comments: 422, shares: 688, targets: [{ platform: 'instagram', account: 'northwind.studio', weight: 1 }] },
  { id: 'c5', title: 'Q&A with the founders', tone: 'slate', publishedAt: '2025-11-03', views: 61_000, engRate: 4.9, likes: 2_400, comments: 538, shares: null, targets: [{ platform: 'youtube', account: 'northwind-yt', weight: 1 }] },
  { id: 'c6', title: 'Store opening recap', tone: 'studio', publishedAt: '2025-11-18', views: 48_200, engRate: 5.6, likes: 2_100, comments: 190, shares: 240, targets: [{ platform: 'facebook', account: 'northwind-fb', weight: 0.55 }, { platform: 'instagram', account: 'northwind.shop', weight: 0.45 }] },
  { id: 'c7', title: 'Spring drop teaser', tone: 'sunset', publishedAt: '2025-11-19', views: 44_700, engRate: 8.1, likes: 3_100, comments: 260, shares: 410, targets: [{ platform: 'tiktok', account: 'northwind.studio', weight: 1 }] },
  { id: 'c8', title: 'Packaging unboxing', tone: 'berry', publishedAt: '2025-11-12', views: 39_500, engRate: 6.7, likes: 2_200, comments: 175, shares: 160, targets: [{ platform: 'instagram', account: 'northwind.shop', weight: 0.7 }, { platform: 'facebook', account: 'northwind-fb', weight: 0.3 }] },
  { id: 'c9', title: 'Behind the seams ep. 3', tone: 'slate', publishedAt: '2025-10-30', views: 33_100, engRate: 4.4, likes: 1_200, comments: 140, shares: null, targets: [{ platform: 'youtube', account: 'northwind-yt', weight: 1 }] },
  { id: 'c10', title: 'Autumn lookbook teaser', tone: 'sunset', publishedAt: '2025-10-26', views: 28_400, engRate: 7.4, likes: 1_800, comments: 120, shares: 190, targets: [{ platform: 'instagram', account: 'northwind.studio', weight: 0.6 }, { platform: 'tiktok', account: 'northwind.studio', weight: 0.4 }] },
  { id: 'c11', title: 'Fabric care tips #1', tone: 'sand', publishedAt: '2025-10-24', views: 21_900, engRate: 8.3, likes: 1_500, comments: 98, shares: 150, targets: [{ platform: 'tiktok', account: 'northwind.studio', weight: 1 }] },
  { id: 'c12', title: 'Holiday hours update', tone: 'ocean', publishedAt: '2025-11-16', views: 12_600, engRate: 3.1, likes: 310, comments: 42, shares: 35, targets: [{ platform: 'facebook', account: 'northwind-fb', weight: 1 }] },
  { id: 'c13', title: 'Summer sale wrap-up', tone: 'sand', publishedAt: '2025-10-12', views: 142_000, engRate: 7.6, likes: 8_900, comments: 640, shares: 1_300, targets: [{ platform: 'tiktok', account: 'northwind.studio', weight: 0.7 }, { platform: 'instagram', account: 'northwind.shop', weight: 0.3 }] },
  { id: 'c14', title: 'Back-to-school edit', tone: 'forest', publishedAt: '2025-09-05', views: 96_500, engRate: 8.0, likes: 6_400, comments: 410, shares: 880, targets: [{ platform: 'tiktok', account: 'northwind.studio', weight: 0.6 }, { platform: 'instagram', account: 'northwind.studio', weight: 0.4 }] },
  { id: 'c15', title: 'Behind the seams ep. 2', tone: 'night', publishedAt: '2025-10-02', views: 74_200, engRate: 4.8, likes: 2_600, comments: 310, shares: null, targets: [{ platform: 'youtube', account: 'northwind-yt', weight: 1 }] },
  { id: 'c16', title: 'Studio playlist vol. 1', tone: 'berry', publishedAt: '2025-09-18', views: 58_800, engRate: 6.2, likes: 3_100, comments: 220, shares: 420, targets: [{ platform: 'instagram', account: 'northwind.studio', weight: 1 }] },
  { id: 'c17', title: 'Meet the makers', tone: 'studio', publishedAt: '2025-08-28', views: 41_000, engRate: 3.9, likes: 1_200, comments: 160, shares: 120, targets: [{ platform: 'facebook', account: 'northwind-fb', weight: 0.6 }, { platform: 'youtube', account: 'northwind-yt', weight: 0.4 }] },
]

const now = Date.now()
const db = {
  refreshedAt: now - 14 * 60_000,
  sync: Object.fromEntries(PLATFORMS.map((p) => [p, { status: 'ok', lastSyncAt: now - 14 * 60_000 }])) as Record<Platform, SyncStatus>,
  /** Demo: the next refresh hits a YouTube API outage (503); "Try again" then succeeds. */
  youtubeOutage: true,
}

/* ── Aggregation ───────────────────────────────────────────────────── */

type Window = [start: number, end: number]
const sumRange = (arr: number[], [s, e]: Window) => {
  let total = 0
  for (let i = Math.max(0, s); i <= e; i++) total += arr[i] ?? 0
  return total
}
const LAST_30: Window = [HISTORY_DAYS - 30, HISTORY_DAYS - 1]

function platformRow(p: Platform, w: Window, share: number): PlatformRow {
  const s = HISTORY.series[p]
  const base = BASE[p]
  const vr = sumRange(s.views, w) / sumRange(s.views, LAST_30)
  const er = sumRange(s.engagements, w) / sumRange(s.engagements, LAST_30)
  const tr = sumRange(s.published, w) / sumRange(s.published, LAST_30)
  const likes = base.likes * er * share
  const comments = base.comments * er * share
  const shares = base.shares * er * share
  return {
    platform: p,
    views: base.views * vr * share,
    reach: base.reach === null ? null : base.reach * vr * share,
    likes,
    comments,
    shares,
    saves: base.saves === null ? null : base.saves * er * share,
    engagements: likes + comments + shares,
    engRate: base.engRate * (er / vr),
    posts: base.posts * tr * share,
  }
}

type Totals = { views: number; reach: number | null; likes: number; comments: number; shares: number; engRate: number; posts: number }

function totals(rows: PlatformRow[]): Totals {
  const sum = (k: 'views' | 'likes' | 'comments' | 'shares' | 'posts') => rows.reduce((a, r) => a + r[k], 0)
  const reachRows = rows.filter((r) => r.reach !== null)
  const views = sum('views')
  return {
    views,
    reach: reachRows.length ? reachRows.reduce((a, r) => a + (r.reach ?? 0), 0) : null,
    likes: sum('likes'),
    comments: sum('comments'),
    shares: sum('shares'),
    // Views-weighted blend of platform rates, calibrated to the workspace figure.
    engRate: views ? (rows.reduce((a, r) => a + r.views * r.engRate, 0) / views) * RATE_CAL : 0,
    posts: sum('posts'),
  }
}

const RATE_CAL = (() => {
  const rows = PLATFORMS.map((p) => platformRow(p, LAST_30, 1))
  const views = rows.reduce((a, r) => a + r.views, 0)
  return DESIGN_KPI.engRate / (rows.reduce((a, r) => a + r.views * r.engRate, 0) / views)
})()

/**
 * The previous period is the same-length window right before. `PREV_CAL` aligns
 * the seeded history with the reported period-over-period change in Figma.
 */
const PREV_CAL = (() => {
  const cur = totals(PLATFORMS.map((p) => platformRow(p, LAST_30, 1)))
  const prev = totals(PLATFORMS.map((p) => platformRow(p, [HISTORY_DAYS - 60, HISTORY_DAYS - 31], 1)))
  const k = (key: 'views' | 'reach' | 'likes' | 'comments' | 'shares', pct: number) => cur[key]! / (1 + pct / 100) / prev[key]!
  return {
    views: k('views', DESIGN_KPI.views),
    reach: k('reach', DESIGN_KPI.reach),
    likes: k('likes', DESIGN_KPI.likes),
    comments: k('comments', DESIGN_KPI.comments),
    shares: k('shares', DESIGN_KPI.shares),
    engRate: cur.engRate - DESIGN_KPI.engRatePt - prev.engRate,
    posts: DESIGN_KPI.prevPosts / prev.posts,
  }
})()

const pctDelta = (cur: number | null, prev: number | null, k: number) => (cur === null || prev === null || prev === 0 ? null : (cur / (prev * k) - 1) * 100)

function visiblePlatforms(f: AnalyticsFilters) {
  const shares = f.account === 'all' ? null : ACCOUNTS.find((a) => a.value === f.account)?.share
  return PLATFORMS.filter((p) => (f.platform === 'all' || f.platform === p) && (shares ? (shares[p] ?? 0) > 0 : true)).map((p) => ({
    platform: p,
    share: shares ? (shares[p] ?? 0) : 1,
  }))
}

function buildAnalytics(f: AnalyticsFilters): AnalyticsData {
  const start = Math.max(indexFromIso(f.from), HISTORY_DAYS - MAX_RANGE_DAYS)
  const end = Math.min(indexFromIso(f.to), HISTORY_DAYS - 1)
  const days = end - start + 1
  const w: Window = [start, end]
  const prevW: Window = [start - days, start - 1]
  const visible = visiblePlatforms(f)
  const platforms = visible.map((v) => v.platform)
  const accountData = f.account === 'all' ? true : (ACCOUNTS.find((a) => a.value === f.account)?.share ?? {})
  const hasData = accountData === true || Object.values(accountData).some((s) => s > 0)

  const base = {
    window: { from: isoFromIndex(start), to: isoFromIndex(end), days },
    refreshedAt: db.refreshedAt,
    sync: db.sync,
    platforms,
  }
  if (!hasData || platforms.length === 0) {
    const zero = { value: null, delta: null }
    return {
      ...base,
      empty: hasData ? 'no-match' : 'no-data',
      metrics: { views: zero, reach: zero, likes: zero, comments: zero, shares: zero, engRate: zero, posts: zero },
      reachExcludes: [],
      daily: [],
      byPlatform: [],
      content: [],
    }
  }

  const rows = visible.map((v) => platformRow(v.platform, w, v.share))
  const cur = totals(rows)
  const prev = totals(visible.map((v) => platformRow(v.platform, prevW, v.share)))

  // Daily series; the rate line is scaled by this subset's engagement/views ratio vs. the workspace's.
  const daily: DailyPoint[] = []
  for (let i = start; i <= end; i++) {
    let views = 0
    let eng = 0
    let allViews = 0
    let allEng = 0
    const point: DailyPoint = { date: isoFromIndex(i), engagements: 0, rate: 0, published: 0, failed: 0 }
    for (const p of PLATFORMS) {
      allViews += HISTORY.series[p].views[i]
      allEng += HISTORY.series[p].engagements[i]
    }
    for (const { platform: p, share } of visible) {
      const s = HISTORY.series[p]
      point[p] = Math.round(s.views[i] * share)
      views += s.views[i] * share
      eng += s.engagements[i] * share
      point.published += s.published[i] * share
      point.failed += s.failed[i] * share
    }
    point.engagements = Math.round(eng)
    point.rate = Math.round(HISTORY.rate[i] * (eng / views / (allEng / allViews)) * 100) / 100
    point.published = Math.round(point.published)
    point.failed = Math.round(point.failed)
    daily.push(point)
  }

  const content: ContentRow[] = []
  for (const post of POSTS) {
    if (post.publishedAt < base.window.from || post.publishedAt > base.window.to) continue
    const targets = post.targets.filter((t) => platforms.includes(t.platform) && (f.account === 'all' || t.account === f.account))
    if (!targets.length) continue
    const weight = targets.reduce((a, t) => a + t.weight, 0)
    content.push({
      id: post.id,
      title: post.title,
      tone: post.tone,
      publishedAt: post.publishedAt,
      platforms: targets.map((t) => t.platform),
      views: Math.round(post.views * weight),
      engRate: post.engRate,
      likes: Math.round(post.likes * weight),
      comments: Math.round(post.comments * weight),
      shares: post.shares === null ? null : Math.round(post.shares * weight),
    })
  }

  return {
    ...base,
    empty: false,
    metrics: {
      views: { value: cur.views, delta: pctDelta(cur.views, prev.views, PREV_CAL.views) },
      reach: { value: cur.reach, delta: pctDelta(cur.reach, prev.reach, PREV_CAL.reach) },
      likes: { value: cur.likes, delta: pctDelta(cur.likes, prev.likes, PREV_CAL.likes) },
      comments: { value: cur.comments, delta: pctDelta(cur.comments, prev.comments, PREV_CAL.comments) },
      shares: { value: cur.shares, delta: pctDelta(cur.shares, prev.shares, PREV_CAL.shares) },
      engRate: { value: cur.engRate, delta: cur.engRate - prev.engRate - PREV_CAL.engRate },
      posts: { value: Math.round(cur.posts), delta: Math.round(cur.posts) - Math.round(prev.posts * PREV_CAL.posts) },
    },
    reachExcludes: rows.filter((r) => r.reach === null).map((r) => r.platform),
    daily,
    byPlatform: rows,
    content,
  }
}

/* ── Queries & mutations ───────────────────────────────────────────── */

export const analyticsQueryOptions = (filters: AnalyticsFilters) =>
  queryOptions({
    queryKey: ['analytics', filters],
    // Aggregates come from each platform's API, so this is the slowest page to load.
    queryFn: () => mockRequest(() => buildAnalytics(filters), { delay: 450 }),
  })

export type RefreshResult = { failed: Platform[] }

/** "Data refreshed …" → re-sync every connected platform. */
export function useRefreshAnalytics() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['analytics', 'refresh'],
    mutationFn: () =>
      mockRequest<RefreshResult>(
        () => {
          const at = Date.now()
          const failed: Platform[] = []
          for (const p of PLATFORMS) {
            if (p === 'youtube' && db.youtubeOutage) {
              db.youtubeOutage = false
              db.sync[p] = { ...db.sync[p], status: 'error', code: 503 }
              failed.push(p)
            } else {
              db.sync[p] = { status: 'ok', lastSyncAt: at }
            }
          }
          db.refreshedAt = at
          return { failed }
        },
        { delay: 1400 },
      ),
    onSuccess: ({ failed }) => {
      const ok = PLATFORMS.filter((p) => !failed.includes(p)).map((p) => PLATFORM_LABEL[p])
      toast.success('Analytics refreshed', {
        description: failed.length ? `${listFormat(ok)} are up to date.` : 'All platforms are up to date.',
      })
    },
    onError: () => toast.error('Couldn’t refresh analytics', { description: 'Please try again.', duration: Infinity }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['analytics'] }),
  })
}

/** API error card → "Try again" for one platform. */
export function useRetryPlatformSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['analytics', 'retry'],
    mutationFn: (platform: Platform) =>
      mockRequest(
        () => {
          db.sync[platform] = { status: 'ok', lastSyncAt: Date.now() }
          return platform
        },
        { delay: 900 },
      ),
    onSuccess: (platform) => toast.success(`${PLATFORM_LABEL[platform]} analytics synced`, { description: 'All platforms are up to date.' }),
    onError: (_err, platform) => toast.error(`Couldn’t reach ${PLATFORM_LABEL[platform]}`, { description: 'Please try again.', duration: Infinity }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['analytics'] }),
  })
}

export const listFormat = (items: string[]) => new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' }).format(items)
