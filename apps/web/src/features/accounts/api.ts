import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/features/session/api'
import { mockRequest } from '@/lib/api'
import { PLATFORM_LABEL, type ConnectionStatus, type Platform } from '@/lib/types'

/* ── Types ─────────────────────────────────────────────────────────── */

/** Figma 05 group order. */
export const PLATFORMS = ['tiktok', 'instagram', 'facebook', 'youtube'] as const satisfies readonly Platform[]

export const isPlatform = (value: unknown): value is Platform => PLATFORMS.includes(value as Platform)

/** `/accounts` — `tab` is the platform filter; `demo=empty` previews the S03 "No accounts yet" state. */
export type AccountsSearch = { tab?: Platform; demo?: 'empty' }
/** `/accounts/connect` — `platform` is the option selected in the Connect modal. */
export type ConnectSearch = { platform?: Platform }

export type AccountType = 'Business' | 'Creator' | 'Page' | 'Channel' | 'Brand channel'

export type SocialAccount = {
  id: string
  platform: Platform
  name: string
  /** "@northwind.studio" or "facebook.com/northwindstudio". */
  handle: string
  initials: string
  status: ConnectionStatus
  accountType: AccountType
  /** "Last sync" value, e.g. "Synced 4 min ago", "Token expires in 2 days". */
  lastSync: string
  /** Token problems render the "Last sync" value in warning text. */
  lastSyncWarning?: boolean
  /** "182K followers", "58.9K subscribers", "—" while connecting. */
  audience: string
  /** A reconnect (re-auth) is in flight — card shows Connecting without a Cancel. */
  reconnecting?: boolean
  /** A manual refresh is in flight. */
  syncing?: boolean
}

/** How an account is named in sentences: the @handle when it has one, otherwise the Page / channel name. */
export const accountLabel = (a: Pick<SocialAccount, 'name' | 'handle'>) => (a.handle.startsWith('@') ? a.handle : a.name)

/** "@northwind.shop and Northwind Outlet", "a, b and c". */
export function joinLabels(labels: string[]) {
  if (labels.length <= 1) return labels[0] ?? ''
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/* ── Mock database ─────────────────────────────────────────────────── */

const SEED: SocialAccount[] = [
  { id: 'acc_tt_studio', platform: 'tiktok', name: 'Northwind Studio', handle: '@northwind.studio', initials: 'NS', status: 'connected', accountType: 'Business', lastSync: 'Synced 4 min ago', audience: '182K followers' },
  { id: 'acc_tt_lena', platform: 'tiktok', name: 'Lena Ortiz', handle: '@lena.makes', initials: 'LO', status: 'connecting', accountType: 'Creator', lastSync: 'Waiting for TikTok approval…', audience: '—' },
  { id: 'acc_ig_studio', platform: 'instagram', name: 'Northwind Studio', handle: '@northwind.studio', initials: 'NS', status: 'connected', accountType: 'Business', lastSync: 'Synced 4 min ago', audience: '96.4K followers' },
  { id: 'acc_ig_shop', platform: 'instagram', name: 'Northwind Shop', handle: '@northwind.shop', initials: 'SH', status: 'reauth', accountType: 'Business', lastSync: 'Token expires in 2 days', lastSyncWarning: true, audience: '24.1K followers' },
  { id: 'acc_ig_lena', platform: 'instagram', name: 'Lena Ortiz', handle: '@lena.makes', initials: 'LO', status: 'connected', accountType: 'Creator', lastSync: 'Synced 11 min ago', audience: '38.7K followers' },
  { id: 'acc_fb_studio', platform: 'facebook', name: 'Northwind Studio', handle: 'facebook.com/northwindstudio', initials: 'NS', status: 'connected', accountType: 'Page', lastSync: 'Synced 6 min ago', audience: '41.2K followers' },
  { id: 'acc_fb_outlet', platform: 'facebook', name: 'Northwind Outlet', handle: 'facebook.com/northwindoutlet', initials: 'NO', status: 'reauth', accountType: 'Page', lastSync: 'Token expired Nov 18', lastSyncWarning: true, audience: '8.9K followers' },
  { id: 'acc_yt_studio', platform: 'youtube', name: 'Northwind Studio', handle: '@northwindstudio', initials: 'NS', status: 'connected', accountType: 'Channel', lastSync: 'Synced 9 min ago', audience: '58.9K subscribers' },
  { id: 'acc_yt_archive', platform: 'youtube', name: 'Northwind Archive', handle: '@northwind-archive', initials: 'NA', status: 'disconnected', accountType: 'Brand channel', lastSync: 'Disconnected by Maya · Nov 2', audience: '3.2K subscribers' },
]

let accountsDb: SocialAccount[] = structuredClone(SEED)

/** Accounts the simulated OAuth popup "signs in" as, per platform (first one not connected yet wins). */
const OAUTH_POOL: Record<Platform, Pick<SocialAccount, 'name' | 'handle' | 'initials' | 'accountType' | 'audience'>[]> = {
  tiktok: [
    { name: 'Northwind Shop', handle: '@northwind.shop', initials: 'SH', accountType: 'Business', audience: '12.4K followers' },
    { name: 'Northwind Outlet', handle: '@northwind.outlet', initials: 'NO', accountType: 'Business', audience: '6.8K followers' },
  ],
  instagram: [
    { name: 'Northwind Lookbook', handle: '@northwind.lookbook', initials: 'LB', accountType: 'Creator', audience: '8.2K followers' },
    { name: 'Northwind Outlet', handle: '@northwind.outlet', initials: 'NO', accountType: 'Business', audience: '5.6K followers' },
  ],
  facebook: [
    { name: 'Northwind Shop', handle: 'facebook.com/northwindshop', initials: 'SH', accountType: 'Page', audience: '15.3K followers' },
    { name: 'Lena Ortiz', handle: 'facebook.com/lenamakes', initials: 'LO', accountType: 'Page', audience: '3.1K followers' },
  ],
  youtube: [
    { name: 'Lena Ortiz', handle: '@lenamakes', initials: 'LO', accountType: 'Channel', audience: '21.7K subscribers' },
    { name: 'Northwind Shorts', handle: '@northwind-shorts', initials: 'NS', accountType: 'Brand channel', audience: '4.4K subscribers' },
  ],
}

function pickOAuthIdentity(platform: Platform, existing: SocialAccount[]) {
  const taken = new Set(existing.filter((a) => a.platform === platform).map((a) => a.handle))
  const free = OAUTH_POOL[platform].find((p) => !taken.has(p.handle))
  if (free) return free
  const base = OAUTH_POOL[platform][0]
  const n = taken.size + 1
  return { ...base, name: `${base.name} ${n}`, handle: `${base.handle}${n}` }
}

let emptyDemoApplied = false
/** `?demo=empty`: start this page load from a workspace with nothing connected (Figma S03). One-shot. */
export function applyEmptyDemo() {
  if (emptyDemoApplied) return false
  emptyDemoApplied = true
  accountsDb = []
  return true
}

function patchDb(ids: string[], patch: (a: SocialAccount) => Partial<SocialAccount>) {
  accountsDb = accountsDb.map((a) => (ids.includes(a.id) ? { ...a, ...patch(a) } : a))
}

/* ── Queries ───────────────────────────────────────────────────────── */

export const accountsQueryOptions = queryOptions({
  queryKey: ['accounts'],
  queryFn: () => mockRequest(() => accountsDb),
})

const KEY = accountsQueryOptions.queryKey

/** Shared optimistic plumbing: cancel in-flight reads, snapshot, apply `update`, roll back on error. */
function useOptimisticAccounts() {
  const queryClient = useQueryClient()
  return {
    queryClient,
    async apply(update: (accounts: SocialAccount[]) => SocialAccount[]) {
      await queryClient.cancelQueries({ queryKey: KEY })
      const snapshot = queryClient.getQueryData(KEY)
      queryClient.setQueryData(KEY, (old) => (old ? update(old) : old))
      return { snapshot }
    },
    set(update: (accounts: SocialAccount[]) => SocialAccount[]) {
      queryClient.setQueryData(KEY, (old) => (old ? update(old) : old))
    },
    rollback(ctx: { snapshot?: SocialAccount[] } | undefined) {
      if (ctx?.snapshot) queryClient.setQueryData(KEY, ctx.snapshot)
    },
    invalidate: () => queryClient.invalidateQueries({ queryKey: KEY }),
  }
}

const patchList = (ids: string[], patch: (a: SocialAccount) => Partial<SocialAccount>) => (list: SocialAccount[]) =>
  list.map((a) => (ids.includes(a.id) ? { ...a, ...patch(a) } : a))

const somethingWentWrong = () => toast.error('Something went wrong', { description: 'Please try again.', duration: Infinity })

/* ── Connect (simulated OAuth) ─────────────────────────────────────── */

class ConnectionCancelledError extends Error {}

/** How long the simulated OAuth popup takes before the platform "approves" access. */
export const OAUTH_DELAY = 2400

export function newConnectionId() {
  return `acc_${Date.now().toString(36)}`
}

function pendingAccount(platform: Platform, id: string, existing: SocialAccount[]): SocialAccount {
  return {
    id,
    platform,
    ...pickOAuthIdentity(platform, existing),
    status: 'connecting',
    lastSync: `Waiting for ${PLATFORM_LABEL[platform]} approval…`,
    audience: '—',
  }
}

/**
 * Starts an OAuth connection. Optimistically adds a "Connecting" card, then
 * swaps it for the connected account (or drops it if the user cancels).
 */
export function useConnectAccount() {
  const o = useOptimisticAccounts()
  return useMutation({
    mutationFn: async ({ platform, id }: { platform: Platform; id: string }) => {
      // The backend records the pending OAuth session right away, so refetches keep the card.
      if (!accountsDb.some((a) => a.id === id)) accountsDb = [...accountsDb, pendingAccount(platform, id, accountsDb)]
      return mockRequest(() => {
        const pending = accountsDb.find((a) => a.id === id)
        if (!pending) throw new ConnectionCancelledError()
        const account: SocialAccount = { ...pending, status: 'connected', lastSync: 'Synced just now', audience: pickAudience(pending) }
        accountsDb = accountsDb.map((a) => (a.id === id ? account : a))
        return account
      }, { delay: OAUTH_DELAY })
    },
    onMutate: ({ platform, id }) => o.apply((list) => (list.some((a) => a.id === id) ? list : [...list, pendingAccount(platform, id, list)])),
    onError: (err, _vars, ctx) => {
      if (err instanceof ConnectionCancelledError) return
      o.rollback(ctx)
      toast.error('Couldn’t connect the account', { description: 'The platform didn’t approve access. Please try again.', duration: Infinity })
    },
    onSuccess: (account) => {
      o.set((list) => list.map((a) => (a.id === account.id ? account : a)))
      toast.success(`${PLATFORM_LABEL[account.platform]} account connected`, { description: `${accountLabel(account)} is ready to publish.` })
    },
    onSettled: o.invalidate,
  })
}

function pickAudience(account: SocialAccount) {
  return OAUTH_POOL[account.platform].find((p) => p.handle === account.handle)?.audience ?? (account.platform === 'youtube' ? '0 subscribers' : '0 followers')
}

/** Cancel a connection that is still waiting for the platform (Figma: "Cancel" on a Connecting card). */
export function useCancelConnection() {
  const o = useOptimisticAccounts()
  return useMutation({
    mutationFn: (account: SocialAccount) =>
      mockRequest(() => {
        accountsDb = accountsDb.filter((a) => a.id !== account.id)
        return account
      }),
    onMutate: (account) => o.apply((list) => list.filter((a) => a.id !== account.id)),
    onError: (_err, _account, ctx) => {
      o.rollback(ctx)
      somethingWentWrong()
    },
    onSuccess: (account) => toast.info('Connection cancelled', { description: `${PLATFORM_LABEL[account.platform]} sign-in for ${accountLabel(account)} was cancelled.` }),
    onSettled: o.invalidate,
  })
}

/* ── Reconnect / refresh / disconnect / remove ─────────────────────── */

/** Re-runs OAuth for one or more accounts (Reconnect, Reconnect all). */
export function useReconnectAccounts() {
  const o = useOptimisticAccounts()
  const reconnecting = (a: SocialAccount): Partial<SocialAccount> => ({ status: 'connecting', reconnecting: true, lastSync: `Waiting for ${PLATFORM_LABEL[a.platform]} approval…`, lastSyncWarning: false })
  return useMutation({
    mutationFn: async (accounts: SocialAccount[]) => {
      const ids = accounts.map((a) => a.id)
      patchDb(ids, reconnecting)
      return mockRequest(() => {
        patchDb(ids, () => ({ status: 'connected', reconnecting: false, lastSync: 'Synced just now', lastSyncWarning: false }))
        return accounts
      }, { delay: 1500 })
    },
    onMutate: (accounts) => o.apply(patchList(accounts.map((a) => a.id), reconnecting)),
    onError: (_err, accounts, ctx) => {
      // Put the server back too — the popup failed, nothing changed.
      accounts.forEach((prev) => patchDb([prev.id], () => prev))
      o.rollback(ctx)
      somethingWentWrong()
    },
    onSuccess: (accounts) => {
      if (accounts.length === 1) {
        const [a] = accounts
        const wasBroken = a.status === 'reauth' || a.status === 'disconnected'
        toast.success('Account reconnected', { description: wasBroken ? `${accountLabel(a)} is publishing again.` : `${accountLabel(a)} has a fresh access token.` })
      } else {
        toast.success(`${accounts.length} accounts reconnected`, { description: 'Scheduled posts will publish as planned.' })
      }
    },
    onSettled: o.invalidate,
  })
}

/** Pull fresh profile + audience data for connected accounts (row "Refresh", header "Refresh all"). */
export function useRefreshAccounts() {
  const o = useOptimisticAccounts()
  return useMutation({
    mutationFn: async (accounts: SocialAccount[]) => {
      const ids = accounts.map((a) => a.id)
      patchDb(ids, () => ({ syncing: true, lastSync: 'Syncing…' }))
      return mockRequest(() => {
        patchDb(ids, () => ({ syncing: false, lastSync: 'Synced just now' }))
        return accounts
      }, { delay: 900 })
    },
    onMutate: (accounts) => o.apply(patchList(accounts.map((a) => a.id), () => ({ syncing: true, lastSync: 'Syncing…' }))),
    onError: (_err, accounts, ctx) => {
      accounts.forEach((prev) => patchDb([prev.id], () => prev))
      o.rollback(ctx)
      somethingWentWrong()
    },
    onSuccess: (accounts) =>
      accounts.length === 1
        ? toast.success('Account refreshed', { description: `${accountLabel(accounts[0])} synced just now.` })
        : toast.success('Accounts refreshed', { description: `${accounts.length} connected accounts synced just now.` }),
    onSettled: o.invalidate,
  })
}

export function useDisconnectAccount() {
  const o = useOptimisticAccounts()
  const session = useSession()
  const disconnected = (): Partial<SocialAccount> => ({
    status: 'disconnected',
    reconnecting: false,
    syncing: false,
    lastSync: `Disconnected by ${session.user.firstName} · ${today()}`,
    lastSyncWarning: false,
  })
  return useMutation({
    mutationFn: (account: SocialAccount) =>
      mockRequest(() => {
        patchDb([account.id], disconnected)
        return account
      }, { delay: 500 }),
    onMutate: (account) => o.apply(patchList([account.id], disconnected)),
    onError: (_err, _account, ctx) => {
      o.rollback(ctx)
      somethingWentWrong()
    },
    onSuccess: (account) => toast.success('Account disconnected', { description: `Posts scheduled to ${accountLabel(account)} are paused until you reconnect.` }),
    onSettled: o.invalidate,
  })
}

/** Remove a disconnected account from the workspace. */
export function useRemoveAccount() {
  const o = useOptimisticAccounts()
  const session = useSession()
  return useMutation({
    mutationFn: (account: SocialAccount) =>
      mockRequest(() => {
        accountsDb = accountsDb.filter((a) => a.id !== account.id)
        return account
      }, { delay: 500 }),
    onMutate: (account) => o.apply((list) => list.filter((a) => a.id !== account.id)),
    onError: (_err, _account, ctx) => {
      o.rollback(ctx)
      somethingWentWrong()
    },
    onSuccess: (account) => toast.success('Account removed', { description: `${accountLabel(account)} was removed from ${session.workspace.name}.` }),
    onSettled: o.invalidate,
  })
}
