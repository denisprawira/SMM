import { createFileRoute } from '@tanstack/react-router'
import { accountsQueryOptions, driveFilesQueryOptions } from '@/features/create-post/api'
import { CreatePostLayout } from '@/features/create-post/flow-layout'

/** Full-screen Create Post flow (no app sidebar); each step is a child route. */
export const Route = createFileRoute('/create')({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(driveFilesQueryOptions), context.queryClient.ensureQueryData(accountsQueryOptions)]),
  head: () => ({ meta: [{ title: 'Create post · Relay' }] }),
  component: CreatePostLayout,
})
