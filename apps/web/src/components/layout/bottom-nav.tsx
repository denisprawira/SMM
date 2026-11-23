import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BOTTOM_NAV_ITEMS, type BottomNavItem } from './nav'

function Tab({ item }: { item: BottomNavItem }) {
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact ?? false, includeSearch: false }}
      className="flex min-w-0 flex-1 flex-col items-center gap-[3px] py-1 text-tertiary data-[status=active]:text-primary"
    >
      <item.icon aria-hidden className="size-[22px]" />
      <span className="text-caption font-medium whitespace-nowrap">{item.label}</span>
    </Link>
  )
}

/** Figma "Bottom nav" (M01) — mobile <768px. */
export function BottomNav({ className }: { className?: string }) {
  const [home, library, calendar, activity] = BOTTOM_NAV_ITEMS
  return (
    <nav aria-label="Primary" className={cn('fixed inset-x-0 bottom-0 z-30 flex items-center border-t bg-background px-2 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]', className)}>
      <Tab item={home} />
      <Tab item={library} />
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <Link
          to="/create"
          aria-label="Create post"
          className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary-hover"
        >
          <Plus aria-hidden className="size-[22px]" />
        </Link>
      </div>
      <Tab item={calendar} />
      <Tab item={activity} />
    </nav>
  )
}
