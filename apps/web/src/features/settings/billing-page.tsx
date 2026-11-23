import { Link, type LinkProps } from '@tanstack/react-router'
import { Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSession } from '@/features/session/api'
import { SettingsCardHeader } from './components/form'
import { SettingsLayout } from './components/settings-layout'

/**
 * Billing has no Figma frame. Minimal page in the same Settings chrome:
 * the current plan and what it covers, linking to where each is managed.
 */
export function BillingSettingsPage() {
  const { workspace, drive } = useSession()
  const rows: { label: string; value: string; to: LinkProps['to']; hash?: string }[] = [
    { label: 'Team members', value: `${workspace.members} members`, to: '/settings', hash: 'team' },
    { label: 'Connected accounts', value: `${workspace.connectedAccounts} accounts`, to: '/accounts' },
    { label: 'Media source', value: drive.connected ? `Google Drive · ${drive.email}` : 'Google Drive · not connected', to: '/settings/integrations/drive' },
  ]

  return (
    <SettingsLayout active="billing">
      <Card>
        <SettingsCardHeader title="Plan" description={`The plan ${workspace.name} is on.`} />
        <div className="flex items-center gap-3 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-text">
            <Zap aria-hidden className="size-[18px]" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-h3 text-foreground">{workspace.plan}</span>
              <Badge variant="accent">Current</Badge>
            </div>
            <p className="text-caption text-tertiary">Files stay in your Drive, so plans never charge for media.</p>
          </div>
        </div>
        <dl className="border-t">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0">
              <dt className="w-32 shrink-0 text-body-sm text-muted-foreground md:w-40">{row.label}</dt>
              <dd className="min-w-0 flex-1 truncate text-body-sm font-medium text-foreground">{row.value}</dd>
              <Button asChild variant="ghost" size="sm">
                <Link to={row.to} hash={row.hash} aria-label={`Manage ${row.label.toLowerCase()}`}>
                  Manage
                </Link>
              </Button>
            </div>
          ))}
        </dl>
      </Card>
    </SettingsLayout>
  )
}
