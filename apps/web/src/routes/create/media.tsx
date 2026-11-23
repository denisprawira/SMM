import { createFileRoute } from '@tanstack/react-router'
import { MEDIA_TYPES, type MediaSearch, type MediaType } from '@/features/create-post/model'
import { MediaStep } from '@/features/create-post/steps/media-step'

export const Route = createFileRoute('/create/media')({
  validateSearch: (search: Record<string, unknown>): MediaSearch => ({
    type: MEDIA_TYPES.includes(search.type as MediaType) && search.type !== 'videos' ? (search.type as MediaType) : undefined,
    q: typeof search.q === 'string' && search.q.trim() ? search.q : undefined,
  }),
  head: () => ({ meta: [{ title: 'Select media · Create post · Relay' }] }),
  component: MediaStep,
})
