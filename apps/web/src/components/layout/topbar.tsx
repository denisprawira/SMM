import { Link, type LinkProps } from '@tanstack/react-router'
import { Fragment, type ReactNode } from 'react'
import bell20 from '@/assets/figma/icons/bell-20.svg'
import bell from '@/assets/figma/icons/bell.svg'
import breadcrumbChevron from '@/assets/figma/icons/breadcrumb-chevron.svg'
import plusInverse from '@/assets/figma/icons/plus-inverse.svg'
import appLogo from '@/assets/figma/logos/app.svg'
import { Avatar, ButtonLink, Icon, IconButton } from '@/components/ui'
import { useSession } from '@/features/session/api'

export type Crumb = { label: string; to?: LinkProps['to'] }

type TopbarProps = {
  /** Trail after the workspace name, e.g. [{ label: 'Settings', to: '/settings' }, { label: 'Integrations' }]. */
  breadcrumb: Crumb[]
  /** Mobile header title; defaults to the last crumb. */
  mobileTitle?: string
  /** Replaces the default desktop actions (bell + Create post). */
  actions?: ReactNode
}

/**
 * Page chrome. Desktop (≥1280): 52px breadcrumb bar inside the main card.
 * Mobile (<768): app header with logo, title, bell, avatar.
 * Tablet shows neither — pages put their primary action in the page header.
 */
export function Topbar({ breadcrumb, mobileTitle, actions }: TopbarProps) {
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
                {i > 0 && <Icon src={breadcrumbChevron} size={14} />}
                {last ? (
                  <span aria-current="page" className="truncate text-body-sm font-medium text-primary">
                    {crumb.label}
                  </span>
                ) : crumb.to ? (
                  <Link to={crumb.to} className="truncate text-body-sm text-tertiary transition-colors hover:text-secondary">
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
            <IconButton icon={bell} label="Notifications" />
            <ButtonLink to="/create" size="sm" icon={plusInverse}>
              Create post
            </ButtonLink>
          </>
        )}
      </header>

      <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-2 border-b bg-surface pr-3 pl-4 md:hidden">
        <Link to="/" aria-label="Relay home">
          <Icon src={appLogo} size={26} />
        </Link>
        <h1 className="truncate text-h3 text-primary">{title}</h1>
        <div className="flex-1" />
        <IconButton icon={bell20} iconSize={20} label="Notifications" appearance="plain" />
        <Link to="/settings/profile" aria-label="Profile">
          <Avatar initials={session.user.initials} size="sm" />
        </Link>
      </header>
    </>
  )
}
