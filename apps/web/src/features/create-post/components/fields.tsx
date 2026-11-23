import { Plus, RotateCcw, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ThumbnailTone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { addHashtag, extractHashtags, removeHashtag } from '../model'

/** Editor header: 28px logo, H2 + tertiary subtitle, action on the right (desktop only). */
export function PanelHeader({ logo, title, subtitle, action }: { logo: ReactNode; title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="hidden w-full items-center gap-2.5 md:flex">
      {logo}
      <div className="flex min-w-0 flex-col">
        <h2 className="text-h2 text-foreground">{title}</h2>
        <p className="truncate text-body-sm text-tertiary">{subtitle}</p>
      </div>
      <div className="flex-1" />
      {action}
    </div>
  )
}

export function ResetToShared({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" disabled={disabled} onClick={onClick}>
      <RotateCcw />
      Reset to shared
    </Button>
  )
}

/** Field label row: Body/Small Medium label + optional caption note (e.g. "Edited for TikTok"). */
export function FieldLabel({ htmlFor, children, note, noteClassName }: { htmlFor?: string; children: ReactNode; note?: ReactNode; noteClassName?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 font-medium">
      <Label htmlFor={htmlFor} className="text-body-sm font-medium text-foreground">
        {children}
      </Label>
      {note && <span className={cn('text-caption text-primary-text', noteClassName)}>{note}</span>}
    </div>
  )
}

/** Label + control stack. Mobile spaces them like the M05 frame (12px), desktop 6px. */
export function FieldStack({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex w-full flex-col gap-3 md:gap-1.5', className)}>{children}</div>
}

export function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-md border bg-subtle pr-1.5 pl-2 text-caption font-medium whitespace-nowrap text-muted-foreground">
      {label}
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="rounded-sm text-tertiary outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40">
        <X className="size-3" />
      </button>
    </span>
  )
}

/** Hashtag chips mirror the hashtags in the caption; removing/adding edits the caption. */
export function HashtagsField({ caption, onChange, suggestions, className }: { caption: string; onChange: (caption: string) => void; suggestions: string[]; className?: string }) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const tags = extractHashtags(caption)
  const suggested = suggestions.filter((s) => !tags.includes(s))

  const commit = () => {
    if (text.trim()) onChange(addHashtag(caption, text))
    setText('')
    setAdding(false)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="text-body-sm font-medium text-foreground">Hashtags</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <TagChip key={tag} label={tag} onRemove={() => onChange(removeHashtag(caption, tag))} />
        ))}
        {adding ? (
          <Input
            autoFocus
            aria-label="New hashtag"
            placeholder="#hashtag"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                setText('')
                setAdding(false)
              }
            }}
            className="h-[30px] w-36 rounded-md px-2 text-body-sm"
          />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus />
            Add
          </Button>
        )}
      </div>
      {suggested.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 text-caption text-tertiary">
          <span>Suggested:</span>
          {suggested.map((s) => (
            <button key={s} type="button" onClick={() => onChange(addHashtag(caption, s))} className="rounded-sm outline-none hover:text-primary-text focus-visible:ring-2 focus-visible:ring-ring/40" aria-label={`Add ${s}`}>
              {s}
            </button>
          ))}
        </p>
      )}
    </div>
  )
}

/** Free-form tag input (YouTube tags): chips + inline input; Enter or comma adds, Backspace removes. */
export function TagsInput({ id, tags, onChange, placeholder = 'Add tag' }: { id: string; tags: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState('')
  const add = () => {
    const t = text.trim().replace(/,$/, '')
    if (t && !tags.includes(t)) onChange([...tags, t])
    setText('')
  }
  return (
    <div className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
      {tags.map((tag) => (
        <TagChip key={tag} label={tag} onRemove={() => onChange(tags.filter((t) => t !== tag))} />
      ))}
      <Input
        id={id}
        value={text}
        placeholder={tags.length ? '' : placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={add}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add()
          } else if (e.key === 'Backspace' && !text && tags.length) onChange(tags.slice(0, -1))
        }}
        className="h-6 min-w-20 flex-1 rounded-none border-0 bg-transparent p-0 text-body-sm shadow-none focus-visible:ring-0"
      />
    </div>
  )
}

/** Six frames from the video; the chosen one gets a 2.5px accent border. */
export function CoverFrames({ tones, value, onChange }: { tones: ThumbnailTone[]; value: number; onChange: (index: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Cover frame" className="flex flex-wrap items-center gap-2">
      {tones.map((tone, i) => {
        const selected = i === value
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Frame ${i + 1}`}
            onClick={() => onChange(i)}
            className={cn(
              'relative h-[78px] w-11 shrink-0 overflow-hidden rounded-md transition-opacity outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 md:h-[84px] md:w-12',
              !selected && 'hover:opacity-100 md:opacity-80',
            )}
          >
            <Thumbnail tone={tone} ratio={48 / 84} className="absolute inset-0 h-full w-full rounded-none" />
            {selected && <span aria-hidden className="absolute inset-0 rounded-md border-[2.5px] border-primary" />}
          </button>
        )
      })}
    </div>
  )
}

/** White settings card (Figma "TikTok settings"): title on desktop, rows of switches/selects. */
export function SettingsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex w-full flex-col gap-2.5 rounded-[10px] border bg-background p-3 md:gap-3 md:p-3.5">
      <h3 className="hidden text-body-sm font-medium text-foreground md:block">{title}</h3>
      {children}
    </section>
  )
}

export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <div className={cn('flex w-full items-center gap-3', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <Label htmlFor={id} className="text-body-sm font-normal text-foreground md:font-medium">
          {label}
        </Label>
        {description && <p className="text-caption text-tertiary">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
