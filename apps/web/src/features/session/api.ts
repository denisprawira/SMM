import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { mockRequest } from '@/lib/api'

export type Session = {
  user: { firstName: string; name: string; initials: string; email: string }
  workspace: { name: string; initial: string; plan: string; members: number; connectedAccounts: number }
  drive: { email: string; usedTb: number; totalTb: number; connected: boolean }
  /** Unresolved failed publish jobs — drives the Post Monitoring badge. */
  failedJobs: number
}

const SESSION: Session = {
  user: { firstName: 'Maya', name: 'Maya Rahman', initials: 'MR', email: 'maya@northwind.studio' },
  workspace: { name: 'Northwind Studio', initial: 'N', plan: 'Pro plan', members: 5, connectedAccounts: 9 },
  drive: { email: 'maya@northwind.studio', usedTb: 1.24, totalTb: 2, connected: true },
  failedJobs: 3,
}

export const sessionQueryOptions = queryOptions({
  queryKey: ['session'],
  queryFn: () => mockRequest(SESSION, { delay: 150 }),
  staleTime: 5 * 60_000,
})

/** Session is loaded by the `_app` layout route, so this never suspends inside it. */
export function useSession() {
  return useSuspenseQuery(sessionQueryOptions).data
}
