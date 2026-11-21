import { Link } from '@tanstack/react-router'
import plusIcon from '@/assets/figma/bottom-nav/plus.svg'
import { Icon } from '@/components/ui'
import { cn } from '@/lib/cn'
import { BOTTOM_NAV_ITEMS, type BottomNavItem } from './nav'

function Tab({ item }: { item: BottomNavItem }) {
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact ?? false, includeSearch: false }}
      className="flex min-w-0 flex-1 flex-col items-center gap-[3px] py-1"
    >
      {({ isActive }) => (
        <>
          <Icon src={isActive ? item.activeIcon : item.icon} size={22} />
          <span className={cn('text-caption font-medium whitespace-nowrap', isActive ? 'text-accent-text' : 'text-tertiary')}>{item.label}</span>
        </>
      )}
    </Link>
  )
}

/** Figma "Bottom nav" — mobile <768px. */
export function BottomNav({ className }: { className?: string }) {
  const [home, library, calendar, activity] = BOTTOM_NAV_ITEMS
  return (
    <nav
      aria-label="Primary"
      className={cn('fixed inset-x-0 bottom-0 z-30 flex items-center border-t bg-surface px-2 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]', className)}
    >
      <Tab item={home} />
      <Tab item={library} />
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <Link to="/create" aria-label="Create post" className="flex size-12 items-center justify-center rounded-full bg-accent shadow-md transition-colors hover:bg-accent-hover">
          <Icon src={plusIcon} size={22} />
        </Link>
      </div>
      <Tab item={calendar} />
      <Tab item={activity} />
    </nav>
  )
}
