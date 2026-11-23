import { Link, type ErrorComponentProps } from '@tanstack/react-router'
import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export function PagePending() {
  return (
    <div className="flex flex-1 items-center justify-center p-10" role="status" aria-label="Loading">
      <Spinner className="size-5 text-primary" />
    </div>
  )
}

export function PageError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-danger-subtle text-danger">
        <CircleAlert aria-hidden className="size-[18px]" />
      </span>
      <p className="text-h3 text-foreground">Something went wrong</p>
      <p className="max-w-sm text-body-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-10 text-center">
      <p className="text-h2 text-foreground">Page not found</p>
      <p className="text-body-sm text-muted-foreground">The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="text-body-sm font-medium text-primary-text hover:underline">
        Back to Overview
      </Link>
    </div>
  )
}
