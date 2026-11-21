import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/layout/route-states'

/** Full-screen Create Post flow (no app sidebar). */
export const Route = createFileRoute('/create')({
  component: () => (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <PagePlaceholder title="Create post" />
    </div>
  ),
})
