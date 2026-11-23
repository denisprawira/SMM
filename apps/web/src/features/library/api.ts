import { queryOptions } from '@tanstack/react-query'
import { DRIVE_FILES, subtreeIds, type DriveFile } from '@/features/drive/data'
import { mockRequest } from '@/lib/api'

/* ── URL state ─────────────────────────────────────────────────────── */

export const FILE_TYPES = ['all', 'video', 'image'] as const
export const DURATIONS = ['any', 'short', 'medium', 'long'] as const
export const MODIFIED_RANGES = ['any', '7d', '30d', '90d'] as const
export const SORTS = ['modified', 'name', 'size', 'duration'] as const
export const VIEWS = ['grid', 'list'] as const

export type FileType = (typeof FILE_TYPES)[number]
export type DurationFilter = (typeof DURATIONS)[number]
export type ModifiedRange = (typeof MODIFIED_RANGES)[number]
export type SortKey = (typeof SORTS)[number]
export type LibraryView = (typeof VIEWS)[number]

/** Defaults are omitted from the URL. */
export type LibrarySearch = {
  q?: string
  type?: Exclude<FileType, 'all'>
  duration?: Exclude<DurationFilter, 'any'>
  modified?: Exclude<ModifiedRange, 'any'>
  sort?: Exclude<SortKey, 'modified'>
  view?: Exclude<LibraryView, 'grid'>
}

const pick = <T extends string>(list: readonly T[], value: unknown, fallback: T) => (list.includes(value as T) && value !== fallback ? (value as T) : undefined)

export function validateLibrarySearch(search: Record<string, unknown>): LibrarySearch {
  const q = typeof search.q === 'string' && search.q.trim() !== '' ? search.q : undefined
  return {
    q,
    type: pick(FILE_TYPES, search.type, 'all') as LibrarySearch['type'],
    duration: pick(DURATIONS, search.duration, 'any') as LibrarySearch['duration'],
    modified: pick(MODIFIED_RANGES, search.modified, 'any') as LibrarySearch['modified'],
    sort: pick(SORTS, search.sort, 'modified') as LibrarySearch['sort'],
    view: pick(VIEWS, search.view, 'grid') as LibrarySearch['view'],
  }
}

export const TYPE_OPTIONS: { value: FileType; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'video', label: 'Videos' },
  { value: 'image', label: 'Images' },
]
export const DURATION_OPTIONS: { value: DurationFilter; label: string }[] = [
  { value: 'any', label: 'Any duration' },
  { value: 'short', label: 'Under 1 min' },
  { value: 'medium', label: '1–10 min' },
  { value: 'long', label: 'Over 10 min' },
]
export const MODIFIED_OPTIONS: { value: ModifiedRange; label: string }[] = [
  { value: 'any', label: 'Modified: any time' },
  { value: '7d', label: 'Modified: last 7 days' },
  { value: '30d', label: 'Modified: last 30 days' },
  { value: '90d', label: 'Modified: last 90 days' },
]
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'modified', label: 'Sort: Last modified' },
  { value: 'name', label: 'Sort: Name' },
  { value: 'size', label: 'Sort: Size' },
  { value: 'duration', label: 'Sort: Duration' },
]

/* ── Filtering (client-side over the indexed listing) ──────────────── */

/** "Today" for the mock Drive index (the Figma frames are dated Nov 21, 2025). */
const INDEX_TODAY = Date.UTC(2025, 10, 21)
const DAYS: Record<Exclude<ModifiedRange, 'any'>, number> = { '7d': 7, '30d': 30, '90d': 90 }

export function hasFilters(s: LibrarySearch) {
  return Boolean(s.q || s.type || s.duration || s.modified)
}

export function filterFiles(files: DriveFile[], s: LibrarySearch): DriveFile[] {
  const q = s.q?.trim().toLowerCase()
  const result = files.filter((f) => {
    if (q && !f.name.toLowerCase().includes(q)) return false
    if (s.type && f.kind !== s.type) return false
    if (s.duration) {
      if (f.kind !== 'video') return false
      const sec = f.durationSec ?? 0
      if (s.duration === 'short' && sec >= 60) return false
      if (s.duration === 'medium' && (sec < 60 || sec > 600)) return false
      if (s.duration === 'long' && sec <= 600) return false
    }
    if (s.modified) {
      const age = (INDEX_TODAY - Date.parse(`${f.modified}T00:00:00Z`)) / 86_400_000
      if (age > DAYS[s.modified]) return false
    }
    return true
  })
  const sort = s.sort ?? 'modified'
  // Array#sort is stable, so ties keep Drive's listing order.
  return result.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'size') return b.sizeMb - a.sizeMb
    if (sort === 'duration') return (b.durationSec ?? 0) - (a.durationSec ?? 0)
    return b.modified.localeCompare(a.modified)
  })
}

/* ── Queries ───────────────────────────────────────────────────────── */

/** Every video/image in the content folder and its subfolders (metadata only — previews stream from Drive). */
export const libraryFilesQueryOptions = (folderId: string) =>
  queryOptions({
    queryKey: ['library', 'files', folderId],
    queryFn: () =>
      mockRequest(() => {
        const ids = subtreeIds(folderId)
        return DRIVE_FILES.filter((f) => ids.has(f.folderId))
      }, { delay: 900 }),
  })
