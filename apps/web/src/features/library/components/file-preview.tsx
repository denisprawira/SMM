import { ExternalLink, Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PlatformLogo } from '@/components/platform-logo'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { DriveFile } from '@/features/drive/data'
import { aspectLabel, driveFileUrl, fileLocation, formatDuration, formatLongDate, formatSize, platformFit } from '@/features/drive/format'
import { cn } from '@/lib/utils'

const PLAYER_RATIO = 268 / 220

/**
 * Figma "Video player" (18:1311): the Drive preview streams into a 220px
 * bg/inverse stage, letter/pillar-boxed to the file's aspect ratio.
 */
function Player({ file }: { file: DriveFile }) {
  const total = file.durationSec ?? 0
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(() => Math.min(12, total))

  // Simulated playback of the streamed preview.
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => {
      setTime((s) => {
        if (s + 1 >= total) {
          setPlaying(false)
          return total
        }
        return s + 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [playing, total])

  const ratio = file.width / file.height
  const tall = ratio < PLAYER_RATIO
  return (
    <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-[10px] bg-inverse">
      <Thumbnail
        tone={file.tone}
        ratio={ratio}
        className={cn('absolute rounded-none', tall ? 'inset-y-0 left-1/2 h-full w-auto -translate-x-1/2' : 'inset-x-0 top-1/2 h-auto w-full -translate-y-1/2')}
        style={{ aspectRatio: `${file.width} / ${file.height}` }}
      />
      {file.kind === 'video' && (
        <>
          <button
            type="button"
            onClick={() => {
              if (!playing && time >= total) setTime(0)
              setPlaying((p) => !p)
            }}
            aria-label={playing ? 'Pause preview' : 'Play preview'}
            className="absolute top-1/2 left-1/2 flex size-12 -translate-1/2 items-center justify-center rounded-full bg-white/90 text-foreground transition-colors outline-none hover:bg-white focus-visible:ring-[3px] focus-visible:ring-white/50"
          >
            {playing ? <Pause aria-hidden className="size-5 fill-current" /> : <Play aria-hidden className="size-5 fill-current" />}
          </button>
          <div className="absolute inset-x-0 bottom-0 flex h-8 items-center gap-2 bg-linear-to-b from-black/0 to-black/60 px-2.5">
            <span className="text-caption font-medium whitespace-nowrap text-white tabular-nums">
              {formatDuration(time)} / {formatDuration(total)}
            </span>
            <Progress value={total ? (time / total) * 100 : 0} aria-label="Playback position" className="h-[3px] flex-1 bg-white/35 *:data-[slot=progress-indicator]:bg-white" />
          </div>
        </>
      )}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-caption">
      <dt className="w-[76px] shrink-0 text-tertiary">{label}</dt>
      <dd className="min-w-0 truncate font-medium text-foreground">{value}</dd>
    </div>
  )
}

const FIT_TONE = { fits: 'text-success-text', neutral: 'text-muted-foreground', issue: 'text-danger-text' } as const

/** Figma "Preview panel" body (18:1306): streamed preview, Drive metadata, platform fit. */
export function FilePreview({ file, contentFolderId, className }: { file: DriveFile; contentFolderId: string; className?: string }) {
  const ratio = aspectLabel(file.width, file.height)
  return (
    <div className={cn('flex flex-col gap-3.5', className)}>
      <Player key={file.id} file={file} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-body font-medium text-foreground">{file.name}</p>
        <p className="text-caption text-tertiary">Streaming preview from Google Drive</p>
      </div>
      <dl className="flex flex-col gap-2">
        {file.kind === 'video' && <MetaRow label="Duration" value={formatDuration(file.durationSec ?? 0)} />}
        <MetaRow label="Resolution" value={`${file.width} × ${file.height} (${ratio})`} />
        <MetaRow label="Size" value={formatSize(file.sizeMb)} />
        <MetaRow label="Format" value={file.codecs ? `${file.format} · ${file.codecs}` : file.format} />
        <MetaRow label="Modified" value={`${formatLongDate(file.modified)} by ${file.modifiedBy}`} />
        <MetaRow label="Location" value={fileLocation(file, contentFolderId)} />
      </dl>
      <div className="flex flex-col gap-1.5 rounded-lg bg-subtle p-2.5">
        <p className="text-caption font-medium text-muted-foreground">Platform fit</p>
        {platformFit(file).map((fit) => (
          <p key={fit.platform} className="flex items-center gap-1.5">
            <PlatformLogo platform={fit.platform} size={14} />
            <span className={cn('text-caption', FIT_TONE[fit.tone])}>{fit.label}</span>
          </p>
        ))}
      </div>
      <Button asChild variant="ghost" size="sm" className="self-start">
        <a href={driveFileUrl(file)} target="_blank" rel="noreferrer">
          <ExternalLink />
          Open in Drive
        </a>
      </Button>
    </div>
  )
}
