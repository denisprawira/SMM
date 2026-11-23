import { Link } from '@tanstack/react-router'
import { GoogleDriveLogo, RelayLogo } from '@/components/brand'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSession } from '@/features/session/api'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav'

/** Figma "Icon rail" (64px collapsed sidebar, T01) — tablet 768–1279px. */
export function IconRail({ className }: { className?: string }) {
  const session = useSession()
  return (
    <aside className={cn('sticky top-0 h-dvh w-16 shrink-0 flex-col items-center gap-1.5 overflow-y-auto py-4', className)}>
      <Link to="/" aria-label="Relay home">
        <RelayLogo size={28} />
      </Link>
      <div className="h-3.5 w-px shrink-0" />
      <nav aria-label="Primary" className="flex flex-col items-center gap-1.5">
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Link
                to={item.to}
                aria-label={item.label}
                activeOptions={{ exact: item.exact ?? false, includeSearch: false }}
                className="relative flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground"
              >
                <item.icon aria-hidden className="size-[18px]" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
      <div className="flex-1" />
      <Link
        to="/settings/integrations/drive"
        aria-label="Google Drive"
        title="Google Drive"
        className="flex size-10 items-center justify-center rounded-lg border bg-card transition-colors hover:bg-subtle"
      >
        <GoogleDriveLogo size={18} />
      </Link>
      <Link to="/settings/profile" aria-label="Profile" title={session.user.name}>
        <Avatar>
          <AvatarFallback>{session.user.initials}</AvatarFallback>
        </Avatar>
      </Link>
    </aside>
  )
}
