import { LayoutGrid, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'list'

const item =
  'h-7 w-[30px] min-w-0 rounded-md px-0 text-tertiary hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm'

/** Figma "View toggle" (17:612): grid / list icons in a bg/subtle segment. */
export function ViewToggle({ value, onValueChange, className }: { value: ViewMode; onValueChange: (v: ViewMode) => void; className?: string }) {
  return (
    <ToggleGroup
      type="single"
      spacing={0.5}
      value={value}
      onValueChange={(v) => v && onValueChange(v as ViewMode)}
      aria-label="View"
      className={cn('shrink-0 rounded-lg bg-subtle p-0.5', className)}
    >
      <ToggleGroupItem value="grid" aria-label="Grid view" title="Grid view" className={item}>
        <LayoutGrid />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" title="List view" className={item}>
        <List />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
