import { createFileRoute, redirect } from '@tanstack/react-router'
import { draftStore } from '@/features/create-post/draft-store'
import { firstBlockingStep, STEPS, stepIndex } from '@/features/create-post/model'

/** `/create` resumes the draft at the first step that still needs input. */
export const Route = createFileRoute('/create/')({
  beforeLoad: () => {
    const step = firstBlockingStep(draftStore.get(), 'review')
    throw redirect({ to: step === 'review' ? '/create/media' : STEPS[stepIndex(step)].to, replace: true })
  },
})
