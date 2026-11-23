import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, CircleCheck, ExternalLink, Eye, Folder, Image, RefreshCw, Send, Video, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GoogleDriveLogo } from '@/components/brand'
import { EmptyState } from '@/components/empty-state'
import { PageContent, PageHeader } from '@/components/page'
import { SearchInput } from '@/components/search-input'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { driveQueryOptions, fileTotal, syncedAgo, useSyncDrive, type DriveState } from '@/features/drive/api'
import { ChangeFolderDialog } from '@/features/drive/components/change-folder-dialog'
import type { DriveFile } from '@/features/drive/data'
import { driveFileUrl, formatCount, formatDuration, formatShortDate, formatSize, formatTotal } from '@/features/drive/format'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import {
  DURATION_OPTIONS,
  filterFiles,
  hasFilters,
  libraryFilesQueryOptions,
  MODIFIED_OPTIONS,
  SORT_OPTIONS,
  TYPE_OPTIONS,
  validateLibrarySearch,
  type LibrarySearch,
} from './api'
import { FileCard, SelectedRing } from './components/file-card'
import { FilePreview } from './components/file-preview'
import { LibraryTopbar } from './components/library-chrome'
import { DriveNotConnected, LIBRARY_DESCRIPTION, NoResults } from './components/library-states'
import { ViewToggle } from './components/view-toggle'
import { sendToCreatePost, useLibrarySelection } from './selection'

const route = getRouteApi('/_app/library')

export function LibraryPage() {
  const { data: drive } = useSuspenseQuery(driveQueryOptions)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <>
      {drive.connected ? (
        <>
          <LibraryTopbar searchActive={searchOpen} onSearch={() => setSearchOpen((o) => !o)} onFilter={() => setFiltersOpen(true)} />
          <ConnectedLibrary drive={drive} searchOpen={searchOpen} filtersOpen={filtersOpen} onFiltersOpenChange={setFiltersOpen} />
        </>
      ) : (
        <>
          <LibraryTopbar />
          <DriveNotConnected />
        </>
      )}
      {/* /library/browse — the Drive browser modal. */}
      <Outlet />
    </>
  )
}

/* ── Connected library ─────────────────────────────────────────────── */

function ConnectedLibrary({
  drive,
  searchOpen,
  filtersOpen,
  onFiltersOpenChange,
}: {
  drive: DriveState
  searchOpen: boolean
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
}) {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const goTo = useNavigate()
  const { data: files } = useSuspenseQuery(libraryFilesQueryOptions(drive.folderId))
  const results = useMemo(() => filterFiles(files, search), [files, search])
  const selection = useLibrarySelection()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [folderOpen, setFolderOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  // Search inputs are uncontrolled (the URL updates async); bump to reset them.
  const [searchKey, setSearchKey] = useState(0)

  const setSearch = (patch: Partial<Record<keyof LibrarySearch, string | undefined>>) =>
    navigate({ search: (prev) => validateLibrarySearch({ ...prev, ...patch }), replace: true })
  const clearSearch = () => {
    setSearchKey((k) => k + 1)
    setSearch(search.q ? { q: undefined } : { q: undefined, type: undefined, duration: undefined, modified: undefined })
  }

  const selected = files.filter((f) => selection.ids.includes(f.id))
  const counts = drive.folder.counts
  const total = fileTotal(drive)
  const onlyType = search.type && !search.q && !search.duration && !search.modified
  const count = !hasFilters(search) ? total : onlyType ? (search.type === 'video' ? counts.videos : counts.images) : results.length
  const view = search.view ?? 'grid'

  const createPost = () => {
    sendToCreatePost(selected.map((f) => f.id))
    selection.clear()
    goTo({ to: '/create' })
  }

  const grid = (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-x-3.5 md:gap-y-4 lg:grid-cols-4 xl:grid-cols-5">
      {results.map((file) => (
        <FileCard key={file.id} file={file} selected={selection.ids.includes(file.id)} onToggle={() => selection.toggle(file.id)} square={isMobile} />
      ))}
    </div>
  )

  return (
    <PageContent className={cn(selected.length > 0 && 'max-md:pb-22')}>
      <PageHeader
        title="Content Library"
        description={LIBRARY_DESCRIPTION}
        className="hidden md:flex"
        actions={
          <>
            <Button asChild variant="outline">
              <a href={driveFileUrl()} target="_blank" rel="noreferrer">
                <ExternalLink />
                Open in Drive
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/library/browse" search={search}>
                <Folder />
                Browse Drive
              </Link>
            </Button>
          </>
        }
      />

      <DriveSourceBar drive={drive} onChangeFolder={() => setFolderOpen(true)} />
      <MobileDriveChip drive={drive} onChangeFolder={() => setFolderOpen(true)} />

      {/* Desktop / tablet toolbar */}
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        <SearchInput
          key={searchKey}
          defaultValue={search.q ?? ''}
          onChange={(e) => setSearch({ q: e.target.value })}
          placeholder="Search by file name…"
          aria-label="Search by file name"
          containerClassName="w-[320px]"
        />
        <FilterSelect label="File type" value={search.type ?? 'all'} options={TYPE_OPTIONS} onChange={(type) => setSearch({ type })} />
        <FilterSelect label="Duration" value={search.duration ?? 'any'} options={DURATION_OPTIONS} onChange={(duration) => setSearch({ duration })} />
        <FilterSelect label="Modified" value={search.modified ?? 'any'} options={MODIFIED_OPTIONS} onChange={(modified) => setSearch({ modified })} />
        <FilterSelect label="Sort" value={search.sort ?? 'modified'} options={SORT_OPTIONS} onChange={(sort) => setSearch({ sort })} />
        <span className="min-w-0 flex-1" />
        <span className="text-body-sm whitespace-nowrap text-tertiary">
          {formatCount(count)} {count === 1 ? 'file' : 'files'}
        </span>
        <ViewToggle value={view} onValueChange={(v) => setSearch({ view: v })} />
      </div>

      {/* Mobile: search row + type chips */}
      {(searchOpen || search.q) && (
        <SearchInput
          key={`m-${searchKey}`}
          autoFocus={searchOpen}
          defaultValue={search.q ?? ''}
          onChange={(e) => setSearch({ q: e.target.value })}
          placeholder="Search by file name…"
          aria-label="Search by file name"
          containerClassName="md:hidden"
        />
      )}
      <MobileChips drive={drive} search={search} onChange={setSearch} />

      {selected.length > 0 && (
        <SelectionBar
          files={selected}
          visible={results}
          selectedIds={selection.ids}
          onSelectVisible={(all) => selection.set(all ? [...new Set([...selection.ids, ...results.map((f) => f.id)])] : selection.ids.filter((id) => !results.some((f) => f.id === id)))}
          onClear={selection.clear}
          onPreview={() => setPreviewOpen(true)}
          onCreate={createPost}
        />
      )}

      {files.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No videos or images in this folder yet"
          description={`Add media to ${drive.folder.name} in your Drive, or point the Library at another folder.`}
          action={
            <Button variant="outline" size="sm" onClick={() => setFolderOpen(true)}>
              Change folder
            </Button>
          }
        />
      ) : results.length === 0 ? (
        <NoResults query={search.q} onClear={clearSearch} />
      ) : view === 'list' ? (
        <>
          <FileTable files={results} selectedIds={selection.ids} onToggle={selection.toggle} className="hidden md:block" />
          <div className="md:hidden">{grid}</div>
        </>
      ) : (
        grid
      )}

      {selected.length > 0 && (
        <div className="fixed inset-x-4 bottom-24 z-30 flex items-center gap-2.5 rounded-[14px] bg-inverse py-2.5 pr-2.5 pl-3.5 shadow-lg md:hidden">
          <p className="text-body-sm font-medium text-primary-foreground">{selected.length} selected</p>
          <span className="flex-1" />
          <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={selection.clear} className="text-white/70 hover:bg-white/10 hover:text-white">
            <X />
          </Button>
          <Button size="sm" onClick={createPost}>
            <Send />
            Create Post
          </Button>
        </div>
      )}

      <MobileFilterSheet open={filtersOpen} onOpenChange={onFiltersOpenChange} search={search} onChange={setSearch} />
      <ChangeFolderDialog drive={drive} open={folderOpen} onOpenChange={setFolderOpen} />
      <PreviewDialog files={selected} contentFolderId={drive.folderId} open={previewOpen} onOpenChange={setPreviewOpen} />
    </PageContent>
  )
}

/* ── Toolbar pieces ────────────────────────────────────────────────── */

function FilterSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Figma "Drive source" (17:564): which Drive folder the Library mirrors, sync status, change / refresh. */
function DriveSourceBar({ drive, onChangeFolder }: { drive: DriveState; onChangeFolder: () => void }) {
  const sync = useSyncDrive()
  return (
    <div className="hidden min-w-0 items-center gap-2.5 rounded-[10px] border bg-subtle px-3 py-2.5 md:flex">
      <GoogleDriveLogo size={18} />
      <span className="text-body-sm text-muted-foreground">Showing</span>
      <span className="min-w-0 truncate text-body-sm font-medium text-foreground">{drive.folder.path}</span>
      <span className="hidden text-body-sm text-tertiary lg:inline">·</span>
      <span className="hidden truncate text-body-sm text-muted-foreground lg:inline">{drive.email}</span>
      <span className="min-w-0 flex-1" />
      <CircleCheck aria-hidden className="size-3.5 shrink-0 text-success" />
      <span className="text-caption whitespace-nowrap text-muted-foreground">{sync.isPending ? 'Syncing…' : `Synced ${syncedAgo(drive.lastSyncedAt)}`}</span>
      <Button variant="ghost" size="sm" onClick={onChangeFolder}>
        Change folder
      </Button>
      <Button variant="ghost" size="sm" onClick={() => sync.mutate()} disabled={sync.isPending}>
        <RefreshCw className={cn(sync.isPending && 'animate-spin')} />
        Refresh
      </Button>
    </div>
  )
}

/** M02: compact Drive source chip. */
function MobileDriveChip({ drive, onChangeFolder }: { drive: DriveState; onChangeFolder: () => void }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-[10px] bg-subtle px-2.5 py-2 md:hidden">
      <GoogleDriveLogo size={14} />
      <span className="min-w-0 truncate text-caption font-medium text-muted-foreground">
        {drive.folder.name} · synced {syncedAgo(drive.lastSyncedAt)}
      </span>
      <span className="flex-1" />
      <button type="button" onClick={onChangeFolder} className="shrink-0 rounded-sm text-caption font-medium text-primary-text outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/20">
        Change
      </button>
    </div>
  )
}

const chip =
  'h-7 min-w-0 shrink-0 gap-1.5 rounded-full border bg-background px-3 text-caption font-medium text-muted-foreground shadow-none hover:bg-subtle hover:text-muted-foreground data-[state=on]:border-inverse data-[state=on]:bg-inverse data-[state=on]:text-primary-foreground data-[spacing=0]:rounded-full'

/** M02 filter chips: type (single select) + "< 1 min". */
function MobileChips({ drive, search, onChange }: { drive: DriveState; search: LibrarySearch; onChange: (patch: Partial<Record<keyof LibrarySearch, string | undefined>>) => void }) {
  const c = drive.folder.counts
  const type = search.type ?? 'all'
  const items = [
    { value: 'all', label: 'All', count: c.videos + c.images },
    { value: 'video', label: 'Videos', count: c.videos },
    { value: 'image', label: 'Images', count: c.images },
  ]
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:hidden [&::-webkit-scrollbar]:hidden">
      <ToggleGroup type="single" spacing={2} value={type} onValueChange={(v) => v && onChange({ type: v })} aria-label="File type" className="shrink-0">
        {items.map((i) => (
          <ToggleGroupItem key={i.value} value={i.value} className={cn(chip, 'group/chip')}>
            {i.label}
            <span className="text-tertiary group-data-[state=on]/chip:text-primary-foreground">{formatCount(i.count)}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ToggleGroup type="single" spacing={2} value={search.duration === 'short' ? 'short' : ''} onValueChange={(v) => onChange({ duration: v || undefined })} aria-label="Duration" className="shrink-0">
        <ToggleGroupItem value="short" className={chip}>
          &lt; 1 min
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

/** Mobile filter sheet (Icon/filter in the M02 header). */
function MobileFilterSheet({
  open,
  onOpenChange,
  search,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: LibrarySearch
  onChange: (patch: Partial<Record<keyof LibrarySearch, string | undefined>>) => void
}) {
  const field = (label: string, el: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-caption font-medium text-muted-foreground">{label}</span>
      {el}
    </div>
  )
  const full = <T extends string>(label: string, value: T, options: { value: T; label: string }[], key: keyof LibrarySearch) => (
    <Select value={value} onValueChange={(v) => onChange({ [key]: v })}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 rounded-t-2xl">
        <SheetHeader className="px-4 pt-5 pb-3">
          <SheetTitle className="text-h3">Filter files</SheetTitle>
          <SheetDescription className="text-body-sm">Narrow the Drive files shown in your Library.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          {field('Type', full('File type', search.type ?? 'all', TYPE_OPTIONS, 'type'))}
          {field('Duration', full('Duration', search.duration ?? 'any', DURATION_OPTIONS, 'duration'))}
          {field('Modified', full('Modified', search.modified ?? 'any', MODIFIED_OPTIONS, 'modified'))}
          {field('Sort', full('Sort', search.sort ?? 'modified', SORT_OPTIONS, 'sort'))}
        </div>
        <SheetFooter className="flex-row gap-2 px-4 pt-5 pb-8">
          <Button variant="outline" className="flex-1" onClick={() => onChange({ type: undefined, duration: undefined, modified: undefined, sort: undefined })}>
            Reset
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/* ── Selection ─────────────────────────────────────────────────────── */

/** Figma "Selection bar" (17:622). */
function SelectionBar({
  files,
  visible,
  selectedIds,
  onSelectVisible,
  onClear,
  onPreview,
  onCreate,
}: {
  files: DriveFile[]
  visible: DriveFile[]
  selectedIds: readonly string[]
  onSelectVisible: (all: boolean) => void
  onClear: () => void
  onPreview: () => void
  onCreate: () => void
}) {
  const allVisible = visible.length > 0 && visible.every((f) => selectedIds.includes(f.id))
  const totalMb = files.reduce((sum, f) => sum + f.sizeMb, 0)
  return (
    <div className="hidden items-center gap-3 rounded-[10px] border border-focus bg-primary-subtle py-2 pr-2 pl-3.5 md:flex">
      <Checkbox
        checked={allVisible ? true : 'indeterminate'}
        onCheckedChange={() => onSelectVisible(!allVisible)}
        aria-label={allVisible ? 'Deselect all shown files' : 'Select all shown files'}
      />
      <p className="text-body-sm font-medium whitespace-nowrap text-primary-text">
        {files.length} {files.length === 1 ? 'file' : 'files'} selected
      </p>
      <p className="hidden text-body-sm whitespace-nowrap text-muted-foreground lg:block">· {formatTotal(totalMb)} total</p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
      <span className="min-w-0 flex-1" />
      <Button variant="outline" size="sm" onClick={onPreview}>
        <Eye />
        Preview
      </Button>
      <Button size="sm" onClick={onCreate}>
        <Send />
        Create Post
      </Button>
    </div>
  )
}

/** "Preview" — step through the selected files' streamed previews. */
function PreviewDialog({ files, contentFolderId, open, onOpenChange }: { files: DriveFile[]; contentFolderId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [index, setIndex] = useState(0)
  const i = Math.min(index, Math.max(files.length - 1, 0))
  const file = files[i]
  return (
    <Dialog
      open={open && !!file}
      onOpenChange={(next) => {
        if (!next) setIndex(0)
        onOpenChange(next)
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-90">
        <div className="flex items-center gap-1 border-b py-3 pr-3 pl-4">
          <DialogTitle className="text-h3">Preview</DialogTitle>
          <DialogDescription className="ml-1 text-caption text-tertiary">
            {i + 1} of {files.length} selected
          </DialogDescription>
          <span className="flex-1" />
          <Button variant="ghost" size="icon-sm" aria-label="Previous file" disabled={i === 0} onClick={() => setIndex(i - 1)}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next file" disabled={i >= files.length - 1} onClick={() => setIndex(i + 1)}>
            <ChevronRight />
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close">
              <X />
            </Button>
          </DialogClose>
        </div>
        {file && <FilePreview file={file} contentFolderId={contentFolderId} className="p-4" />}
      </DialogContent>
    </Dialog>
  )
}

/* ── List view ─────────────────────────────────────────────────────── */

function FileTable({ files, selectedIds, onToggle, className }: { files: DriveFile[]; selectedIds: readonly string[]; onToggle: (id: string) => void; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card', className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 pl-4" />
            <TableHead className="text-caption font-medium text-tertiary">Name</TableHead>
            <TableHead className="text-caption font-medium text-tertiary">Type</TableHead>
            <TableHead className="text-caption font-medium text-tertiary">Duration</TableHead>
            <TableHead className="text-caption font-medium text-tertiary">Size</TableHead>
            <TableHead className="pr-4 text-right text-caption font-medium text-tertiary">Modified</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((f) => {
            const checked = selectedIds.includes(f.id)
            const KindIcon = f.kind === 'video' ? Video : Image
            return (
              <TableRow key={f.id} data-state={checked ? 'selected' : undefined} onClick={() => onToggle(f.id)} className="cursor-pointer data-[state=selected]:bg-primary-subtle">
                <TableCell className="pl-4">
                  <Checkbox checked={checked} onCheckedChange={() => onToggle(f.id)} onClick={(e) => e.stopPropagation()} aria-label={`Select ${f.name}`} />
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <Thumbnail tone={f.tone} ratio={16 / 9} className="h-9 w-16 rounded-md">
                      <SelectedRing show={checked} />
                    </Thumbnail>
                    <span className="truncate text-body-sm font-medium text-foreground">{f.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                    <KindIcon aria-hidden className="size-3.5 text-tertiary" />
                    {f.format}
                  </span>
                </TableCell>
                <TableCell className="text-body-sm text-muted-foreground tabular-nums">{f.durationSec ? formatDuration(f.durationSec) : '—'}</TableCell>
                <TableCell className="text-body-sm text-muted-foreground tabular-nums">{formatSize(f.sizeMb)}</TableCell>
                <TableCell className="pr-4 text-right text-body-sm text-muted-foreground">{formatShortDate(f.modified)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
