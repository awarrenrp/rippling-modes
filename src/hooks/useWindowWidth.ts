import { useState, useEffect } from 'react'

/** Returns the current window inner-width, updating on resize. */
export function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}
