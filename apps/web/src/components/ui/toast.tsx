import { useSyncExternalStore } from 'react'
import closeIcon from '@/assets/figma/icons/x.svg'
import errorIcon from '@/assets/figma/toast/alert-circle.svg'
import successIcon from '@/assets/figma/toast/check-circle.svg'
import infoIcon from '@/assets/figma/toast/info.svg'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

export type ToastType = 'success' | 'error' | 'info'
type ToastItem = { id: number; type: ToastType; title: string; description?: string }

const ICON: Record<ToastType, string> = { success: successIcon, error: errorIcon, info: infoIcon }

/** Figma "Toast" — Type=Success/Error/Info. */
export function Toast({ type, title, description, onClose, className }: Omit<ToastItem, 'id'> & { onClose?: () => void; className?: string }) {
  return (
    <div role="status" className={cn('flex w-[360px] max-w-full items-start gap-2.5 rounded-[10px] border bg-surface px-3.5 py-3 shadow-lg', className)}>
      <Icon src={ICON[type]} size={18} className="mt-px" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body font-medium text-primary">{title}</p>
        {description && <p className="text-body-sm text-secondary">{description}</p>}
      </div>
      {onClose && (
        <button type="button" aria-label="Dismiss" onClick={onClose} className="rounded-sm outline-none focus-visible:shadow-focus">
          <Icon src={closeIcon} size={16} />
        </button>
      )}
    </div>
  )
}

/* ── Tiny toast store ─────────────────────────────────────────────── */

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id)
  emit()
}

function push(type: ToastType, title: string, description?: string) {
  const id = nextId++
  items = [...items, { id, type, title, description }]
  emit()
  setTimeout(() => dismiss(id), 5000)
  return id
}

export const toast = {
  success: (title: string, description?: string) => push('success', title, description),
  error: (title: string, description?: string) => push('error', title, description),
  info: (title: string, description?: string) => push('info', title, description),
  dismiss,
}

/** Mount once at the root. */
export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => items,
  )
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-24 z-50 flex flex-col gap-2 md:bottom-4">
      {list.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast type={t.type} title={t.title} description={t.description} onClose={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  )
}
