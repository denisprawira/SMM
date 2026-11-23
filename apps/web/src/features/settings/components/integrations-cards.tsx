import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { GoogleDriveLogo } from '@/components/brand'
import { PlatformLogo } from '@/components/platform-logo'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSession } from '@/features/session/api'
import { PLATFORM_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PUBLISHING_DEFAULTS, integrationsQueryOptions, useUpdatePublishingDefault, type PlatformIntegration } from '../api'
import { SettingsCardHeader, SwitchRow } from './form'

/** Figma "Google Drive" card (28:5163) — the media source; details live on /settings/integrations/drive. */
export function DriveCard({ className }: { className?: string }) {
  const session = useSession()
  const { data } = useSuspenseQuery(integrationsQueryOptions)
  const { drive } = session
  return (
    <Card className={className}>
      <SettingsCardHeader
        title="Google Drive"
        description="Media source for every post. Relay never stores your files."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/settings/integrations/drive">
              <ArrowRight />
              Manage
            </Link>
          </Button>
        }
      />
      <div className="flex items-center gap-3 p-5">
        <GoogleDriveLogo size={32} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-body-sm font-medium text-foreground">{drive.email}</span>
            <StatusPill status={drive.connected ? 'connected' : 'disconnected'} />
          </div>
          <p className="text-caption text-tertiary">
            Content folder: {data.drive.folder} · {data.drive.access}
          </p>
        </div>
      </div>
    </Card>
  )
}

function PlatformHealth({ item, className }: { item: PlatformIntegration; className?: string }) {
  const degraded = item.health === 'degraded'
  return (
    <div className={cn('items-center gap-1.5', className)}>
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', degraded ? 'bg-warning' : 'bg-success')} />
      <span className={cn('min-w-0 flex-1 text-caption font-medium', degraded ? 'text-warning-text' : 'text-muted-foreground')}>{item.healthLabel}</span>
    </div>
  )
}

/** Figma "Social platforms" card (28:5186) — one row per platform API with its health. */
export function PlatformsCard({ className }: { className?: string }) {
  const { data } = useSuspenseQuery(integrationsQueryOptions)
  return (
    <Card className={className}>
      <SettingsCardHeader
        title="Social platforms"
        description="Relay uses each platform’s official API. Permissions can be revoked any time from the platform."
        stackActionOnMobile
        action={
          <Button asChild size="sm">
            <Link to="/accounts">
              <Plus />
              Connect account
            </Link>
          </Button>
        }
      />
      <ul aria-label="Social platforms">
        {data.platforms.map((item) => {
          const name = PLATFORM_LABEL[item.platform]
          return (
            <li key={item.platform} className="flex items-start gap-3.5 border-b px-5 py-3.5 last:border-b-0">
              <PlatformLogo platform={item.platform} size={32} />
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span id={`platform-${item.platform}`} className="text-body font-medium text-foreground">
                    {name}
                  </span>
                  {item.reauth > 0 && <StatusPill status="reauth" label={`${item.reauth} needs reauth`} />}
                </div>
                <p className="text-caption text-muted-foreground">
                  {item.api} · {item.summary}
                </p>
                <p className="text-caption text-tertiary">Permissions: {item.permissions}</p>
                <PlatformHealth item={item} className="mt-1.5 flex md:hidden" />
                <Button asChild variant="outline" size="sm" className="mt-2.5 self-start md:hidden">
                  <Link to="/accounts" aria-describedby={`platform-${item.platform}`}>
                    Manage accounts
                  </Link>
                </Button>
              </div>
              <PlatformHealth item={item} className="hidden w-[220px] shrink-0 md:flex" />
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link to="/accounts" aria-describedby={`platform-${item.platform}`}>
                  Manage accounts
                </Link>
              </Button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/** Figma "Publishing defaults" card (28:5262). Each switch saves immediately. */
export function PublishingDefaultsCard({ className }: { className?: string }) {
  const { data } = useSuspenseQuery(integrationsQueryOptions)
  const update = useUpdatePublishingDefault()
  return (
    <Card className={className}>
      <SettingsCardHeader title="Publishing defaults" description="Applied to new posts. Override per post." />
      <div className="flex flex-col gap-3 p-5">
        {PUBLISHING_DEFAULTS.map((d) => (
          <SwitchRow
            key={d.key}
            id={`default-${d.key}`}
            title={d.title}
            description={d.description}
            checked={data.defaults[d.key]}
            onCheckedChange={(on) => update.mutate({ key: d.key, on })}
          />
        ))}
      </div>
    </Card>
  )
}
