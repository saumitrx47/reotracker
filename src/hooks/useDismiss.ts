import { useEffect, type RefObject } from 'react'

/** Closes a popover on outside pointer-down or Escape. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: (viaEscape: boolean) => void) {
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(true)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open, onClose])
}
