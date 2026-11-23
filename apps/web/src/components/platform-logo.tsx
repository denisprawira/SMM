import facebook from '@/assets/brand/facebook.svg'
import instagram from '@/assets/brand/instagram.svg'
import stackedFacebook from '@/assets/brand/stacked-facebook.svg'
import stackedInstagram from '@/assets/brand/stacked-instagram.svg'
import stackedTiktok from '@/assets/brand/stacked-tiktok.svg'
import stackedYoutube from '@/assets/brand/stacked-youtube.svg'
import tiktok from '@/assets/brand/tiktok.svg'
import youtube from '@/assets/brand/youtube.svg'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'

const LOGO: Record<Platform, string> = { tiktok, instagram, facebook, youtube }
/** Same marks with a 2px white ring, used where logos overlap. */
const STACKED: Record<Platform, string> = { tiktok: stackedTiktok, instagram: stackedInstagram, facebook: stackedFacebook, youtube: stackedYoutube }

/** Figma "Platform Logo" (6:248) — brand mark per social platform. Resize to 14/16/18/20/24/28/32/36. */
export function PlatformLogo({ platform, size = 24, stacked = false, className }: { platform: Platform; size?: number; stacked?: boolean; className?: string }) {
  return (
    <img
      src={stacked ? STACKED[platform] : LOGO[platform]}
      alt={PLATFORM_LABEL[platform]}
      width={size}
      height={size}
      draggable={false}
      className={cn('block shrink-0', className)}
      style={{ width: size, height: size }}
    />
  )
}

/** Overlapping platform logos (−4px overlap), e.g. a post's targets. */
export function PlatformStack({ platforms, size = 20, className }: { platforms: Platform[]; size?: number; className?: string }) {
  return (
    <div className={cn('flex shrink-0 items-center', className)}>
      {platforms.map((platform, i) => (
        <PlatformLogo key={platform} platform={platform} size={size} stacked={platforms.length > 1} className={i < platforms.length - 1 ? '-mr-1' : undefined} />
      ))}
    </div>
  )
}

/** Figma "Account Chip" (11:460) — 16px platform logo + handle. */
export function AccountChip({ platform, handle, className }: { platform: Platform; handle: string; className?: string }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      <PlatformLogo platform={platform} size={16} />
      <span className="truncate text-body-sm text-foreground">{handle}</span>
    </span>
  )
}
