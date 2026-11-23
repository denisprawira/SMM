import { createFileRoute } from '@tanstack/react-router'
import { isPlatform, type ConnectSearch } from '@/features/accounts/api'
import { ConnectAccountDialog } from '@/features/accounts/connect-account-dialog'

/** Figma 06 "Connect Account (modal)" — rendered over the Social Accounts page. */
export const Route = createFileRoute('/_app/accounts/connect')({
  validateSearch: (search: Record<string, unknown>): ConnectSearch => ({
    platform: isPlatform(search.platform) ? search.platform : undefined,
  }),
  head: () => ({ meta: [{ title: 'Connect an account · Relay' }] }),
  component: ConnectAccountDialog,
})
