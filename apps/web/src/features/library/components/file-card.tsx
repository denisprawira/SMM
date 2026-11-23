import { Image, Video } from 'lucide-react'
import { Thumbnail } from '@/components/thumbnail'
import { Checkbox } from '@/components/ui/checkbox'
import type { DriveFile } from '@/features/drive/data'
import { formatDuration, formatShortDate, libraryMeta } from '@/features/drive/format'
import { cn } from '@/lib/utils'

/** 2px accent ring drawn inside the card edge (Figma: border 2px accent/default), above the thumbnail. */
export function SelectedRing({ show }: { show: boolean }) {
  if (!show) return null
  return <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-primary" />
}

/**
 * Figma "File/<name>" card — desktop (17:644): 16:9 preview, name, type icon,
 * duration · size and modified date. Mobile tile (M02): square preview, name only.
 * The whole card is a label for its checkbox, so a click anywhere toggles it.
 */
export function FileCard({ file, selected, onToggle, square }: { file: DriveFile; selected: boolean; onToggle: () => void; square: boolean }) {
  const KindIcon = file.kind === 'video' ? Video : Image
  return (
    <label
      className={cn(
        'group relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[10px] border bg-card transition-colors hover:border-strong md:rounded-xl',
        selected && 'hover:border-primary',
      )}
    >
      <div className="relative">
        <Thumbnail
          tone={file.tone}
          kind={file.kind}
          duration={file.durationSec ? formatDuration(file.durationSec) : undefined}
          ratio={square ? 1 : 16 / 9}
          className="aspect-square h-auto w-full rounded-none md:aspect-video"
        />
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Select ${file.name}`}
          className={cn('absolute top-2 left-2 md:top-2.5 md:left-2.5', !selected && 'md:opacity-90')}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1 px-2.5 py-2 md:px-3 md:pt-2.5 md:pb-3">
        <p className="truncate text-caption font-medium text-foreground md:text-body-sm">{file.name}</p>
        <div className="hidden items-center gap-1.5 text-caption text-tertiary md:flex">
          <KindIcon aria-hidden className="size-3 shrink-0" />
          <span className="truncate">{libraryMeta(file)}</span>
          <span className="min-w-0 flex-1" />
          <span className="shrink-0">{formatShortDate(file.modified)}</span>
        </div>
      </div>
      <SelectedRing show={selected} />
    </label>
  )
}
