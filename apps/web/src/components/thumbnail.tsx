import { Image, Play } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import type { MediaKind, ThumbnailTone } from '@/lib/types'
import { cn } from '@/lib/utils'

const TONES: Record<ThumbnailTone, [string, string]> = {
  sunset: ['rgb(246 160 122)', 'rgb(194 71 122)'],
  ocean: ['rgb(127 211 240)', 'rgb(45 91 168)'],
  forest: ['rgb(168 221 177)', 'rgb(47 107 79)'],
  studio: ['rgb(237 231 222)', 'rgb(174 156 136)'],
  night: ['rgb(75 81 138)', 'rgb(20 22 43)'],
  sand: ['rgb(245 223 174)', 'rgb(208 143 78)'],
  berry: ['rgb(226 182 238)', 'rgb(123 63 160)'],
  slate: ['rgb(183 193 206)', 'rgb(70 81 95)'],
}

type ThumbnailProps = {
  tone?: ThumbnailTone
  /** Bottom-right chip: duration for video, image glyph for image. */
  kind?: MediaKind
  duration?: string
  /**
   * Width ÷ height of the rendered box. Figma's gradient handle is relative to
   * the frame, so the CSS angle depends on aspect (1 → 143.13°, 16/9 → 157.13°).
   */
  ratio?: number
  /** Size/radius via className; defaults to the 160×90 component. */
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Figma "Thumbnail" (11:303) — placeholder for a Drive file preview (streamed
 * via the Drive thumbnail link, never stored). Gradient tone + two soft
 * ellipses, drawn with CSS. Resize freely; the chip pins bottom-right.
 */
export function Thumbnail({ tone = 'sunset', kind, duration, ratio = 16 / 9, className, style, children }: ThumbnailProps) {
  const [from, to] = TONES[tone]
  const angle = 90 + (Math.atan((ratio * 4) / 3) * 180) / Math.PI
  return (
    <div
      className={cn('relative h-[90px] w-40 shrink-0 overflow-hidden rounded-lg', className)}
      style={{ backgroundImage: `linear-gradient(${angle}deg, ${from} 14.286%, ${to} 85.714%)`, ...style }}
    >
      <span aria-hidden className="absolute inset-[-15.56%_7.5%_53.33%_57.5%] rounded-full bg-white/22" />
      <span aria-hidden className="absolute inset-[64.44%_-6.25%_-64.44%_-31.25%] rounded-[50%] bg-black/14" />
      {kind === 'video' && duration && (
        <span className="absolute right-1.5 bottom-1.5 flex items-center gap-[3px] rounded-sm bg-black/62 px-[5px] py-px">
          <Play aria-hidden className="size-2.5 fill-white text-white" />
          <span className="text-caption font-medium whitespace-nowrap text-white">{duration}</span>
        </span>
      )}
      {kind === 'image' && (
        <span className="absolute right-1.5 bottom-1.5 flex items-center rounded-sm bg-black/62 p-[3px]">
          <Image aria-hidden className="size-2.5 text-white" />
        </span>
      )}
      {children}
    </div>
  )
}
