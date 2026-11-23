import { createFileRoute } from '@tanstack/react-router'
import { guardStep } from '@/features/create-post/model'
import { ReviewStep } from '@/features/create-post/steps/review-step'

export const Route = createFileRoute('/create/review')({
  beforeLoad: () => guardStep('review'),
  head: () => ({ meta: [{ title: 'Review · Create post · Relay' }] }),
  component: ReviewStep,
})
