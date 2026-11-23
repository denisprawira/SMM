import { queryOptions, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mockRequest } from '@/lib/api'
import { PLATFORM_LABEL, type Platform, type PublishStatus, type ThumbnailTone } from '@/lib/types'

/* ── Search params (URL state) ─────────────────────────────────────── */

/** Status tabs, in Figma order. `undefined` = "All targets". */
export const STATUS_TABS = ['scheduled', 'processing', 'published', 'failed', 'cancelled', 'draft'] as const satisfies readonly PublishStatus[]
export const STATUS_LABEL: Record<PublishStatus, string> = {
  scheduled: 'Scheduled',
  processing: 'Processing',
  published: 'Published',
  failed: 'Failed',
  cancelled: 'Cancelled',
  draft: 'Draft',
}

export const DATE_RANGES = [
  { value: 'nov-2025', label: 'Nov 1 – Nov 30, 2025' },
  { value: 'last-7', label: 'Last 7 days' },
  { value: 'next-7', label: 'Next 7 days' },
  { value: 'oct-2025', label: 'Oct 1 – Oct 31, 2025' },
] as const
export type DateRange = (typeof DATE_RANGES)[number]['value']
export const DEFAULT_RANGE: DateRange = 'nov-2025'

export const PLATFORMS = ['tiktok', 'instagram', 'facebook', 'youtube'] as const satisfies readonly Platform[]

export type MonitoringSearch = {
  status?: PublishStatus
  platform?: Platform
  account?: AccountId
  range?: DateRange
  q?: string
  page?: number
  /** "Group by post" switch — on by default, `false` lists every target as its own row. */
  grouped?: boolean
}

const oneOf = <T extends string>(values: readonly T[], v: unknown): T | undefined => (values.includes(v as T) ? (v as T) : undefined)

/** `validateSearch` for `/monitoring` — defaults are omitted from the URL. */
export function parseMonitoringSearch(search: Record<string, unknown>): MonitoringSearch {
  const page = Number(search.page)
  const range = oneOf(DATE_RANGES.map((r) => r.value), search.range)
  return {
    status: oneOf(STATUS_TABS, search.status),
    platform: oneOf(PLATFORMS, search.platform),
    account: oneOf(ACCOUNT_IDS, search.account),
    range: range === DEFAULT_RANGE ? undefined : range,
    q: typeof search.q === 'string' && search.q.trim() ? search.q : undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
    grouped: search.grouped === false || search.grouped === 'false' ? false : undefined,
  }
}

/* ── Domain ────────────────────────────────────────────────────────── */

export const ACCOUNTS = {
  'tt-studio': { platform: 'tiktok', handle: '@northwind.studio', url: 'https://www.tiktok.com/@northwind.studio' },
  'ig-studio': { platform: 'instagram', handle: '@northwind.studio', url: 'https://www.instagram.com/northwind.studio/' },
  'fb-studio': { platform: 'facebook', handle: 'Northwind Studio', url: 'https://www.facebook.com/' },
  'yt-studio': { platform: 'youtube', handle: 'Northwind Studio', url: 'https://www.youtube.com/' },
  'ig-shop': { platform: 'instagram', handle: '@northwind.shop', url: 'https://www.instagram.com/northwind.shop/' },
} as const satisfies Record<string, { platform: Platform; handle: string; url: string }>
export type AccountId = keyof typeof ACCOUNTS
export const ACCOUNT_IDS = Object.keys(ACCOUNTS) as AccountId[]
export const accountLabel = (id: AccountId) => `${ACCOUNTS[id].handle} · ${PLATFORM_LABEL[ACCOUNTS[id].platform]}`

export type JobError = {
  /** Drawer heading, e.g. "Rejected by TikTok". */
  title: string
  /** Table "Error" column. */
  message: string
  /** Mobile card copy. */
  short: string
  detail: string
  code: string
  howToFix: string
  /** Secondary remedy offered next to "Retry now". */
  remedy: 'replace-media' | 'reconnect' | 'wait'
}

export type JobTarget = {
  /** Publishing job id — one job per target (platform + account). */
  id: string
  account: AccountId
  platform: Platform
  status: PublishStatus
  /** Minutes after the scheduled time the platform confirmed the post. */
  publishedAfter?: number
  /** Upload progress, 0–100, while `processing`. */
  progress?: number
  /** Last rejection (kept after a retry so the timeline can show it). */
  error?: JobError
  retried?: boolean
  /** Status before a cancel, so it can be undone. */
  cancelledFrom?: PublishStatus
}

export type JobPost = {
  id: string
  title: string
  /** Drive file name — media is streamed from the customer's Drive, never stored. */
  file: string
  duration: string
  sizeMb: number
  tone: ThumbnailTone
  /** Day of Nov 2025; `null` = not scheduled (draft). */
  day: number | null
  /** Scheduled time, minutes after midnight. */
  minutes: number | null
  createdAt: string
  createdBy: string
  targets: JobTarget[]
}

export type StatusCounts = Record<PublishStatus | 'all', number>

export type JobsPage = {
  grouped: boolean
  /** Grouped view: one page of posts with all of their targets. */
  posts: JobPost[]
  /** Flat view: one page of targets (with their post). */
  rows: { post: JobPost; targetId: string }[]
  counts: StatusCounts
  totalPosts: number
  totalTargets: number
  page: number
  pageCount: number
}

export type JobDetail = { post: JobPost; focusId: string }

/* ── Formatting helpers (shared by table, cards and drawer) ────────── */

/** The mock's "now": Nov 21, 2025, shortly after 12:30 PM. */
const TODAY = 21

export function formatClock(totalSeconds: number, withSeconds = false) {
  const h = Math.floor(totalSeconds / 3600) % 24
  const m = Math.floor(totalSeconds / 60) % 60
  const s = totalSeconds % 60
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')}${withSeconds ? `:${String(s).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`
}

const dayLabel = (day: number) => (day === TODAY ? 'Today' : `Nov ${day}`)

/** "Nov 19, 9:00 AM" · "Today, 12:30 PM" · "Not scheduled". */
export function scheduledLabel(post: JobPost) {
  if (post.day == null || post.minutes == null) return 'Not scheduled'
  return `${dayLabel(post.day)}, ${formatClock(post.minutes * 60)}`
}

/** Mobile meta: "Nov 19 · 9:00 AM". */
export function scheduledShort(post: JobPost) {
  if (post.day == null || post.minutes == null) return 'Not scheduled'
  return `${dayLabel(post.day)} · ${formatClock(post.minutes * 60)}`
}

export function publishedLabel(post: JobPost, target: JobTarget) {
  if (target.status !== 'published' || post.day == null || post.minutes == null) return null
  return `${dayLabel(post.day)}, ${formatClock((post.minutes + (target.publishedAfter ?? 1)) * 60)}`
}

export const formatSize = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`)
export const fileMeta = (post: JobPost) => `${post.file} · ${post.duration} · ${formatSize(post.sizeMb)}`
export const targetsLabel = (n: number) => `${n} ${n === 1 ? 'target' : 'targets'}`
export const driveUrl = (post: JobPost) => `https://drive.google.com/drive/search?q=${encodeURIComponent(post.file)}`

/** Order of the per-status pills on a post row (Figma: "2 published", "1 failed"). */
const SUMMARY_ORDER: PublishStatus[] = ['published', 'processing', 'scheduled', 'failed', 'draft', 'cancelled']

export function statusSummary(post: JobPost) {
  return SUMMARY_ORDER.flatMap((status) => {
    const count = post.targets.filter((t) => t.status === status).length
    if (count === 0) return []
    const label = status === 'draft' ? 'Draft' : `${count} ${status}`
    return [{ status, count, label }]
  })
}

/** The job the drawer opens on for a post: first failed, else processing, else the first target. */
export function focusJobId(post: JobPost) {
  return (post.targets.find((t) => t.status === 'failed') ?? post.targets.find((t) => t.status === 'processing') ?? post.targets[0]).id
}

export type TimelineEvent = { title: string; meta: string; tone: 'done' | 'info' | 'success' | 'danger' }

/** Per-target job timeline for the drawer. */
export function buildTimeline(post: JobPost, target: JobTarget): TimelineEvent[] {
  const platform = PLATFORM_LABEL[target.platform]
  const created: TimelineEvent = { title: 'Created', meta: `${post.createdAt} · ${post.createdBy}`, tone: 'done' }
  if (post.day == null || post.minutes == null) return [created, { title: 'Not scheduled yet', meta: 'Draft — pick a time to publish', tone: 'done' }]
  if (target.status === 'scheduled') return [created, { title: `Scheduled for ${scheduledLabel(post)}`, meta: `Media streams from Google Drive at publish time`, tone: 'done' }]
  if (target.status === 'cancelled' && target.cancelledFrom === 'scheduled') return [created, { title: 'Cancelled', meta: `Just now · ${post.createdBy}`, tone: 'done' }]

  const t = post.minutes * 60
  const run: TimelineEvent[] = [
    created,
    { title: 'Queued', meta: `Nov ${post.day}, ${formatClock(t - 30, true)}`, tone: 'done' },
    { title: 'Fetched file from Google Drive', meta: `${formatClock(t + 2, true)} · streamed, not stored`, tone: 'done' },
    { title: `Uploading to ${platform}`, meta: formatClock(t + 20, true), tone: 'info' },
  ]
  if (target.status === 'published') {
    return [...run, { title: `Published on ${platform}`, meta: formatClock(t + (target.publishedAfter ?? 1) * 60 + 4, true), tone: 'success' }]
  }
  const rejected: TimelineEvent[] = target.error
    ? [{ title: target.error.title, meta: `${formatClock(t + 65, true)} · ${target.error.code}`, tone: 'danger' }]
    : []
  if (target.status === 'failed') return [...run, ...rejected]
  if (target.status === 'processing') {
    if (target.retried) {
      return [...run, ...rejected, { title: 'Retry requested', meta: `Just now · ${post.createdBy}`, tone: 'done' }, { title: 'Queued', meta: 'Waiting for an upload slot', tone: 'info' }]
    }
    return [...run.slice(0, -1), { ...run[run.length - 1], meta: `${formatClock(t + 20, true)} · ${target.progress ?? 0}%` }]
  }
  // cancelled while processing / after a failure
  return [...run, ...rejected, { title: 'Cancelled', meta: `Just now · ${post.createdBy}`, tone: 'done' }]
}

/* ── Mock database ─────────────────────────────────────────────────── */

const ERRORS = {
  duration: {
    title: 'Rejected by TikTok',
    message: 'Video exceeds TikTok’s 10 min limit',
    short: 'Video exceeds 10 min limit',
    detail: 'The video is 11:02 long. TikTok accepts videos up to 10:00 through the API.',
    code: 'ERR_DURATION_LIMIT',
    howToFix: 'Trim the file in Drive to under 10 minutes, or swap in a shorter cut, then retry. Other targets aren’t affected.',
    remedy: 'replace-media',
  },
  quota: {
    title: 'Upload quota exceeded',
    message: 'Daily upload quota exceeded — retry after 12:00 AM PT',
    short: 'Daily upload quota exceeded',
    detail: 'This channel reached YouTube’s daily upload quota. Uploads open again when the quota resets at 12:00 AM PT.',
    code: 'ERR_QUOTA_EXCEEDED',
    howToFix: 'Retry after 12:00 AM PT. The file stays in your Drive, so nothing needs to be re-selected.',
    remedy: 'wait',
  },
  permission: {
    title: 'Rejected by Facebook',
    message: 'Page permission revoked',
    short: 'Page permission revoked',
    detail: 'Relay no longer has permission to publish to the Northwind Studio Page.',
    code: 'ERR_PERMISSION_REVOKED',
    howToFix: 'Reconnect the Facebook Page in Social Accounts, then retry. Other targets aren’t affected.',
    remedy: 'reconnect',
  },
} satisfies Record<string, JobError>

const target = (id: string, account: AccountId, status: PublishStatus, extra: Partial<JobTarget> = {}): JobTarget => ({
  id,
  account,
  platform: ACCOUNTS[account].platform,
  status,
  ...extra,
})

/** Page 1 — the rows drawn in Figma (11 Post Monitoring — Desktop). */
const FEATURED: JobPost[] = [
  {
    id: 'post_spring', title: 'Spring drop teaser', file: 'spring_drop_teaser_cut2.mp4', duration: '11:02', sizeMb: 1843, tone: 'berry',
    day: 19, minutes: 9 * 60, createdAt: 'Nov 18, 4:12 PM', createdBy: 'Maya Rahman',
    targets: [
      target('job_3b7e10', 'ig-studio', 'published', { publishedAfter: 1 }),
      target('job_8f21c4', 'tt-studio', 'failed', { error: ERRORS.duration }),
      target('job_5c90d2', 'fb-studio', 'published', { publishedAfter: 2 }),
    ],
  },
  {
    id: 'post_studio', title: 'Studio tour — 60s cut', file: 'studio_tour_60s.mov', duration: '1:00', sizeMb: 248, tone: 'ocean',
    day: 21, minutes: 12 * 60 + 30, createdAt: 'Nov 20, 10:05 AM', createdBy: 'Maya Rahman',
    targets: [
      target('job_2e4a71', 'yt-studio', 'processing', { progress: 64 }),
      target('job_9a1f33', 'fb-studio', 'scheduled'),
      target('job_4d6b08', 'tt-studio', 'scheduled'),
    ],
  },
  {
    id: 'post_store', title: 'Store opening recap', file: 'store_opening_recap.mp4', duration: '2:14', sizeMb: 412, tone: 'sunset',
    day: 12, minutes: 18 * 60, createdAt: 'Nov 11, 3:40 PM', createdBy: 'Daniel Okafor',
    targets: [target('job_6a9e21', 'fb-studio', 'failed', { error: ERRORS.permission }), target('job_1f8c55', 'ig-studio', 'published', { publishedAfter: 1 })],
  },
  {
    id: 'post_seams', title: 'Behind the seams ep. 4', file: 'behind_the_seams_ep4.mp4', duration: '18:40', sizeMb: 2662, tone: 'night',
    day: 18, minutes: 12 * 60 + 30, createdAt: 'Nov 17, 2:20 PM', createdBy: 'Maya Rahman',
    targets: [target('job_7d1049', 'yt-studio', 'failed', { error: ERRORS.quota })],
  },
  {
    id: 'post_morning', title: 'Morning routine with Lena', file: 'lena_morning_routine.mp4', duration: '0:58', sizeMb: 186, tone: 'forest',
    day: 21, minutes: 9 * 60, createdAt: 'Nov 19, 11:30 AM', createdBy: 'Lena Fischer',
    targets: [target('job_0c3d92', 'tt-studio', 'published', { publishedAfter: 1 }), target('job_e81a47', 'ig-studio', 'published', { publishedAfter: 1 })],
  },
  {
    id: 'post_autumn', title: 'Autumn lookbook reel', file: 'autumn_lookbook_reel_v3.mp4', duration: '0:45', sizeMb: 142, tone: 'sunset',
    day: 21, minutes: 16 * 60 + 30, createdAt: 'Nov 20, 9:15 AM', createdBy: 'Maya Rahman',
    targets: [target('job_b4f6e0', 'ig-studio', 'scheduled'), target('job_c7a2d8', 'tt-studio', 'scheduled')],
  },
  {
    id: 'post_holiday', title: 'Holiday gift guide', file: 'holiday_gift_guide_9x16.mp4', duration: '1:20', sizeMb: 268, tone: 'berry',
    day: null, minutes: null, createdAt: 'Nov 20, 5:48 PM', createdBy: 'Daniel Okafor',
    targets: [target('job_d1e9b3', 'ig-studio', 'draft')],
  },
  {
    id: 'post_bf', title: 'Black Friday teaser (old cut)', file: 'bf_teaser_v1.mp4', duration: '0:30', sizeMb: 96, tone: 'slate',
    day: 20, minutes: 10 * 60, createdAt: 'Nov 14, 1:05 PM', createdBy: 'Maya Rahman',
    targets: [target('job_f20b6c', 'ig-studio', 'cancelled'), target('job_a95e17', 'tt-studio', 'cancelled')],
  },
]

/** Expanded by default (Figma shows these three open). */
export const DEFAULT_EXPANDED = ['post_spring', 'post_studio', 'post_seams']

const SCHEDULED_TITLES = [
  'Fabric care tips #3', 'Studio tour — full cut', 'Holiday window reveal', 'Gift wrapping hacks', 'Founders’ Q&A part 2', 'Winter capsule preview',
  'Customer stories: Priya', 'Knitwear close-ups', 'Packing orders with Sam', 'Year in review teaser', 'New Year sale countdown',
]
const PAST_TITLES = [
  'Black Friday teaser — final', 'Packaging unboxing', 'New collection — night shoot', 'Q&A with the founders', 'Linen vs. cotton explained', 'Fabric care tips #2',
  'Studio playlist vol. 3', 'Meet the makers: Ana', 'Denim fit guide', 'Behind the seams ep. 3', 'Weekend market recap', 'How we dye our yarn',
  'Pop-up shop day one', 'Styling one coat 3 ways', 'Customer stories: Jonah', 'Sustainable shipping 101', 'Fabric care tips #1', 'Sketch to sample',
  'Autumn lookbook stills', 'Morning routine with Lena (pt. 1)', 'Restock alert: wool scarves', 'Atelier time-lapse', 'Behind the seams ep. 2',
  'Colour of the month: rust', 'Tailoring basics', 'Studio dog cameo', 'Choosing the right zipper', 'Shop floor tour', 'Pattern cutting ASMR',
  'Designer picks: November', 'Repair café recap', 'Behind the seams ep. 1', 'Swatch library tour', 'Cozy knits haul', 'Photo day bloopers',
  'Thread count myths', 'Mending a hem live', 'Mood board walkthrough', 'Fit check: Lena', 'Inside the dye lab', 'Wool sourcing trip',
  'Store opening teaser', 'Sneak peek: holiday drop', 'Thank you, 10K followers', 'Ironing like a pro',
]
const TONES: ThumbnailTone[] = ['sunset', 'ocean', 'forest', 'studio', 'night', 'sand', 'berry', 'slate']
const COMBOS: AccountId[][] = [
  ['tt-studio', 'ig-studio', 'fb-studio'],
  ['ig-studio', 'yt-studio', 'fb-studio'],
  ['tt-studio', 'ig-shop', 'yt-studio'],
  ['ig-shop', 'tt-studio', 'fb-studio'],
]
const TIMES = [9 * 60, 12 * 60 + 30, 18 * 60, 10 * 60, 16 * 60 + 30, 8 * 60 + 15]
const PEOPLE = ['Maya Rahman', 'Daniel Okafor', 'Lena Fischer']

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’'.]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
const jobId = (n: number) => `job_${(0x10a3f + n * 7919).toString(16).slice(-6).padStart(6, '0')}`

function generated(title: string, i: number, day: number, status: 'scheduled' | 'published', count: number): JobPost {
  const accounts = (count === 2 ? [['ig-studio', 'tt-studio']] : COMBOS)[i % (count === 2 ? 1 : COMBOS.length)] as AccountId[]
  return {
    id: `post_${slug(title)}`,
    title,
    file: `${slug(title)}.mp4`,
    duration: `${(i % 3) + 0}:${String((i * 17) % 60).padStart(2, '0')}`,
    sizeMb: 80 + ((i * 53) % 400),
    tone: TONES[i % TONES.length],
    day,
    minutes: TIMES[i % TIMES.length],
    createdAt: `Nov ${Math.max(1, day - 2)}, ${formatClock(((i * 97) % 600 + 540) * 60)}`,
    createdBy: PEOPLE[i % PEOPLE.length],
    targets: accounts.map((account, k) => target(jobId(i * 3 + k), account, status, status === 'published' ? { publishedAfter: k + 1 } : {})),
  }
}

/**
 * 64 posts · 182 targets: Scheduled 36 · Processing 2 · Published 138 · Failed 3 · Cancelled 2 · Draft 1
 * (the counts on the Figma tabs). Page 1 is FEATURED; the rest fill pages 2–8.
 */
function seed(): JobPost[] {
  const scheduled = SCHEDULED_TITLES.map((title, i) => generated(title, i, 22 + Math.floor((i * 9) / SCHEDULED_TITLES.length), 'scheduled', i === SCHEDULED_TITLES.length - 1 ? 2 : 3))
  const past = PAST_TITLES.map((title, i) => generated(title, 100 + i, 20 - Math.floor((i * 20) / PAST_TITLES.length), 'published', i === PAST_TITLES.length - 1 ? 2 : 3))
  // The second processing job: a cross-post still uploading to Instagram.
  const live = past[0]
  live.day = TODAY
  live.minutes = 12 * 60 + 15
  live.targets[1] = { ...live.targets[1], status: 'processing', progress: 22, publishedAfter: undefined }
  return [...FEATURED, ...scheduled, ...past]
}

let db: JobPost[] = seed()

const PAGE_SIZE = { posts: 8, targets: 16 }

function inRange(post: JobPost, range: DateRange) {
  if (range === 'oct-2025') return false
  if (post.day == null) return range === 'nov-2025'
  if (range === 'last-7') return post.day >= TODAY - 6 && post.day <= TODAY
  if (range === 'next-7') return post.day >= TODAY && post.day <= TODAY + 6
  return true
}

type Filters = Required<Pick<MonitoringSearch, 'range' | 'grouped' | 'page'>> & Omit<MonitoringSearch, 'range' | 'grouped' | 'page'>

const matchesTarget = (t: JobTarget, f: Filters) => (!f.platform || t.platform === f.platform) && (!f.account || t.account === f.account)

function query(f: Filters) {
  const q = f.q?.trim().toLowerCase()
  const posts = db.filter((p) => inRange(p, f.range) && (!q || p.title.toLowerCase().includes(q) || p.file.toLowerCase().includes(q)))
  const scoped = posts.flatMap((post) => post.targets.filter((t) => matchesTarget(t, f)).map((t) => ({ post, t })))
  const counts = { all: scoped.length } as StatusCounts
  for (const s of STATUS_TABS) counts[s] = scoped.filter(({ t }) => t.status === s).length
  const matching = scoped.filter(({ t }) => !f.status || t.status === f.status)
  const matchingPosts = posts.filter((p) => matching.some(({ post }) => post === p))
  return { counts, matching, matchingPosts }
}

function listJobs(f: Filters): JobsPage {
  const { counts, matching, matchingPosts } = query(f)
  const size = f.grouped ? PAGE_SIZE.posts : PAGE_SIZE.targets
  const total = f.grouped ? matchingPosts.length : matching.length
  const pageCount = Math.max(1, Math.ceil(total / size))
  const page = Math.min(Math.max(1, f.page), pageCount)
  const start = (page - 1) * size
  return {
    grouped: f.grouped,
    posts: f.grouped ? matchingPosts.slice(start, start + size) : [],
    rows: f.grouped ? [] : matching.slice(start, start + size).map(({ post, t }) => ({ post, targetId: t.id })),
    counts,
    totalPosts: matchingPosts.length,
    totalTargets: matching.length,
    page,
    pageCount,
  }
}

const normalize = (s: MonitoringSearch): Filters => ({ ...s, range: s.range ?? DEFAULT_RANGE, grouped: s.grouped ?? true, page: s.page ?? 1 })

/* ── Queries ───────────────────────────────────────────────────────── */

export const jobsQueryOptions = (search: MonitoringSearch) => {
  const f = normalize(search)
  return queryOptions({
    queryKey: ['monitoring', 'list', f],
    queryFn: () => mockRequest(() => listJobs(f)),
  })
}

export const jobDetailQueryOptions = (jobId: string) =>
  queryOptions({
    queryKey: ['monitoring', 'job', jobId],
    queryFn: () =>
      mockRequest((): JobDetail => {
        const post = db.find((p) => p.targets.some((t) => t.id === jobId))
        if (!post) throw new Error(`No publishing job with id “${jobId}”.`)
        return { post, focusId: jobId }
      }),
  })

/** Unresolved failed targets across all posts — the sidebar "Post Monitoring" badge. Shares the `monitoring` key so retries/cancels refresh it. */
export const failedJobsCountQueryOptions = queryOptions({
  queryKey: ['monitoring', 'failed-count'],
  queryFn: () => mockRequest(() => db.reduce((n, p) => n + p.targets.filter((t) => t.status === 'failed').length, 0), { delay: 150 }),
})

/** CSV of every target matching the current filters (all pages). */
export async function exportJobsCsv(search: MonitoringSearch) {
  const rows = await mockRequest(() => query(normalize(search)).matching, { delay: 400 })
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const lines = [
    ['Job ID', 'Post', 'Drive file', 'Platform', 'Account', 'Scheduled', 'Published at', 'Status', 'Error'],
    ...rows.map(({ post, t }) => [
      t.id,
      post.title,
      post.file,
      PLATFORM_LABEL[t.platform],
      ACCOUNTS[t.account].handle,
      scheduledLabel(post),
      publishedLabel(post, t) ?? '',
      STATUS_LABEL[t.status],
      t.status === 'failed' ? (t.error?.message ?? '') : '',
    ]),
  ]
  const blob = new Blob([lines.map((l) => l.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: 'relay-post-monitoring.csv' })
  a.click()
  URL.revokeObjectURL(url)
  return rows.length
}

/* ── Mutations: retry / cancel / undo (optimistic) ─────────────────── */

type Change = { id: string; from: PublishStatus; to: JobTarget }

function nextTarget(t: JobTarget, action: 'retry' | 'cancel' | 'restore'): JobTarget | null {
  if (action === 'retry') return t.status === 'failed' ? { ...t, status: 'processing', progress: 0, retried: true } : null
  if (action === 'cancel') return ['scheduled', 'processing', 'failed'].includes(t.status) ? { ...t, status: 'cancelled', cancelledFrom: t.status, progress: undefined } : null
  return t.status === 'cancelled' && t.cancelledFrom ? { ...t, status: t.cancelledFrom, cancelledFrom: undefined } : null
}

function patchPost(post: JobPost, ids: Set<string>, action: 'retry' | 'cancel' | 'restore', changes?: Change[]): JobPost {
  if (!post.targets.some((t) => ids.has(t.id))) return post
  return {
    ...post,
    targets: post.targets.map((t) => {
      if (!ids.has(t.id)) return t
      const next = nextTarget(t, action)
      if (!next) return t
      changes?.push({ id: t.id, from: t.status, to: next })
      return next
    }),
  }
}

/** Applies the change to every cached list page and drawer, adjusting the tab counts. */
function applyOptimistic(qc: QueryClient, ids: Set<string>, action: 'retry' | 'cancel' | 'restore') {
  qc.setQueriesData<JobsPage>({ queryKey: ['monitoring', 'list'] }, (old) => {
    if (!old) return old
    const changes: Change[] = []
    const seen = new Set<JobPost>()
    const patch = (p: JobPost) => {
      const out = patchPost(p, ids, action, seen.has(p) ? undefined : changes)
      seen.add(p)
      return out
    }
    const posts = old.posts.map(patch)
    const cache = new Map<string, JobPost>()
    const rows = old.rows.map((r) => {
      const post = cache.get(r.post.id) ?? patch(r.post)
      cache.set(r.post.id, post)
      return { ...r, post }
    })
    const counts = { ...old.counts }
    for (const c of changes) {
      counts[c.from] = Math.max(0, counts[c.from] - 1)
      counts[c.to.status] += 1
    }
    return { ...old, posts, rows, counts }
  })
  qc.setQueriesData<JobDetail>({ queryKey: ['monitoring', 'job'] }, (old) => (old ? { ...old, post: patchPost(old.post, ids, action) } : old))
}

type Outcome = { changed: { id: string; title: string; platform: Platform }[] }

function useTargetAction(action: 'retry' | 'cancel') {
  const qc = useQueryClient()
  const restore = useRestore()
  return useMutation({
    mutationFn: (ids: string[]) =>
      mockRequest((): Outcome => {
        const set = new Set(ids)
        const changes: Change[] = []
        db = db.map((p) => patchPost(p, set, action, changes))
        return {
          changed: changes.map((c) => {
            const post = db.find((p) => p.targets.some((t) => t.id === c.id))!
            return { id: c.id, title: post.title, platform: c.to.platform }
          }),
        }
      }, { delay: 500 }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ['monitoring'] })
      const snapshots = [...qc.getQueriesData({ queryKey: ['monitoring', 'list'] }), ...qc.getQueriesData({ queryKey: ['monitoring', 'job'] })]
      applyOptimistic(qc, new Set(ids), action)
      return { snapshots }
    },
    onError: (_err, _ids, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data))
      toast.error('Something went wrong', { description: 'Please try again.', duration: Infinity })
    },
    onSuccess: ({ changed }) => {
      if (changed.length === 0) return
      const one = changed.length === 1 ? changed[0] : null
      const platform = one ? PLATFORM_LABEL[one.platform] : ''
      if (action === 'retry') {
        toast.success('Retry queued', { description: one ? `${one.title} will be re-sent to ${platform}.` : `${changed.length} failed targets will be re-sent.` })
      } else {
        toast.success(one ? 'Target cancelled' : `${changed.length} targets cancelled`, {
          description: one ? `${one.title} won’t be published to ${platform}.` : 'They won’t be published. Other targets aren’t affected.',
          action: { label: 'Undo', onClick: () => restore.mutate(changed.map((c) => c.id)) },
        })
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['monitoring'] }),
  })
}

function useRestore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      mockRequest(() => {
        const set = new Set(ids)
        db = db.map((p) => patchPost(p, set, 'restore'))
      }, { delay: 300 }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ['monitoring'] })
      applyOptimistic(qc, new Set(ids), 'restore')
    },
    onSuccess: (_d, ids) => toast.success(ids.length === 1 ? 'Target restored' : `${ids.length} targets restored`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['monitoring'] }),
  })
}

/** Re-send failed targets. Optimistically flips them to Processing and moves the Failed count. */
export const useRetryTargets = () => useTargetAction('retry')

/** Cancel scheduled / processing / failed targets (with Undo in the toast). */
export const useCancelTargets = () => useTargetAction('cancel')

export const failedIds = (targets: JobTarget[]) => targets.filter((t) => t.status === 'failed').map((t) => t.id)
export const cancellableIds = (targets: JobTarget[]) => targets.filter((t) => t.status === 'scheduled' || t.status === 'processing').map((t) => t.id)
