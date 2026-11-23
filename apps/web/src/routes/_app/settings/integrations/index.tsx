import { createFileRoute } from '@tanstack/react-router'
import { integrationsQueryOptions } from '@/features/settings/api'
import { IntegrationsSettingsPage } from '@/features/settings/integrations-page'

export const Route = createFileRoute('/_app/settings/integrations/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(integrationsQueryOptions),
  head: () => ({ meta: [{ title: 'Social platforms · Settings · Relay' }] }),
  component: IntegrationsSettingsPage,
})
