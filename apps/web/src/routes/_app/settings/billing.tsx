import { createFileRoute } from '@tanstack/react-router'
import { BillingSettingsPage } from '@/features/settings/billing-page'

export const Route = createFileRoute('/_app/settings/billing')({
  head: () => ({ meta: [{ title: 'Billing · Settings · Relay' }] }),
  component: BillingSettingsPage,
})
