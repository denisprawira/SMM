import { createFileRoute } from '@tanstack/react-router'
import { driveQueryOptions } from '@/features/drive/api'
import { DrivePage } from '@/features/drive/drive-page'

export const Route = createFileRoute('/_app/settings/integrations/drive')({
  loader: ({ context }) => context.queryClient.ensureQueryData(driveQueryOptions),
  head: () => ({ meta: [{ title: 'Google Drive · Settings · Relay' }] }),
  component: DrivePage,
})
