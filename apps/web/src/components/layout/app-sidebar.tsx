import { Link } from '@tanstack/react-router'
import chevronsUpDown from '@/assets/figma/icons/chevrons-up-down.svg'
import settingsIcon from '@/assets/figma/icons/settings.svg'
import appLogo from '@/assets/figma/logos/app.svg'
import driveLogo from '@/assets/figma/logos/google-drive.svg'
import driveConnectedDot from '@/assets/figma/status/drive-connected.svg'
import { Avatar, Badge, Icon, SearchInput } from '@/components/ui'
import { useSession } from '@/features/session/api'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from './nav'

/** Figma "App Sidebar" (248px) — desktop ≥1280px. */
export function AppSidebar({ className }: { className?: string }) {
  const session = useSession()
  const usedPct = Math.round((session.drive.usedTb / session.drive.totalTb) * 100)

  return (
    <aside className={cn('sticky top-0 h-dvh w-[248px] shrink-0 flex-col overflow-y-auto bg-canvas px-3 pt-4 pb-3', className)}>
      <Link to="/" className="flex items-center gap-2.5 px-2 pt-1 pb-4">
        <Icon src={appLogo} size={28} alt="" />
        <span className="text-h3 text-primary">Relay</span>
      </Link>

      <SearchInput size="sm" placeholder="Search" shortcut="⌘K" aria-label="Search" />

      <nav aria-label="Primary" className="mt-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            activeOptions={{ exact: item.exact ?? false, includeSearch: false }}
            className="group flex h-8 items-center gap-2.5 rounded-md px-2 transition-colors hover:bg-muted/60 data-[status=active]:bg-muted"
          >
            {({ isActive }) => (
              <>
                <Icon src={isActive ? item.activeIcon : item.icon} size={16} />
                <span className={cn('min-w-0 flex-1 truncate text-body font-medium', isActive ? 'text-primary' : 'text-secondary')}>{item.label}</span>
                {item.showFailedCount && session.failedJobs > 0 && <Badge tone="danger">{session.failedJobs}</Badge>}
              </>
            )}
          </Link>
        ))}
      </nav>

      <p className="mt-5 px-2 pb-1.5 text-overline text-tertiary uppercase">Media source</p>
      <Link
        to="/settings/integrations/drive"
        className="flex flex-col gap-2 rounded-[10px] border bg-surface p-3 transition-colors hover:border-strong"
      >
        <span className="flex items-center gap-2">
          <Icon src={driveLogo} size={18} />
          <span className="text-body-sm font-medium text-primary">Google Drive</span>
          <span className="flex-1" />
          {session.drive.connected && <Icon src={driveConnectedDot} size={8} alt="Connected" />}
        </span>
        <span className="truncate text-caption text-secondary">{session.drive.email}</span>
        <span className="flex h-1 w-full overflow-hidden rounded-full bg-muted">
          <span className="h-1 rounded-full bg-accent" style={{ width: `${usedPct}%` }} />
        </span>
        <span className="text-caption text-tertiary">
          {session.drive.usedTb} TB of {session.drive.totalTb} TB · files stay in your Drive
        </span>
      </Link>

      <div className="min-h-4 flex-1" />

      <button type="button" className="flex w-full items-center gap-2.5 rounded-lg border bg-surface p-2 text-left transition-colors hover:bg-subtle">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-inverse text-body-sm font-medium text-inverse">
          {session.workspace.initial}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium text-primary">{session.workspace.name}</span>
          <span className="truncate text-caption text-tertiary">
            {session.workspace.plan} · {session.workspace.members} members
          </span>
        </span>
        <Icon src={chevronsUpDown} size={16} />
      </button>

      <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <Avatar initials={session.user.initials} size="md" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium text-primary">{session.user.name}</span>
          <span className="truncate text-caption text-tertiary">{session.user.email}</span>
        </span>
        <Link
          to="/settings/profile"
          aria-label="Account settings"
          title="Account settings"
          className="flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
        >
          <Icon src={settingsIcon} size={16} />
        </Link>
      </div>
    </aside>
  )
}
