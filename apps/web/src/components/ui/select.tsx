import { useId } from 'react'
import chevron from '@/assets/figma/icons/select-chevron.svg'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

export type SelectOption<T extends string> = { value: T; label: string }

type SelectProps<T extends string> = {
  value: T
  options: readonly SelectOption<T>[]
  onChange?: (value: T) => void
  className?: string
  'aria-label'?: string
}

/**
 * Figma "Select" — filter dropdown trigger. A native <select> overlays the
 * styled trigger, so keyboard + screen readers get platform behaviour.
 */
export function Select<T extends string>({ value, options, onChange, className, 'aria-label': ariaLabel }: SelectProps<T>) {
  const id = useId()
  const current = options.find((o) => o.value === value)?.label ?? value
  return (
    <div
      className={cn(
        'relative inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-surface pr-2.5 pl-3 shadow-xs transition-colors focus-within:border-accent hover:bg-subtle',
        className,
      )}
    >
      <span className="flex-1 truncate text-body whitespace-nowrap text-primary">{current}</span>
      <Icon src={chevron} size={16} />
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange?.(e.target.value as T)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
