import { useSyncExternalStore } from 'react'
import type { Platform } from '@/lib/types'
import { driveFileById, type DriveFile, type SocialAccount } from './api'

/* ── Draft shape ───────────────────────────────────────────────────── */

export type TikTokPrivacy = 'everyone' | 'friends' | 'only-me'
export type YouTubeVisibility = 'public' | 'unlisted' | 'private'

export type TikTokSettings = {
  platform: 'tiktok'
  /** `null` = use the shared caption. */
  caption: string | null
  coverFrame: number
  whoCanView: TikTokPrivacy
  allowComments: boolean
  allowDuet: boolean
  allowStitch: boolean
  brandedContent: boolean
}

export type InstagramSettings = {
  platform: 'instagram'
  caption: string | null
  coverFrame: number
  shareToFeed: boolean
  allowComments: boolean
  hideLikes: boolean
}

export type YouTubeSettings = {
  platform: 'youtube'
  publishAs: 'short' | 'video'
  title: string
  /** `null` = use the shared caption. */
  description: string | null
  /** Drive image used as the custom thumbnail (regular videos only). */
  thumbnailId: string | null
  visibility: YouTubeVisibility
  category: string
  playlist: string
  tags: string[]
  madeForKids: boolean
}

export type FacebookSettings = {
  platform: 'facebook'
  caption: string | null
  allowComments: boolean
  allowEmbedding: boolean
}

export type TargetSettings = TikTokSettings | InstagramSettings | YouTubeSettings | FacebookSettings
export type SettingsFor<P extends Platform> = Extract<TargetSettings, { platform: P }>

export type Schedule = {
  mode: 'now' | 'schedule'
  /** Workspace-local date, `YYYY-MM-DD`. */
  date: string
  /** Minutes after midnight in `timezone`. */
  minutes: number
  timezone: string
  stagger: boolean
  /** Minutes after `minutes` for each target when staggering. */
  offsets: Record<string, number>
}

export type Draft = {
  mediaIds: string[]
  /** Account ids, in the order they were selected. */
  targetIds: string[]
  /** Shared defaults, applied to every target unless edited for it. */
  caption: string
  settings: Record<string, TargetSettings>
  /** `null` until the Schedule step is opened. */
  schedule: Schedule | null
  /** Targets the user has reviewed in Customize (drives the ✓ in the targets list). */
  visited: string[]
  /** Set after a blocked "Continue" so fields show their errors. */
  showErrors: boolean
  /** Has the user changed anything since the draft was created? */
  touched: boolean
}

/* ── Defaults ──────────────────────────────────────────────────────── */

/** Default stagger offsets per platform (Figma: IG/TikTok on time, YouTube +15m, Facebook +1h). */
export const STAGGER_OFFSET: Record<Platform, number> = { instagram: 0, tiktok: 0, youtube: 15, facebook: 60 }

export function defaultSettings(platform: Platform, media?: DriveFile): TargetSettings {
  switch (platform) {
    case 'tiktok':
      return { platform, caption: null, coverFrame: 0, whoCanView: 'everyone', allowComments: true, allowDuet: true, allowStitch: false, brandedContent: false }
    case 'instagram':
      return { platform, caption: null, coverFrame: 0, shareToFeed: true, allowComments: true, hideLikes: false }
    case 'youtube':
      return {
        platform,
        publishAs: canBeShort(media) ? 'short' : 'video',
        title: '',
        description: null,
        thumbnailId: null,
        visibility: 'public',
        category: 'Howto & Style',
        playlist: 'none',
        tags: [],
        madeForKids: false,
      }
    case 'facebook':
      return { platform, caption: null, allowComments: true, allowEmbedding: true }
  }
}

/** YouTube Shorts: vertical video up to 3 minutes. */
export function canBeShort(media?: DriveFile) {
  return !!media && media.kind === 'video' && (media.durationSec ?? 0) <= 180 && media.aspect === '9:16'
}

const SEED_CAPTION = '5 knitwear looks for the first cold week 🍂 Which one are you wearing? #fallfashion #lookbook'

/** The saved draft the flow opens with (the post designed in Figma). */
function seedDraft(): Draft {
  return {
    mediaIds: ['f_autumn'],
    targetIds: ['ig_northwind', 'tt_northwind', 'yt_northwind', 'fb_northwind'],
    caption: SEED_CAPTION,
    settings: {
      tt_northwind: {
        platform: 'tiktok',
        caption: '5 knitwear looks for the first cold week 🍂 Which one are you wearing? Shot in our studio with Lena — full lookbook on the site. #fallfashion #lookbook #slowfashion',
        coverFrame: 1,
        whoCanView: 'everyone',
        allowComments: true,
        allowDuet: true,
        allowStitch: false,
        brandedContent: false,
      },
      ig_northwind: { platform: 'instagram', caption: null, coverFrame: 1, shareToFeed: true, allowComments: true, hideLikes: false },
      yt_northwind: {
        platform: 'youtube',
        publishAs: 'short',
        title: 'Autumn lookbook — 5 knitwear looks for fall',
        description: 'Five knitwear looks for the first cold week, styled by Lena in our studio. Shop the lookbook: northwind.studio/fall\n\n#Shorts #fallfashion',
        thumbnailId: null,
        visibility: 'public',
        category: 'Howto & Style',
        playlist: 'fall-2025',
        tags: ['knitwear', 'fall fashion', 'lookbook', 'northwind'],
        madeForKids: false,
      },
      fb_northwind: {
        platform: 'facebook',
        caption: 'Five knitwear looks for the first cold week, styled by Lena in our studio. Shop the lookbook: northwind.studio/fall #fallfashion',
        allowComments: true,
        allowEmbedding: true,
      },
    },
    schedule: null,
    visited: ['tt_northwind', 'ig_northwind'],
    showErrors: false,
    touched: true,
  }
}

export function blankDraft(): Draft {
  return { mediaIds: [], targetIds: [], caption: '', settings: {}, schedule: null, visited: [], showErrors: false, touched: false }
}

/* ── Store ─────────────────────────────────────────────────────────── */

let state: Draft = seedDraft()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const draftStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  update(fn: (draft: Draft) => Draft) {
    state = { ...fn(state), touched: true }
    emit()
  },
  reset() {
    state = blankDraft()
    emit()
  },
  start(draft: Draft) {
    state = draft
    emit()
  },
}

/** The whole draft; components derive what they need during render. */
export function useDraft() {
  return useSyncExternalStore(draftStore.subscribe, draftStore.get, draftStore.get)
}

/* ── Actions ───────────────────────────────────────────────────────── */

export const MAX_IMAGES = 10

/**
 * Start a new post from files picked in the Content Library / Drive browser.
 * Same rules as the media step: a post carries one video, or a carousel of up
 * to 10 images. Returns what made it in so the caller can say so.
 */
export function startDraftFromFiles(ids: readonly string[]) {
  const files = ids.map(driveFileById).filter((f): f is DriveFile => !!f)
  const video = files.find((f) => f.kind === 'video')
  const media = video ? [video] : files.slice(0, MAX_IMAGES)
  draftStore.start({ ...blankDraft(), mediaIds: media.map((f) => f.id), touched: true })
  return { added: media, skipped: ids.length - media.length }
}

/**
 * Select / deselect a Drive file. A video replaces the current selection;
 * images build a carousel of up to 10. Targets the new media can't publish
 * to are dropped. Returns `false` when the image limit blocks the change.
 */
export function toggleMedia(file: DriveFile, files: DriveFile[]): boolean {
  const d = draftStore.get()
  const selected = d.mediaIds.includes(file.id)
  let mediaIds: string[]
  if (selected) mediaIds = d.mediaIds.filter((id) => id !== file.id)
  else if (file.kind === 'video') mediaIds = [file.id]
  else {
    const current = files.filter((f) => d.mediaIds.includes(f.id))
    const images = current.every((f) => f.kind === 'image') ? d.mediaIds : []
    if (images.length >= MAX_IMAGES) return false
    mediaIds = [...images, file.id]
  }
  const media = files.filter((f) => mediaIds.includes(f.id))
  draftStore.update((draft) => {
    const targetIds = draft.targetIds.filter((id) => {
      const platform = draft.settings[id]?.platform
      return !platform || media.every((m) => !m.unsupported.includes(platform))
    })
    const settings = { ...draft.settings }
    // Shorts need a short vertical video; fall back to a regular upload.
    for (const id of targetIds) {
      const s = settings[id]
      if (s?.platform === 'youtube' && s.publishAs === 'short' && !canBeShort(media[0])) settings[id] = { ...s, publishAs: 'video' }
    }
    return { ...draft, mediaIds, targetIds, settings }
  })
  return true
}

export function setTargets(accounts: SocialAccount[], media?: DriveFile) {
  draftStore.update((draft) => {
    const settings = { ...draft.settings }
    for (const a of accounts) settings[a.id] ??= defaultSettings(a.platform, media)
    return { ...draft, targetIds: accounts.map((a) => a.id), settings }
  })
}

export function toggleTarget(account: SocialAccount, media?: DriveFile) {
  draftStore.update((draft) => {
    if (draft.targetIds.includes(account.id)) return { ...draft, targetIds: draft.targetIds.filter((id) => id !== account.id) }
    const settings = { ...draft.settings, [account.id]: draft.settings[account.id] ?? defaultSettings(account.platform, media) }
    return { ...draft, targetIds: [...draft.targetIds, account.id], settings }
  })
}

export function setSharedCaption(caption: string) {
  draftStore.update((draft) => ({ ...draft, caption }))
}

export function updateSettings<P extends Platform>(targetId: string, patch: Partial<Omit<SettingsFor<P>, 'platform'>>) {
  draftStore.update((draft) => {
    const current = draft.settings[targetId]
    if (!current) return draft
    return { ...draft, settings: { ...draft.settings, [targetId]: { ...current, ...patch } as TargetSettings } }
  })
}

/** "Reset to shared": drop the per-target caption override. */
export function resetToShared(targetId: string) {
  draftStore.update((draft) => {
    const s = draft.settings[targetId]
    if (!s) return draft
    const next: TargetSettings = s.platform === 'youtube' ? { ...s, description: null } : { ...s, caption: null }
    return { ...draft, settings: { ...draft.settings, [targetId]: next } }
  })
}

export function markVisited(targetId: string) {
  const d = draftStore.get()
  if (d.visited.includes(targetId)) return
  draftStore.update((draft) => ({ ...draft, visited: [...draft.visited, targetId] }))
}

export function setShowErrors(showErrors: boolean) {
  if (draftStore.get().showErrors === showErrors) return
  draftStore.update((draft) => ({ ...draft, showErrors }))
}

export function setSchedule(patch: Partial<Schedule>) {
  draftStore.update((draft) => (draft.schedule ? { ...draft, schedule: { ...draft.schedule, ...patch } } : draft))
}

/** First visit to the Schedule step: next best time, staggered by platform. */
export function ensureSchedule(defaults: Schedule) {
  if (draftStore.get().schedule) return
  draftStore.update((draft) => ({ ...draft, schedule: defaults }))
}
