import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mockRequest } from '@/lib/api'
import { PLATFORM_LABEL, type MediaKind, type Platform, type PublishStatus, type ThumbnailTone } from '@/lib/types'
import { dateOf, formatWhen, monthGridRange } from './date-utils'

/* ── Types ─────────────────────────────────────────────────────────── */

export const CALENDAR_VIEWS = ['month', 'week', 'day'] as const
export type CalendarView = (typeof CALENDAR_VIEWS)[number]

/** Publishing status per target (cancelled targets never show on the calendar). */
export type CalendarStatus = Exclude<PublishStatus, 'cancelled'>
export const CALENDAR_STATUSES = ['scheduled', 'processing', 'published', 'failed', 'draft'] as const satisfies readonly CalendarStatus[]

export const CALENDAR_PLATFORMS = ['tiktok', 'instagram', 'facebook', 'youtube'] as const satisfies readonly Platform[]

export type CalendarFilters = { platform?: Platform; status?: CalendarStatus; account?: string }

export type CalendarSearch = CalendarFilters & {
  /** Omitted = month on desktop, week (agenda) on mobile. */
  view?: CalendarView
  /** Anchor date `YYYY-MM-DD`; omitted = today. */
  date?: string
  /** Selected post in the day view's "Edit schedule" panel. */
  post?: string
}

export type CalendarAccount = { id: string; platform: Platform; handle: string }

/** One target = one platform + account. Each target keeps its own time. */
export type CalendarTarget = {
  id: string
  accountId: string
  platform: Platform
  handle: string
  status: CalendarStatus
  /** Wall-clock `YYYY-MM-DDTHH:mm` in the post's time zone. */
  at: string
  error?: string
}

export type CalendarPost = {
  id: string
  title: string
  /** Drive file the post publishes (streamed from the customer's Drive). */
  fileName: string
  tone: ThumbnailTone
  kind: MediaKind
  timezone: string
  targets: CalendarTarget[]
}

/** A post's targets that share one time — a block in week/day/agenda. */
export type CalendarEntry = { key: string; post: CalendarPost; at: string; targets: CalendarTarget[]; status: CalendarStatus }

/* ── Mock clock ────────────────────────────────────────────────────── */

/** The Figma frames are drawn on Friday, Nov 21, 2025 at 10:40 AM — the mock "now". */
export const CALENDAR_TODAY = '2025-11-21'
export const CALENDAR_NOW = '2025-11-21T10:40'

export const TIMEZONES = ['America/New_York (EST)', 'America/Chicago (CST)', 'America/Los_Angeles (PST)', 'Europe/London (GMT)', 'Asia/Jakarta (WIB)', 'UTC'] as const

export const CALENDAR_ACCOUNTS: CalendarAccount[] = [
  { id: 'tt-northwind-studio', platform: 'tiktok', handle: '@northwind.studio' },
  { id: 'ig-northwind-studio', platform: 'instagram', handle: '@northwind.studio' },
  { id: 'ig-northwind-shop', platform: 'instagram', handle: '@northwind.shop' },
  { id: 'ig-lena-makes', platform: 'instagram', handle: '@lena.makes' },
  { id: 'yt-northwind-studio', platform: 'youtube', handle: 'Northwind Studio' },
  { id: 'fb-northwind-studio', platform: 'facebook', handle: 'Northwind Studio' },
]

export const STATUS_LABEL: Record<CalendarStatus, string> = {
  scheduled: 'Scheduled',
  processing: 'Processing',
  published: 'Published',
  failed: 'Failed',
  draft: 'Draft',
}

/* ── Mock database ─────────────────────────────────────────────────── */

const ACC = {
  tt: 'tt-northwind-studio',
  ig: 'ig-northwind-studio',
  igShop: 'ig-northwind-shop',
  igLena: 'ig-lena-makes',
  yt: 'yt-northwind-studio',
  fb: 'fb-northwind-studio',
} as const
type AccKey = keyof typeof ACC

type Seed = [date: string, time: string, title: string, tone: ThumbnailTone, targets: [AccKey, CalendarStatus, string?][]]

/** Oct 27 – Nov 30, 2025: the Month frame, with Nov 17 – 23 from the Week / Day / Agenda frames. */
const SEED: Seed[] = [
  ['2025-10-27', '16:30', 'Autumn lookbook reel', 'sunset', [['ig', 'published']]],
  ['2025-10-29', '20:15', 'Studio tour — 60s cut', 'ocean', [['tt', 'published']]],
  ['2025-10-31', '12:30', 'Fabric care tips #3', 'sand', [['yt', 'published']]],
  ['2025-11-01', '12:30', 'Holiday gift guide', 'berry', [['fb', 'published']]],

  ['2025-11-03', '18:00', 'Packaging unboxing', 'studio', [['tt', 'published']]],
  ['2025-11-03', '20:15', 'Q&A with the founders', 'slate', [['ig', 'published']]],
  ['2025-11-04', '20:15', 'Morning routine with Lena', 'forest', [['ig', 'published']]],
  ['2025-11-05', '09:00', 'Night shoot BTS', 'night', [['tt', 'published']]],
  ['2025-11-05', '12:30', 'Linen collection drop', 'sunset', [['yt', 'published']]],
  ['2025-11-06', '12:30', 'Color story: Rust', 'ocean', [['fb', 'published']]],
  ['2025-11-07', '16:30', 'Model casting reel', 'sand', [['tt', 'published']]],
  ['2025-11-07', '18:00', 'Store opening recap', 'berry', [['ig', 'published']]],
  ['2025-11-07', '20:15', 'Behind the seams ep. 3', 'studio', [['ig', 'published']]],
  ['2025-11-08', '18:00', 'Knitwear flatlay', 'slate', [['tt', 'published']]],

  ['2025-11-10', '09:00', 'Autumn lookbook reel', 'forest', [['yt', 'published']]],
  ['2025-11-10', '12:30', 'Studio tour — 60s cut', 'night', [['fb', 'published']]],
  ['2025-11-11', '12:30', 'Fabric care tips #3', 'sunset', [['tt', 'published']]],
  ['2025-11-12', '16:30', 'Holiday gift guide', 'ocean', [['ig', 'published']]],
  ['2025-11-12', '18:00', 'Packaging unboxing', 'sand', [['ig', 'published']]],
  ['2025-11-13', '18:00', 'Q&A with the founders', 'berry', [['tt', 'published']]],
  ['2025-11-14', '09:00', 'Night shoot BTS', 'slate', [['fb', 'failed', 'Page permission revoked']]],
  ['2025-11-14', '12:30', 'Linen collection drop', 'forest', [['tt', 'published']]],
  ['2025-11-14', '20:15', 'Morning routine with Lena', 'studio', [['yt', 'published']]],
  ['2025-11-15', '09:00', 'Color story: Rust', 'night', [['ig', 'published']]],

  ['2025-11-17', '09:00', 'Model casting reel', 'sunset', [['ig', 'published']]],
  ['2025-11-17', '18:00', 'Store opening recap', 'ocean', [['tt', 'published']]],
  ['2025-11-18', '12:30', 'Behind the seams ep. 4', 'sand', [['yt', 'failed', 'Daily upload quota exceeded']]],
  ['2025-11-18', '20:00', 'Knitwear flatlay', 'berry', [['fb', 'published'], ['ig', 'published']]],
  ['2025-11-19', '09:00', 'Spring drop teaser', 'forest', [['tt', 'failed', 'Video exceeds 10 min limit']]],
  ['2025-11-19', '15:00', 'Color story: Rust', 'slate', [['ig', 'published']]],
  ['2025-11-19', '19:00', 'Store opening recap', 'ocean', [['fb', 'failed', 'Page permission revoked']]],
  ['2025-11-20', '11:00', 'Q&A with the founders', 'slate', [['yt', 'published'], ['tt', 'published']]],
  ['2025-11-21', '09:00', 'Morning routine with Lena', 'forest', [['tt', 'published'], ['igLena', 'published']]],
  ['2025-11-21', '12:30', 'Studio tour — 60s cut', 'ocean', [['yt', 'processing'], ['fb', 'scheduled'], ['tt', 'scheduled']]],
  ['2025-11-21', '16:30', 'Autumn lookbook reel', 'sunset', [['ig', 'scheduled'], ['tt', 'scheduled']]],
  ['2025-11-21', '18:30', 'Packaging unboxing', 'studio', [['igShop', 'scheduled']]],
  ['2025-11-22', '10:00', 'Night shoot BTS', 'night', [['ig', 'scheduled']]],
  ['2025-11-22', '18:00', 'Linen collection drop', 'studio', [['ig', 'scheduled'], ['fb', 'scheduled']]],
  ['2025-11-23', '12:00', 'Fabric care tips #3', 'sand', [['tt', 'scheduled']]],

  ['2025-11-24', '09:00', 'Store opening recap', 'night', [['fb', 'scheduled']]],
  ['2025-11-24', '20:15', 'Model casting reel', 'forest', [['yt', 'scheduled']]],
  ['2025-11-25', '09:00', 'Behind the seams ep. 5', 'sunset', [['tt', 'scheduled']]],
  ['2025-11-25', '12:30', 'Knitwear flatlay', 'ocean', [['ig', 'scheduled']]],
  ['2025-11-25', '16:30', 'Autumn lookbook reel', 'sand', [['ig', 'scheduled']]],
  ['2025-11-26', '12:30', 'Studio tour — 60s cut', 'berry', [['tt', 'scheduled']]],
  ['2025-11-26', '16:30', 'Fabric care tips #3', 'studio', [['yt', 'scheduled']]],
  ['2025-11-27', '16:30', 'Holiday gift guide', 'slate', [['fb', 'scheduled']]],
  ['2025-11-28', '18:00', 'Packaging unboxing', 'forest', [['tt', 'scheduled']]],
  ['2025-11-28', '20:15', 'Q&A with the founders', 'night', [['ig', 'draft']]],
  ['2025-11-29', '20:15', 'Morning routine with Lena', 'sunset', [['ig', 'scheduled']]],
]

const IMAGE_TITLES = new Set(['Knitwear flatlay', 'Color story: Rust', 'Holiday gift guide'])
const FILE_NAMES: Record<string, string> = { 'Autumn lookbook reel': 'autumn_lookbook_reel_v3.mp4' }

function fileNameFor(title: string, kind: MediaKind) {
  if (FILE_NAMES[title]) return FILE_NAMES[title]
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return `${slug}.${kind === 'image' ? 'jpg' : 'mp4'}`
}

const accountById = (id: string) => CALENDAR_ACCOUNTS.find((a) => a.id === id)!

let postsDb: CalendarPost[] = SEED.map(([date, time, title, tone, targets], i) => {
  const kind: MediaKind = IMAGE_TITLES.has(title) ? 'image' : 'video'
  const id = `post_${String(i + 1).padStart(3, '0')}`
  return {
    id,
    title,
    fileName: fileNameFor(title, kind),
    tone,
    kind,
    timezone: TIMEZONES[0],
    targets: targets.map(([acc, status, error], j) => {
      const account = accountById(ACC[acc])
      return { id: `${id}_t${j + 1}`, accountId: account.id, platform: account.platform, handle: account.handle, status, at: `${date}T${time}`, error }
    }),
  }
})

/* ── Derivations (pure) ────────────────────────────────────────────── */

export function aggregateStatus(targets: CalendarTarget[]): CalendarStatus {
  if (targets.some((t) => t.status === 'failed')) return 'failed'
  if (targets.some((t) => t.status === 'processing')) return 'processing'
  if (targets.every((t) => t.status === 'published')) return 'published'
  if (targets.every((t) => t.status === 'draft')) return 'draft'
  return 'scheduled'
}

/** Status pill copy for a whole entry, e.g. "Processing · uploading to YouTube". */
export function entryStatusLabel(targets: CalendarTarget[]) {
  const status = aggregateStatus(targets)
  if (status === 'processing') {
    const t = targets.find((x) => x.status === 'processing')!
    return `Processing · uploading to ${PLATFORM_LABEL[t.platform]}`
  }
  if (status === 'failed') {
    const failed = targets.filter((x) => x.status === 'failed')
    return failed.length === 1 && failed[0].error ? `Failed · ${failed[0].error}` : `Failed · ${failed.length} of ${targets.length} targets`
  }
  return STATUS_LABEL[status]
}

/** Only targets that haven't gone out (or failed) can be moved. */
export const isMovable = (t: CalendarTarget) => t.status === 'scheduled' || t.status === 'draft' || t.status === 'failed'
export const isPast = (at: string) => at < CALENDAR_NOW

export function matchesTarget(t: CalendarTarget, f: CalendarFilters) {
  return (!f.platform || t.platform === f.platform) && (!f.status || t.status === f.status) && (!f.account || t.accountId === f.account)
}

export const hasFilters = (f: CalendarFilters) => Boolean(f.platform || f.status || f.account)

/** Keeps only matching targets; drops posts with none left. */
export function filterPosts(posts: CalendarPost[], f: CalendarFilters): CalendarPost[] {
  if (!hasFilters(f)) return posts
  return posts.flatMap((p) => {
    const targets = p.targets.filter((t) => matchesTarget(t, f))
    return targets.length ? [{ ...p, targets }] : []
  })
}

/** Groups each post's targets by time → one entry per (post, time), sorted by time. */
export function toEntries(posts: CalendarPost[]): CalendarEntry[] {
  const entries: CalendarEntry[] = []
  for (const post of posts) {
    const byAt = new Map<string, CalendarTarget[]>()
    for (const t of post.targets) byAt.set(t.at, [...(byAt.get(t.at) ?? []), t])
    for (const [at, targets] of byAt) entries.push({ key: `${post.id}@${at}`, post, at, targets, status: aggregateStatus(targets) })
  }
  return entries.sort((a, b) => a.at.localeCompare(b.at) || a.post.title.localeCompare(b.post.title))
}

export function entriesByDate(entries: CalendarEntry[]) {
  const map = new Map<string, CalendarEntry[]>()
  for (const e of entries) map.set(dateOf(e.at), [...(map.get(dateOf(e.at)) ?? []), e])
  return map
}

/* ── Queries ───────────────────────────────────────────────────────── */

/** Posts with at least one target inside the month grid (Mon-first weeks) of `month` (`YYYY-MM`). */
export const calendarQueryOptions = (month: string) =>
  queryOptions({
    queryKey: ['calendar', month],
    queryFn: () =>
      mockRequest(() => {
        const { from, to } = monthGridRange(month)
        return postsDb.filter((p) => p.targets.some((t) => dateOf(t.at) >= from && dateOf(t.at) <= to))
      }),
  })

/* ── Mutations (optimistic across every cached month) ──────────────── */

function useOptimisticCalendar() {
  const queryClient = useQueryClient()
  return {
    async apply(update: (posts: CalendarPost[]) => CalendarPost[]) {
      await queryClient.cancelQueries({ queryKey: ['calendar'] })
      const snapshots = queryClient.getQueriesData<CalendarPost[]>({ queryKey: ['calendar'] })
      queryClient.setQueriesData<CalendarPost[]>({ queryKey: ['calendar'] }, (old) => (old ? update(old) : old))
      return { snapshots }
    },
    rollback(ctx?: { snapshots: [readonly unknown[], CalendarPost[] | undefined][] }) {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    settle: () => queryClient.invalidateQueries({ queryKey: ['calendar'] }),
  }
}

const genericError = () => toast.error('Something went wrong', { description: 'Please try again.', duration: Infinity })

export type RescheduleInput = { postId: string; changes: { targetId: string; at: string }[]; timezone?: string }

function applyReschedule(post: CalendarPost, input: RescheduleInput): CalendarPost {
  return {
    ...post,
    timezone: input.timezone ?? post.timezone,
    targets: post.targets.map((t) => {
      const change = input.changes.find((c) => c.targetId === t.id)
      if (!change) return t
      // A failed target moved into the future is queued again.
      return { ...t, at: change.at, status: t.status === 'failed' ? 'scheduled' : t.status, error: t.status === 'failed' ? undefined : t.error }
    }),
  }
}

/** Drag-and-drop, the Reschedule dialog and the day view's "Edit schedule" Save. */
export function useReschedulePost() {
  const cache = useOptimisticCalendar()
  return useMutation({
    mutationFn: (input: RescheduleInput) =>
      mockRequest(() => {
        const post = postsDb.find((p) => p.id === input.postId)
        if (!post) throw new Error('Post not found')
        const next = applyReschedule(post, input)
        postsDb = postsDb.map((p) => (p.id === input.postId ? next : p))
        return next
      }, { delay: 500 }),
    onMutate: (input) => cache.apply((posts) => posts.map((p) => (p.id === input.postId ? applyReschedule(p, input) : p))),
    onError: (_e, _v, ctx) => {
      cache.rollback(ctx)
      genericError()
    },
    onSuccess: (post, input) => {
      const at = input.changes[0]?.at
      const moved = input.changes.length
      toast.success('Post rescheduled', {
        description: at ? `${post.title} · ${formatWhen(at)}${moved > 1 ? ` · ${moved} targets` : ''}` : post.title,
      })
    },
    onSettled: cache.settle,
  })
}

/** Removes the post from the calendar (the Drive file is untouched); toast offers Undo. */
export function useDeletePost() {
  const cache = useOptimisticCalendar()
  const restore = useMutation({
    mutationFn: (post: CalendarPost) =>
      mockRequest(() => {
        postsDb = [...postsDb, post]
        return post
      }),
    onMutate: (post) => cache.apply((posts) => [...posts, post]),
    onError: (_e, _v, ctx) => {
      cache.rollback(ctx)
      genericError()
    },
    onSuccess: (post) => toast.success('Post restored', { description: `${post.title} is back on the calendar.` }),
    onSettled: cache.settle,
  })
  return useMutation({
    mutationFn: (post: CalendarPost) =>
      mockRequest(() => {
        // Views may hold a filtered copy; return the full record so Undo restores every target.
        const full = postsDb.find((p) => p.id === post.id) ?? post
        postsDb = postsDb.filter((p) => p.id !== post.id)
        return full
      }, { delay: 400 }),
    onMutate: (post) => cache.apply((posts) => posts.filter((p) => p.id !== post.id)),
    onError: (_e, _v, ctx) => {
      cache.rollback(ctx)
      genericError()
    },
    onSuccess: (post) =>
      toast.success('Post deleted', {
        description: `${post.title} was removed from the calendar. The file stays in your Drive.`,
        action: { label: 'Undo', onClick: () => restore.mutate(post) },
      }),
    onSettled: cache.settle,
  })
}

/** Re-sends failed targets: they show Processing until the platform answers. */
export function useRetryPost() {
  const cache = useOptimisticCalendar()
  return useMutation({
    mutationFn: (post: CalendarPost) =>
      mockRequest(() => {
        let resolved: CalendarPost = post
        postsDb = postsDb.map((p) => {
          if (p.id !== post.id) return p
          resolved = {
            ...p,
            targets: p.targets.map((t) => (t.status === 'failed' ? { ...t, status: isPast(t.at) ? 'published' : 'scheduled', error: undefined } : t)),
          }
          return resolved
        })
        return resolved
      }, { delay: 1400 }),
    onMutate: (post) =>
      cache.apply((posts) =>
        posts.map((p) => (p.id === post.id ? { ...p, targets: p.targets.map((t) => (t.status === 'failed' ? { ...t, status: 'processing' as const, error: undefined } : t)) } : p)),
      ),
    onError: (_e, _v, ctx) => {
      cache.rollback(ctx)
      genericError()
    },
    onSuccess: (post, original) => {
      const retried = original.targets.filter((t) => t.status === 'failed')
      const platforms = [...new Set(retried.map((t) => PLATFORM_LABEL[t.platform]))].join(', ')
      const past = retried.every((t) => isPast(t.at))
      toast.success(past ? 'Retry succeeded' : 'Retry queued', {
        description: past ? `${post.title} was published to ${platforms}.` : `${post.title} will be sent to ${platforms} as scheduled.`,
      })
    },
    onSettled: cache.settle,
  })
}
