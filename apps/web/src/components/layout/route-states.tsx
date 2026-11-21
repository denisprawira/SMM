import { Link, type ErrorComponentProps } from '@tanstack/react-router'
import alertCircle from '@/assets/figma/icons/alert-circle-danger.svg'
import { Button, Icon } from '@/components/ui'

export function PagePending() {
  return (
    <div className="flex flex-1 items-center justify-center p-10" role="status" aria-label="Loading">
      <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-accent" />
    </div>
  )
}

export function PageError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-danger-subtle">
        <Icon src={alertCircle} size={18} />
      </span>
      <p className="text-h3 text-primary">Something went wrong</p>
      <p className="max-w-sm text-body-sm text-secondary">{error instanceof Error ? error.message : String(error)}</p>
      <Button variant="secondary" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-10 text-center">
      <p className="text-h2 text-primary">Page not found</p>
      <p className="text-body-sm text-secondary">The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="text-body-sm font-medium text-accent-text hover:underline">
        Back to Overview
      </Link>
    </div>
  )
}

/** Temporary body for routes not built yet. */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <p className="text-body-sm text-tertiary">{title} — coming soon</p>
    </div>
  )
}
