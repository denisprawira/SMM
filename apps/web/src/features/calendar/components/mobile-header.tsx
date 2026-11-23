import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { CalendarFilters } from '../api'
import { AccountFilter, PlatformFilter, StatusFilter, type FilterChange } from './filter-selects'

type FilterSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: CalendarFilters
  onChange: FilterChange
  onClear: () => void
}

/** Bottom sheet with the desktop toolbar's three filters. */
export function FilterSheet({ open, onOpenChange, filters, onChange, onClear }: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 rounded-t-2xl pb-[max(16px,env(safe-area-inset-bottom))]">
        <SheetHeader className="px-4 pt-5 pb-3">
          <SheetTitle className="text-h3">Filters</SheetTitle>
          <SheetDescription className="text-body-sm">Show posts by platform, status or account.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-caption font-medium text-muted-foreground">Platform</Label>
            <PlatformFilter value={filters.platform} onChange={(platform) => onChange({ platform })} className="w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-caption font-medium text-muted-foreground">Status</Label>
            <StatusFilter value={filters.status} onChange={(status) => onChange({ status })} className="w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-caption font-medium text-muted-foreground">Account</Label>
            <AccountFilter value={filters.account} onChange={(account) => onChange({ account })} className="w-full" />
          </div>
        </div>
        <SheetFooter className="flex-row items-center px-4 pt-5">
          <Button variant="ghost" onClick={onClear}>
            Clear all
          </Button>
          <div className="flex-1" />
          <SheetClose asChild>
            <Button>Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
