import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronsUpDown, Settings } from 'lucide-react'
import { GoogleDriveLogo, RelayLogo } from '@/components/brand'
import { SearchInput } from '@/components/search-input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { driveQueryOptions } from '@/features/drive/api'
import { failedJobsCountQueryOptions } from '@/features/monitoring/api'
import { useSession } from '@/features/session/api'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav'

/** Figma "App Sidebar" (11:181, 248px) — desktop ≥1280px. */
export function AppSidebar({ className }: { className?: string }) {
  const session = useSession()
  // Live state from the features that own it; the session snapshot covers the first paint.
  const failedJobs = useQuery(failedJobsCountQueryOptions).data ?? session.failedJobs
  const liveDrive = useQuery(driveQueryOptions).data
  const drive = liveDrive
    ? { connected: liveDrive.connected, email: liveDrive.email, usedTb: liveDrive.storage.usedTb, totalTb: liveDrive.storage.totalTb }
    : session.drive
  const usedPct = Math.round((drive.usedTb / drive.totalTb) * 100)

  return (
    <aside className={cn('sticky top-0 h-dvh w-[248px] shrink-0 flex-col overflow-y-auto bg-canvas px-3 pt-4 pb-3', className)}>
      <Link to="/" className="flex items-center gap-2.5 px-2 pt-1 pb-4">
        <RelayLogo size={28} />
        <span className="text-h3 text-foreground">Relay</span>
      </Link>

      <SearchInput size="sm" placeholder="Search" shortcut="⌘K" aria-label="Search" />

      <nav aria-label="Primary" className="mt-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            activeOptions={{ exact: item.exact ?? false, includeSearch: false }}
            className="group flex h-8 items-center gap-2.5 rounded-md px-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground"
          >
            <item.icon aria-hidden className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-body font-medium">{item.label}</span>
            {item.showFailedCount && failedJobs > 0 && <Badge variant="destructive">{failedJobs}</Badge>}
          </Link>
        ))}
      </nav>

      <p className="mt-5 px-2 pb-1.5 text-overline text-tertiary uppercase">Media source</p>
      <Link to="/settings/integrations/drive" className="flex flex-col gap-2 rounded-[10px] border bg-card p-3 transition-colors hover:border-strong">
        <span className="flex items-center gap-2">
          <GoogleDriveLogo size={18} />
          <span className="text-body-sm font-medium text-foreground">Google Drive</span>
          <span className="flex-1" />
          <span
            aria-label={drive.connected ? 'Connected' : 'Not connected'}
            className={cn('size-2 rounded-full', drive.connected ? 'bg-success' : 'bg-[var(--border-strong)]')}
          />
        </span>
        {drive.connected ? (
          <>
            <span className="truncate text-caption text-muted-foreground">{drive.email}</span>
            <Progress value={usedPct} aria-label="Drive usage" />
            <span className="text-caption text-tertiary">
              {drive.usedTb} TB of {drive.totalTb} TB · files stay in your Drive
            </span>
          </>
        ) : (
          <>
            <span className="text-caption text-muted-foreground">Not connected</span>
            <span className="text-caption text-tertiary">Connect Drive to browse your media</span>
          </>
        )}
      </Link>

      <div className="min-h-4 flex-1" />

      <button type="button" className="flex w-full items-center gap-2.5 rounded-lg border bg-card p-2 text-left transition-colors hover:bg-subtle">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-inverse text-body-sm font-medium text-primary-foreground">
          {session.workspace.initial}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium text-foreground">{session.workspace.name}</span>
          <span className="truncate text-caption text-tertiary">
            {session.workspace.plan} · {session.workspace.members} members
          </span>
        </span>
        <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-tertiary" />
      </button>

      <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <Avatar>
          <AvatarFallback>{session.user.initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium text-foreground">{session.user.name}</span>
          <span className="truncate text-caption text-tertiary">{session.user.email}</span>
        </span>
        <Button asChild variant="ghost" size="icon-sm" aria-label="Account settings" title="Account settings">
          <Link to="/settings/profile">
            <Settings />
          </Link>
        </Button>
      </div>
    </aside>
  )
}
