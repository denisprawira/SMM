import { createFileRoute } from '@tanstack/react-router'
import { teamQueryOptions, workspaceSettingsQueryOptions } from '@/features/settings/api'
import { WorkspaceSettingsPage } from '@/features/settings/workspace-page'

export const Route = createFileRoute('/_app/settings/')({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(workspaceSettingsQueryOptions), context.queryClient.ensureQueryData(teamQueryOptions)]),
  head: () => ({ meta: [{ title: 'Workspace & team · Settings · Relay' }] }),
  component: WorkspaceSettingsPage,
})
