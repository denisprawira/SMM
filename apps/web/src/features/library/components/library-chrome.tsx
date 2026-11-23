import { Search } from 'lucide-react'
import { MobileFilterButton, Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'

/**
 * Desktop: the shared Topbar (breadcrumb, bell, Create post).
 * Mobile: Figma M02 "App header" — logo, "Library", search + filter icon buttons, no avatar.
 */
export function LibraryTopbar({ onSearch, onFilter, searchActive }: { onSearch?: () => void; onFilter?: () => void; searchActive?: boolean }) {
  return (
    <Topbar
      breadcrumb={[{ label: 'Content Library' }]}
      mobileTitle="Library"
      mobileAvatar={false}
      mobileActions={
        <>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Search files"
            aria-pressed={searchActive}
            disabled={!onSearch}
            onClick={onSearch}
            className="text-muted-foreground aria-pressed:bg-subtle aria-pressed:text-foreground"
          >
            <Search className="size-5" />
          </Button>
          <MobileFilterButton label="Filter files" onClick={onFilter} />
        </>
      }
    />
  )
}
