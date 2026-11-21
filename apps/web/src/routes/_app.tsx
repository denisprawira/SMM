import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { sessionQueryOptions } from '@/features/session/api'

/** Pathless layout: sidebar / rail / bottom nav around every app page. */
export const Route = createFileRoute('/_app')({
  loader: ({ context }) => context.queryClient.ensureQueryData(sessionQueryOptions),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
