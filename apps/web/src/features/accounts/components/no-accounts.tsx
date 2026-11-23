import { Plus, Users } from 'lucide-react'
import { PlatformLogo } from '@/components/platform-logo'
import { Button } from '@/components/ui/button'
import { PLATFORM_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PLATFORMS } from '../api'
import { ConnectLink } from './connect-link'

/** Figma States S03 "Social Accounts · No accounts yet" — dashed container filling the page. */
export function NoAccounts({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed', className)}>
      <div className="flex flex-col items-center gap-3.5 px-4 py-12 text-center md:px-6">
        <span className="flex size-14 items-center justify-center rounded-[14px] border bg-background text-muted-foreground shadow-sm">
          <Users aria-hidden className="size-6" />
        </span>
        <h2 className="text-h2 text-foreground">No accounts connected yet</h2>
        <p className="max-w-[440px] text-body text-muted-foreground">
          Connect the TikTok, Instagram, Facebook and YouTube accounts you manage. You can add several per platform — brands, creators and Pages side by side.
        </p>
        <ul className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto">
          {PLATFORMS.map((platform) => (
            <li key={platform} className="flex flex-col items-center gap-2.5 rounded-xl border bg-card p-4 shadow-xs md:w-[200px]">
              <PlatformLogo platform={platform} size={36} />
              <p className="text-body font-medium text-foreground">{PLATFORM_LABEL[platform]}</p>
              <Button asChild variant="outline" size="sm">
                <ConnectLink platform={platform} aria-label={`Connect ${PLATFORM_LABEL[platform]}`}>
                  <Plus />
                  Connect
                </ConnectLink>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
