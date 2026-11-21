import checkIcon from '@/assets/figma/icons/check-inverse.svg'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

type CheckboxProps = {
  checked: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  'aria-label'?: string
  disabled?: boolean
}

/** Figma "Checkbox" — unchecked / checked / indeterminate. */
export function Checkbox({ checked, indeterminate = false, onCheckedChange, className, disabled, 'aria-label': ariaLabel }: CheckboxProps) {
  const on = checked || indeterminate
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onCheckedChange?.(!checked)
      }}
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-sm outline-none focus-visible:shadow-focus disabled:opacity-50',
        on ? 'bg-accent' : 'border border-strong bg-surface',
        className,
      )}
    >
      {checked && !indeterminate && <Icon src={checkIcon} size={12} />}
      {indeterminate && <span className="h-0.5 w-2 rounded-[1px] bg-surface" />}
    </button>
  )
}
