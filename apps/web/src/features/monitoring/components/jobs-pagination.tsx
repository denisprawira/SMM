import { createLink } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

const RouterPaginationLink = createLink(PaginationLink)

/** Page list with ellipses: 1 2 3 … 8 · 1 … 4 5 6 … 8 · 1 … 6 7 8. */
function pageItems(page: number, pageCount: number): (number | 'gap-start' | 'gap-end')[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const start = Math.max(2, Math.min(page - 1, pageCount - 2))
  const end = Math.min(pageCount - 1, Math.max(page + 1, 3))
  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  return [1, ...(start > 2 ? (['gap-start'] as const) : []), ...middle, ...(end < pageCount - 1 ? (['gap-end'] as const) : []), pageCount]
}

const pageSearch = (n: number) => (prev: Record<string, unknown>) => ({ ...prev, page: n === 1 ? undefined : n })

/** Figma table footer pager: 28px outline chevrons, 28px page cells, active = bg/muted. */
export function JobsPagination({ page, pageCount, className }: { page: number; pageCount: number; className?: string }) {
  const edge = 'size-7 rounded-lg border bg-background text-foreground shadow-none'
  const cell = 'size-7 rounded-md text-caption font-medium text-muted-foreground'
  return (
    <Pagination className={cn('mx-0 w-auto justify-end', className)}>
      <PaginationContent className="gap-2">
        <PaginationItem>
          <RouterPaginationLink
            to="/monitoring"
            search={pageSearch(page - 1)}
            aria-label="Previous page"
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={cn(edge, page <= 1 && 'pointer-events-none')}
          >
            <ChevronLeft />
          </RouterPaginationLink>
        </PaginationItem>
        {pageItems(page, pageCount).map((item) =>
          typeof item === 'number' ? (
            <PaginationItem key={item}>
              <RouterPaginationLink
                to="/monitoring"
                search={pageSearch(item)}
                isActive={item === page}
                className={cn(cell, item === page && 'border-0 bg-muted text-foreground shadow-none hover:bg-muted')}
              >
                {item}
              </RouterPaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis className="size-7 text-muted-foreground [&>svg]:size-3.5" />
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <RouterPaginationLink
            to="/monitoring"
            search={pageSearch(page + 1)}
            aria-label="Next page"
            aria-disabled={page >= pageCount}
            tabIndex={page >= pageCount ? -1 : undefined}
            className={cn(edge, page >= pageCount && 'pointer-events-none')}
          >
            <ChevronRight />
          </RouterPaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
