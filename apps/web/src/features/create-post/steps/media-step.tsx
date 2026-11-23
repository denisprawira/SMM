import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ChevronRight, CircleCheck, ExternalLink, Search, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { GoogleDriveLogo } from '@/components/brand'
import { EmptyState } from '@/components/empty-state'
import { PlatformLogo } from '@/components/platform-logo'
import { SearchInput } from '@/components/search-input'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PLATFORM_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'
import { accountsQueryOptions, driveFilesQueryOptions, type DriveFile } from '../api'
import { StepBody } from '../components/step-body'
import { MAX_IMAGES, toggleMedia, useDraft } from '../draft-store'
import { compatNote, isCarousel, PLATFORM_ORDER, selectedMedia, type MediaType } from '../model'

const route = getRouteApi('/create/media')

const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: 'videos', label: 'Videos' },
  { value: 'images', label: 'Images' },
  { value: 'all', label: 'All files' },
]

export function MediaStep() {
  const { type = 'videos', q = '' } = route.useSearch()
  const navigate = route.useNavigate()
  const draft = useDraft()
  const { data: files } = useSuspenseQuery(driveFilesQueryOptions)

  const query = q.trim().toLowerCase()
  const visible = files.filter((f) => (type === 'all' || (type === 'videos' ? f.kind === 'video' : f.kind === 'image')) && (!query || f.name.toLowerCase().includes(query)))
  const media = selectedMedia(draft, files)

  const setSearch = (next: { type?: MediaType; q?: string }) =>
    navigate({
      search: (prev) => {
        const t = next.type ?? prev.type ?? 'videos'
        const text = next.q ?? prev.q ?? ''
        return { type: t === 'videos' ? undefined : t, q: text.trim() ? text : undefined }
      },
      replace: true,
    })

  const onToggle = (file: DriveFile) => {
    if (!toggleMedia(file, files)) toast.info(`Up to ${MAX_IMAGES} images`, { description: 'A carousel holds at most 10 images. Deselect one to add another.' })
  }

  return (
    <StepBody
      title="Select media from Google Drive"
      description="Pick a video or up to 10 images. Multiple images publish as a carousel where supported."
      actions={
        <div className="flex w-full flex-wrap items-center gap-2">
          <nav aria-label="Drive folder" className="flex h-9 min-w-0 items-center gap-1 rounded-lg border bg-background px-3">
            <GoogleDriveLogo size={16} />
            <span className="text-body-sm whitespace-nowrap text-muted-foreground">My Drive</span>
            <ChevronRight aria-hidden className="size-3.5 shrink-0 text-tertiary" />
            <span className="text-body-sm whitespace-nowrap text-muted-foreground">Northwind</span>
            <ChevronRight aria-hidden className="size-3.5 shrink-0 text-tertiary" />
            <span aria-current="page" className="text-body-sm font-medium whitespace-nowrap text-foreground">
              Content 2025
            </span>
          </nav>
          <SearchInput placeholder="Search Drive…" aria-label="Search Drive" value={q} onChange={(e) => setSearch({ q: e.target.value })} containerClassName="w-full sm:w-[240px]" />
          <Select value={type} onValueChange={(v) => setSearch({ type: v as MediaType })}>
            <SelectTrigger aria-label="File type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden flex-1 lg:block" />
          <Button asChild variant="ghost" size="sm">
            <a href="https://drive.google.com/drive/my-drive" target="_blank" rel="noreferrer">
              <ExternalLink />
              Browse all of Drive
            </a>
          </Button>
        </div>
      }
    >
      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title={query ? `No files match “${q.trim()}”` : `No ${type === 'images' ? 'images' : 'videos'} in this folder`}
          description="Try a different name or file type, or browse all of Drive."
          action={
            <Button variant="outline" size="sm" onClick={() => setSearch({ q: '', type: 'all' })}>
              Show all files
            </Button>
          }
        />
      ) : (
        <div role="group" aria-label="Drive files" className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] md:gap-3.5">
          {visible.map((file) => (
            <FileCard key={file.id} file={file} selected={draft.mediaIds.includes(file.id)} onToggle={() => onToggle(file)} />
          ))}
        </div>
      )}

      {media.length > 0 && <CompatibilityCard media={media} />}
    </StepBody>
  )
}

function FileCard({ file, selected, onToggle }: { file: DriveFile; selected: boolean; onToggle: () => void }) {
  return (
    <label
      className={cn(
        'group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[10px] border bg-card transition-[border-color,box-shadow] hover:border-strong has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/20',
        selected && 'border-primary ring-1 ring-primary hover:border-primary',
      )}
    >
      <span className="relative block">
        <Thumbnail tone={file.tone} kind={file.kind} duration={file.duration} ratio={196 / 122} className="aspect-[196/122] h-auto w-full rounded-none" />
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Select ${file.name}`} className="absolute top-2 left-2 focus-visible:ring-0" />
      </span>
      <span className="flex min-w-0 flex-col gap-[3px] px-2.5 pt-2 pb-2.5">
        <span className="truncate text-caption font-medium text-foreground" title={file.name}>
          {file.name}
        </span>
        {file.warning ? (
          <span className="flex min-w-0 items-center gap-1 text-caption text-warning-text">
            <TriangleAlert aria-hidden className="size-3 shrink-0 text-warning" />
            <span className="truncate">{file.warning}</span>
          </span>
        ) : (
          <span className="truncate text-caption text-tertiary">{file.kind === 'video' ? `${file.format} · ${file.duration}` : `${file.format} · ${file.resolution}`}</span>
        )}
      </span>
    </label>
  )
}

function CompatibilityCard({ media }: { media: DriveFile[] }) {
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions)
  const connected = PLATFORM_ORDER.filter((p) => accounts.some((a) => a.platform === p && a.status === 'connected'))
  const notes = connected.map((platform) => ({ platform, ...compatNote(platform, media) }))
  const blocked = notes.filter((n) => !n.ok).map((n) => PLATFORM_LABEL[n.platform])
  const name = isCarousel(media) ? (media.length === 1 ? 'This image' : `These ${media.length} images`) : media[0].name
  const allOk = blocked.length === 0

  return (
    <section aria-label="Platform compatibility" className="flex w-full flex-col gap-2.5 rounded-xl border bg-card p-4 shadow-xs">
      <p className="flex items-start gap-2 text-body-sm font-medium text-foreground">
        {allOk ? <CircleCheck aria-hidden className="mt-px size-4 shrink-0 text-success" /> : <TriangleAlert aria-hidden className="mt-px size-4 shrink-0 text-warning" />}
        <span>
          {allOk
            ? `${name} ${isCarousel(media) && media.length > 1 ? 'work' : 'works'} on every platform you’ve connected`
            : `${name} can’t publish to ${blocked.join(' or ')} — those accounts are unavailable in the next step`}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {notes.map((n) => (
          <span key={n.platform} className="flex items-center gap-1.5">
            <PlatformLogo platform={n.platform} size={16} className={n.ok ? undefined : 'opacity-50'} />
            <span className={cn('text-caption whitespace-nowrap', n.ok ? 'text-muted-foreground' : 'text-warning-text')}>{n.text}</span>
          </span>
        ))}
      </div>
    </section>
  )
}
