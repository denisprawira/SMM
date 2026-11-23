import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  /** Lucide icon, or a brand mark node (e.g. `<GoogleDriveLogo size={30} />`). */
  icon: LucideIcon | ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** `card` = bordered surface (Figma State patterns 30:903); `plain` = centred in the page. */
  variant?: 'card' | 'plain'
  /** `lg` = full-page empty state (56px tile, H2 title). */
  size?: 'default' | 'lg'
  className?: string
  children?: ReactNode
}

function isLucide(icon: EmptyStateProps['icon']): icon is LucideIcon {
  return typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon && 'render' in icon)
}

/** Figma empty treatment: icon tile, Body/Medium title, Body/Small secondary text, optional action. */
export function EmptyState({ icon, title, description, action, variant = 'card', size = 'default', className, children }: EmptyStateProps) {
  const Icon = isLucide(icon) ? icon : null
  const lg = size === 'lg'
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2.5 text-center',
        variant === 'card' && 'rounded-xl border bg-card p-7 shadow-xs',
        className,
      )}
    >
      <span className={cn('flex shrink-0 items-center justify-center rounded-xl border bg-subtle text-muted-foreground', lg ? 'size-14' : 'size-11')}>
        {Icon ? <Icon aria-hidden className={lg ? 'size-6' : 'size-5'} /> : (icon as ReactNode)}
      </span>
      <p className={cn('text-foreground', lg ? 'mt-1.5 text-h2' : 'text-body font-medium')}>{title}</p>
      {description && <p className={cn('max-w-[440px] text-muted-foreground', lg ? 'text-body' : 'text-body-sm')}>{description}</p>}
      {action && <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{action}</div>}
      {children}
    </div>
  )
}
