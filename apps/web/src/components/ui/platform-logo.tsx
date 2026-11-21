import facebook from '@/assets/figma/platforms/facebook.svg'
import instagram from '@/assets/figma/platforms/instagram.svg'
import stackedFacebook from '@/assets/figma/platforms/stacked-facebook.svg'
import stackedInstagram from '@/assets/figma/platforms/stacked-instagram.svg'
import stackedTiktok from '@/assets/figma/platforms/stacked-tiktok.svg'
import stackedYoutube from '@/assets/figma/platforms/stacked-youtube.svg'
import tiktok from '@/assets/figma/platforms/tiktok.svg'
import youtube from '@/assets/figma/platforms/youtube.svg'
import { cn } from '@/lib/cn'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'

const LOGO: Record<Platform, string> = { tiktok, instagram, facebook, youtube }
/** Variant with a 2px white ring, used when logos overlap. */
const STACKED: Record<Platform, string> = {
  tiktok: stackedTiktok,
  instagram: stackedInstagram,
  facebook: stackedFacebook,
  youtube: stackedYoutube,
}

/** Figma "Platform Logo" — resize to 14/16/20/22/24/32. */
export function PlatformLogo({
  platform,
  size = 24,
  stacked = false,
  className,
}: {
  platform: Platform
  size?: number
  stacked?: boolean
  className?: string
}) {
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
        <PlatformLogo key={platform} platform={platform} size={size} stacked className={i < platforms.length - 1 ? '-mr-1' : undefined} />
      ))}
    </div>
  )
}

/** Figma "Account Chip" — platform logo + handle. */
export function AccountChip({ platform, handle, className }: { platform: Platform; handle: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <PlatformLogo platform={platform} size={16} />
      <span className="text-body-sm whitespace-nowrap text-primary">{handle}</span>
    </span>
  )
}
