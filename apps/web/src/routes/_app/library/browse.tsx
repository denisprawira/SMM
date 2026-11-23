import { createFileRoute, redirect } from '@tanstack/react-router'
import { driveListingQueryOptions, driveQueryOptions } from '@/features/drive/api'
import { BrowseDriveDialog, DEFAULT_BROWSE_FOLDER } from '@/features/library/browse/browse-dialog'

/** Drive browser modal, rendered into the Library's <Outlet/>. `folder` = Drive folder id or shared / recent / starred. */
export const Route = createFileRoute('/_app/library/browse')({
  validateSearch: (search: Record<string, unknown>): { folder?: string } => ({
    folder: typeof search.folder === 'string' && search.folder !== DEFAULT_BROWSE_FOLDER ? search.folder : undefined,
  }),
  loaderDeps: ({ search }) => ({ folder: search.folder ?? DEFAULT_BROWSE_FOLDER }),
  loader: async ({ context, deps }) => {
    const drive = await context.queryClient.ensureQueryData(driveQueryOptions)
    if (!drive.connected) throw redirect({ to: '/library' })
    await context.queryClient.ensureQueryData(driveListingQueryOptions(deps.folder))
  },
  pendingComponent: () => null,
  head: () => ({ meta: [{ title: 'Browse Google Drive · Relay' }] }),
  component: BrowseDriveDialog,
})
