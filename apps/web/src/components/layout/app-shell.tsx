import type { ReactNode } from 'react'
import { AppSidebar } from './app-sidebar'
import { BottomNav } from './bottom-nav'
import { IconRail } from './icon-rail'

/**
 * Responsive app frame (Figma "Main wrap"):
 *  - ≥1280  248px sidebar + main card (8px inset, radius/xl, border)
 *  - 768–1279  64px icon rail + main card
 *  - <768  full-bleed canvas + bottom nav
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <AppSidebar className="hidden xl:flex" />
      <IconRail className="hidden md:flex xl:hidden" />
      <div className="flex min-w-0 flex-1 flex-col pb-[90px] md:py-2 md:pr-2 md:pb-2">
        <main className="flex min-w-0 flex-1 flex-col md:overflow-hidden md:rounded-xl md:border md:bg-background">{children}</main>
      </div>
      <BottomNav className="md:hidden" />
    </div>
  )
}
