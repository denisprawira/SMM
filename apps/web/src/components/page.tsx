import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Page body inside the main card. Figma "Content": desktop px-32 pt-28 pb-40
 * gap-24; tablet 24px; mobile 16px.
 */
export function PageContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex min-w-0 flex-col gap-4 p-4 md:gap-5 md:p-6 xl:gap-6 xl:px-8 xl:pt-7 xl:pb-10', className)}>{children}</div>
}

/**
 * Figma "Page header": H1 title + Body/Default secondary description on the
 * left, filters/actions bottom-aligned on the right.
 */
export function PageHeader({ title, description, actions, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-end md:gap-3', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-h2 text-foreground md:text-h1">{title}</h1>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {actions && (
        <>
          <div className="hidden flex-1 md:block" />
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </>
      )}
    </div>
  )
}
