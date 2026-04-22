import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from './Icon'

interface SearchSpotlightProps {
  isOpen: boolean
  onClose: () => void
}

const RESULTS = {
  People: [
    { icon: 'person', label: 'Alice Warren',  sub: 'Engineering · San Francisco' },
    { icon: 'person', label: 'Marcus Lee',    sub: 'Sales · New York' },
    { icon: 'person', label: 'Priya Sharma',  sub: 'Product · Remote' },
  ],
  Pages: [
    { icon: 'home',         label: 'Home',      sub: 'Dashboard' },
    { icon: 'payments',     label: 'Payroll',   sub: 'Run & review payroll' },
    { icon: 'favorite',     label: 'Benefits',  sub: 'Health, dental, vision' },
    { icon: 'laptop_mac',   label: 'IT',        sub: 'Device management' },
  ],
  Actions: [
    { icon: 'add_circle',   label: 'Add employee',     sub: '' },
    { icon: 'sync',         label: 'Run payroll',       sub: '' },
    { icon: 'download',     label: 'Export headcount',  sub: '' },
    { icon: 'edit',         label: 'Edit PTO policy',   sub: '' },
  ],
}

export function SearchSpotlight({ isOpen, onClose }: SearchSpotlightProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [isOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = Object.entries(RESULTS).map(([section, items]) => ({
    section,
    items: query
      ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || i.sub.toLowerCase().includes(query.toLowerCase()))
      : items,
  })).filter(g => g.items.length > 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.25)',
              zIndex: 400,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Spotlight card */}
          <motion.div
            key="spotlight"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              position: 'fixed',
              top: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 560,
              background: '#ffffff',
              borderRadius: 12,
              boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
              zIndex: 401,
              overflow: 'hidden',
            }}
          >
            {/* Input row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 16px',
                height: 52,
                borderBottom: filtered.length > 0 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <Icon name="search" size={18} style={{ color: '#999', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search people, pages, actions..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 15, color: '#111', background: 'transparent',
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{
                    background: '#efefef', border: 'none', borderRadius: 4,
                    width: 20, height: 20, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#888', flexShrink: 0,
                  }}
                >
                  <Icon name="close" size={13} />
                </button>
              )}
              <kbd
                onClick={onClose}
                style={{
                  fontSize: 11, color: '#bbb', border: '1px solid #e0e0e0',
                  borderRadius: 4, padding: '1px 5px', cursor: 'pointer',
                  fontFamily: 'inherit', flexShrink: 0,
                }}
              >
                esc
              </kbd>
            </div>

            {/* Results */}
            {filtered.length > 0 && (
              <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 0' }}>
                {filtered.map(({ section, items }) => (
                  <div key={section}>
                    <div
                      style={{
                        padding: '4px 16px 4px',
                        fontSize: 10.5, fontWeight: 600, color: '#bbb',
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                      }}
                    >
                      {section}
                    </div>
                    {items.map(item => (
                      <motion.button
                        key={item.label}
                        onClick={onClose}
                        whileHover={{ background: '#f5f5f5' }}
                        style={{
                          width: '100%', padding: '7px 16px',
                          border: 'none', background: 'transparent',
                          cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: '#f0f0f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon name={item.icon} size={15} style={{ color: '#555' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: '#111', fontWeight: 400 }}>
                            {item.label}
                          </div>
                          {item.sub && (
                            <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
                              {item.sub}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {query && filtered.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>
                No results for "{query}"
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
