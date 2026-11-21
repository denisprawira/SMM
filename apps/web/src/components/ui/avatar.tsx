import { cn } from '@/lib/cn'

export type AvatarSize = 'sm' | 'md' | 'lg'

const SIZE: Record<AvatarSize, string> = {
  sm: 'size-6 text-caption',
  md: 'size-8 text-body-sm',
  lg: 'size-10 text-body',
}

/** Figma "Avatar" — initials on accent/subtle. */
export function Avatar({ initials, size = 'md', className }: { initials: string; size?: AvatarSize; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-subtle font-medium whitespace-nowrap text-accent-text',
        SIZE[size],
        className,
      )}
    >
      {initials}
    </span>
  )
}
