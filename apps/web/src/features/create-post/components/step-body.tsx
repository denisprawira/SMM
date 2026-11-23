import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PostSummary } from './post-summary'

/**
 * Body of the Media / Accounts / Schedule / Review steps: scrolling step
 * content (Figma px-32 py-28 gap-20) and the 340px Post summary rail (xl+).
 */
export function StepBody({ title, description, actions, showStatus, className, children }: { title: string; description: ReactNode; actions?: ReactNode; showStatus?: boolean; className?: string; children: ReactNode }) {
  return (
    <>
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className={cn('flex min-w-0 flex-col gap-4 p-4 md:gap-5 md:px-6 md:py-6 xl:px-8 xl:py-7', className)}>
          <header className="flex flex-col gap-1">
            <h1 className="text-h2 text-foreground md:text-h1">{title}</h1>
            <p className="text-body-sm text-muted-foreground md:text-body">{description}</p>
          </header>
          {actions}
          {children}
        </div>
      </div>
      <PostSummary showStatus={showStatus} className="hidden xl:flex" />
    </>
  )
}
