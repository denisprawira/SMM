import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Surface card: white, 1px border, 12px radius, shadow/xs. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-w-0 flex-col overflow-hidden rounded-xl border bg-surface shadow-xs', className)} {...props} />
}

type CardHeaderProps = {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

/** Card header: H3 title + body/small tertiary description, actions on the right. */
export function CardHeader({ title, description, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2 px-5 py-4', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="truncate text-h3 text-primary">{title}</h3>
        {description && <p className="truncate text-body-sm text-tertiary">{description}</p>}
      </div>
      <div className="min-w-0 flex-1" />
      {actions}
    </div>
  )
}

/** List row inside a card, separated by a top border. */
export function CardRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 border-t px-5 py-2.5', className)} {...props} />
}
