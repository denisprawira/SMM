import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { PlatformLogo } from '@/components/platform-logo'
import { Thumbnail } from '@/components/thumbnail'
import type { Platform, ThumbnailTone } from '@/lib/types'
import { cn } from '@/lib/utils'

const FEED_LABEL: Record<Platform, string> = { tiktok: 'For You', instagram: 'Reels', youtube: 'Shorts', facebook: 'Reels' }

/**
 * Figma "Phone preview": 236×480 screen in an 8px inverse bezel, drawn with
 * CSS + Thumbnail — the media tone, a bottom scrim, feed label, action rail
 * and the caption (title for YouTube) clamped to three lines.
 */
export function PhonePreview({ platform, handle, text, tone, slides = 1, className }: { platform: Platform; handle: string; text: string; tone: ThumbnailTone; slides?: number; className?: string }) {
  return (
    <div className={cn('shrink-0 rounded-[36px] bg-inverse p-2', className)} role="img" aria-label={`${FEED_LABEL[platform]} preview for ${handle}`}>
      <div className="relative h-[480px] w-[236px] overflow-hidden rounded-[28px] bg-inverse">
        <Thumbnail tone={tone} ratio={236 / 480} className="absolute inset-0 h-full w-full rounded-none" />
        <span aria-hidden className="absolute inset-x-0 top-[260px] h-[220px] bg-linear-to-b from-black/0 to-black/70" />
        <div className="absolute inset-x-0 top-0 flex items-center gap-1.5 px-3.5 py-4">
          <PlatformLogo platform={platform} size={16} />
          <span className="text-caption font-medium text-white">{FEED_LABEL[platform]}</span>
        </div>
        <div aria-hidden className="absolute top-[250px] left-[196px] flex flex-col items-center gap-3.5 text-white">
          {[Heart, MessageCircle, Share2].map((Icon, i) => (
            <span key={i} className="flex flex-col items-center gap-0.5">
              <Icon className="size-[22px]" strokeWidth={2} />
              <span className="text-caption font-medium">—</span>
            </span>
          ))}
        </div>
        <div className="absolute bottom-5 left-3.5 flex w-[176px] flex-col gap-1 text-white">
          <p className="truncate text-body-sm font-medium">{handle}</p>
          {text && <p className="line-clamp-3 text-caption break-words">{text}</p>}
        </div>
        {slides > 1 && (
          <div aria-hidden className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {Array.from({ length: Math.min(slides, 10) }, (_, i) => (
              <span key={i} className={cn('size-1.5 rounded-full', i === 0 ? 'bg-white' : 'bg-white/50')} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
