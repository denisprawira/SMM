import { Link, type LinkProps } from '@tanstack/react-router'
import { Bell, ChevronRight, Funnel, Plus } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { RelayLogo } from '@/components/brand'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/session/api'

export type Crumb = { label: string; to?: LinkProps['to'] }

type TopbarProps = {
  /** Trail after the workspace name, e.g. [{ label: 'Settings', to: '/settings' }, { label: 'Integrations' }]. */
  breadcrumb: Crumb[]
  /** Mobile header title; defaults to the last crumb. */
  mobileTitle?: string
  /** Replaces the default desktop actions (bell + Create post). */
  actions?: ReactNode
  /** Replaces the mobile bell, e.g. a filter button (Figma M02–M04). */
  mobileActions?: ReactNode
  /** Show the avatar at the end of the mobile header (default true; Library M02 hides it). */
  mobileAvatar?: boolean
}

/**
 * Page chrome. Desktop (≥1280): Figma "Topbar" — 52px breadcrumb bar inside the
 * main card. Mobile (<768): app header with logo, title, bell, avatar.
 * Tablet shows neither — pages keep their primary action in the page header.
 */
export function Topbar({ breadcrumb, mobileTitle, actions, mobileActions, mobileAvatar = true }: TopbarProps) {
  const session = useSession()
  const crumbs: Crumb[] = [{ label: session.workspace.name, to: '/' }, ...breadcrumb]
  const title = mobileTitle ?? breadcrumb[breadcrumb.length - 1]?.label ?? ''

  return (
    <>
      <header className="hidden h-[52px] shrink-0 items-center gap-2 border-b pr-4 pl-6 xl:flex">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-tertiary" />}
                {last ? (
                  <span aria-current="page" className="truncate text-body-sm font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : crumb.to ? (
                  <Link to={crumb.to} className="truncate text-body-sm text-tertiary transition-colors hover:text-muted-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate text-body-sm text-tertiary">{crumb.label}</span>
                )}
              </Fragment>
            )
          })}
        </nav>
        <div className="flex-1" />
        {actions ?? (
          <>
            <Button variant="outline" size="icon" aria-label="Notifications" title="Notifications" className="shadow-none">
              <Bell />
            </Button>
            <Button asChild size="sm">
              <Link to="/create">
                <Plus />
                Create post
              </Link>
            </Button>
          </>
        )}
      </header>

      <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-2 border-b bg-background pr-3 pl-4 md:hidden">
        <Link to="/" aria-label="Relay home">
          <RelayLogo size={26} />
        </Link>
        <h1 className="truncate text-h3 text-foreground">{title}</h1>
        <div className="flex-1" />
        {mobileActions ?? (
          <Button variant="ghost" size="icon-lg" aria-label="Notifications" className="text-muted-foreground">
            <Bell className="size-5" />
          </Button>
        )}
        {mobileAvatar && (
          <Link to="/settings/profile" aria-label="Profile">
            <Avatar size="sm">
              <AvatarFallback>{session.user.initials}</AvatarFallback>
            </Avatar>
          </Link>
        )}
      </header>
    </>
  )
}

/** Mobile header filter button with an "active filters" dot (Figma M03/M04). */
export function MobileFilterButton({ activeFilters = 0, label = 'Filters', onClick }: { activeFilters?: number; label?: string; onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label={activeFilters ? `${label} (${activeFilters} active)` : label}
      disabled={!onClick}
      onClick={onClick}
      className="relative text-muted-foreground"
    >
      <Funnel className="size-5" />
      {activeFilters > 0 && <span aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />}
    </Button>
  )
}
