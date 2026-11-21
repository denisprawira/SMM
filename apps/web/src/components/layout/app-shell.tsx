import type { ReactNode } from 'react'
import { AppSidebar } from './app-sidebar'
import { BottomNav } from './bottom-nav'
import { IconRail } from './icon-rail'

/**
 * Responsive app frame:
 *  - ≥1280  248px sidebar + main card (8px inset)
 *  - 768–1279  64px icon rail + main card
 *  - <768  full-bleed canvas + bottom nav
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <AppSidebar className="hidden xl:flex" />
      <IconRail className="hidden md:flex xl:hidden" />
      <div className="flex min-w-0 flex-1 flex-col pb-[90px] md:py-2 md:pr-2">
        <main className="flex min-w-0 flex-1 flex-col md:overflow-hidden md:rounded-xl md:border md:bg-surface">{children}</main>
      </div>
      <BottomNav className="md:hidden" />
    </div>
  )
}

/** Standard page body padding inside the main card. */
export function PageContent({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`flex min-w-0 flex-col gap-4 p-4 md:gap-5 md:p-6 xl:gap-6 xl:px-8 xl:pt-7 xl:pb-10 ${className}`}>{children}</div>
}
