import { useState, useEffect, type RefObject } from 'react'

/**
 * Observes the element bound to `ref` and returns its current content width.
 * Updates whenever the element resizes (e.g. when nav / chat panels open).
 */
export function useContainerWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Set initial value immediately
    setWidth(el.offsetWidth)

    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return width
}
