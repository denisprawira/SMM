import { cn } from '@/lib/cn'

export type SegmentOption<T extends string> = { value: T; label: string }

type SegmentedControlProps<T extends string> = {
  value: T
  options: readonly SegmentOption<T>[]
  onChange: (value: T) => void
  /** Stretch segments to fill the container (mobile). */
  fill?: boolean
  className?: string
  'aria-label'?: string
}

/** Figma "Segment" ×N inside a bg/subtle container with 2px padding. */
export function SegmentedControl<T extends string>({ value, options, onChange, fill = false, className, 'aria-label': ariaLabel }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('items-center gap-0.5 rounded-lg bg-subtle p-0.5', fill ? 'flex w-full' : 'inline-flex shrink-0', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-7 items-center justify-center rounded-md px-2.5 text-body-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:shadow-focus',
              fill && 'min-w-0 flex-1',
              active ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
