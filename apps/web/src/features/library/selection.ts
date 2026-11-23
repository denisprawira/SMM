import { useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { startDraftFromFiles } from '@/features/create-post/draft-store'

/**
 * Library file selection (Drive file IDs). Lives outside the route so it
 * survives opening the Drive browser and coming back. Seeded with the
 * three files selected in the Figma frame.
 */
let selected: readonly string[] = ['f_autumn', 'f_studio', 'f_holiday']
const listeners = new Set<() => void>()

function set(next: readonly string[]) {
  selected = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useLibrarySelection() {
  const ids = useSyncExternalStore(subscribe, () => selected)
  const toggle = useCallback((id: string) => set(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]), [])
  const clear = useCallback(() => set([]), [])
  return { ids, toggle, clear, set }
}

/** "Create Post" / "Add N files to post": seed a new Create Post draft with the picked files and say what was added. */
export function sendToCreatePost(ids: readonly string[]) {
  const { added, skipped } = startDraftFromFiles(ids)
  const files = (n: number) => `${n} ${n === 1 ? 'file' : 'files'}`
  if (added.length === 0) {
    toast.info('Pick media for your post', { description: 'These files can’t be published yet — choose from your Drive in step 1.' })
  } else if (skipped > 0) {
    toast.success(`${added.length === 1 ? added[0].name : files(added.length)} added to a new post`, {
      description: `A post carries one video or up to 10 images, so ${skipped === 1 ? '1 file wasn’t' : `${skipped} files weren’t`} added. Files stay in your Drive.`,
    })
  } else {
    toast.success(`${added.length} Drive ${added.length === 1 ? 'file' : 'files'} added to a new post`, { description: 'Files stay in your Drive — Relay keeps a reference only.' })
  }
}
