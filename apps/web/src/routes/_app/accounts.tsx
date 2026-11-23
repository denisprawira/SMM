import { createFileRoute } from '@tanstack/react-router'
import { accountsQueryOptions, applyEmptyDemo, isPlatform, type AccountsSearch } from '@/features/accounts/api'
import { AccountsPage } from '@/features/accounts/accounts-page'

/** Figma 05 "Social Accounts — Desktop". Child route `/accounts/connect` renders the Connect modal into the page's <Outlet/>. */
export const Route = createFileRoute('/_app/accounts')({
  validateSearch: (search: Record<string, unknown>): AccountsSearch => ({
    tab: isPlatform(search.tab) ? search.tab : undefined,
    demo: search.demo === 'empty' ? 'empty' : undefined,
  }),
  // The platform tab filters client-side; only the demo switch affects what is loaded.
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: ({ context, deps }) => {
    if (deps.demo === 'empty' && applyEmptyDemo()) context.queryClient.removeQueries({ queryKey: accountsQueryOptions.queryKey })
    return context.queryClient.ensureQueryData(accountsQueryOptions)
  },
  head: () => ({ meta: [{ title: 'Social Accounts · Relay' }] }),
  component: AccountsPage,
})
