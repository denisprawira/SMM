import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export type DragSession<P> = {
  payload: P
  /** Pointer position (viewport). */
  x: number
  y: number
  /** Where inside the dragged element the pointer grabbed it. */
  grabX: number
  grabY: number
  width: number
  height: number
}

/** Where a drag would land: the new wall-clock time, or why it can't go there. */
export type DropTarget = { date: string; at: string; valid: boolean; reason?: string }

type Options<P> = {
  /** Resolve the drop under the pointer (the overlay is pointer-events-none, so `elementFromPoint` sees the grid). */
  resolveDrop: (session: DragSession<P>) => DropTarget | null
  onDrop: (payload: P, drop: DropTarget) => void
}

const THRESHOLD = 4

/**
 * Pointer-driven drag for calendar chips/blocks (no HTML5 DnD, so we control the
 * floating preview, the drop highlight and the "Move to …" tooltip). A press that
 * doesn't move past the threshold stays a normal click.
 */
export function usePointerDrag<P>({ resolveDrop, onDrop }: Options<P>) {
  const [session, setSession] = useState<DragSession<P> | null>(null)
  const [drop, setDrop] = useState<DropTarget | null>(null)
  const suppressClick = useRef(false)
  const opts = useRef({ resolveDrop, onDrop })
  useLayoutEffect(() => {
    opts.current = { resolveDrop, onDrop }
  })

  function onPointerDown(e: ReactPointerEvent<HTMLElement>, payload: P) {
    if (e.button !== 0 || e.pointerType === 'touch') return
    const rect = e.currentTarget.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    let active: DragSession<P> | null = null
    let lastDrop: DropTarget | null = null

    const cleanup = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('keydown', key)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      setSession(null)
      setDrop(null)
    }
    const move = (ev: PointerEvent) => {
      if (!active) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < THRESHOLD) return
        active = { payload, x: ev.clientX, y: ev.clientY, grabX: startX - rect.left, grabY: startY - rect.top, width: rect.width, height: rect.height }
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'grabbing'
      }
      active = { ...active, x: ev.clientX, y: ev.clientY }
      lastDrop = opts.current.resolveDrop(active)
      setSession(active)
      setDrop(lastDrop)
    }
    const up = () => {
      const wasDragging = active !== null
      cleanup()
      if (!wasDragging) return
      suppressClick.current = true
      setTimeout(() => (suppressClick.current = false), 0)
      if (lastDrop) opts.current.onDrop(payload, lastDrop)
    }
    const cancel = () => {
      if (active) {
        suppressClick.current = true
        setTimeout(() => (suppressClick.current = false), 0)
      }
      cleanup()
    }
    const key = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') cancel()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('keydown', key)
  }

  return {
    session,
    drop,
    onPointerDown,
    /** True right after a drag ended — swallow the click that follows pointerup. */
    isClickSuppressed: () => suppressClick.current,
  }
}

/** The drop zone (`[data-drop-date]`) under a viewport point. */
export function dropZoneAt(x: number, y: number) {
  return document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-date]') ?? null
}
