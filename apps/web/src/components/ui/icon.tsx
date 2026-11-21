import { cn } from '@/lib/cn'

type IconProps = {
  /** Imported Figma SVG asset URL. */
  src: string
  /** Rendered size in px (square). */
  size?: number
  className?: string
  /** Leave empty for decorative icons. */
  alt?: string
}

/** Renders an exported Figma icon at its design size. */
export function Icon({ src, size = 16, className, alt = '' }: IconProps) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      width={size}
      height={size}
      draggable={false}
      className={cn('block shrink-0 select-none', className)}
      style={{ width: size, height: size }}
    />
  )
}
