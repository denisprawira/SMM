import { Copy, Ellipsis, ExternalLink, Link as LinkIcon, LoaderCircle, LogOut, RefreshCw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PlatformLogo } from '@/components/platform-logo'
import { StatusPill } from '@/components/status-pill'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PLATFORM_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useCancelConnection, useReconnectAccounts, useRefreshAccounts, type SocialAccount } from '../api'
import { AVATAR_TONE } from '../platform-copy'
import { ConfirmAccountDialog, type ConfirmKind } from './confirm-account-dialog'

const PROFILE_URL: Record<SocialAccount['platform'], (handle: string) => string> = {
  tiktok: (h) => `https://www.tiktok.com/${h}`,
  instagram: (h) => `https://www.instagram.com/${h.replace(/^@/, '')}`,
  facebook: (h) => `https://${h}`,
  youtube: (h) => `https://www.youtube.com/${h}`,
}

/** Figma 05 "Account/…" card: identity, status pill, details, action footer. */
export function AccountCard({ account }: { account: SocialAccount }) {
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null)
  const reconnect = useReconnectAccounts()
  const refresh = useRefreshAccounts()
  const cancel = useCancelConnection()

  const platform = PLATFORM_LABEL[account.platform]
  const disconnected = account.status === 'disconnected'
  const pendingNew = account.status === 'connecting' && !account.reconnecting

  const copyHandle = () => {
    void navigator.clipboard?.writeText(account.handle)
    toast.success('Copied to clipboard', { description: account.handle })
  }

  return (
    <Card>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="relative size-10 shrink-0">
          <Avatar size="lg" className={cn(disconnected && 'opacity-50')}>
            <AvatarFallback className={AVATAR_TONE[account.platform]}>{account.initials}</AvatarFallback>
          </Avatar>
          {/* 16px mark with a 2px surface ring (Figma "Platform Logo" at 28,28). */}
          <PlatformLogo platform={account.platform} size={20} stacked className="absolute top-[26px] left-[26px]" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <p className={cn('truncate text-body font-medium', disconnected ? 'text-muted-foreground' : 'text-foreground')}>{account.name}</p>
          <p className="truncate text-caption text-tertiary">{account.handle}</p>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`More actions for ${account.name}`} className="text-tertiary">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {pendingNew ? (
              <DropdownMenuItem disabled={cancel.isPending} onSelect={() => cancel.mutate(account)}>
                <X />
                Cancel connection
              </DropdownMenuItem>
            ) : (
              <>
                {account.status === 'connected' && (
                  <DropdownMenuItem disabled={account.syncing} onSelect={() => refresh.mutate([account])}>
                    <RefreshCw />
                    Refresh data
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem disabled={account.reconnecting} onSelect={() => reconnect.mutate([account])}>
                  {disconnected ? <LinkIcon /> : <RefreshCw />}
                  Reconnect
                </DropdownMenuItem>
                {!disconnected && (
                  <DropdownMenuItem asChild>
                    <a href={PROFILE_URL[account.platform](account.handle)} target="_blank" rel="noreferrer">
                      <ExternalLink />
                      Open on {platform}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={copyHandle}>
                  <Copy />
                  Copy {account.handle.startsWith('@') ? 'handle' : 'link'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {disconnected ? (
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirm('remove')}>
                    <Trash2 />
                    Remove from workspace
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem variant="destructive" disabled={account.reconnecting} onSelect={() => setConfirm('disconnect')}>
                    <LogOut />
                    Disconnect
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex px-4">
        <StatusPill status={account.status} />
      </div>

      <dl className="flex flex-col gap-1.5 px-4 pt-3 pb-3.5 text-caption">
        <DetailRow label="Account type" value={account.accountType} />
        <DetailRow label="Last sync" value={account.lastSync} warning={account.lastSyncWarning} />
        <DetailRow label="Audience" value={account.audience} />
      </dl>

      <div className="mt-auto flex items-center gap-2 border-t bg-canvas px-3 py-2.5">
        {pendingNew ? (
          <>
            <Button variant="ghost" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate(account)}>
              <X />
              Cancel
            </Button>
            <div className="flex-1" />
            <p className="truncate text-caption text-tertiary">Finish sign-in in the {platform} window</p>
          </>
        ) : account.reconnecting ? (
          <>
            <Button variant="ghost" size="sm" disabled>
              <LoaderCircle className="animate-spin" />
              Reconnecting…
            </Button>
          </>
        ) : (
          <>
            <Button
              variant={account.status === 'reauth' ? 'default' : disconnected ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => reconnect.mutate([account])}
            >
              {disconnected ? <LinkIcon /> : <RefreshCw />}
              Reconnect
            </Button>
            <div className="flex-1" />
            {disconnected ? (
              <Button variant="ghost" size="sm" onClick={() => setConfirm('remove')}>
                <Trash2 />
                Remove
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirm('disconnect')}>
                <LogOut />
                Disconnect
              </Button>
            )}
          </>
        )}
      </div>

      <ConfirmAccountDialog account={account} kind={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </Card>
  )
}

function DetailRow({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="shrink-0 text-tertiary">{label}</dt>
      <div className="flex-1" />
      <dd className={cn('truncate text-right font-medium', warning ? 'text-warning-text' : 'text-foreground')}>{value}</dd>
    </div>
  )
}
