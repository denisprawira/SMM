import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export type SegmentOption<T extends string> = { value: T; label: string }

type SegmentedControlProps<T extends string> = {
  value: T
  options: readonly SegmentOption<T>[]
  onValueChange: (value: T) => void
  /** Stretch segments to fill the container (mobile). */
  fill?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * Figma "Segment" (7:186) ×N inside a bg/subtle container with 2px padding —
 * date ranges, calendar views, list/grid. A single-select Radix ToggleGroup
 * that never deselects. (For tabbed panels use `<Tabs>` + `TabsList variant="segment"`.)
 */
export function SegmentedControl<T extends string>({ value, options, onValueChange, fill = false, className, 'aria-label': ariaLabel }: SegmentedControlProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => next && onValueChange(next as T)}
      aria-label={ariaLabel}
      className={cn('items-center gap-0.5 rounded-lg bg-subtle p-0.5', fill ? 'flex w-full' : 'inline-flex shrink-0', className)}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            'flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-body-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm',
            fill && 'min-w-0 flex-1',
          )}
        >
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
