import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Eye, Folder, Info, Link as LinkIcon, LoaderCircle, Lock, LogOut, Search } from 'lucide-react'
import { GoogleDriveLogo } from '@/components/brand'
import { EmptyState } from '@/components/empty-state'
import { PageContent, PageHeader } from '@/components/page'
import { SearchInput } from '@/components/search-input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { driveQueryOptions, fileTotal, useConnectDrive } from '@/features/drive/api'
import { formatCount } from '@/features/drive/format'
import { cn } from '@/lib/utils'
import { LibraryTopbar } from './library-chrome'

export const LIBRARY_DESCRIPTION = 'Videos and images from your connected Google Drive. Nothing is copied to Relay.'

const PROMISES = [
  { icon: Eye, label: 'Read-only access' },
  { icon: Lock, label: 'Files never stored on Relay' },
  { icon: Folder, label: 'You choose the folder' },
  { icon: LogOut, label: 'Disconnect anytime' },
] as const

/** States S02 (29:397) — Drive is not connected: dashed container with the connect CTA. */
export function DriveNotConnected() {
  const connect = useConnectDrive()
  return (
    <PageContent className="flex-1">
      <PageHeader title="Content Library" description="Videos and images from your connected Google Drive." />
      <div className="flex min-h-[480px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed">
        <div className="flex flex-col items-center gap-3.5 px-4 py-10 text-center md:px-6 md:py-12">
          <span className="flex size-14 items-center justify-center rounded-[14px] border bg-background shadow-sm">
            <GoogleDriveLogo size={30} />
          </span>
          <h2 className="text-h2 text-foreground">Connect Google Drive to see your media</h2>
          <p className="max-w-[440px] text-body text-muted-foreground">
            Your library is your Drive. Relay lists the videos and images in a folder you pick and streams them to platforms only when a post publishes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => connect.mutate()} disabled={connect.isPending}>
              {connect.isPending ? <LoaderCircle className="animate-spin" /> : <LinkIcon />}
              {connect.isPending ? 'Connecting…' : 'Connect Google Drive'}
            </Button>
            <Button asChild variant="ghost">
              <Link to="/settings/integrations/drive">
                <Info />
                How it works
              </Link>
            </Button>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-[10px] bg-subtle px-[18px] py-3.5">
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
                <Icon aria-hidden className="size-3.5 shrink-0" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageContent>
  )
}

/** Library — no results (30:937). */
export function NoResults({ query, onClear }: { query?: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title={query ? `No files match “${query}”` : 'No files match these filters'}
      description="Try a different name, or check that the file is inside your content folder in Drive."
      action={
        <Button variant="outline" size="sm" onClick={onClear}>
          {query ? 'Clear search' : 'Clear filters'}
        </Button>
      }
      className="mx-auto w-full max-w-[340px] [&>p:last-of-type]:max-w-[284px]"
    />
  )
}

/** Skeleton card — 16:9 (desktop) / square (mobile) preview block + two text bars. */
function SkeletonCard({ i }: { i: number }) {
  const widths = ['w-[150px]', 'w-[130px]', 'w-[110px]']
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[10px] border bg-card md:rounded-xl">
      <div className="aspect-square bg-subtle md:aspect-video" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className={cn('h-2.5 max-w-full rounded-sm', widths[i % 3])} />
        <Skeleton className="h-2 w-[90px] max-w-full rounded-sm" />
      </div>
    </div>
  )
}

/** States S04 (29:733) — route pending: "Fetching file list from Google Drive…" + skeleton grid. */
export function LibraryPending() {
  const { data: drive } = useQuery(driveQueryOptions)
  const total = drive ? formatCount(fileTotal(drive)) : '1,284'
  const select = (label: string) => (
    <Select disabled>
      <SelectTrigger aria-label={label} className="disabled:opacity-100">
        <SelectValue placeholder={label} />
      </SelectTrigger>
    </Select>
  )
  return (
    <>
      <LibraryTopbar />
      <PageContent>
        <PageHeader title="Content Library" description={LIBRARY_DESCRIPTION} className="hidden md:flex" />
        <div role="status" className="flex items-center gap-2.5 rounded-[10px] border bg-subtle px-3 py-2.5">
          <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin text-primary" />
          <span className="truncate text-body-sm text-muted-foreground">Fetching file list from Google Drive…</span>
          <span className="flex-1" />
          <span className="hidden text-caption whitespace-nowrap text-tertiary md:inline">{total} files · this can take a few seconds the first time</span>
        </div>
        <div className="hidden flex-wrap items-center gap-2 md:flex" aria-hidden>
          <SearchInput disabled placeholder="Search by file name…" containerClassName="w-[320px]" tabIndex={-1} />
          {select('All types')}
          {select('Any duration')}
          {select('Modified: any time')}
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-x-3.5 md:gap-y-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <SkeletonCard key={i} i={i} />
          ))}
        </div>
      </PageContent>
    </>
  )
}
