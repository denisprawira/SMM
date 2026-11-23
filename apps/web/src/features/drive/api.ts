import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mockRequest } from '@/lib/api'
import { childFolders, DRIVE_FILES, folderById, folderChain, folderPath, DRIVE_ROOT_ID, type DriveFile, type DriveFolder } from './data'
import { formatCount } from './format'

export type { DriveFile, DriveFolder } from './data'

export type DriveConnection = {
  connected: boolean
  email: string
  connectedSince: string
  /** Epoch ms of the last successful index sync. */
  lastSyncedAt: number
  autoSync: string
  scope: string
  /** Content folder — the Library lists media inside it and its subfolders. */
  folderId: string
  storage: { usedTb: number; totalTb: number; videosGb: number; imagesGb: number; otherGb: number }
  /** Scheduled posts whose media lives in this Drive (paused on disconnect). */
  scheduledPosts: number
}

export type DriveState = DriveConnection & { folder: DriveFolder & { path: string } }

/* ── Mock database ─────────────────────────────────────────────────── */

let connectionDb: DriveConnection = {
  connected: true,
  email: 'maya@northwind.studio',
  connectedSince: 'Sep 12, 2025',
  lastSyncedAt: Date.now() - 2 * 60_000,
  autoSync: 'Every 15 minutes',
  scope: 'Read-only (drive.readonly)',
  folderId: 'content-2025',
  storage: { usedTb: 1.24, totalTb: 2, videosGb: 864, imagesGb: 118, otherGb: 262 },
  scheduledPosts: 12,
}

function withFolder(c: DriveConnection): DriveState {
  const folder = folderById(c.folderId) ?? folderById('content-2025')!
  return { ...c, folder: { ...folder, path: folderPath(folder.id) } }
}

/* ── Formatting ────────────────────────────────────────────────────── */

/** `short` → "2 min ago", `long` → "2 minutes ago". */
export function syncedAgo(ts: number, style: 'short' | 'long' = 'short') {
  const min = Math.floor((Date.now() - ts) / 60_000)
  if (min < 1) return 'just now'
  if (style === 'short') return `${min} min ago`
  return `${min} ${min === 1 ? 'minute' : 'minutes'} ago`
}

export const fileTotal = (d: DriveState) => d.folder.counts.videos + d.folder.counts.images

/* ── Queries ───────────────────────────────────────────────────────── */

export const driveQueryOptions = queryOptions({
  queryKey: ['drive'],
  queryFn: () => mockRequest(() => withFolder(connectionDb), { delay: 200 }),
})

/** Virtual views in the Drive browser's left column (Icon/users, clock, sun). */
export const DRIVE_VIEWS = ['shared', 'recent', 'starred'] as const
export type DriveView = (typeof DRIVE_VIEWS)[number]

export type DriveListing = {
  id: string
  title: string
  /** Breadcrumb from My Drive; one entry for virtual views. */
  chain: { id: string; name: string }[]
  folders: DriveFolder[]
  files: DriveFile[]
}

const VIEW_TITLE: Record<DriveView, string> = { shared: 'Shared with me', recent: 'Recent', starred: 'Starred' }

function listing(id: string): DriveListing {
  if ((DRIVE_VIEWS as readonly string[]).includes(id)) {
    const view = id as DriveView
    const byDate = [...DRIVE_FILES].sort((a, b) => b.modified.localeCompare(a.modified))
    const files = view === 'recent' ? byDate.slice(0, 8) : view === 'starred' ? byDate.filter((f) => f.starred) : []
    return { id, title: VIEW_TITLE[view], chain: [{ id, name: VIEW_TITLE[view] }], folders: [], files }
  }
  const folder = folderById(id) ?? folderById(DRIVE_ROOT_ID)!
  return {
    id: folder.id,
    title: folder.name,
    chain: folderChain(folder.id).map(({ id: cid, name }) => ({ id: cid, name })),
    folders: childFolders(folder.id),
    files: DRIVE_FILES.filter((f) => f.folderId === folder.id),
  }
}

export const driveListingQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['drive', 'listing', id],
    queryFn: () => mockRequest(() => listing(id), { delay: 200 }),
  })

/* ── Mutations ─────────────────────────────────────────────────────── */

function useDriveCache() {
  const queryClient = useQueryClient()
  const patch = (fn: (d: DriveState) => DriveState) => queryClient.setQueryData<DriveState>(driveQueryOptions.queryKey, (old) => (old ? fn(old) : old))
  const snapshot = async () => {
    await queryClient.cancelQueries({ queryKey: driveQueryOptions.queryKey })
    return queryClient.getQueryData<DriveState>(driveQueryOptions.queryKey)
  }
  const restore = (prev?: DriveState) => prev && queryClient.setQueryData(driveQueryOptions.queryKey, prev)
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: ['drive'] }), queryClient.invalidateQueries({ queryKey: ['library'] })])
  return { patch, snapshot, restore, refresh }
}

const failToast = () => toast.error('Something went wrong', { description: 'Please try again.', duration: Infinity })

/** Danger zone → "Disconnect and pause N posts". Optimistic: the Library flips to the "not connected" state at once. */
export function useDisconnectDrive() {
  const cache = useDriveCache()
  return useMutation({
    mutationFn: () =>
      mockRequest(() => {
        connectionDb = { ...connectionDb, connected: false }
        return withFolder(connectionDb)
      }, { delay: 500 }),
    onMutate: async () => {
      const prev = await cache.snapshot()
      cache.patch((d) => ({ ...d, connected: false }))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      cache.restore(ctx?.prev)
      failToast()
    },
    onSuccess: (d) => toast.success('Google Drive disconnected', { description: `${d.scheduledPosts} scheduled posts are paused until you reconnect.` }),
    onSettled: cache.refresh,
  })
}

/** "Connect Google Drive" / "Reconnect Drive" — the OAuth round-trip, so not optimistic. */
export function useConnectDrive({ notify = true }: { notify?: boolean } = {}) {
  const cache = useDriveCache()
  return useMutation({
    mutationFn: () =>
      mockRequest(() => {
        connectionDb = { ...connectionDb, connected: true, lastSyncedAt: Date.now() }
        return withFolder(connectionDb)
      }, { delay: 900 }),
    onError: failToast,
    onSuccess: (d) => {
      cache.patch(() => d)
      if (notify) toast.success('Google Drive connected', { description: `Showing ${formatCount(fileTotal(d))} files from ${d.folder.path}.` })
    },
    onSettled: cache.refresh,
  })
}

/** "Refresh" — re-index the content folder now. */
export function useSyncDrive() {
  const cache = useDriveCache()
  return useMutation({
    mutationFn: () =>
      mockRequest(() => {
        connectionDb = { ...connectionDb, lastSyncedAt: Date.now() }
        return withFolder(connectionDb)
      }, { delay: 900 }),
    onError: failToast,
    onSuccess: (d) => {
      cache.patch(() => d)
      toast.success('Synced with Google Drive', { description: `${formatCount(fileTotal(d))} files · no changes since the last sync.` })
    },
    onSettled: cache.refresh,
  })
}

/** "Change folder" — point the Library at another Drive folder. Optimistic. */
export function useChangeDriveFolder() {
  const cache = useDriveCache()
  return useMutation({
    mutationFn: (folderId: string) =>
      mockRequest(() => {
        connectionDb = { ...connectionDb, folderId, lastSyncedAt: Date.now() }
        return withFolder(connectionDb)
      }, { delay: 500 }),
    onMutate: async (folderId) => {
      const prev = await cache.snapshot()
      const folder = folderById(folderId)
      if (folder) cache.patch((d) => ({ ...d, folderId, folder: { ...folder, path: folderPath(folderId) } }))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      cache.restore(ctx?.prev)
      failToast()
    },
    onSuccess: (d) => toast.success('Content folder updated', { description: `The Library now lists media in ${d.folder.path}.` }),
    onSettled: cache.refresh,
  })
}
