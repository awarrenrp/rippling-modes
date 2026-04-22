import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from './Icon'

export type Mode = 'fullchat' | 'canvas' | 'copilot'
export type PanelState = 'floating' | 'sidebar' | 'fullscreen'

interface ModeBarProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
  navOpen?: boolean
  onNavOpen?: () => void
  chatOpen?: boolean
  onChatToggle?: () => void
  onSearchOpen?: () => void
  /** @deprecated kept for compat */
  panelState?: PanelState
  /** @deprecated kept for compat */
  onPanelChange?: (panel: PanelState) => void
}

export function ModeBar({ navOpen = true, onNavOpen, chatOpen = false, onChatToggle, onSearchOpen }: ModeBarProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      style={{
        height: 44,
        background: 'var(--grey-200)',
        borderBottom: '1px solid #d6d6d6',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 50,
        position: 'relative',
        paddingLeft: 16,
        paddingRight: 16,
        gap: 10,
      }}
    >
      {/* Left: sidebar toggle + wordmark — fixed width keeps search centered */}
      <div style={{ width: 120, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {onNavOpen && (
          <motion.button
            onClick={onNavOpen}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            title={navOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              width: 28, height: 28, borderRadius: 6, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#555', flexShrink: 0, padding: 0,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {navOpen ? (
                <motion.span key="chevron" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 4 }} transition={{ duration: 0.14 }} style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon name="chevron_left" size={18} />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.14 }} style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon name="menu" size={18} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
        {/* Only show wordmark when nav is closed */}
        <AnimatePresence initial={false}>
          {!navOpen && (
            <motion.span
              key="wordmark"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              style={{ fontSize: 13, fontWeight: 600, color: '#111', letterSpacing: '-0.2px' }}
            >
              rippling
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Center: search trigger */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onSearchOpen}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            maxWidth: 480,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: focused ? '#d8d8d8' : '#dfdfdf',
            border: `1px solid ${focused ? '#bbb' : '#d2d2d2'}`,
            borderRadius: 6,
            padding: '0 10px',
            height: 30,
            cursor: 'text',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <Icon name="search" size={15} style={{ color: '#999', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#aaa', userSelect: 'none' }}>Search...</span>
        </button>
      </div>

      {/* Right: AI chat toggle + avatar — same fixed width as left */}
      <div style={{ width: 120, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <motion.button
          onClick={onChatToggle}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          title={chatOpen ? 'Close AI chat' : 'Open AI chat'}
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: chatOpen ? '1px solid #c8c8c8' : 'none',
            background: chatOpen ? '#d8d8d8' : 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <img src="/rippling-ai.png" width={20} height={20} style={{ display: 'block', opacity: chatOpen ? 1 : 0.55 }} />
        </motion.button>

        <div
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: '#d0d0d0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#555', fontSize: 10, fontWeight: 600, letterSpacing: '0.3px',
          }}
        >
          AW
        </div>
      </div>
    </div>
  )
}
