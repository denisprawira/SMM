import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, CircleAlert, CircleCheck, Folder, HardDrive, Info, Link as LinkIcon, LoaderCircle, LogOut, ShieldCheck, X, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Banner } from '@/components/banner'
import { GoogleDriveLogo } from '@/components/brand'
import { Topbar } from '@/components/layout/topbar'
import { PageContent, PageHeader } from '@/components/page'
import { StatusPill } from '@/components/status-pill'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSession } from '@/features/session/api'
import { cn } from '@/lib/utils'
import { driveQueryOptions, fileTotal, syncedAgo, useConnectDrive, type DriveState } from './api'
import { ChangeFolderDialog } from './components/change-folder-dialog'
import { DisconnectDriveDialog } from './components/disconnect-dialog'
import { formatCount } from './format'

/** Figma "03 Google Drive Integration — Desktop" (17:943). Full-width page, no settings nav. */
export function DrivePage() {
  const { data: drive } = useSuspenseQuery(driveQueryOptions)
  // Inline success (States 30:779) after a reconnect from this page.
  const [justConnected, setJustConnected] = useState(false)
  const connect = useConnectDrive({ notify: false })
  const reconnect = () => connect.mutate(undefined, { onSuccess: () => setJustConnected(true) })

  return (
    <>
      <Topbar
        breadcrumb={[
          { label: 'Settings', to: '/settings' },
          { label: 'Integrations', to: '/settings/integrations' },
          { label: 'Google Drive' },
        ]}
      />
      <PageContent>
        <PageHeader title="Google Drive" description="Relay reads media directly from your Google Drive. Files are never copied to or stored on Relay servers." />

        {!drive.connected && (
          <Banner
            tone="danger"
            icon={CircleAlert}
            title="Google Drive disconnected"
            description={`${drive.scheduledPosts} scheduled posts are paused. Reconnect to resume publishing.`}
            action={
              <Button variant="outline" size="sm" onClick={reconnect} disabled={connect.isPending}>
                {connect.isPending ? <LoaderCircle className="animate-spin" /> : <LinkIcon />}
                {connect.isPending ? 'Reconnecting…' : 'Reconnect Drive'}
              </Button>
            }
          />
        )}
        {drive.connected && justConnected && <InlineSuccess drive={drive} />}

        <ConnectionCard drive={drive} connecting={connect.isPending} onConnect={reconnect} />

        {drive.connected && (
          <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start">
            <StorageCard drive={drive} />
            <ContentFolderCard drive={drive} />
            <PermissionsCard />
          </div>
        )}

        <HowItWorks />

        {drive.connected && (
          <section className="flex flex-col gap-3 rounded-xl border border-danger bg-card p-5 shadow-xs md:flex-row md:items-center">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-body font-medium text-foreground">Disconnect Google Drive</h2>
              <p className="text-body-sm text-muted-foreground">Scheduled posts that use Drive files will be paused until you reconnect. Your files are not affected.</p>
            </div>
            <div className="hidden flex-1 md:block" />
            <DisconnectDriveDialog scheduledPosts={drive.scheduledPosts}>
              <Button variant="destructive" className="self-start md:self-auto">
                <LogOut />
                Disconnect Drive
              </Button>
            </DisconnectDriveDialog>
          </section>
        )}
      </PageContent>
    </>
  )
}

/* ── Cards ─────────────────────────────────────────────────────────── */

function CardTitleRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-h3 text-foreground">
      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      {children}
    </h2>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-caption text-tertiary">{label}</dt>
      <dd className="truncate text-body-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

/** Figma "Connection" (17:1072). */
function ConnectionCard({ drive, connecting, onConnect }: { drive: DriveState; connecting: boolean; onConnect: () => void }) {
  const session = useSession()
  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-subtle">
            <GoogleDriveLogo size={26} />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-h2 text-foreground">Google Drive</h2>
              <StatusPill status={drive.connected ? 'connected' : 'disconnected'} />
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-body-sm">
              <Avatar size="sm">
                <AvatarFallback>{session.user.initials}</AvatarFallback>
              </Avatar>
              {drive.connected ? (
                <>
                  <span className="text-muted-foreground">Connected as</span>
                  <span className="truncate font-medium text-foreground">{drive.email}</span>
                  <span className="text-tertiary">· since {drive.connectedSince}</span>
                </>
              ) : (
                <>
                  <span className="truncate font-medium text-foreground">{drive.email}</span>
                  <span className="text-tertiary">· access revoked</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="hidden flex-1 md:block" />
        <div className="flex flex-wrap items-center gap-4">
          {drive.connected ? (
            <>
              <Button asChild variant="outline">
                <Link to="/library/browse">
                  <Folder />
                  Browse Drive
                </Link>
              </Button>
              <DisconnectDriveDialog scheduledPosts={drive.scheduledPosts}>
                <Button variant="outline">
                  <LogOut />
                  Disconnect
                </Button>
              </DisconnectDriveDialog>
            </>
          ) : (
            <Button onClick={onConnect} disabled={connecting}>
              {connecting ? <LoaderCircle className="animate-spin" /> : <LinkIcon />}
              {connecting ? 'Connecting…' : 'Connect Google Drive'}
            </Button>
          )}
        </div>
      </div>
      {drive.connected && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-3 md:grid-cols-4">
          <Stat label="Last sync" value={syncedAgo(drive.lastSyncedAt, 'long')} />
          <Stat label="Auto-sync" value={drive.autoSync} />
          <Stat label="Access scope" value={drive.scope} />
          <Stat label="Files indexed" value={formatCount(fileTotal(drive))} />
        </dl>
      )}
    </Card>
  )
}

/** Figma "Storage usage" (17:1116) — usage bar segments = CSS, legend squares = CSS. */
function StorageCard({ drive }: { drive: DriveState }) {
  const s = drive.storage
  const totalGb = s.totalTb * 1000
  const parts = [
    { label: 'Videos', gb: s.videosGb, color: 'bg-chart-1' },
    { label: 'Images', gb: s.imagesGb, color: 'bg-chart-2' },
    { label: 'Other files', gb: s.otherGb, color: 'bg-chart-3' },
  ]
  return (
    <Card className="flex-1 gap-3.5 p-5">
      <CardTitleRow icon={HardDrive}>Drive storage</CardTitleRow>
      <p className="flex items-end gap-1.5">
        <span className="text-metric text-foreground">{s.usedTb} TB</span>
        <span className="text-body-sm text-tertiary">of {s.totalTb} TB used</span>
      </p>
      <div role="img" aria-label={`${s.usedTb} TB of ${s.totalTb} TB used`} className="flex h-2 w-full items-center gap-0.5 overflow-hidden rounded-full bg-muted">
        {parts.map((p) => (
          <span key={p.label} className={cn('h-2 shrink-0', p.color)} style={{ width: `${(p.gb / totalGb) * 100}%` }} />
        ))}
      </div>
      <ul className="flex flex-col gap-1.5">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-body-sm">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-[2px]', p.color)} />
            <span className="text-muted-foreground">{p.label}</span>
            <span className="flex-1" />
            <span className="font-medium text-foreground">{p.gb} GB</span>
          </li>
        ))}
      </ul>
      <p className="flex items-start gap-1.5 rounded-lg bg-subtle px-2.5 py-2 text-caption text-muted-foreground">
        <Info aria-hidden className="mt-px size-3.5 shrink-0 text-tertiary" />
        Reported by Google. Relay stores 0 bytes of your media.
      </p>
    </Card>
  )
}

/** Figma "Content folder" (17:1149). */
function ContentFolderCard({ drive }: { drive: DriveState }) {
  const [open, setOpen] = useState(false)
  const c = drive.folder.counts
  return (
    <Card className="flex-1 gap-3.5 p-5">
      <CardTitleRow icon={Folder}>Content folder</CardTitleRow>
      <p className="max-w-[300px] text-body-sm text-muted-foreground">Relay only lists media inside this folder and its subfolders.</p>
      <p className="flex min-w-0 items-center gap-2 rounded-lg border bg-subtle px-3 py-2.5">
        <Folder aria-hidden className="size-4 shrink-0 text-warning" />
        <span className="truncate text-body-sm font-medium text-foreground">{drive.folder.path}</span>
      </p>
      <dl className="flex items-center gap-5">
        {[
          { label: 'Videos', value: c.videos },
          { label: 'Images', value: c.images },
          { label: 'Subfolders', value: c.subfolders },
        ].map((x) => (
          <div key={x.label} className="flex flex-col-reverse">
            <dt className="text-caption text-tertiary">{x.label}</dt>
            <dd className="text-h2 text-foreground">{formatCount(x.value)}</dd>
          </div>
        ))}
      </dl>
      <Button variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
        Change folder
      </Button>
      <ChangeFolderDialog drive={drive} open={open} onOpenChange={setOpen} />
    </Card>
  )
}

const CAN = ['See and preview files in the content folder', 'Read file names, sizes and durations', 'Stream a file to a platform at publish time']
const CANNOT = ['Upload, edit or delete your files', 'Keep copies after a publish job finishes']

/** Figma "Permissions" (17:1173). */
function PermissionsCard() {
  return (
    <Card className="flex-1 gap-3 p-5">
      <CardTitleRow icon={ShieldCheck}>What Relay can do</CardTitleRow>
      <ul className="flex flex-col gap-3">
        {CAN.map((t) => (
          <li key={t} className="flex items-center gap-2 text-body-sm text-foreground">
            <Check aria-label="Allowed" className="size-3.5 shrink-0 text-success" />
            {t}
          </li>
        ))}
        {CANNOT.map((t) => (
          <li key={t} className="flex items-center gap-2 text-body-sm text-tertiary">
            <X aria-label="Not allowed" className="size-3.5 shrink-0 text-tertiary" />
            {t}
          </li>
        ))}
      </ul>
    </Card>
  )
}

const STEPS = [
  { title: 'Pick files', body: 'Choose videos or images from your Drive in the Content Library.' },
  { title: 'Schedule', body: 'Relay saves only a reference (file ID) and your post settings.' },
  { title: 'Publish', body: 'At publish time the file streams from Drive straight to each platform.' },
  { title: 'Done', body: 'No copy is kept. Revoke access any time from Google or here.' },
]

/** Figma "How it works" (17:1198). */
function HowItWorks() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-subtle p-5 shadow-xs">
      <h2 className="text-h3 text-foreground">How publishing from Drive works</h2>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:items-center">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-caption font-medium text-muted-foreground">{i + 1}</span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-body-sm font-medium text-foreground">{s.title}</span>
              <span className="max-w-[200px] text-caption text-muted-foreground">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** States "Inline success" (30:779). */
function InlineSuccess({ drive }: { drive: DriveState }) {
  return (
    <Card role="status" className="gap-2.5 p-4">
      <p className="flex items-center gap-2 text-body-sm font-medium text-foreground">
        <CircleCheck aria-hidden className="size-4 shrink-0 text-success" />
        Google Drive connected
      </p>
      <p className="max-w-[288px] text-caption text-muted-foreground">
        Showing {formatCount(fileTotal(drive))} files from {drive.folder.path}.
      </p>
      <Button asChild variant="outline" size="sm" className="self-start">
        <Link to="/library">
          <ArrowRight />
          Open Content Library
        </Link>
      </Button>
    </Card>
  )
}
