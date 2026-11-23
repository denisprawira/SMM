import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronRight, Clock, Folder, HardDrive, Image, Lock, Sun, Users, Video, X, type LucideIcon } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { GoogleDriveLogo } from '@/components/brand'
import { EmptyState } from '@/components/empty-state'
import { SearchInput } from '@/components/search-input'
import { Thumbnail } from '@/components/thumbnail'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { driveListingQueryOptions, driveQueryOptions, type DriveListing } from '@/features/drive/api'
import { childFolders, DRIVE_FILES, DRIVE_ROOT_ID, folderChain, type DriveFile, type DriveFolder } from '@/features/drive/data'
import { browserMeta, formatDuration, formatTotal } from '@/features/drive/format'
import { useSession } from '@/features/session/api'
import { cn } from '@/lib/utils'
import { validateLibrarySearch } from '../api'
import { SelectedRing } from '../components/file-card'
import { FilePreview } from '../components/file-preview'
import { ViewToggle, type ViewMode } from '../components/view-toggle'
import { sendToCreatePost, useLibrarySelection } from '../selection'

export const DEFAULT_BROWSE_FOLDER = 'november'

const route = getRouteApi('/_app/library/browse')
const FILE_BY_ID = new Map(DRIVE_FILES.map((f) => [f.id, f]))

const KIND_OPTIONS = [
  { value: 'all', label: 'Videos & images' },
  { value: 'video', label: 'Videos' },
  { value: 'image', label: 'Images' },
] as const
const SORT_OPTIONS = [
  { value: 'modified', label: 'Last modified' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
] as const
type Kind = (typeof KIND_OPTIONS)[number]['value']
type Sort = (typeof SORT_OPTIONS)[number]['value']

/**
 * Figma "Modal/Browse Google Drive" (18:1059) at /library/browse?folder=…:
 * folder tree · folder contents · streamed preview, then "Add N files to post".
 * Selection starts from the Library's selection.
 */
export function BrowseDriveDialog() {
  const { folder = DEFAULT_BROWSE_FOLDER } = route.useSearch()
  const navigate = route.useNavigate()
  const goTo = useNavigate()
  const session = useSession()
  const library = useLibrarySelection()
  const { data: drive } = useSuspenseQuery(driveQueryOptions)
  const { data: listing } = useSuspenseQuery(driveListingQueryOptions(folder))

  const [selected, setSelected] = useState<string[]>(() => [...library.ids])
  const [focusId, setFocusId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Kind>('all')
  const [sort, setSort] = useState<Sort>('modified')
  const [view, setView] = useState<ViewMode>('grid')

  const close = () => navigate({ to: '/library', search: (prev) => validateLibrarySearch(prev) })
  const openFolder = (id: string) => {
    setQuery('')
    setFocusId(null)
    navigate({ search: (prev) => ({ ...prev, folder: id === DEFAULT_BROWSE_FOLDER ? undefined : id }) })
  }

  const files = useMemo(() => {
    const q = query.trim().toLowerCase()
    return listing.files
      .filter((f) => (!q || f.name.toLowerCase().includes(q)) && (kind === 'all' || f.kind === kind))
      .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'size' ? b.sizeMb - a.sizeMb : b.modified.localeCompare(a.modified)))
  }, [listing.files, query, kind, sort])
  const folders = query ? listing.folders.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase())) : listing.folders

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const focused = (focusId && files.find((f) => f.id === focusId)) || files.find((f) => selected.includes(f.id)) || files[0]
  const focusIndex = focused ? selected.indexOf(focused.id) : -1
  const visibleSelected = files.filter((f) => selected.includes(f.id)).length
  const totalMb = selected.reduce((sum, id) => sum + (FILE_BY_ID.get(id)?.sizeMb ?? 0), 0)

  const addToPost = () => {
    sendToCreatePost(selected)
    library.clear()
    goTo({ to: '/create' })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent showCloseButton={false} className="flex h-[min(760px,calc(100dvh-2rem))] flex-col sm:max-w-[1120px]">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2.5 border-b px-5 py-4">
          <GoogleDriveLogo size={22} />
          <DialogTitle className="truncate">Browse Google Drive</DialogTitle>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-subtle py-[3px] pr-2.5 pl-1 sm:flex">
            <Avatar size="sm">
              <AvatarFallback>{session.user.initials}</AvatarFallback>
            </Avatar>
            <span className="text-caption font-medium text-muted-foreground">{drive.email}</span>
          </span>
          <DialogDescription className="sr-only">Pick videos and images from your Google Drive. Files stay in your Drive.</DialogDescription>
          <span className="flex-1" />
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X />
            </Button>
          </DialogClose>
        </div>

        {/* Toolbar */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-5 py-3">
          <Breadcrumb chain={listing.chain} onOpen={openFolder} />
          <span className="min-w-0 flex-1" />
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this folder…" aria-label="Search this folder" containerClassName="w-full sm:w-[240px]" />
          <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <SelectTrigger aria-label="File type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {KIND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ViewToggle value={view} onValueChange={setView} />
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          <ScrollArea className="hidden w-[220px] shrink-0 border-r bg-canvas md:block">
            <FolderTree current={listing.id} contentFolderId={drive.folderId} onOpen={openFolder} />
          </ScrollArea>

          <ScrollArea className="min-w-0 flex-1">
            <div className="flex flex-col gap-3.5 px-5 py-4">
              {folders.length > 0 && (
                <>
                  <p className="text-caption font-medium text-tertiary">Folders</p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                    {folders.map((f) => (
                      <FolderCard key={f.id} folder={f} onOpen={() => openFolder(f.id)} />
                    ))}
                  </div>
                </>
              )}
              {files.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-caption font-medium text-tertiary">Files</p>
                    <span className="flex-1" />
                    <label className="flex cursor-pointer items-center gap-2 text-caption font-medium text-muted-foreground">
                      <Checkbox
                        checked={visibleSelected === 0 ? false : visibleSelected === files.length ? true : 'indeterminate'}
                        onCheckedChange={() => {
                          const ids = files.map((f) => f.id)
                          setSelected((s) => (visibleSelected === files.length ? s.filter((id) => !ids.includes(id)) : [...new Set([...s, ...ids])]))
                        }}
                      />
                      Select all
                    </label>
                  </div>
                  {view === 'grid' ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(124px,1fr))] gap-3">
                      {files.map((f) => (
                        <BrowseCard key={f.id} file={f} selected={selected.includes(f.id)} focused={focused?.id === f.id} onToggle={() => toggle(f.id)} onFocus={() => setFocusId(f.id)} />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-[10px] border">
                      {files.map((f, i) => (
                        <BrowseRow key={f.id} file={f} first={i === 0} selected={selected.includes(f.id)} focused={focused?.id === f.id} onToggle={() => toggle(f.id)} onFocus={() => setFocusId(f.id)} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                folders.length === 0 && <EmptyListing listing={listing} query={query} />
              )}
            </div>
          </ScrollArea>

          <ScrollArea className="hidden w-[300px] shrink-0 border-l lg:block">
            <div className="flex flex-col gap-3.5 p-4">
              <div className="flex items-center gap-2 text-caption">
                <p className="font-medium text-tertiary">Preview</p>
                <span className="flex-1" />
                <p className="text-tertiary">{focusIndex >= 0 ? `${focusIndex + 1} of ${selected.length} selected` : `${selected.length} selected`}</p>
              </div>
              {focused ? (
                <FilePreview file={focused} contentFolderId={drive.folderId} />
              ) : (
                <p className="rounded-[10px] bg-subtle px-3 py-8 text-center text-body-sm text-tertiary">Select a file to preview it.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-0 shrink-0 flex-row items-center gap-2 bg-background px-5 py-3 sm:justify-start">
          <Lock aria-hidden className="size-3.5 shrink-0 text-tertiary" />
          <p className="text-body-sm font-medium whitespace-nowrap text-foreground">
            {selected.length} selected · {formatTotal(totalMb)}
          </p>
          <p className="hidden min-w-0 truncate text-body-sm text-tertiary lg:block">· Files stay in your Drive — Relay keeps a reference only</p>
          <span className="flex-1" />
          <DialogClose asChild>
            <Button variant="outline" className="hidden sm:inline-flex">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={selected.length === 0} onClick={addToPost}>
            <ArrowRight />
            Add {selected.length} {selected.length === 1 ? 'file' : 'files'} to post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Pieces ────────────────────────────────────────────────────────── */

function Breadcrumb({ chain, onOpen }: { chain: DriveListing['chain']; onOpen: (id: string) => void }) {
  return (
    <nav aria-label="Folder path" className="flex min-w-0 items-center gap-1 overflow-hidden">
      {chain.map((c, i) => {
        const last = i === chain.length - 1
        return (
          <Fragment key={c.id}>
            {i > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-tertiary" />}
            {last ? (
              <span aria-current="page" className="truncate text-body-sm font-medium text-foreground">
                {c.name}
              </span>
            ) : (
              <button type="button" onClick={() => onOpen(c.id)} className="shrink-0 rounded-sm text-body-sm whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20">
                {c.name}
              </button>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

const INDENT = ['pl-2', 'pl-6', 'pl-10', 'pl-14'] as const

function TreeItem({ icon: Icon, label, active, depth, folder, onClick }: { icon: LucideIcon; label: string; active: boolean; depth?: number; folder?: boolean; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'h-[30px] w-full justify-start gap-2 rounded-md pr-2 text-body-sm font-normal text-muted-foreground hover:bg-muted/60',
        INDENT[Math.min(depth ?? 0, INDENT.length - 1)],
        active && 'bg-muted font-medium text-foreground hover:bg-muted',
      )}
    >
      <Icon aria-hidden className={cn('size-[15px]', folder && !active && 'text-warning')} />
      <span className="truncate">{label}</span>
    </Button>
  )
}

/** Figma "Folder tree" (18:1113): Drive views, then folders expanded down to the current one. */
function FolderTree({ current, contentFolderId, onOpen }: { current: string; contentFolderId: string; onOpen: (id: string) => void }) {
  const chain = folderChain(current)
  const expanded = new Set([DRIVE_ROOT_ID, ...chain.slice(0, -1).map((f) => f.id), ...folderChain(contentFolderId).map((f) => f.id)])
  const rows: { folder: DriveFolder; depth: number }[] = []
  const walk = (parentId: string, depth: number) => {
    for (const f of childFolders(parentId)) {
      rows.push({ folder: f, depth })
      if (expanded.has(f.id)) walk(f.id, depth + 1)
    }
  }
  walk(DRIVE_ROOT_ID, 0)
  return (
    <nav aria-label="Google Drive folders" className="flex flex-col gap-0.5 p-3">
      <TreeItem icon={HardDrive} label="My Drive" active={current === DRIVE_ROOT_ID} onClick={() => onOpen(DRIVE_ROOT_ID)} />
      <TreeItem icon={Users} label="Shared with me" active={current === 'shared'} onClick={() => onOpen('shared')} />
      <TreeItem icon={Clock} label="Recent" active={current === 'recent'} onClick={() => onOpen('recent')} />
      <TreeItem icon={Sun} label="Starred" active={current === 'starred'} onClick={() => onOpen('starred')} />
      <p className="px-2 pt-3.5 pb-1.5 text-overline text-tertiary uppercase">Folders</p>
      {rows.map(({ folder, depth }) => (
        <TreeItem key={folder.id} icon={Folder} folder label={folder.name} depth={depth} active={current === folder.id} onClick={() => onOpen(folder.id)} />
      ))}
    </nav>
  )
}

function FolderCard({ folder, onOpen }: { folder: DriveFolder; onOpen: () => void }) {
  return (
    <Button variant="outline" onClick={onOpen} className="h-auto min-w-0 justify-start gap-2.5 rounded-[10px] px-3 py-2.5 shadow-none">
      <Folder aria-hidden className="size-[18px] text-warning" />
      <span className="flex min-w-0 flex-col items-start">
        <span className="max-w-full truncate text-body-sm font-medium text-foreground">{folder.name}</span>
        <span className="text-caption font-normal text-tertiary">{folder.items} items</span>
      </span>
    </Button>
  )
}

/** Figma file card in the browser (18:1192): 4:3 preview, name, "MP4 · 0:42". Focused = accent/subtle fill. */
function BrowseCard({ file, selected, focused, onToggle, onFocus }: { file: DriveFile; selected: boolean; focused: boolean; onToggle: () => void; onFocus: () => void }) {
  return (
    <label onClick={onFocus} className={cn('relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[10px] border bg-card transition-colors hover:border-strong', focused && 'bg-primary-subtle')}>
      <div className="relative">
        <Thumbnail
          tone={file.tone}
          kind={file.kind}
          duration={file.durationSec ? formatDuration(file.durationSec) : undefined}
          ratio={131 / 98}
          className="aspect-[131/98] h-auto w-full rounded-none"
        />
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Select ${file.name}`} className="absolute top-2 left-2" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 px-2.5 py-2 text-caption">
        <p className="truncate font-medium text-foreground">{file.name}</p>
        <p className="truncate text-tertiary">{browserMeta(file)}</p>
      </div>
      <SelectedRing show={selected} />
    </label>
  )
}

function BrowseRow({ file, first, selected, focused, onToggle, onFocus }: { file: DriveFile; first: boolean; selected: boolean; focused: boolean; onToggle: () => void; onFocus: () => void }) {
  const KindIcon = file.kind === 'video' ? Video : Image
  return (
    <label onClick={onFocus} className={cn('flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-subtle', !first && 'border-t', focused && 'bg-primary-subtle hover:bg-primary-subtle')}>
      <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Select ${file.name}`} />
      <Thumbnail tone={file.tone} ratio={16 / 9} className="h-[27px] w-12 rounded-sm" />
      <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-foreground">{file.name}</span>
      <span className="flex shrink-0 items-center gap-1.5 text-caption text-tertiary">
        <KindIcon aria-hidden className="size-3" />
        {browserMeta(file)}
      </span>
    </label>
  )
}

function EmptyListing({ listing, query }: { listing: DriveListing; query: string }) {
  if (query) return <EmptyState variant="plain" icon={Folder} title={`No files match “${query}”`} description={`Nothing in ${listing.title} matches that name.`} className="py-12" />
  if (listing.id === 'shared') return <EmptyState variant="plain" icon={Users} title="Nothing shared with you yet" description="Files other people share with your Google account show up here." className="py-12" />
  return <EmptyState variant="plain" icon={Folder} title="No videos or images here" description="This folder has no media Relay can publish. Open a subfolder or another folder." className="py-12" />
}
