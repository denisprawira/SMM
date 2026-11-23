import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Outlet } from '@tanstack/react-router'
import { Plus, RefreshCw, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { Banner } from '@/components/banner'
import { Topbar } from '@/components/layout/topbar'
import { PageContent, PageHeader } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import { accountLabel, accountsQueryOptions, isPlatform, joinLabels, PLATFORMS, useReconnectAccounts, useRefreshAccounts, type SocialAccount } from './api'
import { ConnectLink } from './components/connect-link'
import { NoAccounts } from './components/no-accounts'
import { PlatformGroup } from './components/platform-group'

const route = getRouteApi('/_app/accounts')

export function AccountsPage() {
  const { tab, demo } = route.useSearch()
  const navigate = route.useNavigate()
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions)

  // `?demo=empty` has been applied by the loader; drop it so the URL is plain /accounts again.
  useEffect(() => {
    if (demo) void navigate({ search: (prev) => ({ ...prev, demo: undefined }), replace: true })
  }, [demo, navigate])

  const empty = accounts.length === 0

  return (
    <>
      <Topbar breadcrumb={[{ label: 'Social Accounts' }]} />
      <PageContent className={cn(empty && 'flex-1')}>
        <PageHeader
          title="Social Accounts"
          description="Connect several accounts per platform. Relay publishes through each platform’s official API."
          actions={empty ? undefined : <HeaderActions accounts={accounts} />}
        />
        {empty ? (
          // Figma S03: the container sits 20px under the header (page gap is 24) and fills the rest of the page.
          <NoAccounts className="flex-1 md:-mt-1" />
        ) : (
          <AccountsList
            accounts={accounts}
            tab={tab}
            onTabChange={(value) => navigate({ search: (prev) => ({ ...prev, tab: isPlatform(value) ? value : undefined }), replace: true, resetScroll: false })}
          />
        )}
      </PageContent>
      {/* `/accounts/connect` renders the Connect modal here. */}
      <Outlet />
    </>
  )
}

function HeaderActions({ accounts }: { accounts: SocialAccount[] }) {
  const refresh = useRefreshAccounts()
  const refreshable = accounts.filter((a) => a.status === 'connected' && !a.syncing)
  return (
    <div className="flex w-full gap-3 md:w-auto">
      <Button variant="outline" className="flex-1 md:flex-none" disabled={refresh.isPending || refreshable.length === 0} onClick={() => refresh.mutate(refreshable)}>
        <RefreshCw className={cn(refresh.isPending && 'animate-spin')} />
        Refresh all
      </Button>
      <Button asChild className="flex-1 md:flex-none">
        <ConnectLink>
          <Plus />
          Connect account
        </ConnectLink>
      </Button>
    </div>
  )
}

function AccountsList({ accounts, tab, onTabChange }: { accounts: SocialAccount[]; tab?: Platform; onTabChange: (value: string) => void }) {
  const value = tab ?? 'all'
  const byPlatform = (p: Platform) => accounts.filter((a) => a.platform === p)
  // "All" lists platforms that have accounts; a platform's own tab shows it even when empty (with a Connect tile).
  const platforms = tab ? [tab] : PLATFORMS.filter((p) => byPlatform(p).length > 0)
  const tabs = [{ value: 'all', label: 'All', count: accounts.length }, ...PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABEL[p], count: byPlatform(p).length }))]

  return (
    <Tabs value={value} onValueChange={onTabChange} className="gap-6">
      {/* Scrolls sideways on narrow screens; the list keeps its full-width rule. */}
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList variant="line" aria-label="Platform" className="min-w-max">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {/* Figma tab label is "All  9" — name and count in one run, two spaces apart. */}
              {`${t.label}  ${t.count}`}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent value={value} className="flex flex-col gap-6">
        <ReauthBanner accounts={accounts} />
        {platforms.map((p) => (
          <PlatformGroup key={p} platform={p} accounts={byPlatform(p)} />
        ))}
      </TabsContent>
    </Tabs>
  )
}

/** Figma 05 "Banner/warning": accounts whose token is expiring or expired. */
function ReauthBanner({ accounts }: { accounts: SocialAccount[] }) {
  const reconnect = useReconnectAccounts()
  const needsReauth = accounts.filter((a) => a.status === 'reauth')
  if (needsReauth.length === 0) return null
  const n = needsReauth.length
  return (
    <Banner
      // Mobile: the button drops under the text (indented past the icon) instead of squeezing it.
      className="max-md:flex-wrap max-md:items-start max-md:[&>div:last-child]:pl-[30px] max-md:[&>div:nth-child(2)]:basis-[calc(100%-30px)]"
      tone="warning"
      icon={TriangleAlert}
      title={`${n} ${n === 1 ? 'account needs' : 'accounts need'} reauthorization`}
      description={`Posts scheduled to ${joinLabels(needsReauth.map(accountLabel))} will fail until you reconnect ${n === 1 ? 'it' : 'them'}.`}
      action={
        <Button variant="outline" size="sm" disabled={reconnect.isPending} onClick={() => reconnect.mutate(needsReauth)}>
          <RefreshCw />
          {n === 1 ? 'Reconnect' : 'Reconnect all'}
        </Button>
      }
    />
  )
}
