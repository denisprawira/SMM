import { useSuspenseQuery } from '@tanstack/react-query'
import { PlatformLogo } from '@/components/platform-logo'
import { StatusPill } from '@/components/status-pill'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import { accountsQueryOptions, driveFilesQueryOptions, useReconnectAccount, type DriveFile, type SocialAccount } from '../api'
import { StepBody } from '../components/step-body'
import { setTargets, toggleTarget, useDraft, type Draft } from '../draft-store'
import { orderedTargets, PLATFORM_ORDER, publishesAs, selectedMedia, supportsPlatform } from '../model'

export function AccountsStep() {
  const draft = useDraft()
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions)
  const { data: files } = useSuspenseQuery(driveFilesQueryOptions)
  const media = selectedMedia(draft, files)
  const selectable = (a: SocialAccount) => a.status === 'connected' && supportsPlatform(media, a.platform)
  const selected = draft.targetIds.length

  const selectAll = () => {
    const added = PLATFORM_ORDER.flatMap((p) => accounts.filter((a) => a.platform === p && selectable(a) && !draft.targetIds.includes(a.id)))
    setTargets([...orderedTargets(draft, accounts), ...added], media[0])
  }

  return (
    <StepBody
      title="Where should this go?"
      description="Choose one or more accounts. Each selected account becomes its own publishing target with its own status."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <p aria-live="polite" className="text-body-sm font-medium whitespace-nowrap text-foreground">
            {selected} of {accounts.length} selected
          </p>
          <span aria-hidden className="text-body-sm text-tertiary">
            ·
          </span>
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select all connected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setTargets([], media[0])} disabled={selected === 0}>
            Clear
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {PLATFORM_ORDER.map((platform) => (
          <PlatformCard key={platform} platform={platform} accounts={accounts.filter((a) => a.platform === platform)} draft={draft} media={media} selectable={selectable} />
        ))}
      </div>
    </StepBody>
  )
}

function PlatformCard({
  platform,
  accounts,
  draft,
  media,
  selectable,
}: {
  platform: Platform
  accounts: SocialAccount[]
  draft: Draft
  media: DriveFile[]
  selectable: (a: SocialAccount) => boolean
}) {
  const count = accounts.filter((a) => draft.targetIds.includes(a.id)).length
  const yt = accounts.map((a) => draft.settings[a.id]).find((s) => s?.platform === 'youtube')
  return (
    <section aria-label={PLATFORM_LABEL[platform]} className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
      <header className="flex items-center gap-2.5 border-b px-4 py-3.5">
        <PlatformLogo platform={platform} size={24} />
        <div className="flex min-w-0 flex-col">
          <h2 className="text-body font-medium text-foreground">{PLATFORM_LABEL[platform]}</h2>
          <p className={cn('truncate text-caption', supportsPlatform(media, platform) ? 'text-tertiary' : 'text-warning-text')}>{publishesAs(platform, media, yt)}</p>
        </div>
        <div className="flex-1" />
        {count > 0 && <p className="text-caption font-medium whitespace-nowrap text-primary-text">{count} selected</p>}
      </header>
      {accounts.map((account, i) => (
        <AccountRow key={account.id} account={account} first={i === 0} checked={draft.targetIds.includes(account.id)} enabled={selectable(account)} media={media} />
      ))}
    </section>
  )
}

function AccountRow({ account, first, checked, enabled, media }: { account: SocialAccount; first: boolean; checked: boolean; enabled: boolean; media: DriveFile[] }) {
  const reconnect = useReconnectAccount()
  const pending = reconnect.isPending && reconnect.variables?.id === account.id
  const unsupported = account.status === 'connected' && !supportsPlatform(media, account.platform)

  return (
    <label
      className={cn(
        'flex min-h-[54px] items-center gap-3 px-4 py-2.5 transition-colors',
        !first && 'border-t',
        checked ? 'bg-primary-subtle' : enabled && 'hover:bg-subtle',
        enabled ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      <Checkbox checked={checked} disabled={!enabled} onCheckedChange={() => toggleTarget(account, media[0])} aria-label={`${account.name} (${account.handle})`} className="disabled:opacity-40" />
      <Avatar className={cn(!enabled && 'opacity-50')}>
        <AvatarFallback>{account.initials}</AvatarFallback>
      </Avatar>
      <span className={cn('flex min-w-0 flex-1 flex-col', !enabled && 'text-tertiary')}>
        <span className={cn('truncate text-body-sm font-medium', enabled && 'text-foreground')}>{account.name}</span>
        <span className={cn('truncate text-caption', enabled && 'text-tertiary')}>
          {account.handle} · {account.kind}
        </span>
      </span>
      {account.status === 'connecting' && <StatusPill status="connecting" />}
      {account.status === 'disconnected' && <StatusPill status="disconnected" />}
      {account.status === 'reauth' && (
        <>
          <StatusPill status={pending ? 'connecting' : 'reauth'} label={pending ? 'Reconnecting' : 'Reauth required'} />
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              reconnect.mutate(account)
            }}
          >
            Reconnect
          </Button>
        </>
      )}
      {unsupported && <StatusPill status="not-available" />}
    </label>
  )
}
