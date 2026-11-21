import { Link } from '@tanstack/react-router'
import appLogo from '@/assets/figma/logos/app.svg'
import driveLogo from '@/assets/figma/logos/google-drive.svg'
import { Avatar, Icon } from '@/components/ui'
import { useSession } from '@/features/session/api'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from './nav'

/** Figma "Icon rail" (64px collapsed sidebar) — tablet 768–1279px. */
export function IconRail({ className }: { className?: string }) {
  const session = useSession()
  return (
    <aside className={cn('sticky top-0 h-dvh w-16 shrink-0 flex-col items-center gap-1.5 overflow-y-auto py-4', className)}>
      <Link to="/" aria-label="Relay home">
        <Icon src={appLogo} size={28} />
      </Link>
      <div className="h-3.5 w-px shrink-0" />
      <nav aria-label="Primary" className="flex flex-col items-center gap-1.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            aria-label={item.label}
            title={item.label}
            activeOptions={{ exact: item.exact ?? false, includeSearch: false }}
            className="relative flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-muted/60 data-[status=active]:bg-muted"
          >
            {({ isActive }) => (
              <>
                <Icon src={isActive ? item.railActiveIcon : item.railIcon} size={18} />
                {item.showFailedCount && session.failedJobs > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger ring-2 ring-canvas" aria-label={`${session.failedJobs} failed`} />
                )}
              </>
            )}
          </Link>
        ))}
      </nav>
      <div className="flex-1" />
      <Link
        to="/settings/integrations/drive"
        aria-label="Google Drive"
        title="Google Drive"
        className="flex size-10 items-center justify-center rounded-lg border bg-surface transition-colors hover:bg-subtle"
      >
        <Icon src={driveLogo} size={18} />
      </Link>
      <Link to="/settings/profile" aria-label="Profile" title={session.user.name}>
        <Avatar initials={session.user.initials} size="md" />
      </Link>
    </aside>
  )
}
