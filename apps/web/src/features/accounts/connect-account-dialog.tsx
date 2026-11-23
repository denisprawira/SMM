import { getRouteApi } from '@tanstack/react-router'
import { Check, ExternalLink, Lock, X } from 'lucide-react'
import { useState } from 'react'
import { PlatformLogo } from '@/components/platform-logo'
import { StatusPill } from '@/components/status-pill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'
import { useQueryClient } from '@tanstack/react-query'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import { accountsQueryOptions, isPlatform, newConnectionId, PLATFORMS, useCancelConnection, useConnectAccount, type AccountsSearch } from './api'
import { CONNECT_COPY } from './platform-copy'

const route = getRouteApi('/_app/accounts/connect')

/** Figma 06 opens with Instagram selected when no platform is given. */
const DEFAULT_PLATFORM: Platform = 'instagram'
/** Matches the dialog's zoom/fade-out so the route only unmounts once it has closed. */
const CLOSE_ANIMATION_MS = 200

/**
 * Figma 06 "Connect an account". Lives at `/accounts/connect?platform=…`.
 * Continue starts a simulated OAuth popup (States 30:1017 "Connecting Instagram…");
 * when the platform approves, the account appears in the list with a toast.
 */
export function ConnectAccountDialog() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const queryClient = useQueryClient()
  const connect = useConnectAccount()
  const cancel = useCancelConnection()
  const [open, setOpen] = useState(true)
  const [cancelledId, setCancelledId] = useState<string | null>(null)

  const connecting = connect.isPending && connect.variables.id !== cancelledId
  const selected = connecting ? connect.variables.platform : (search.platform ?? DEFAULT_PLATFORM)
  const label = PLATFORM_LABEL[selected]

  const close = (tab: AccountsSearch['tab'] = search.tab) => {
    setOpen(false)
    setTimeout(() => void navigate({ to: '/accounts', search: { tab }, resetScroll: false }), CLOSE_ANIMATION_MS)
  }

  const select = (value: string) => {
    if (isPlatform(value)) void navigate({ search: (prev) => ({ ...prev, platform: value }), replace: true, resetScroll: false })
  }

  const start = () => {
    setCancelledId(null)
    connect.mutate(
      { platform: selected, id: newConnectionId() },
      // Show the new card: stay on this platform's tab, otherwise switch to All.
      { onSuccess: (account) => close(search.tab && search.tab !== account.platform ? undefined : search.tab) },
    )
  }

  const stop = () => {
    const id = connect.variables?.id
    const pending = queryClient.getQueryData(accountsQueryOptions.queryKey)?.find((a) => a.id === id)
    if (!id || !pending) return
    setCancelledId(id)
    cancel.mutate(pending)
  }

  return (
    // Closing while connecting keeps the sign-in running; the card in the list shows its progress.
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[560px]">
        <div className="flex items-start gap-2 pt-5 pr-5 pb-2 pl-6">
          <DialogHeader className="min-w-0 flex-1 gap-1 p-0">
            <DialogTitle>Connect an account</DialogTitle>
            <DialogDescription>Choose a platform. You’ll sign in on the platform and approve access.</DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close" className="text-tertiary">
              <X />
            </Button>
          </DialogClose>
        </div>

        <RadioGroup aria-label="Platform" value={selected} onValueChange={select} disabled={connecting} className="gap-2 px-6 py-3">
          {PLATFORMS.map((platform) => (
            <PlatformOption key={platform} platform={platform} checked={platform === selected} disabled={connecting} />
          ))}
        </RadioGroup>

        <div className="px-6 pt-1 pb-5">{connecting ? <ConnectingCard platform={selected} /> : <PermissionList platform={selected} />}</div>

        <div className="flex flex-wrap items-center gap-2 border-t bg-canvas px-6 py-3.5">
          <Lock aria-hidden className="size-3.5 shrink-0 text-tertiary" />
          <p className="text-caption text-tertiary">Secure OAuth · revoke anytime</p>
          <div className="flex-1" />
          <div className="flex gap-2 max-sm:w-full max-sm:*:flex-1">
            {connecting ? (
              <Button variant="outline" onClick={stop} disabled={cancel.isPending}>
                Cancel
              </Button>
            ) : (
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            )}
            <Button onClick={start} disabled={connecting}>
              {connecting ? <Spinner aria-hidden /> : <ExternalLink />}
              {connecting ? `Waiting for ${label}…` : `Continue to ${label}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PlatformOption({ platform, checked, disabled }: { platform: Platform; checked: boolean; disabled: boolean }) {
  const copy = CONNECT_COPY[platform]
  const id = `connect-${platform}`
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex flex-col rounded-[10px] border transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-ring/20',
        checked ? 'border-[1.5px] border-primary bg-primary-subtle' : 'bg-background',
        disabled ? 'cursor-default' : 'cursor-pointer',
        !checked && !disabled && 'hover:bg-subtle',
        !checked && disabled && 'opacity-60',
      )}
    >
      <span className="flex items-center gap-3 px-3.5 py-3">
        <PlatformLogo platform={platform} size={32} />
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="text-body font-medium text-foreground">{PLATFORM_LABEL[platform]}</span>
          <span className="text-caption text-muted-foreground">{copy.subtitle}</span>
        </span>
        {/* Figma radio: 18px, border/strong ring; selected = 5px accent ring around a white centre. */}
        <RadioGroupItem
          id={id}
          value={platform}
          className="size-[18px] border-strong bg-background shadow-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100 data-[state=checked]:border-[5px] data-[state=checked]:border-primary [&_[data-slot=radio-group-indicator]]:hidden"
        />
      </span>
      {checked && (
        <span className="flex flex-col gap-2 pr-3.5 pb-3.5 pl-[58px]">
          <span className="max-w-[420px] text-caption text-muted-foreground">{copy.requirement}</span>
          <span className="flex flex-wrap gap-1.5">
            {copy.formats.map((format) => (
              <Badge key={format} variant="outline" className="h-[22px] px-2">
                {format}
              </Badge>
            ))}
          </span>
        </span>
      )}
    </label>
  )
}

function PermissionList({ platform }: { platform: Platform }) {
  const copy = CONNECT_COPY[platform]
  return (
    <div className="flex flex-col gap-2 rounded-[10px] bg-subtle p-3.5">
      <p className="text-caption font-medium text-muted-foreground">Relay will request permission to</p>
      <ul className="flex flex-col gap-2 text-body-sm">
        {copy.permissions.map((permission) => (
          <li key={permission} className="flex items-start gap-2 text-foreground">
            <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
            {permission}
          </li>
        ))}
        <li className="flex items-start gap-2 text-tertiary">
          <X aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {copy.never}
        </li>
      </ul>
    </div>
  )
}

/** States 30:1017 — inline progress while the platform's sign-in popup is open. */
function ConnectingCard({ platform }: { platform: Platform }) {
  return (
    <div role="status" className="flex items-center gap-2.5 rounded-xl border bg-card p-3.5 shadow-xs">
      <PlatformLogo platform={platform} size={28} />
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <p className="truncate text-body-sm font-medium text-foreground">Connecting {PLATFORM_LABEL[platform]}…</p>
        <p className="truncate text-caption text-tertiary">Finish signing in in the popup window</p>
      </div>
      <StatusPill status="connecting" />
    </div>
  )
}
