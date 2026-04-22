import { useState, useRef, useEffect } from 'react'
import { useWindowWidth } from './hooks/useWindowWidth'

const NAV_COLLAPSE_BP = 1024
import { AnimatePresence, motion, useMotionValue, animate } from 'motion/react'
import { Icon } from './components/Icon'
import { ModeBar, type Mode, type PanelState } from './components/ModeBar'
import { ChatPanel } from './components/ChatPanel'
import { PageContent, type PageId } from './components/PageContent'
import { SearchSpotlight } from './components/SearchSpotlight'

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_WIDTH  = 220
const CHAT_WIDTH = 360

const SPRING = { type: 'spring', stiffness: 320, damping: 38 } as const

// Floating card shadows — omnidirectional, layered for realism
const FLOAT_SHADOW   = '0 2px 8px rgba(0,0,0,0.07), 0 8px 28px rgba(0,0,0,0.12), 0 24px 64px rgba(0,0,0,0.10)'
const FLOAT_SHADOW_0 = '0 2px 0px rgba(0,0,0,0), 0 8px 0px rgba(0,0,0,0), 0 24px 0px rgba(0,0,0,0)'

// Directional shadows for "Out" push mode
const NAV_PUSH_SHADOW  = '4px 0 12px rgba(0,0,0,0.06), 12px 0 40px rgba(0,0,0,0.10)'
const CHAT_PUSH_SHADOW = '-4px 0 16px rgba(0,0,0,0.06), -12px 0 40px rgba(0,0,0,0.10)'

const NAV_SHADOW   = FLOAT_SHADOW
const NAV_SHADOW_0 = FLOAT_SHADOW_0
const CHAT_SHADOW  = FLOAT_SHADOW

const NAV_ITEMS: Array<{ icon: string; label: string; page: PageId | null }> = [
  { icon: 'home',         label: 'Home',      page: null        },
  { icon: 'table_chart',  label: 'Table',     page: 'table'     },
  { icon: 'dashboard',    label: 'Dashboard', page: 'dashboard' },
  { icon: 'settings',     label: 'Settings',  page: 'settings'  },
  { icon: 'list_alt',     label: 'Detail',    page: 'detail'    },
  { icon: 'account_tree', label: 'Flow',      page: 'flow'      },
  { icon: 'brush',        label: 'Canvas',    page: 'canvas'    },
]

// ─── V2 App ───────────────────────────────────────────────────────────────────

export function AppV2() {
  const [interactionModel, setInteractionModel] = useState<'in' | 'out'>('in')
  const [activePage, setActivePage]  = useState<PageId | null>(null)
  const [mode, setMode]              = useState<Mode>('copilot')
  const [navOpen, setNavOpen]        = useState(false)
  const [chatOpen, setChatOpen]      = useState(false)
  const [pendingMessage, setPending] = useState('')
  const [searchOpen, setSearchOpen]  = useState(false)
  const windowWidth = useWindowWidth()

  // Auto-collapse nav when viewport is too narrow
  const isNarrow = windowWidth < NAV_COLLAPSE_BP
  useEffect(() => {
    if (isNarrow) setNavOpen(false)
  }, [isNarrow])

  // Flow page hides the outer nav
  const showNav = activePage !== 'flow'

  // Tracks whether the chat panel should enter from the bottom (fullscreen)
  // or from the right (sidebar overlay). Set before the panel mounts so that
  // Framer Motion's `initial` reads the correct value at mount time.
  const chatEntryDir = useRef<'y' | 'x'>('y')

  // ── Drag-to-expand (in "In" mode only) ──────────────────────────────────────
  const panelWidthMV  = useMotionValue(CHAT_WIDTH)
  const stageRef      = useRef<HTMLDivElement>(null)
  const dragStartRef  = useRef<{ clientX: number } | null>(null)

  useEffect(() => {
    if (mode !== 'fullchat') panelWidthMV.set(CHAT_WIDTH)
  }, [mode, panelWidthMV])

  function handleResizePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    panelWidthMV.stop()
    dragStartRef.current = { clientX: e.clientX }
  }

  function handleResizePointerMove(e: React.PointerEvent) {
    if (!dragStartRef.current) return
    const delta    = dragStartRef.current.clientX - e.clientX
    const containerW = stageRef.current?.clientWidth ?? window.innerWidth
    const newW     = Math.min(Math.max(CHAT_WIDTH, CHAT_WIDTH + delta), containerW - 16)
    panelWidthMV.set(newW)
  }

  function handleResizePointerUp(_e: React.PointerEvent) {
    if (!dragStartRef.current) return
    dragStartRef.current = null
    const containerW = stageRef.current?.clientWidth ?? window.innerWidth
    const currentW   = panelWidthMV.get()

    if (currentW > containerW * 0.55) {
      animate(panelWidthMV, containerW, {
        ...SPRING,
        onComplete: () => {
          setMode('fullchat')
          panelWidthMV.set(CHAT_WIDTH)
        },
      })
    } else {
      animate(panelWidthMV, CHAT_WIDTH, SPRING)
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  function handleModeChange(newMode: Mode) {
    setMode(newMode)
    if (newMode === 'copilot') {
      setChatOpen(false)
      setPending('')
    }
  }

  function handleExpandToggle() {
    if (mode === 'fullchat') {
      setMode('copilot')
      setChatOpen(true)
    } else {
      setMode('fullchat')
    }
  }

  function goToPage() {
    setNavOpen(false)
    chatEntryDir.current = 'x'
    setMode('copilot')
    setChatOpen(true)
  }

  function openChatWithMessage(msg: string) {
    setPending(msg)
    chatEntryDir.current = 'y'
    panelWidthMV.set(stageRef.current?.clientWidth ?? window.innerWidth)
    setMode('fullchat')
    setChatOpen(true)
  }

  function handleChatToggle() {
    if (mode === 'fullchat') {
      handleExpandToggle()
    } else {
      if (interactionModel === 'in') {
        chatEntryDir.current = 'x'
        panelWidthMV.set(CHAT_WIDTH)
      }
      setChatOpen((v) => !v)
    }
  }

  const panelState: PanelState =
    mode === 'fullchat' ? 'fullscreen' :
    chatOpen            ? 'sidebar'    :
    'home'

  // Scrim only applies in "In" overlay mode; nav scrim skipped when nav is hidden (flow page)
  const anyOverlay = interactionModel === 'in' && ((navOpen && showNav) || (chatOpen && mode === 'copilot'))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ModeBar
        mode={mode}
        onModeChange={handleModeChange}
        navOpen={navOpen}
        onNavOpen={() => setNavOpen((v) => !v)}
        chatOpen={chatOpen || mode === 'fullchat'}
        onChatToggle={handleChatToggle}
        onSearchOpen={() => setSearchOpen(true)}
        panelState={panelState}
      />

      {/* ── Main stage ── */}
      <div
        ref={stageRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}
      >

        {interactionModel === 'in' ? (
          // ── IN: floating overlays on a full-width content surface ──────────
          <>
            {/* Content surface */}
            <div
              style={{
                flex: 1, display: 'flex', overflow: 'hidden',
                transition: 'opacity 0.35s ease',
                opacity: mode === 'fullchat' ? 0 : 1,
                pointerEvents: mode === 'fullchat' ? 'none' : 'auto',
              }}
            >
              <PageContent activePage={activePage} onAskAI={openChatWithMessage} chatOpen={chatOpen} />
            </div>

            {/* Scrim */}
            <AnimatePresence>
              {anyOverlay && mode !== 'fullchat' && (
                <motion.div
                  key="scrim"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => { setNavOpen(false); setChatOpen(false) }}
                  style={{
                    position: 'absolute', inset: 0, zIndex: 9,
                    background: 'rgba(0,0,0,0.10)', cursor: 'default',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Nav overlay — floats in from left as a rounded card */}
            <AnimatePresence>
              {navOpen && showNav && (
                <motion.div
                  key="nav-overlay"
                  initial={{ x: -(NAV_WIDTH + 16), boxShadow: NAV_SHADOW_0 }}
                  animate={{ x: 0, boxShadow: NAV_SHADOW }}
                  exit={{ x: -(NAV_WIDTH + 16), boxShadow: NAV_SHADOW_0 }}
                  transition={SPRING}
                  style={{
                    position: 'absolute', left: 8, top: 8, bottom: 8,
                    width: NAV_WIDTH, zIndex: 20,
                    background: '#ffffff', borderRadius: 12,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}
                >
                  <div style={{ height: 44, flexShrink: 0 }} />
                  {mode === 'fullchat' && (
                    <div style={{
                      margin: '8px 10px 4px', padding: '7px 10px',
                      borderRadius: 7, background: '#f5f8ff',
                      border: '1px solid #e0e8ff',
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}>
                      <Icon name="chat_bubble_outline" size={13} style={{ color: '#6b7dcc', flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, color: '#6b7dcc', lineHeight: 1.35 }}>
                        Pick a page — chat moves to the side
                      </span>
                    </div>
                  )}
                  <div style={{ flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {NAV_ITEMS.map(({ icon, label, page }) => {
                      const isActive = activePage === page
                      return (
                        <button
                          key={label}
                          onClick={() => {
                            setActivePage(page)
                            mode === 'fullchat' ? goToPage() : setNavOpen(false)
                          }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', borderRadius: 7, border: 'none',
                            background: isActive ? '#f5f5f5' : 'transparent',
                            color: isActive ? '#111' : '#777',
                            fontWeight: isActive ? 500 : 400,
                            fontSize: 13.5, cursor: 'pointer', textAlign: 'left',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isActive ? '#ececec' : '#f9f9f9' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isActive ? '#f5f5f5' : 'transparent' }}
                        >
                          <Icon name={icon} size={20} style={{ color: isActive ? '#444' : '#bbb' }} />
                          <span style={{ flex: 1 }}>{label}</span>
                          {mode === 'fullchat' && (
                            <Icon name="arrow_forward" size={13} style={{ color: '#ccc' }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    fontSize: 10, color: '#ccc', fontWeight: 500,
                    letterSpacing: '0.6px', textTransform: 'uppercase',
                  }}>
                    Workspace
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat overlay — morphs between sidebar and fullscreen */}
            <AnimatePresence>
              {(chatOpen || mode === 'fullchat') && (
                <motion.div
                  key="chat-panel-in"
                  initial={chatEntryDir.current === 'y' ? { y: '100%' } : { x: '100%' }}
                  animate={{ x: 0, y: 0 }}
                  exit={chatEntryDir.current === 'y' ? { y: '100%' } : { x: '100%' }}
                  transition={SPRING}
                  style={{
                    position: 'absolute', zIndex: 20,
                    right:  mode === 'fullchat' ? 0 : 8,
                    top:    mode === 'fullchat' ? 0 : 8,
                    bottom: mode === 'fullchat' ? 0 : 8,
                    width: panelWidthMV,
                    borderRadius: mode === 'fullchat' ? 0 : 12,
                    overflow: 'hidden',
                    boxShadow: mode === 'fullchat' ? 'none' : CHAT_SHADOW,
                    transition: [
                      'right 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                      'top 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                      'bottom 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                      'border-radius 0.45s ease',
                      'box-shadow 0.45s ease',
                    ].join(', '),
                  }}
                >
                  {mode !== 'fullchat' && (
                    <div
                      onPointerDown={handleResizePointerDown}
                      onPointerMove={handleResizePointerMove}
                      onPointerUp={handleResizePointerUp}
                      title="Drag to expand"
                      style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
                        cursor: 'col-resize', zIndex: 30,
                        background: 'transparent', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.06)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    />
                  )}
                  <ChatPanel
                    mode={mode === 'fullchat' ? 'fullchat' : 'copilot'}
                    onExpandToggle={handleExpandToggle}
                    onClose={mode === 'fullchat' ? handleExpandToggle : () => setChatOpen(false)}
                    initialQuery={pendingMessage}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          // ── OUT: panels push content aside (flex row with shadows) ──────────
          <>
            {/* Nav — flex sidebar, shadow on right edge */}
            {showNav && (
              <motion.div
                animate={{ width: navOpen ? NAV_WIDTH : 0 }}
                transition={SPRING}
                style={{
                  flexShrink: 0, overflow: 'hidden',
                  boxShadow: navOpen ? NAV_PUSH_SHADOW : 'none',
                  transition: 'box-shadow 0.3s ease',
                }}
              >
                <div style={{
                  width: NAV_WIDTH, height: '100%',
                  background: '#ffffff',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ height: 44, flexShrink: 0, borderBottom: '1px solid #f0f0f0' }} />
                  <div style={{ flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {NAV_ITEMS.map(({ icon, label, page }) => {
                      const isActive = activePage === page
                      return (
                        <button
                          key={label}
                          onClick={() => { setActivePage(page); setNavOpen(false) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', borderRadius: 7, border: 'none',
                            background: isActive ? '#f5f5f5' : 'transparent',
                            color: isActive ? '#111' : '#777',
                            fontWeight: isActive ? 500 : 400,
                            fontSize: 13.5, cursor: 'pointer', textAlign: 'left',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isActive ? '#ececec' : '#f9f9f9' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isActive ? '#f5f5f5' : 'transparent' }}
                        >
                          <Icon name={icon} size={20} style={{ color: isActive ? '#444' : '#bbb' }} />
                          <span style={{ flex: 1 }}>{label}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    fontSize: 10, color: '#ccc', fontWeight: 500,
                    letterSpacing: '0.6px', textTransform: 'uppercase',
                  }}>
                    Workspace
                  </div>
                </div>
              </motion.div>
            )}

            {/* Content — collapses in fullchat */}
            <div
              style={{
                flex: mode === 'fullchat' ? '0 0 0px' : '1 1 0px',
                overflow: 'hidden', minWidth: 0,
                opacity: mode === 'fullchat' ? 0 : 1,
                transition: 'opacity 0.35s ease',
                pointerEvents: mode === 'fullchat' ? 'none' : 'auto',
              }}
            >
              <PageContent activePage={activePage} onAskAI={openChatWithMessage} chatOpen={chatOpen} />
            </div>

            {/* Chat — flex sidebar, shadow on left edge */}
            <motion.div
              layout
              transition={SPRING}
              style={{
                flex: mode === 'fullchat' ? '1 1 0px' : chatOpen ? `0 0 ${CHAT_WIDTH}px` : '0 0 0px',
                overflow: 'hidden', minWidth: 0,
                display: 'flex', flexDirection: 'column',
                boxShadow: (chatOpen || mode === 'fullchat') ? CHAT_PUSH_SHADOW : 'none',
              }}
            >
              <AnimatePresence>
                {(chatOpen || mode === 'fullchat') && (
                  <motion.div
                    key="chat-out"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ height: '100%', minWidth: CHAT_WIDTH, display: 'flex', flexDirection: 'column' }}
                  >
                    <ChatPanel
                      mode={mode === 'fullchat' ? 'fullchat' : 'copilot'}
                      onExpandToggle={handleExpandToggle}
                      onClose={mode === 'fullchat' ? handleExpandToggle : () => setChatOpen(false)}
                      initialQuery={pendingMessage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}

      </div>

      {/* ── In/Out interaction switcher ── */}
      <V2InteractionSwitcher model={interactionModel} onChange={setInteractionModel} />

      {/* ── Search spotlight ── */}
      <SearchSpotlight isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

// ─── Interaction model switcher (V2) ─────────────────────────────────────────

function V2InteractionSwitcher({
  model,
  onChange,
}: {
  model: 'in' | 'out'
  onChange: (m: 'in' | 'out') => void
}) {
  return (
    <div
      style={{
        position: 'fixed', bottom: 20, left: 16, zIndex: 200,
        background: '#d0d0d0', borderRadius: 8, padding: '3px',
        display: 'flex', gap: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      {(['out', 'in'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: '5px 12px', borderRadius: 5, border: 'none',
            background: model === m ? '#ffffff' : 'transparent',
            color: model === m ? '#111' : '#666',
            fontSize: 12.5, fontWeight: model === m ? 500 : 400,
            cursor: 'pointer',
            transition: 'background 0.12s, color 0.12s',
            boxShadow: model === m ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
          }}
        >
          {m === 'out' ? 'Out' : 'In'}
        </button>
      ))}
    </div>
  )
}
