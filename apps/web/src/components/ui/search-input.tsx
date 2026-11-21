import type { InputHTMLAttributes } from 'react'
import searchIcon from '@/assets/figma/icons/search.svg'
import { cn } from '@/lib/cn'
import { Kbd } from './badge'
import { Icon } from './icon'

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  shortcut?: string
  /** `md` = 36px (Figma Search Input), `sm` = 34px (sidebar quick search). */
  size?: 'md' | 'sm'
}

/** Figma "Search Input" — focus state is the accent border + focus ring. */
export function SearchInput({ shortcut, size = 'md', className, placeholder = 'Search…', ...props }: SearchInputProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-surface px-2.5 shadow-xs transition-shadow focus-within:border-accent focus-within:shadow-focus',
        size === 'md' ? 'h-9' : 'h-[34px]',
        className,
      )}
    >
      <Icon src={searchIcon} size={16} />
      <input
        type="search"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body text-primary outline-none placeholder:text-tertiary [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </label>
  )
}
