import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion, useMotionValue, animate } from 'motion/react'
import { Icon } from './components/Icon'
import { ModeBar, type Mode } from './components/ModeBar'
import { NavPanel, NAV_WIDTH } from './components/NavPanel'
import { ChatPanel, ReportPanelContent, type ChatOrientation } from './components/ChatPanel'
import { PageContent, type PageId } from './components/PageContent'
import { CopilotContent } from './components/CopilotContent'
import { useNavToggle } from './hooks/useNavToggle'
import { useWindowWidth } from './hooks/useWindowWidth'

/** Viewport width below which the nav auto-collapses. */
const NAV_COLLAPSE_BP = 1024

const SPRING = { type: 'spring', stiffness: 320, damping: 38 } as const

/** Chat sidebar width responsive to viewport. */
function getChatWidth(windowWidth: number): number {
  if (windowWidth >= 1440) return 400
  if (windowWidth >= 1280) return 360
  if (windowWidth >= 1024) return 320
  return 280
}

// ─── App ──────────────────────────────────────────────────────────────────────

export type ColorScheme = 'white' | 'grey' | 'variable'

export default function App() {
  const [interactionModel, setInteractionModel] = useState<'in' | 'out'>('out')
  const [elevation, setElevation]               = useState<'base' | 'shadow'>('base')
  const [colorScheme, setColorScheme]           = useState<ColorScheme>('variable')
  const [chatFill, setChatFill]                 = useState<'filled' | 'empty'>('filled')
  const [activePage, setActivePage]             = useState<PageId | null>(null)
  const [chatOpen, setChatOpen]                 = useState(false)
  const [chatOrientation, setChatOrientation]   = useState<ChatOrientation>('sidebar')
  const [pendingMessage, setPendingMessage]     = useState('')
  const [reportFullscreen, setReportFullscreen] = useState(false)

  const isFullchat = chatOpen && chatOrientation === 'fullscreen'
  const isFloating = chatOpen && chatOrientation === 'floating'
  const [snapHint, setSnapHint] = useState(false)
  const floatingRef = useRef<HTMLDivElement>(null)
  const [floatSize, setFloatSize] = useState({ w: 380, h: 520 })
  const floatResizeState = useRef<{
    dir: string; startX: number; startY: number; startW: number; startH: number
  } | null>(null)
  // When floating, the sidebar slot is empty (panel renders at root level)
  const chatInSidebar = chatOpen && chatOrientation === 'sidebar'
  const nav = useNavToggle(true)
  const navOpen = nav.isOpen
  const windowWidth = useWindowWidth()
  const chatWidth   = getChatWidth(windowWidth)

  // Auto-collapse nav when viewport is too narrow
  const isNarrow = windowWidth < NAV_COLLAPSE_BP
  useEffect(() => {
    if (isNarrow) nav.close()
  }, [isNarrow]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag-to-resize (shared by both interaction models) ───────────────────────
  const stageRef     = useRef<HTMLDivElement>(null)
  const panelWidthMV = useMotionValue(0)
  const dragStartRef = useRef<{ clientX: number } | null>(null)

  // Keep panelWidthMV in sync with chat open/close state and responsive width
  useEffect(() => {
    const containerW = stageRef.current?.clientWidth ?? window.innerWidth
    if (isFullchat) {
      animate(panelWidthMV, containerW, SPRING)
    } else if (chatInSidebar) {
      animate(panelWidthMV, chatWidth, SPRING)
    } else {
      // floating or closed — collapse the sidebar slot to 0 in both models
      animate(panelWidthMV, 0, SPRING)
    }
  }, [chatOpen, chatOrientation, interactionModel, chatWidth]) // eslint-disable-line

  function handleResizePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    panelWidthMV.stop()
    dragStartRef.current = { clientX: e.clientX }
  }

  function handleResizePointerMove(e: React.PointerEvent) {
    if (!dragStartRef.current) return
    const delta     = dragStartRef.current.clientX - e.clientX
    const containerW = stageRef.current?.clientWidth ?? window.innerWidth
    const newW      = Math.min(Math.max(chatWidth, chatWidth + delta), containerW - 16)
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
          setChatOrientation('fullscreen')
          setChatOpen(true)
          panelWidthMV.set(chatWidth)
        },
      })
    } else {
      animate(panelWidthMV, chatWidth, SPRING)
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  const showNav = true

  function handleReportFullscreen() {
    // Report takes over — dismiss chat, show report as a full-screen page
    setChatOpen(false)
    setChatOrientation('sidebar')
    setReportFullscreen(true)
  }

  function handleOrientationChange(o: ChatOrientation) {
    if (o === 'fullscreen') {
      panelWidthMV.set(stageRef.current?.clientWidth ?? window.innerWidth)
    } else if (o === 'sidebar' && interactionModel === 'in') {
      panelWidthMV.set(chatWidth)
    }
    setChatOrientation(o)
    setChatOpen(true)
  }

  const openChatWithMessage = useCallback((msg: string) => {
    setPendingMessage(msg)
    panelWidthMV.set(stageRef.current?.clientWidth ?? window.innerWidth)
    setChatOrientation('fullscreen')
    setChatOpen(true)
  }, [panelWidthMV])

  const openChatFloating = useCallback((msg: string) => {
    setPendingMessage(msg)
    setChatOrientation('floating')
    setChatOpen(true)
  }, [])

  function handleChatToggle() {
    if (!chatOpen) panelWidthMV.set(0)
    if (!chatOpen) setChatOrientation('sidebar')
    setChatOpen((v) => !v)
  }

  const SNAP_THRESHOLD = 120

  function handleFloatDrag() {
    if (!floatingRef.current) return
    const rect = floatingRef.current.getBoundingClientRect()
    setSnapHint(rect.right > window.innerWidth - SNAP_THRESHOLD)
  }

  function handleFloatDragEnd() {
    if (!floatingRef.current) return
    const rect = floatingRef.current.getBoundingClientRect()
    if (rect.right > window.innerWidth - SNAP_THRESHOLD) {
      setSnapHint(false)
      handleOrientationChange('sidebar')
    } else {
      setSnapHint(false)
    }
  }

  function startFloatResize(e: React.PointerEvent, dir: string) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    floatResizeState.current = {
      dir,
      startX: e.clientX, startY: e.clientY,
      startW: floatSize.w, startH: floatSize.h,
    }
  }

  function onFloatResizeMove(e: React.PointerEvent) {
    const s = floatResizeState.current
    if (!s) return
    const dx = e.clientX - s.startX
    const dy = e.clientY - s.startY
    const MIN_W = 280, MIN_H = 320
    let w = s.startW, h = s.startH
    if (s.dir.includes('e')) w = Math.max(MIN_W, s.startW + dx)
    if (s.dir.includes('w')) w = Math.max(MIN_W, s.startW - dx)
    if (s.dir.includes('s')) h = Math.max(MIN_H, s.startH + dy)
    if (s.dir.includes('n')) h = Math.max(MIN_H, s.startH - dy)
    setFloatSize({ w, h })
  }

  function stopFloatResize() {
    floatResizeState.current = null
  }

  const navBg = colorScheme === 'white' ? '#ffffff'
    : colorScheme === 'grey' ? 'var(--grey-200)'
    : 'var(--grey-100)'

  const chatBg = colorScheme === 'white' ? '#ffffff'
    : colorScheme === 'grey' ? 'var(--grey-200)'
    : '#ffffff'

  // Home page background — white in grey scheme, grey-100 otherwise
  const pageBg = colorScheme === 'grey' ? 'var(--grey-50)' : 'var(--grey-100)'

  const chatMode: Mode = isFullchat ? 'fullchat' : 'copilot'
  const showSidebarChat = chatInSidebar || isFullchat

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', background: '#e0e0e0', overflow: 'hidden',
      }}
    >
      {/* Top bar — hidden in fullchat */}
      <AnimatePresence initial={false}>
        {!isFullchat && (
          <motion.div
            key="topbar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{ flexShrink: 0, zIndex: 50 }}
          >
            <ModeBar
              mode={chatMode}
              onModeChange={() => {}}
              navOpen={navOpen && showNav}
              onNavOpen={nav.toggle}
              chatOpen={chatOpen}
              onChatToggle={handleChatToggle}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen close button */}
      <AnimatePresence>
        {isFullchat && (
          <motion.button
            key="fullscreen-close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => { setChatOrientation('sidebar'); setChatOpen(false) }}
            title="Exit full screen"
            style={{
              position: 'fixed', top: 0, right: 16, zIndex: 300,
              width: 30, height: 44,
              border: 'none', background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#888',
            }}
          >
            <Icon name="close" size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating chat panel */}
      <AnimatePresence>
        {isFloating && snapHint && (
          <motion.div
            key="snap-zone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0,
              width: chatWidth,
              background: 'rgba(0,0,0,0.04)',
              borderLeft: '2px solid rgba(0,0,0,0.10)',
              zIndex: 490,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isFloating && (
          <motion.div
            key="floating-chat"
            ref={floatingRef}
            drag
            dragMomentum={false}
            dragElastic={0}
            onDrag={handleFloatDrag}
            onDragEnd={handleFloatDragEnd}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            style={{
              position: 'fixed', bottom: 80, right: 24,
              width: floatSize.w, height: floatSize.h,
              zIndex: 500,
              borderRadius: snapHint ? 0 : 8,
              overflow: 'hidden',
              boxShadow: snapHint
                ? 'none'
                : '0 12px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.10)',
              border: '1px solid #e0e0e0',
              display: 'flex', flexDirection: 'column',
              background: '#fff',
              cursor: 'url(/drag-cursor.svg) 12 12, move',
              transition: 'border-radius 0.12s, box-shadow 0.12s',
            }}
          >
            {/* Resize handles — edges */}
            {(['n','s','e','w'] as const).map((dir) => (
              <div key={dir}
                onPointerDown={(e) => startFloatResize(e, dir)}
                onPointerMove={onFloatResizeMove}
                onPointerUp={stopFloatResize}
                style={{
                  position: 'absolute', zIndex: 20,
                  ...(dir === 'n' && { top: 0,    left: 6, right: 6, height: 5, cursor: 'ns-resize'  }),
                  ...(dir === 's' && { bottom: 0, left: 6, right: 6, height: 5, cursor: 'ns-resize'  }),
                  ...(dir === 'e' && { right: 0,  top: 6, bottom: 6, width: 5,  cursor: 'ew-resize'  }),
                  ...(dir === 'w' && { left: 0,   top: 6, bottom: 6, width: 5,  cursor: 'ew-resize'  }),
                }}
              />
            ))}
            {/* Resize handles — corners */}
            {(['nw','ne','sw','se'] as const).map((dir) => (
              <div key={dir}
                onPointerDown={(e) => startFloatResize(e, dir)}
                onPointerMove={onFloatResizeMove}
                onPointerUp={stopFloatResize}
                style={{
                  position: 'absolute', zIndex: 21, width: 10, height: 10,
                  ...(dir === 'nw' && { top: 0,    left: 0,  cursor: 'nwse-resize' }),
                  ...(dir === 'ne' && { top: 0,    right: 0, cursor: 'nesw-resize' }),
                  ...(dir === 'sw' && { bottom: 0, left: 0,  cursor: 'nesw-resize' }),
                  ...(dir === 'se' && { bottom: 0, right: 0, cursor: 'nwse-resize' }),
                }}
              />
            ))}
            {/* Drag handle strip */}
            <div
              style={{
                height: 22, flexShrink: 0,
                background: '#f2f2f2',
                borderBottom: '1px solid #ebebeb',
                cursor: 'url(/drag-cursor.svg) 12 12, move',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <div style={{ width: 28, height: 3, borderRadius: 2, background: '#d0d0d0' }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden', cursor: 'default' }}>
              <ChatPanel
                mode="copilot"
                orientation="floating"
                onOrientationChange={handleOrientationChange}
                onClose={() => { setChatOpen(false); setChatOrientation('sidebar') }}
                initialQuery={pendingMessage}
                elevation={elevation}
                panelBg={chatBg}
                chatFill={chatFill}
                onReportFullscreen={handleReportFullscreen}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stage ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {interactionModel === 'out' ? (
          // ── OUT: panels overlay content — content never moves ─────────────────
          <div ref={stageRef} style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>

            {/* Content — always full size behind overlay panels */}
            <div
              style={{
                position: 'absolute', inset: 0,
                opacity: isFullchat ? 0 : 1,
                transition: 'opacity 0.2s ease',
                pointerEvents: isFullchat ? 'none' : 'auto',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {activePage === null
                ? <CopilotContent onAskAI={openChatWithMessage} chatOpen={chatOpen} elevation={elevation} pageBg={pageBg} />
                : <PageContent activePage={activePage} onAskAI={openChatWithMessage} onAskAIFromChip={openChatFloating} elevation={elevation} pageBg={pageBg} />
              }
            </div>

            {/* Nav overlay — slides in from left on top of content */}
            {showNav && (
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 20, display: 'flex' }}>
                <NavPanel isOpen={navOpen} onToggle={nav.toggle} activePage={activePage} onPageChange={setActivePage} elevation={elevation} background={navBg} />
              </div>
            )}

            {/* Chat overlay — slides in from right on top of content */}
            <motion.div
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: panelWidthMV,
                overflow: 'hidden', minWidth: 0,
                display: 'flex', flexDirection: 'column',
                borderLeft: elevation === 'shadow' || !showSidebarChat
                  ? 'none'
                  : '1px solid #e8e8e8',
                boxShadow: elevation === 'shadow' && showSidebarChat
                  ? '-4px 0 20px rgba(0,0,0,0.09), -8px 0 40px rgba(0,0,0,0.05)'
                  : 'none',
                zIndex: 10,
              }}
            >
              {/* Drag handle */}
              {showSidebarChat && !isFullchat && (
                <div
                  onPointerDown={handleResizePointerDown}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: 6, cursor: 'col-resize', zIndex: 10,
                  }}
                />
              )}
              {showSidebarChat && (
                <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <ChatPanel
                    mode={chatMode}
                    orientation={chatOrientation}
                    onOrientationChange={handleOrientationChange}
                    onClose={
                      isFullchat
                        ? () => { setChatOrientation('sidebar'); setChatOpen(false) }
                        : () => setChatOpen(false)
                    }
                    initialQuery={pendingMessage}
                    elevation={elevation}
                    panelBg={chatBg}
                    chatFill={chatFill}
                    onReportFullscreen={handleReportFullscreen}
                  />
                </div>
              )}
            </motion.div>

          </div>
        ) : (
          // ── IN: panels push content (flex row) ───────────────────────────────
          <>
            {showNav && <NavPanel isOpen={navOpen} onToggle={nav.toggle} activePage={activePage} onPageChange={setActivePage} elevation={elevation} background={navBg} />}

            <div ref={stageRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>

              {/* Main content */}
              <div
                style={{
                  flex: 1,
                  overflow: 'hidden', minWidth: 0,
                  opacity: isFullchat ? 0 : 1,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: isFullchat ? 'none' : 'auto',
                  background: 'var(--grey-100)',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {activePage === null
                ? <CopilotContent onAskAI={openChatWithMessage} chatOpen={chatOpen} elevation={elevation} pageBg={pageBg} />
                : <PageContent activePage={activePage} onAskAI={openChatWithMessage} onAskAIFromChip={openChatFloating} elevation={elevation} pageBg={pageBg} />
              }
              </div>

              {/* Chat — width driven by panelWidthMV */}
              <motion.div
                style={{
                  width: panelWidthMV,
                  overflow: 'hidden', minWidth: 0,
                  display: 'flex', flexDirection: 'column',
                  borderLeft: elevation === 'shadow' || !showSidebarChat
                    ? 'none'
                    : '1px solid #e8e8e8',
                  boxShadow: elevation === 'shadow' && showSidebarChat
                    ? '-4px 0 20px rgba(0,0,0,0.09), -8px 0 40px rgba(0,0,0,0.05)'
                    : 'none',
                  position: 'relative', zIndex: 2,
                }}
              >
                {/* Drag handle */}
                {showSidebarChat && !isFullchat && (
                  <div
                    onPointerDown={handleResizePointerDown}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerUp}
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: 6, cursor: 'col-resize', zIndex: 10,
                    }}
                  />
                )}
                {showSidebarChat && (
                  <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <ChatPanel
                      mode={chatMode}
                      orientation={chatOrientation}
                      onOrientationChange={handleOrientationChange}
                      onClose={
                        isFullchat
                          ? () => { setChatOrientation('sidebar'); setChatOpen(false) }
                          : () => setChatOpen(false)
                      }
                      initialQuery={pendingMessage}
                      elevation={elevation}
                      panelBg={chatBg}
                      chatFill={chatFill}
                      onReportFullscreen={handleReportFullscreen}
                    />
                  </div>
                )}
              </motion.div>

            </div>
          </>
        )}
      </div>

      {/* ── Report full-screen overlay ── */}
      <AnimatePresence>
        {reportFullscreen && (
          <motion.div
            key="report-fs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 400,
              background: '#fff',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              height: 44, flexShrink: 0,
              borderBottom: '1px solid #e8e8e8',
              display: 'flex', alignItems: 'center',
              padding: '0 16px', gap: 8,
            }}>
              <motion.button
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={() => setReportFullscreen(false)}
                style={{
                  width: 32, height: 32, borderRadius: 7,
                  border: '1px solid #e4e4e4', background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#666',
                }}
              >
                <Icon name="close" size={16} />
              </motion.button>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1, paddingLeft: 6 }}>
                Q1 Payroll Report
              </span>
              <span style={{ fontSize: 11, color: '#bbb', background: '#f5f5f5', borderRadius: 4, padding: '2px 7px', fontWeight: 500 }}>
                Generated by AI
              </span>
            </div>

            {/* Report content — reuse the same component */}
            <div style={{ flex: 1, overflow: 'hidden', maxWidth: 900, margin: '0 auto', width: '100%' }}>
              <ReportPanelContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Prototype options ── */}
      <PrototypeOptions
        model={interactionModel} onModelChange={setInteractionModel}
        elevation={elevation}    onElevationChange={setElevation}
        colorScheme={colorScheme} onColorSchemeChange={setColorScheme}
        chatFill={chatFill}      onChatFillChange={setChatFill}
      />
    </div>
  )
}

// ─── Prototype Options Menu ───────────────────────────────────────────────────

function OptionRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--grey-500)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', background: 'var(--grey-100)', borderRadius: 6, padding: 2, gap: 1 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: value === opt.value ? '#ffffff' : 'transparent',
              color: value === opt.value ? '#111' : 'var(--grey-500)',
              fontSize: 12, fontWeight: value === opt.value ? 500 : 400,
              boxShadow: value === opt.value ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
              transition: 'background 0.1s, color 0.1s',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PrototypeOptions({
  model, onModelChange,
  elevation, onElevationChange,
  colorScheme, onColorSchemeChange,
  chatFill, onChatFillChange,
}: {
  model: 'in' | 'out'; onModelChange: (m: 'in' | 'out') => void
  elevation: 'base' | 'shadow'; onElevationChange: (e: 'base' | 'shadow') => void
  colorScheme: ColorScheme; onColorSchemeChange: (c: ColorScheme) => void
  chatFill: 'filled' | 'empty'; onChatFillChange: (f: 'filled' | 'empty') => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 16, zIndex: 200 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{
              position: 'absolute', bottom: 44, left: 0,
              background: '#ffffff',
              border: '1px solid var(--grey-200)',
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
              padding: '14px 16px',
              minWidth: 260,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Prototype Options
            </span>
            <OptionRow
              label="Motion"
              options={[{ value: 'out', label: 'Out' }, { value: 'in', label: 'In' }]}
              value={model} onChange={onModelChange}
            />
            <OptionRow
              label="Height"
              options={[{ value: 'base', label: 'Base' }, { value: 'shadow', label: 'Shadow' }]}
              value={elevation} onChange={onElevationChange}
            />
            <OptionRow
              label="Color"
              options={[
                { value: 'white', label: 'White' },
                { value: 'grey', label: 'Grey' },
                { value: 'variable', label: 'Variable' },
              ]}
              value={colorScheme} onChange={onColorSchemeChange}
            />
            <OptionRow
              label="Chat panel"
              options={[
                { value: 'filled', label: 'Filled' },
                { value: 'empty', label: 'Empty' },
              ]}
              value={chatFill} onChange={onChatFillChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        style={{
          width: 34, height: 34, borderRadius: 8,
          border: '1px solid var(--grey-200)',
          background: open ? '#111' : '#ffffff',
          color: open ? '#ffffff' : 'var(--grey-600)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M2 5h11M2 10h11M5 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM10 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </motion.button>
    </div>
  )
}
