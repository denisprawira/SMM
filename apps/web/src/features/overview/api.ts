import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui'
import { mockRequest } from '@/lib/api'
import type { Platform, ThumbnailTone } from '@/lib/types'

export const OVERVIEW_RANGES = ['7d', '30d', '90d'] as const
export type OverviewRange = (typeof OVERVIEW_RANGES)[number]
export type OverviewSearch = { range?: OverviewRange; account?: string }

export type AttentionItem = {
  id: string
  /** `failed` = publish job failed; `reauth` = account token expiring/expired. */
  kind: 'failed' | 'reauth'
  platform: Platform
  title: string
  /** "TikTok · @northwind.studio" */
  context: string
  reason: string
  action: 'retry' | 'details' | 'reconnect'
}

export type PostSummary = {
  id: string
  title: string
  when: string
  /** Compact date for mobile, e.g. "Sat · 12:00 PM". */
  whenShort: string
  tone: ThumbnailTone
  platforms: Platform[]
}

export type OverviewData = {
  metrics: {
    published: { value: number; delta: number }
    scheduled: { value: number; nextAt: string; nextLabel: string }
    attention: { failed: number; reauth: number }
    views: { value: string; deltaPct: number }
    engagement: { value: string; deltaPct: number }
    engagementRate: { value: number; deltaPt: number }
  }
  platformSplit: { platform: Platform; value: string; deltaPct: number }[]
  attention: AttentionItem[]
  upcoming: PostSummary[]
  recent: (PostSummary & { meta: string })[]
}

export const ACCOUNT_OPTIONS = [
  { value: 'all', label: 'All accounts' },
  { value: 'northwind.studio', label: '@northwind.studio' },
  { value: 'northwind.shop', label: '@northwind.shop' },
  { value: 'northwind-yt', label: 'Northwind Studio (YouTube)' },
] as const

/* ── Mock database ─────────────────────────────────────────────────── */

let attentionDb: AttentionItem[] = [
  { id: 'job_8f21c', kind: 'failed', platform: 'tiktok', title: 'Spring drop teaser', context: 'TikTok · @northwind.studio', reason: 'Video exceeds 10 min limit', action: 'retry' },
  { id: 'job_7d104', kind: 'failed', platform: 'youtube', title: 'Behind the seams ep. 4', context: 'YouTube · Northwind Studio', reason: 'Daily upload quota exceeded', action: 'retry' },
  { id: 'job_6a9e2', kind: 'failed', platform: 'facebook', title: 'Store opening recap', context: 'Facebook · Northwind Studio', reason: 'Page permission revoked', action: 'details' },
  { id: 'acc_ig_shop', kind: 'reauth', platform: 'instagram', title: '@northwind.shop', context: 'Instagram · token expires in 2 days', reason: 'Token expires in 2 days', action: 'reconnect' },
  { id: 'acc_fb_outlet', kind: 'reauth', platform: 'facebook', title: 'Northwind Outlet', context: 'Facebook Page · token expired', reason: 'Token expired', action: 'reconnect' },
]

function buildOverview(): OverviewData {
  const failed = attentionDb.filter((a) => a.kind === 'failed').length
  const reauth = attentionDb.filter((a) => a.kind === 'reauth').length
  return {
    metrics: {
      published: { value: 148, delta: 18 },
      scheduled: { value: 36, nextAt: '4:30 PM', nextLabel: 'today at 4:30 PM' },
      attention: { failed, reauth },
      views: { value: '1.28M', deltaPct: 12.4 },
      engagement: { value: '86.4K', deltaPct: 8.1 },
      engagementRate: { value: 6.8, deltaPt: 0.4 },
    },
    platformSplit: [
      { platform: 'tiktok', value: '612K', deltaPct: 21 },
      { platform: 'instagram', value: '384K', deltaPct: 9 },
      { platform: 'youtube', value: '198K', deltaPct: 4 },
      { platform: 'facebook', value: '86K', deltaPct: -6 },
    ],
    attention: attentionDb,
    upcoming: [
      { id: 'p1', title: 'Autumn lookbook reel', when: 'Today · 4:30 PM', whenShort: 'Today · 4:30 PM', tone: 'sunset', platforms: ['instagram', 'tiktok'] },
      { id: 'p2', title: 'Studio tour — 60s cut', when: 'Tomorrow · 9:00 AM', whenShort: 'Tomorrow · 9:00 AM', tone: 'ocean', platforms: ['youtube', 'facebook'] },
      { id: 'p3', title: 'Fabric care tips #3', when: 'Sat, Nov 23 · 12:00 PM', whenShort: 'Sat · 12:00 PM', tone: 'sand', platforms: ['tiktok'] },
      { id: 'p4', title: 'Holiday gift guide', when: 'Mon, Nov 25 · 6:00 PM', whenShort: 'Mon · 6:00 PM', tone: 'berry', platforms: ['instagram', 'facebook', 'tiktok'] },
    ],
    recent: [
      { id: 'r1', title: 'Morning routine with Lena', when: '2h ago', whenShort: '2h ago', meta: '2h ago · 18.2K views', tone: 'forest', platforms: ['tiktok', 'instagram'] },
      { id: 'r2', title: 'New collection — night shoot', when: '5h ago', whenShort: '5h ago', meta: '5h ago · 9.4K views', tone: 'night', platforms: ['youtube'] },
      { id: 'r3', title: 'Packaging unboxing', when: '8h ago', whenShort: '8h ago', meta: '8h ago · 3.1K views', tone: 'studio', platforms: ['instagram', 'facebook'] },
      { id: 'r4', title: 'Q&A with the founders', when: 'Yesterday', whenShort: 'Yesterday', meta: 'Yesterday · 12.7K views', tone: 'slate', platforms: ['youtube', 'tiktok'] },
    ],
  }
}

/* ── Queries & mutations ───────────────────────────────────────────── */

export const overviewQueryOptions = ({ range = '30d', account = 'all' }: OverviewSearch) =>
  queryOptions({
    queryKey: ['overview', { range, account }],
    queryFn: () => mockRequest(buildOverview),
  })

const ACTION_COPY: Record<AttentionItem['action'], { title: string; description: (item: AttentionItem) => string }> = {
  retry: { title: 'Retry queued', description: (i) => `${i.title} will be re-sent to ${i.context.split(' · ')[0]}.` },
  details: { title: 'Opened in Post Monitoring', description: (i) => i.reason },
  reconnect: { title: 'Account reconnected', description: (i) => `${i.title} is publishing again.` },
}

/** Retry / Reconnect from the "Needs attention" list. Optimistically removes the row. */
export function useResolveAttention() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (item: AttentionItem) =>
      mockRequest(() => {
        attentionDb = attentionDb.filter((a) => a.id !== item.id)
        return item
      }, { delay: 600 }),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: ['overview'] })
      const snapshots = queryClient.getQueriesData<OverviewData>({ queryKey: ['overview'] })
      queryClient.setQueriesData<OverviewData>({ queryKey: ['overview'] }, (old) =>
        old ? { ...old, attention: old.attention.filter((a) => a.id !== item.id) } : old,
      )
      return { snapshots }
    },
    onError: (_err, _item, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.error('Something went wrong', 'Please try again.')
    },
    onSuccess: (item) => {
      const copy = ACTION_COPY[item.action]
      toast.success(copy.title, copy.description(item))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['overview'] }),
  })
}
