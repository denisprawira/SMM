import { Link } from '@tanstack/react-router'
import { Fragment, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { SETTINGS_NAV, type SettingsNavItem, type SettingsSection } from './nav-items'

function NavLink({ item, active, className }: { item: SettingsNavItem; active: boolean; className?: string }) {
  return (
    <Link
      to={item.to}
      hash={item.hash}
      hashScrollIntoView={{ behavior: 'smooth', block: 'start' }}
      // Exact + hash, so "General" (/settings) isn't active on /settings#team or /settings/profile.
      activeOptions={{ exact: true, includeHash: true }}
      data-active={active || undefined}
      className={cn(
        'flex h-8 items-center gap-2.5 rounded-md px-2.5 text-body-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20',
        'data-active:bg-muted data-active:text-foreground',
        className,
      )}
    >
      <item.icon aria-hidden className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

/**
 * Desktop (≥1280): the 200px "Settings nav" column with group overlines.
 * Below that: one horizontally scrolling row with dividers between groups.
 */
export function SettingsNav({ active, variant, className }: { active: SettingsSection; variant: 'column' | 'scroller'; className?: string }) {
  const scroller = useRef<HTMLElement>(null)

  // Keep the active pill in view on narrow screens without scrolling the page.
  useEffect(() => {
    const el = scroller.current
    const current = el?.querySelector<HTMLElement>('[data-active]')
    if (!el || !current) return
    el.scrollLeft = current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2
  }, [active])

  if (variant === 'column') {
    return (
      <nav aria-label="Settings" className={cn('w-[200px] shrink-0 flex-col gap-0.5', className)}>
        {SETTINGS_NAV.map((group) => (
          <Fragment key={group.label}>
            <p className="px-2.5 pt-3 pb-1 text-overline text-tertiary uppercase">{group.label}</p>
            {group.items.map((item) => (
              <NavLink key={item.id} item={item} active={item.id === active} />
            ))}
          </Fragment>
        ))}
      </nav>
    )
  }

  return (
    <nav
      ref={scroller}
      aria-label="Settings"
      className={cn(
        '-mx-4 flex items-center gap-1 overflow-x-auto border-b px-4 pb-3 [scrollbar-width:none] md:-mx-6 md:px-6 [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {SETTINGS_NAV.map((group, i) => (
        <Fragment key={group.label}>
          {i > 0 && <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />}
          {group.items.map((item) => (
            <NavLink key={item.id} item={item} active={item.id === active} className="shrink-0" />
          ))}
        </Fragment>
      ))}
    </nav>
  )
}
