import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import type { Draft } from '../draft-store'
import { firstBlockingStep, stepIndex, STEPS, type StepId } from '../model'

/**
 * Figma "Stepper" in the flow header: 24px circles joined by 28×2 rules.
 * Done = accent + check, current = accent + 4px accent/20 ring, upcoming =
 * bordered. Every step up to the first incomplete one is a link.
 */
export function Stepper({ current, draft, className }: { current: StepId; draft: Draft; className?: string }) {
  const currentIndex = stepIndex(current)
  const reachable = stepIndex(firstBlockingStep(draft, 'review'))
  return (
    <ol aria-label="Create post steps" className={cn('flex items-center gap-2', className)}>
      {STEPS.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const canVisit = !active && i <= Math.max(reachable, currentIndex)
        const body = (
          <>
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-medium',
                done && 'bg-primary text-primary-foreground',
                active && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                !done && !active && 'border border-strong bg-background text-tertiary',
              )}
            >
              {done ? <Check aria-hidden className="size-3.5" strokeWidth={2.5} /> : i + 1}
            </span>
            <span
              className={cn(
                'text-body-sm font-medium whitespace-nowrap',
                active ? 'text-foreground' : done ? 'text-muted-foreground' : 'text-tertiary',
                !active && 'hidden lg:inline',
              )}
            >
              {step.label}
            </span>
          </>
        )
        return (
          <Fragment key={step.id}>
            {i > 0 && <li aria-hidden className={cn('h-0.5 w-7 shrink-0 rounded-[1px]', i <= currentIndex ? 'bg-primary' : 'bg-border')} />}
            <li className="flex shrink-0">
              {canVisit ? (
                <Link
                  to={step.to}
                  className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 [&:hover>span:last-child]:text-foreground"
                  aria-label={`${step.label}${done ? ' (done)' : ''}`}
                >
                  {body}
                </Link>
              ) : (
                <span className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
                  {body}
                </span>
              )}
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

/** Mobile step header: five 4px bars (Figma M05 "Step header"). */
export function StepBars({ current, className }: { current: StepId; className?: string }) {
  const currentIndex = stepIndex(current)
  return (
    <div aria-hidden className={cn('flex w-full items-center gap-1', className)}>
      {STEPS.map((step, i) => (
        <span key={step.id} className={cn('h-1 min-w-0 flex-1 rounded-full', i <= currentIndex ? 'bg-primary' : 'bg-muted')} />
      ))}
    </div>
  )
}
