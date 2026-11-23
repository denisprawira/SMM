import { createFileRoute } from '@tanstack/react-router'
import { notificationsQueryOptions, profileQueryOptions, workspaceSettingsQueryOptions } from '@/features/settings/api'
import { ProfileSettingsPage } from '@/features/settings/profile-page'

export const Route = createFileRoute('/_app/settings/profile')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(profileQueryOptions),
      context.queryClient.ensureQueryData(notificationsQueryOptions),
      // The time zone select labels its first option with the workspace default.
      context.queryClient.ensureQueryData(workspaceSettingsQueryOptions),
    ]),
  head: () => ({ meta: [{ title: 'Profile & notifications · Settings · Relay' }] }),
  component: ProfileSettingsPage,
})
