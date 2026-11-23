import googleDriveLogo from '@/assets/brand/google-drive.svg'
import relayLogo from '@/assets/brand/relay.svg'
import { cn } from '@/lib/utils'

/**
 * Brand marks (Figma "Logo/App", "Logo/Google Drive"). These are trademark
 * artwork, not icons — Lucide has no brand logos — so they stay as the
 * official image assets. Every UI icon in the app comes from lucide-react.
 */
export function RelayLogo({ size = 28, className }: { size?: number; className?: string }) {
  return <img src={relayLogo} alt="Relay" width={size} height={size} draggable={false} className={cn('block shrink-0', className)} style={{ width: size, height: size }} />
}

export function GoogleDriveLogo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <img src={googleDriveLogo} alt="Google Drive" width={size} height={size} draggable={false} className={cn('block shrink-0', className)} style={{ width: size, height: size }} />
  )
}
