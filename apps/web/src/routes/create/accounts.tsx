import { createFileRoute } from '@tanstack/react-router'
import { guardStep } from '@/features/create-post/model'
import { AccountsStep } from '@/features/create-post/steps/accounts-step'

export const Route = createFileRoute('/create/accounts')({
  beforeLoad: () => guardStep('accounts'),
  head: () => ({ meta: [{ title: 'Choose accounts · Create post · Relay' }] }),
  component: AccountsStep,
})
