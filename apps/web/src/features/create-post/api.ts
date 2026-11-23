import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mockRequest } from '@/lib/api'
import type { ConnectionStatus, MediaKind, Platform, ThumbnailTone } from '@/lib/types'

/* ── Types ─────────────────────────────────────────────────────────── */

/** A file in the customer's Google Drive. Relay only keeps the reference. */
export type DriveFile = {
  id: string
  name: string
  kind: MediaKind
  /** "MP4", "JPG" */
  format: string
  /** "0:42" — videos only. */
  duration?: string
  durationSec?: number
  sizeMb: number
  /** "9:16" */
  aspect: string
  /** "1080×1920" */
  resolution: string
  tone: ThumbnailTone
  /** Platforms this file cannot publish to, with the card-level warning shown in the picker. */
  unsupported: Platform[]
  warning?: string
}

export type AccountKind = 'Business' | 'Creator' | 'Channel' | 'Brand channel' | 'Page'

/** A connected social account — every selected account becomes one publishing target. */
export type SocialAccount = {
  id: string
  platform: Platform
  name: string
  handle: string
  kind: AccountKind
  initials: string
  status: ConnectionStatus
  /** IANA zone where most of this account's audience is (for "Audience local time"). */
  audienceTz: string
}

export type BestTime = { date: string; minutes: number; label: string }

/** One publishing job per target, as returned by the schedule mutation. */
export type PublishJob = { id: string; accountId: string; platform: Platform; label: string; at: string | null; minutes: number | null }

export type ScheduleResult = {
  title: string
  mode: 'now' | 'schedule'
  jobs: PublishJob[]
}

/* ── Mock database ─────────────────────────────────────────────────── */

const DRIVE_FILES: DriveFile[] = [
  { id: 'f_autumn', name: 'autumn_lookbook_reel_v3.mp4', kind: 'video', format: 'MP4', duration: '0:42', durationSec: 42, sizeMb: 248, aspect: '9:16', resolution: '1080×1920', tone: 'sunset', unsupported: [] },
  { id: 'f_studio', name: 'studio_tour_60s.mov', kind: 'video', format: 'MP4', duration: '1:00', durationSec: 60, sizeMb: 356, aspect: '9:16', resolution: '1080×1920', tone: 'ocean', unsupported: [] },
  { id: 'f_fabric', name: 'fabric-care-tips-03.mp4', kind: 'video', format: 'MP4', duration: '0:28', durationSec: 28, sizeMb: 164, aspect: '9:16', resolution: '1080×1920', tone: 'sand', unsupported: [] },
  { id: 'f_holiday', name: 'holiday_gift_guide_9×16.mp4', kind: 'video', format: 'MP4', duration: '0:35', durationSec: 35, sizeMb: 205, aspect: '9:16', resolution: '1080×1920', tone: 'berry', unsupported: [] },
  { id: 'f_packaging', name: 'packaging_unboxing.mp4', kind: 'video', format: 'MP4', duration: '0:51', durationSec: 51, sizeMb: 298, aspect: '9:16', resolution: '1080×1920', tone: 'studio', unsupported: [] },
  {
    id: 'f_founders',
    name: 'founders_qa_full.mp4',
    kind: 'video',
    format: 'MP4',
    duration: '12:48',
    durationSec: 768,
    sizeMb: 1840,
    aspect: '16:9',
    resolution: '1920×1080',
    tone: 'slate',
    unsupported: ['tiktok', 'instagram'],
    warning: 'Too long for TikTok & Reels',
  },
  { id: 'f_lena', name: 'lena_morning_routine.mp4', kind: 'video', format: 'MP4', duration: '0:58', durationSec: 58, sizeMb: 341, aspect: '9:16', resolution: '1080×1920', tone: 'forest', unsupported: [] },
  { id: 'f_store', name: 'store_opening_recap.mp4', kind: 'video', format: 'MP4', duration: '2:14', durationSec: 134, sizeMb: 512, aspect: '9:16', resolution: '1080×1920', tone: 'sunset', unsupported: [] },
  {
    id: 'f_seams',
    name: 'behind_the_seams_ep4.mp4',
    kind: 'video',
    format: 'MP4',
    duration: '8:36',
    durationSec: 516,
    sizeMb: 1210,
    aspect: '16:9',
    resolution: '1920×1080',
    tone: 'night',
    unsupported: ['tiktok', 'instagram'],
    warning: 'YouTube & Facebook only',
  },
  { id: 'f_casting', name: 'model_casting_reel.mp4', kind: 'video', format: 'MP4', duration: '1:24', durationSec: 84, sizeMb: 402, aspect: '9:16', resolution: '1080×1920', tone: 'ocean', unsupported: [] },
  { id: 'i_cover1', name: 'lookbook_cover_01.jpg', kind: 'image', format: 'JPG', sizeMb: 4.2, aspect: '4:5', resolution: '1080×1350', tone: 'sand', unsupported: ['youtube'] },
  { id: 'i_cover2', name: 'lookbook_cover_02.jpg', kind: 'image', format: 'JPG', sizeMb: 3.9, aspect: '4:5', resolution: '1080×1350', tone: 'berry', unsupported: ['youtube'] },
  { id: 'i_detail', name: 'knit_detail_closeup.jpg', kind: 'image', format: 'JPG', sizeMb: 5.1, aspect: '4:5', resolution: '1080×1350', tone: 'studio', unsupported: ['youtube'] },
  { id: 'i_flatlay', name: 'studio_flatlay.jpg', kind: 'image', format: 'JPG', sizeMb: 4.6, aspect: '1:1', resolution: '1080×1080', tone: 'forest', unsupported: ['youtube'] },
  { id: 'i_storefront', name: 'store_front_night.jpg', kind: 'image', format: 'JPG', sizeMb: 6.3, aspect: '4:5', resolution: '1080×1350', tone: 'night', unsupported: ['youtube'] },
  { id: 'i_team', name: 'team_photo_2025.jpg', kind: 'image', format: 'JPG', sizeMb: 7.8, aspect: '16:9', resolution: '1920×1080', tone: 'slate', unsupported: ['youtube'] },
]

let accountsDb: SocialAccount[] = [
  { id: 'tt_northwind', platform: 'tiktok', name: 'Northwind Studio', handle: '@northwind.studio', kind: 'Business', initials: 'NS', status: 'connected', audienceTz: 'America/New_York' },
  { id: 'tt_lena', platform: 'tiktok', name: 'Lena Ortiz', handle: '@lena.makes', kind: 'Creator', initials: 'LO', status: 'connecting', audienceTz: 'America/New_York' },
  { id: 'ig_northwind', platform: 'instagram', name: 'Northwind Studio', handle: '@northwind.studio', kind: 'Business', initials: 'NS', status: 'connected', audienceTz: 'America/New_York' },
  { id: 'ig_shop', platform: 'instagram', name: 'Northwind Shop', handle: '@northwind.shop', kind: 'Business', initials: 'SH', status: 'reauth', audienceTz: 'America/New_York' },
  { id: 'ig_lena', platform: 'instagram', name: 'Lena Ortiz', handle: '@lena.makes', kind: 'Creator', initials: 'LO', status: 'connected', audienceTz: 'America/Chicago' },
  { id: 'yt_northwind', platform: 'youtube', name: 'Northwind Studio', handle: '@northwindstudio', kind: 'Channel', initials: 'NS', status: 'connected', audienceTz: 'America/Los_Angeles' },
  { id: 'yt_archive', platform: 'youtube', name: 'Northwind Archive', handle: '@northwind-archive', kind: 'Brand channel', initials: 'NA', status: 'disconnected', audienceTz: 'America/Los_Angeles' },
  { id: 'fb_northwind', platform: 'facebook', name: 'Northwind Studio', handle: 'Page', kind: 'Page', initials: 'NS', status: 'connected', audienceTz: 'America/New_York' },
  { id: 'fb_outlet', platform: 'facebook', name: 'Northwind Outlet', handle: 'Page', kind: 'Page', initials: 'NO', status: 'reauth', audienceTz: 'America/New_York' },
]

/**
 * The Figma flow is set in the week of Thu, Nov 27 2025 (workspace time zone
 * America/New_York). Scheduling validation and the date picker use this
 * mock "now" so the designed dates stay schedulable.
 */
/** Lookup for media handed over from the Content Library (ids match `features/drive`). */
export const driveFileById = (id: string) => DRIVE_FILES.find((f) => f.id === id)

export const MOCK_NOW = new Date('2025-11-21T15:00:00Z')

/** "Best times from your analytics" (workspace time zone). */
export const BEST_TIMES: BestTime[] = [
  { date: '2025-11-27', minutes: 18 * 60, label: 'Thu 6:00 PM' },
  { date: '2025-11-28', minutes: 12 * 60 + 30, label: 'Fri 12:30 PM' },
  { date: '2025-11-29', minutes: 10 * 60, label: 'Sat 10:00 AM' },
]

/** Posts already on the calendar, by workspace-local date (minutes after midnight). */
export const EXISTING_POSTS: Record<string, number[]> = {
  '2025-11-24': [12 * 60],
  '2025-11-25': [9 * 60, 17 * 60],
  '2025-11-27': [9 * 60, 12 * 60 + 30],
  '2025-11-28': [16 * 60 + 30],
  '2025-12-01': [10 * 60],
}

let savedDraft: unknown = null

/* ── Queries ───────────────────────────────────────────────────────── */

export const driveFilesQueryOptions = queryOptions({
  queryKey: ['create-post', 'drive-files', 'content-2025'],
  queryFn: () => mockRequest(DRIVE_FILES),
  staleTime: 5 * 60_000,
})

export const accountsQueryOptions = queryOptions({
  queryKey: ['create-post', 'accounts'],
  queryFn: () => mockRequest(() => accountsDb),
})

/* ── Mutations ─────────────────────────────────────────────────────── */

/** Reconnect an account that needs reauthorization. Optimistically flips it to connected. */
export function useReconnectAccount() {
  const queryClient = useQueryClient()
  const key = accountsQueryOptions.queryKey
  return useMutation({
    mutationFn: (account: SocialAccount) =>
      mockRequest(() => {
        accountsDb = accountsDb.map((a) => (a.id === account.id ? { ...a, status: 'connected' as const } : a))
        return account
      }, { delay: 700 }),
    onMutate: async (account) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old) => old?.map((a) => (a.id === account.id ? { ...a, status: 'connected' as const } : a)))
      return { previous }
    },
    onError: (_err, _account, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
      toast.error('Couldn’t reconnect', { description: 'Please try again.', duration: Infinity })
    },
    onSuccess: (account) => toast.success('Account reconnected', { description: `${account.name} (${account.handle === 'Page' ? 'Facebook Page' : account.handle}) can publish again.` }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

/** Persist the in-progress draft (autosave and the explicit "Save draft" action). */
export function useSaveDraft() {
  return useMutation({
    mutationKey: ['create-post', 'save-draft'],
    mutationFn: ({ draft }: { draft: unknown; manual?: boolean }) =>
      mockRequest(() => {
        savedDraft = draft
        return true
      }, { delay: 400 }),
    onSuccess: (_ok, { manual }) => {
      if (manual) toast.success('Draft saved', { description: 'Pick up where you left off any time from Create post.' })
    },
    onError: (_err, { manual }) => {
      if (manual) toast.error('Couldn’t save draft', { description: 'Please try again.', duration: Infinity })
    },
  })
}

/** Creates one publishing job per target. */
export function useSchedulePosts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (result: ScheduleResult) =>
      mockRequest(() => {
        savedDraft = null
        return { ...result, jobs: result.jobs.map((j, i) => ({ ...j, id: `job_${Date.now().toString(36)}_${i}` })) }
      }, { delay: 900 }),
    onSuccess: (result) => {
      const n = result.jobs.length
      const noun = `${n} ${n === 1 ? 'post' : 'posts'}`
      if (result.mode === 'now') toast.success(`${noun} publishing`, { description: 'Track each target in Post Monitoring.' })
      else toast.success(`${noun} scheduled`, { description: `${result.title} is on the calendar.` })
      // Other screens read the same jobs from their own caches.
      void queryClient.invalidateQueries({ queryKey: ['overview'] })
      void queryClient.invalidateQueries({ queryKey: ['calendar'] })
      void queryClient.invalidateQueries({ queryKey: ['monitoring'] })
    },
    onError: () => toast.error('Couldn’t schedule posts', { description: 'Nothing was published. Please try again.', duration: Infinity }),
  })
}

/** For debugging in the console / future API swap. */
export const getSavedDraft = () => savedDraft
