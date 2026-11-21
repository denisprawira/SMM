import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/layout/route-states'
import { Topbar } from '@/components/layout/topbar'

export const Route = createFileRoute('/_app/accounts')({
  component: () => (
    <>
      <Topbar breadcrumb={[{ label: 'Social Accounts' }]} />
      <PagePlaceholder title="Social Accounts" />
    </>
  ),
})
