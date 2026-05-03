import { useState } from 'react'
import { motion } from 'motion/react'
import { Icon } from './Icon'

/**
 * Rippling app chrome — matches AI Monetization file Navigation Top Bar (berry shell).
 * @see https://www.figma.com/design/poVVjOenGhKfG0E1BJY1os/AI-Monetization — node 3298:10539
 */
const HEADER_BG = '#4A0039'
const HEADER_HEIGHT_PX = 56
const SEARCH_MAX_WIDTH_PX = 384
const SEARCH_HEIGHT_PX = 42

export type Mode = 'fullchat' | 'canvas' | 'copilot'
export type PanelState = 'floating' | 'sidebar' | 'fullscreen'

interface ModeBarProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
  navOpen?: boolean
  onNavOpen?: () => void
  /** Logo click — e.g. navigate to app home. */
  onLogoClick?: () => void
  chatOpen?: boolean
  onChatToggle?: () => void
  onSearchOpen?: () => void
  /** @deprecated kept for compat */
  panelState?: PanelState
  /** @deprecated kept for compat */
  onPanelChange?: (panel: PanelState) => void
}

function topBarGhostBtn(hover: boolean): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: 8,
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary-foreground)',
    background: hover ? 'rgba(255,255,255,0.12)' : 'transparent',
    transition: 'background 0.15s ease',
    flexShrink: 0,
  }
}

export function ModeBar({
  navOpen = true,
  onNavOpen,
  onLogoClick,
  chatOpen = false,
  onChatToggle,
  onSearchOpen,
}: ModeBarProps) {
  const [searchFocused, setSearchFocused] = useState(false)
  const [hoverSlot, setHoverSlot] = useState<string | null>(null)

  return (
    <div
      style={{
        height: HEADER_HEIGHT_PX,
        background: HEADER_BG,
        color: 'var(--primary-foreground)',
        borderBottom: `1px solid color-mix(in srgb, var(--primary-foreground) 14%, ${HEADER_BG})`,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 50,
        position: 'relative',
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      {/* Left rail — balances right rail so search stays visually centered */}
      <div
        style={{
          flex: '1 1 0',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minWidth: 0,
          zIndex: 2,
        }}
      >
        {onNavOpen && (
          <motion.button
            type="button"
            onClick={onNavOpen}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            title={navOpen ? 'Close navigation' : 'Open navigation'}
            onMouseEnter={() => setHoverSlot('nav')}
            onMouseLeave={() => setHoverSlot(null)}
            style={topBarGhostBtn(hoverSlot === 'nav')}
          >
            <Icon name="menu" size={22} aria-hidden />
          </motion.button>
        )}
        {onLogoClick ? (
          <motion.button
            type="button"
            onClick={onLogoClick}
            aria-label="Home"
            title="Home"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              border: 'none',
              padding: 0,
              margin: 0,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              paddingLeft: onNavOpen ? 4 : 0,
            }}
          >
            <img
              src="/rippling-logo.png"
              alt=""
              style={{
                height: '20.8px',
                width: 'auto',
                maxWidth: 'min(128px, 22.4vw)',
                objectFit: 'contain',
                display: 'block',
                userSelect: 'none',
                mixBlendMode: 'screen',
              }}
            />
          </motion.button>
        ) : (
          <img
            src="/rippling-logo.png"
            alt="Rippling"
            style={{
              height: '20.8px',
              width: 'auto',
              maxWidth: 'min(128px, 22.4vw)',
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              paddingLeft: onNavOpen ? 4 : 0,
              mixBlendMode: 'screen',
            }}
          />
        )}
      </div>

      {/* Center — search (absolutely centered on header) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: `min(${SEARCH_MAX_WIDTH_PX}px, calc(100vw - 48px))`,
          maxWidth: SEARCH_MAX_WIDTH_PX,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <button
          type="button"
          onClick={() => onSearchOpen?.()}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            width: '100%',
            height: SEARCH_HEIGHT_PX,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(255,255,255,0.3)',
            border: searchFocused
              ? '1px solid rgba(255,255,255,0.65)'
              : '1px solid rgba(255,255,255,0.35)',
            borderRadius: 6,
            padding: '0 8px',
            cursor: 'text',
            boxShadow: searchFocused ? '0 0 0 3px color-mix(in srgb, var(--brand) 22%, transparent)' : 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            pointerEvents: 'auto',
          }}
        >
          <Icon name="search" size={12} style={{ color: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.82)',
              userSelect: 'none',
              textAlign: 'left',
              flex: 1,
            }}
          >
            Search or jump to…
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.02em',
              flexShrink: 0,
              padding: '1px 4px',
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.12)',
            }}
          >
            ⌘K
          </span>
        </button>
      </div>

      {/* Right — quick actions + divider + org + profile */}
      <div
        style={{
          flex: '1 1 0',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 2,
          minWidth: 0,
          zIndex: 2,
        }}
      >
        {(
          [
            { id: 'notify', icon: 'notifications', title: 'Notifications' },
            { id: 'help', icon: 'help', title: 'Help' },
            { id: 'mail', icon: 'mail', title: 'Inbox' },
          ] as const
        ).map(({ id, icon, title }) => (
          <motion.button
            key={id}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            title={title}
            onMouseEnter={() => setHoverSlot(id)}
            onMouseLeave={() => setHoverSlot(null)}
            style={topBarGhostBtn(hoverSlot === id)}
          >
            <Icon name={icon} size={22} />
          </motion.button>
        ))}

        <motion.button
          type="button"
          onClick={onChatToggle}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          title={chatOpen ? 'Close Rippling AI' : 'Open Rippling AI'}
          onMouseEnter={() => setHoverSlot('ai')}
          onMouseLeave={() => setHoverSlot(null)}
          style={{
            ...topBarGhostBtn(hoverSlot === 'ai'),
            border: chatOpen ? '1px solid rgba(255,255,255,0.28)' : undefined,
            background:
              chatOpen
                ? 'rgba(255,255,255,0.14)'
                : hoverSlot === 'ai'
                  ? 'rgba(255,255,255,0.12)'
                  : 'transparent',
          }}
        >
          <img
            src="/rippling-ai.png"
            width={22}
            height={22}
            alt=""
            style={{
              display: 'block',
              filter: 'brightness(0) invert(1)',
              opacity: chatOpen ? 1 : 0.92,
            }}
          />
        </motion.button>

        <div
          style={{
            width: 1,
            height: 24,
            background: 'rgba(255,255,255,0.35)',
            marginLeft: 6,
            marginRight: 6,
            flexShrink: 0,
            alignSelf: 'center',
          }}
          aria-hidden
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: 'var(--primary-foreground)',
              letterSpacing: '-0.1px',
              whiteSpace: 'nowrap',
              maxWidth: 160,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Acme, Inc.
          </span>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-foreground)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.02em',
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            >
              AW
            </div>
            <span
              title="Company HQ"
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: '#1e4aa9',
                border: `2px solid ${HEADER_BG}`,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
