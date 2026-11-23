import { useNavigate } from '@tanstack/react-router'
import type { JobPost, JobsPage } from './api'

/** Opens the job-details drawer (child route) and keeps the list's filters. */
export function useOpenJob() {
  const navigate = useNavigate()
  return (jobId: string, replace = false) => navigate({ to: '/monitoring/$jobId', params: { jobId }, search: true, replace })
}

/** Ignore row clicks that land on a control inside the row. */
export const isFromControl = (el: EventTarget) => el instanceof Element && el.closest('button, a, input, label, [role="checkbox"], [role="menuitem"]') !== null

/** Posts for the card list; the flat view is folded back into posts on mobile. */
export function mobilePosts(data: JobsPage): JobPost[] {
  if (data.grouped) return data.posts
  const byId = new Map<string, JobPost>()
  for (const { post, targetId } of data.rows) {
    const t = post.targets.find((x) => x.id === targetId)
    if (!t) continue
    const existing = byId.get(post.id)
    byId.set(post.id, existing ? { ...existing, targets: [...existing.targets, t] } : { ...post, targets: [t] })
  }
  return [...byId.values()]
}
