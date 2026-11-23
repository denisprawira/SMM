import { createFileRoute } from '@tanstack/react-router'
import { driveQueryOptions } from '@/features/drive/api'
import { libraryFilesQueryOptions, validateLibrarySearch } from '@/features/library/api'
import { LibraryPending } from '@/features/library/components/library-states'
import { LibraryPage } from '@/features/library/library-page'

export const Route = createFileRoute('/_app/library')({
  // Search, filters, sort and view live in the URL; filtering is client-side over the indexed listing.
  validateSearch: validateLibrarySearch,
  loader: async ({ context }) => {
    const drive = await context.queryClient.ensureQueryData(driveQueryOptions)
    if (drive.connected) await context.queryClient.ensureQueryData(libraryFilesQueryOptions(drive.folderId))
  },
  pendingComponent: LibraryPending,
  pendingMs: 150,
  pendingMinMs: 400,
  head: () => ({ meta: [{ title: 'Content Library · Relay' }] }),
  component: LibraryPage,
})
