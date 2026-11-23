import { Search } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'

type SearchInputProps = Omit<ComponentProps<'input'>, 'type' | 'size'> & {
  /** Keyboard hint shown on the right, e.g. "⌘K". */
  shortcut?: string
  /** `sm` = 34px sidebar quick search; default = 36px Figma "Search Input". */
  size?: 'default' | 'sm'
  containerClassName?: string
}

/**
 * Figma "Search Input" (7:123): 36px, radius 8, search icon, optional ⌘K kbd.
 * Focus = accent border + 3px accent/18% ring.
 */
export function SearchInput({ shortcut, size = 'default', className, containerClassName, ...props }: SearchInputProps) {
  return (
    <label
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border bg-background px-2.5 shadow-xs transition-[color,box-shadow] has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/20',
        size === 'sm' ? 'h-[34px]' : 'h-9',
        containerClassName,
      )}
    >
      <Search aria-hidden className="size-4 shrink-0 text-tertiary" />
      <input
        type="search"
        className={cn('min-w-0 flex-1 bg-transparent text-body text-foreground outline-none placeholder:text-tertiary [&::-webkit-search-cancel-button]:hidden', className)}
        {...props}
      />
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </label>
  )
}
