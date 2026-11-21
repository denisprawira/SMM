import type { CSSProperties, ReactNode } from 'react'
import ellipseA from '@/assets/figma/thumbnail/ellipse-a.svg'
import ellipseB from '@/assets/figma/thumbnail/ellipse-b.svg'
import imageIcon from '@/assets/figma/thumbnail/image.svg'
import playIcon from '@/assets/figma/thumbnail/play.svg'
import { cn } from '@/lib/cn'
import type { MediaKind, ThumbnailTone } from '@/lib/types'

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
  /** Shows the bottom-right chip: duration for video, glyph for image. */
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
 * Figma "Thumbnail" — placeholder for a Drive file preview (streamed via the
 * Drive thumbnail link, never stored). Resize freely; chip pins bottom-right.
 */
export function Thumbnail({ tone = 'sunset', kind, duration, ratio = 16 / 9, className, style, children }: ThumbnailProps) {
  const [from, to] = TONES[tone]
  const angle = 90 + (Math.atan((ratio * 4) / 3) * 180) / Math.PI
  return (
    <div
      className={cn('relative h-[90px] w-40 shrink-0 overflow-hidden rounded-lg', className)}
      style={{ backgroundImage: `linear-gradient(${angle}deg, ${from} 14.286%, ${to} 85.714%)`, ...style }}
    >
      <div className="absolute inset-[-15.56%_7.5%_53.33%_57.5%]">
        <img src={ellipseA} alt="" aria-hidden className="absolute inset-0 block size-full max-w-none" draggable={false} />
      </div>
      <div className="absolute inset-[64.44%_-6.25%_-64.44%_-31.25%]">
        <img src={ellipseB} alt="" aria-hidden className="absolute inset-0 block size-full max-w-none" draggable={false} />
      </div>
      {kind === 'video' && (
        <span className="absolute right-1.5 bottom-1.5 flex items-center gap-[3px] rounded-sm bg-black/62 px-[5px] py-px">
          <img src={playIcon} alt="" aria-hidden width={10} height={10} className="size-2.5" />
          <span className="text-caption font-medium whitespace-nowrap text-inverse">{duration}</span>
        </span>
      )}
      {kind === 'image' && (
        <span className="absolute right-1.5 bottom-1.5 flex items-center rounded-sm bg-black/62 p-[3px]">
          <img src={imageIcon} alt="" aria-hidden width={10} height={10} className="size-2.5" />
        </span>
      )}
      {children}
    </div>
  )
}
