import { createFileRoute } from '@tanstack/react-router'
import { guardStep, type CustomizeSearch } from '@/features/create-post/model'
import { CustomizeStep } from '@/features/create-post/steps/customize-step'
import type { Platform } from '@/lib/types'

const PLATFORMS: Platform[] = ['tiktok', 'instagram', 'youtube', 'facebook']

export const Route = createFileRoute('/create/customize')({
  validateSearch: (search: Record<string, unknown>): CustomizeSearch => ({
    target: typeof search.target === 'string' && search.target ? search.target : undefined,
    preview: PLATFORMS.includes(search.preview as Platform) ? (search.preview as Platform) : undefined,
  }),
  beforeLoad: () => guardStep('customize'),
  head: () => ({ meta: [{ title: 'Customize · Create post · Relay' }] }),
  component: CustomizeStep,
})
