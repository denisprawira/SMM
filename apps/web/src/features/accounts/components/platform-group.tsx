import { Plus } from 'lucide-react'
import { PlatformLogo } from '@/components/platform-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { SocialAccount } from '../api'
import { AccountCard } from './account-card'
import { ConnectLink } from './connect-link'

/** Figma 05 "Group/<Platform>": header row + 3-up card grid with an "Add account" tile in the free slot. */
export function PlatformGroup({ platform, accounts }: { platform: Platform; accounts: SocialAccount[] }) {
  const label = PLATFORM_LABEL[platform]
  const headingId = `accounts-${platform}`
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <PlatformLogo platform={platform} size={20} />
        <h2 id={headingId} className="text-h3 text-foreground">
          {label}
        </h2>
        <Badge>{accounts.length}</Badge>
        <div className="flex-1" />
        <Button asChild variant="ghost" size="sm">
          <ConnectLink platform={platform}>
            <Plus />
            Add {label} account
          </ConnectLink>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
        <AddAccountTile platform={platform} count={accounts.length} />
      </div>
    </section>
  )
}

/**
 * Dashed "Add another … account" tile. It fills the last row's free slot
 * (3-up on desktop, 2-up on tablet) and is hidden when the row is full or on
 * mobile, where the header's "Add … account" button covers it. A platform with
 * no accounts (only listed on its own tab) always shows it.
 */
function AddAccountTile({ platform, count }: { platform: Platform; count: number }) {
  const label = PLATFORM_LABEL[platform]
  const visibility = count === 0 ? 'flex' : cn('hidden', count % 2 === 1 ? 'md:flex' : 'md:hidden', count % 3 !== 0 ? 'xl:flex' : 'xl:hidden')
  return (
    <ConnectLink
      platform={platform}
      className={cn(
        'min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-strong p-6 text-center transition-colors outline-none hover:bg-subtle focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20',
        visibility,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-subtle text-muted-foreground">
        <Plus aria-hidden className="size-4" />
      </span>
      <span className="text-body-sm font-medium text-muted-foreground">{count === 0 ? `Connect ${/^[AEIOU]/.test(label) ? 'an' : 'a'} ${label} account` : `Add another ${label} account`}</span>
      <span className="text-caption text-tertiary">Manage brands and creators side by side</span>
    </ConnectLink>
  )
}
