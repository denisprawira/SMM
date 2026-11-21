import switchOff from '@/assets/figma/controls/switch-off.svg'
import switchOn from '@/assets/figma/controls/switch-on.svg'
import { cn } from '@/lib/cn'

type SwitchProps = {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  'aria-label'?: string
  disabled?: boolean
}

/** Figma "Switch" — 32×18. */
export function Switch({ checked, onCheckedChange, className, disabled, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn('inline-flex h-[18px] w-8 shrink-0 rounded-full outline-none focus-visible:shadow-focus disabled:opacity-50', className)}
    >
      <img src={checked ? switchOn : switchOff} alt="" aria-hidden width={32} height={18} className="h-[18px] w-8" draggable={false} />
    </button>
  )
}
