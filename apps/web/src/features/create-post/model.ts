import { redirect } from '@tanstack/react-router'
import { PLATFORM_LABEL, type Platform, type ThumbnailTone } from '@/lib/types'
import { BEST_TIMES, EXISTING_POSTS, MOCK_NOW, type DriveFile, type SocialAccount } from './api'
import { draftStore, STAGGER_OFFSET, type Draft, type Schedule, type TargetSettings } from './draft-store'

/* ── Steps ─────────────────────────────────────────────────────────── */

export const STEPS = [
  { id: 'media', label: 'Media', title: 'Select media', to: '/create/media' },
  { id: 'accounts', label: 'Accounts', title: 'Choose accounts', to: '/create/accounts' },
  { id: 'customize', label: 'Customize', title: 'Customize', to: '/create/customize' },
  { id: 'schedule', label: 'Schedule', title: 'Schedule', to: '/create/schedule' },
  { id: 'review', label: 'Review', title: 'Review', to: '/create/review' },
] as const

export type StepId = (typeof STEPS)[number]['id']
export type StepPath = (typeof STEPS)[number]['to']

export const stepIndex = (id: StepId) => STEPS.findIndex((s) => s.id === id)

export function stepFromPath(pathname: string): StepId {
  const seg = pathname.replace(/\/+$/, '').split('/').pop()
  return STEPS.find((s) => s.id === seg)?.id ?? 'media'
}

/** Is everything a step needs filled in? (Media/accounts are hard requirements.) */
export function stepComplete(draft: Draft, id: StepId): boolean {
  switch (id) {
    case 'media':
      return draft.mediaIds.length > 0
    case 'accounts':
      return draft.targetIds.length > 0
    case 'customize':
      return draft.targetIds.every((tid) => targetIssues(draft, tid).errors.length === 0)
    case 'schedule':
      return scheduleError(draft.schedule) === null
    case 'review':
      return false
  }
}

/** Index of the first step that still needs work before `id` (or `id` itself). */
export function firstBlockingStep(draft: Draft, id: StepId): StepId {
  const target = stepIndex(id)
  for (let i = 0; i < target; i++) if (!stepComplete(draft, STEPS[i].id)) return STEPS[i].id
  return id
}

/** Route guard: send deep links to the first step that still needs input. */
export function guardStep(id: StepId) {
  const blocking = firstBlockingStep(draftStore.get(), id)
  if (blocking !== id) throw redirect({ to: STEPS[stepIndex(blocking)].to, replace: true })
}

/* ── Search params ─────────────────────────────────────────────────── */

export const MEDIA_TYPES = ['videos', 'images', 'all'] as const
export type MediaType = (typeof MEDIA_TYPES)[number]
export type MediaSearch = { type?: MediaType; q?: string }
export type CustomizeSearch = { target?: string; preview?: Platform }

/* ── Platforms & targets ───────────────────────────────────────────── */

export const PLATFORM_ORDER: Platform[] = ['tiktok', 'instagram', 'youtube', 'facebook']
export const PLATFORM_SHORT: Record<Platform, string> = { tiktok: 'TikTok', instagram: 'IG', youtube: 'YT', facebook: 'FB' }

export const CAPTION_LIMIT: Record<Platform, number> = { tiktok: 2200, instagram: 2200, youtube: 5000, facebook: 63206 }
export const TITLE_LIMIT = 100
/** Facebook truncates feed captions after ~3 lines. */
export const FACEBOOK_HOOK_LENGTH = 125

/** "@northwind.studio" for TikTok/Instagram, the channel/page name for YouTube/Facebook. */
export const targetLabel = (a: SocialAccount) => (a.platform === 'tiktok' || a.platform === 'instagram' ? a.handle : a.name)

export const ACCOUNT_KIND_LABEL: Record<SocialAccount['kind'], string> = {
  Business: 'Business account',
  Creator: 'Creator account',
  Channel: 'Channel',
  'Brand channel': 'Brand channel',
  Page: 'Page',
}

export function orderedTargets(draft: Draft, accounts: SocialAccount[]) {
  return draft.targetIds.map((id) => accounts.find((a) => a.id === id)).filter((a): a is SocialAccount => !!a)
}

export function targetsByPlatform(draft: Draft, accounts: SocialAccount[]) {
  return orderedTargets(draft, accounts).sort((a, b) => PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform))
}

export function selectedMedia(draft: Draft, files: DriveFile[]) {
  return draft.mediaIds.map((id) => files.find((f) => f.id === id)).filter((f): f is DriveFile => !!f)
}

export function isCarousel(media: DriveFile[]) {
  return media.length > 0 && media[0].kind === 'image'
}

/** "From Drive · 0:42 · 248 MB · 9:16" */
export function mediaMeta(media: DriveFile[]) {
  if (media.length === 0) return ''
  if (isCarousel(media)) {
    const mb = media.reduce((sum, m) => sum + m.sizeMb, 0)
    return `From Drive · ${media[0].format} · ${mb.toFixed(1)} MB`
  }
  const m = media[0]
  return `From Drive · ${m.duration} · ${m.sizeMb} MB · ${m.aspect}`
}

/** Frames sampled from the video for the cover picker (Figma tones). */
export const frameTones = (tone: ThumbnailTone): ThumbnailTone[] => [tone, tone, 'berry', 'sand', tone, 'night']

export const supportsPlatform = (media: DriveFile[], platform: Platform) => media.every((m) => !m.unsupported.includes(platform))

/** "Reel", "Short", "Page Reel"… — what each target publishes as. */
export function formatLabel(platform: Platform, media: DriveFile[], settings?: TargetSettings) {
  const carousel = isCarousel(media)
  switch (platform) {
    case 'tiktok':
      return carousel ? 'Photo carousel' : 'Video'
    case 'instagram':
      return carousel ? 'Carousel' : 'Reel'
    case 'youtube':
      return settings?.platform === 'youtube' && settings.publishAs === 'video' ? 'Video' : 'Short'
    case 'facebook':
      return carousel ? 'Photo post' : 'Page Reel'
  }
}

/** Platform card subtitle on the Accounts step. */
export function publishesAs(platform: Platform, media: DriveFile[], settings?: TargetSettings) {
  if (!supportsPlatform(media, platform)) return 'Not available for this file'
  const carousel = isCarousel(media)
  switch (platform) {
    case 'tiktok':
      return carousel ? 'Publishes as a photo carousel' : 'Publishes as a TikTok video'
    case 'instagram':
      return carousel ? 'Publishes as a carousel' : 'Publishes as a Reel'
    case 'youtube': {
      const m = media[0]
      if (settings?.platform === 'youtube' && settings.publishAs === 'video') return 'Publishes as a video'
      return m?.aspect === '9:16' && (m.durationSec ?? 0) <= 180 ? `${m.duration} vertical → publishes as a Short` : 'Publishes as a video'
    }
    case 'facebook':
      return carousel ? 'Publishes as a photo post' : 'Publishes as a Page Reel'
  }
}

/** Compatibility line per platform for the selected media (Select media step). */
export function compatNote(platform: Platform, media: DriveFile[]) {
  if (!supportsPlatform(media, platform)) {
    const reason = media.find((m) => m.unsupported.includes(platform))
    return { ok: false, text: reason?.kind === 'image' ? 'Image posts not supported' : 'Not supported for this file' }
  }
  if (isCarousel(media)) {
    const n = media.length
    const text = { tiktok: `Photo carousel · ${n} of 35`, instagram: `Carousel · ${n} of 10`, facebook: `Photo post · ${n} ${n === 1 ? 'image' : 'images'}`, youtube: '' }[platform]
    return { ok: true, text }
  }
  const m = media[0]
  const text = {
    tiktok: `${m.aspect} · ${m.duration} · under 10 min`,
    instagram: 'Reel · under 15 min',
    youtube: (m.durationSec ?? 0) <= 180 && m.aspect === '9:16' ? 'Short · under 3 min' : 'Video · under 12 h',
    facebook: (m.durationSec ?? 0) <= 90 ? 'Reel · under 90 s' : 'Video post',
  }[platform]
  return { ok: true, text }
}

/* ── Captions & validation ─────────────────────────────────────────── */

export function captionFor(draft: Draft, targetId: string) {
  const s = draft.settings[targetId]
  if (!s) return draft.caption
  if (s.platform === 'youtube') return s.description ?? draft.caption
  return s.caption ?? draft.caption
}

export function isEdited(draft: Draft, targetId: string) {
  const s = draft.settings[targetId]
  if (!s) return false
  return s.platform === 'youtube' ? s.description !== null : s.caption !== null
}

export type TargetIssues = { errors: string[]; suggestions: string[] }

export function targetIssues(draft: Draft, targetId: string): TargetIssues {
  const s = draft.settings[targetId]
  const errors: string[] = []
  const suggestions: string[] = []
  if (!s) return { errors, suggestions }
  const caption = captionFor(draft, targetId)
  if (caption.length > CAPTION_LIMIT[s.platform]) errors.push(`${s.platform === 'youtube' ? 'Description' : 'Caption'} is over the ${CAPTION_LIMIT[s.platform].toLocaleString('en-US')}-character limit`)
  if (s.platform === 'youtube') {
    if (!s.title.trim()) errors.push('Add a title — YouTube requires one')
    else if (s.title.length > TITLE_LIMIT) errors.push('Title is over 100 characters')
    if (s.publishAs === 'video' && !s.thumbnailId) suggestions.push('Pick a custom thumbnail from your Drive')
  }
  if (s.platform === 'facebook' && caption.length > FACEBOOK_HOOK_LENGTH) suggestions.push('Feed cuts captions after 3 lines — consider a shorter hook')
  return { errors, suggestions }
}

/** Targets list icon: ✓ reviewed, ! needs attention, … untouched (uses shared defaults). */
export function targetStatus(draft: Draft, account: SocialAccount): 'ready' | 'attention' | 'idle' {
  if (targetIssues(draft, account.id).errors.length > 0) return 'attention'
  if (draft.visited.includes(account.id)) return 'ready'
  // Platform-only required fields (YouTube title) need a look before publishing.
  return account.platform === 'youtube' ? 'attention' : 'idle'
}

export function extractHashtags(text: string) {
  return [...new Set(text.match(/#[\p{L}\p{N}_]+/gu) ?? [])]
}

export function removeHashtag(text: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text
    .replace(new RegExp(`\\s*${escaped}(?![\\p{L}\\p{N}_])`, 'gu'), '')
    .replace(/[ \t]+$/gm, '')
    .trim()
}

export function addHashtag(text: string, raw: string) {
  const tag = `#${raw.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '')}`
  if (tag === '#' || extractHashtags(text).includes(tag)) return text
  return text ? `${text.trimEnd()} ${tag}` : tag
}

/** Truncate at a word boundary (review rows show the first ~54 characters). */
export function excerpt(text: string, max = 54) {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max + 1)
  const i = cut.lastIndexOf(' ')
  return `${(i > 0 ? cut.slice(0, i) : flat.slice(0, max)).replace(/[,.;:]$/, '')}…`
}

/** "autumn_lookbook_reel_v3.mp4" → "Autumn lookbook reel". */
export function postTitle(media: DriveFile[]) {
  if (media.length === 0) return 'Untitled post'
  const base = media[0].name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]v\d+$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()
  const title = base.charAt(0).toUpperCase() + base.slice(1)
  return media.length > 1 ? `${title} carousel` : title
}

/* ── Time zones & schedule ─────────────────────────────────────────── */

export const WORKSPACE_TZ = 'America/New_York'

export const TIMEZONES = [
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Denver', label: 'America/Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'UTC', label: 'UTC' },
] as const

const CITY: Record<string, string> = {
  'America/New_York': 'New York',
  'America/Chicago': 'Chicago',
  'America/Denver': 'Denver',
  'America/Los_Angeles': 'Los Angeles',
  'Europe/London': 'London',
  UTC: 'UTC',
}

function tzOffsetMinutes(instant: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
  return (asUtc - instant.getTime()) / 60_000
}

/** Wall-clock date + minutes in `tz` → absolute instant. */
export function zonedInstant(date: string, minutes: number, tz: string) {
  const [y, m, d] = date.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60)
  const first = guess - tzOffsetMinutes(new Date(guess), tz) * 60_000
  return new Date(guess - tzOffsetMinutes(new Date(first), tz) * 60_000)
}

const fmt = (instant: Date, tz: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(instant)

/** "6:00 PM" */
export const formatClock = (instant: Date, tz: string) => fmt(instant, tz, { hour: 'numeric', minute: '2-digit' })
/** "EST" */
export const tzAbbr = (instant: Date, tz: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value ?? ''
/** "Thu, Nov 27" */
export const formatDayShort = (instant: Date, tz: string) => fmt(instant, tz, { weekday: 'short', month: 'short', day: 'numeric' })
/** "Thu" */
export const formatWeekday = (instant: Date, tz: string) => fmt(instant, tz, { weekday: 'short' })

/** Minutes after midnight → "6:00 PM". */
export function minutesLabel(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** `YYYY-MM-DD` → "Thu, Nov 27, 2025" (calendar date, no zone shift). */
export function dateLabel(date: string, withYear = true) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' })
}

export const toIsoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function fromIsoDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const mockToday = () => fromIsoDate(fmt(MOCK_NOW, WORKSPACE_TZ, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2'))

export function defaultSchedule(targets: SocialAccount[]): Schedule {
  const best = BEST_TIMES[0]
  return {
    mode: 'schedule',
    date: best.date,
    minutes: best.minutes,
    timezone: WORKSPACE_TZ,
    stagger: true,
    offsets: Object.fromEntries(targets.map((t) => [t.id, STAGGER_OFFSET[t.platform]])),
  }
}

export const offsetFor = (schedule: Schedule, targetId: string, platform: Platform) => (schedule.stagger ? (schedule.offsets[targetId] ?? STAGGER_OFFSET[platform]) : 0)

export type TargetTime = { account: SocialAccount; instant: Date; minutes: number }

export function targetTimes(schedule: Schedule, targets: SocialAccount[]): TargetTime[] {
  const base = zonedInstant(schedule.date, schedule.minutes, schedule.timezone)
  return targets.map((account) => {
    const offset = offsetFor(schedule, account.id, account.platform)
    return { account, minutes: schedule.minutes + offset, instant: new Date(base.getTime() + offset * 60_000) }
  })
}

export function scheduleError(schedule: Schedule | null): string | null {
  if (!schedule) return 'Pick when this should go out'
  if (schedule.mode === 'now') return null
  if (zonedInstant(schedule.date, schedule.minutes, schedule.timezone).getTime() <= MOCK_NOW.getTime()) return 'Pick a time in the future'
  return null
}

/** "Thu, Nov 27 · 6:00–7:00 PM EST" (or a single time). */
export function scheduleSummary(schedule: Schedule, targets: SocialAccount[]) {
  const times = targetTimes(schedule, targets).sort((a, b) => a.instant.getTime() - b.instant.getTime())
  const tz = schedule.timezone
  const first = times[0]?.instant ?? zonedInstant(schedule.date, schedule.minutes, tz)
  const last = times[times.length - 1]?.instant ?? first
  return { day: formatDayShort(first, tz), range: clockRange(first, last, tz, '–'), abbr: tzAbbr(first, tz), first, last }
}

/** "6:00–7:00 PM" / "11:30 AM–12:30 PM" / "6:00 PM". */
export function clockRange(first: Date, last: Date, tz: string, sep: string) {
  const a = formatClock(first, tz)
  const b = formatClock(last, tz)
  if (a === b) return a
  const [aTime, aMer] = a.split(' ')
  const [, bMer] = b.split(' ')
  return aMer === bMer ? `${aTime}${sep}${b}` : `${a}${sep}${b}`
}

export function audienceLocal(instant: Date, account: SocialAccount) {
  return `${formatClock(instant, account.audienceTz)} ${tzAbbr(instant, account.audienceTz)} · ${CITY[account.audienceTz] ?? account.audienceTz}`
}

/** Info / warning about other posts already on the chosen day. */
export function spacingNote(schedule: Schedule, times: TargetTime[]) {
  if (schedule.mode !== 'schedule' || times.length === 0) return null
  const existing = EXISTING_POSTS[schedule.date] ?? []
  if (existing.length === 0) return null
  const day = dateLabel(schedule.date, false)
  const list = existing.map(minutesLabel).join(', ')
  const gap = Math.min(...times.flatMap((t) => existing.map((e) => Math.abs(t.minutes - e))))
  const n = existing.length
  const lead = `${day} already has ${n} ${n === 1 ? 'post' : 'posts'} (${list}).`
  if (gap >= 60) {
    const hours = Math.floor(gap / 60)
    return { tone: 'info' as const, text: `${lead} This one keeps at least ${hours} ${hours === 1 ? 'hour' : 'hours'} between posts.` }
  }
  return { tone: 'warning' as const, text: `${lead} This one goes out ${gap === 0 ? 'at the same time as' : `${gap} min from`} another post — consider spacing them out.` }
}

export const platformName = (p: Platform) => PLATFORM_LABEL[p]
