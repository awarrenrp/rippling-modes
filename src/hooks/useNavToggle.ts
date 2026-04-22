import { useState } from 'react'

export function useNavToggle(initialOpen = true) {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const toggle = () => setIsOpen((prev) => !prev)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return { isOpen, toggle, open, close }
}
