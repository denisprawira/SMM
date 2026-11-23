import { Hash, Sun } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const EMOJI = ['🍂', '🧶', '✨', '🔥', '❤️', '🙌', '👀', '📍', '🛍️', '☕', '🍁', '❄️']

type CaptionFieldProps = {
  id: string
  value: string
  onChange: (value: string) => void
  limit: number
  invalid?: boolean
  /** Textarea height on desktop (Figma: 96px caption, 64px YouTube description). */
  desktopHeight?: string
  placeholder?: string
  className?: string
}

/**
 * Figma "Textarea" with a toolbar (hashtag / emoji) and a live character
 * counter. Mobile (M05) drops the toolbar and keeps the counter inside a
 * 10px-radius card.
 */
export function CaptionField({ id, value, onChange, limit, invalid, desktopHeight = 'md:h-24', placeholder = 'Write a caption…', className }: CaptionFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const over = value.length > limit

  const insert = (text: string) => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const pad = text.startsWith('#') && start > 0 && !/\s$/.test(value.slice(0, start)) ? ' ' : ''
    onChange(value.slice(0, start) + pad + text + value.slice(end))
    const caret = start + pad.length + text.length
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(caret, caret)
    })
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2 rounded-[10px] border bg-background p-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20 md:gap-0 md:rounded-lg md:p-0 md:shadow-xs',
        (over || invalid) && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
        className,
      )}
    >
      <Textarea
        ref={ref}
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={over || invalid || undefined}
        className={cn('min-h-0 rounded-none border-0 bg-transparent p-0 text-body-sm shadow-none focus-visible:ring-0 resize-none md:px-3 md:py-2.5 md:field-sizing-fixed', desktopHeight)}
      />
      <div className="flex items-center gap-1.5 md:border-t md:px-2.5 md:py-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Insert hashtag" className="hidden text-tertiary md:inline-flex" onClick={() => insert('#')}>
              <Hash className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert hashtag</TooltipContent>
        </Tooltip>
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Insert emoji" className="hidden text-tertiary md:inline-flex">
                  <Sun className="size-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Insert emoji</TooltipContent>
          </Tooltip>
          <PopoverContent align="start" className="grid w-auto grid-cols-6 gap-1 p-2">
            {EMOJI.map((e) => (
              <Button key={e} type="button" variant="ghost" size="icon-sm" className="text-body" onClick={() => insert(e)} aria-label={`Insert ${e}`}>
                {e}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
        <div className="flex-1" />
        <span aria-live="polite" className={cn('text-caption whitespace-nowrap tabular-nums', over ? 'font-medium text-danger-text' : 'text-tertiary')}>
          {value.length.toLocaleString('en-US')} / {limit.toLocaleString('en-US')}
        </span>
      </div>
    </div>
  )
}
