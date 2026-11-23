import { createFileRoute } from '@tanstack/react-router'
import { guardStep } from '@/features/create-post/model'
import { ScheduleStep } from '@/features/create-post/steps/schedule-step'

export const Route = createFileRoute('/create/schedule')({
  beforeLoad: () => guardStep('schedule'),
  head: () => ({ meta: [{ title: 'Schedule · Create post · Relay' }] }),
  component: ScheduleStep,
})
