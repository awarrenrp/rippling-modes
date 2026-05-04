import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'motion/react'
import { Icon } from './components/Icon'
import { ModeBar, type Mode } from './components/ModeBar'
import { NavPanel, navRailWidthPx, type SideBySideNavId } from './components/NavPanel'
import {
  ChatPanel,
  ReportPanelContent,
  ShellSplitUnifiedHeader,
  CHAT_PANEL_DEFAULT_TITLE,
  type ChatOrientation,
} from './components/ChatPanel'
import { ReportBuilderEditMode } from './components/ReportBuilderEditMode'
import { PageContent, type PageId } from './components/PageContent'
import { CopilotContent } from './components/CopilotContent'
import { SCHEDULE_CANVAS_DISPLAY_NAME } from './components/ScheduleCanvasView'
import { useNavToggle } from './hooks/useNavToggle'
import { useWindowWidth } from './hooks/useWindowWidth'
import {
  PROTOTYPE_DEFAULTS,
  NAV_COLLAPSE_BP,
  MIN_CHAT_W,
  getChatWidth,
  type ChatDockPolicy,
  type ColorScheme,
} from './prototypeDefaults'

const SPRING = { type: 'spring', stiffness: 320, damping: 38 } as const

/** Docked sidebar chat width when opened from the top bar (ModeBar) chat control. */
const SIDEBAR_CHAT_OPEN_FROM_NAV_PX = 360

const CANVAS_DOCK_SLIDE_PX = 56
const CANVAS_DOCK_SWAP_EASE = [0.22, 1, 0.36, 1] as const
const CANVAS_DOCK_SWAP_DURATION = 0.52

/** Match ChatPanel `SPLIT_GRIP_PX` — gutter between docked chat and dashboard canvas in edit mode. */
const DASHBOARD_CHAT_CANVAS_GUTTER_PX = 6

/** Dashboard side-by-side: chat column cannot shrink below this when resizing. */
const DASHBOARD_SIDEBY_SIDE_MIN_CHAT_PX = 320
/** Dashboard (canvas) pane cannot shrink below this fraction of the stage width. */
const DASHBOARD_SIDEBY_SIDE_MIN_CANVAS_FRACTION = 0.3

function clampPanelWidthDashboardSideBySide(w: number, containerW: number): number {
  if (containerW <= 0) return w
  const minChat = DASHBOARD_SIDEBY_SIDE_MIN_CHAT_PX
  const maxChat = Math.min(
    containerW - 16,
    containerW * (1 - DASHBOARD_SIDEBY_SIDE_MIN_CANVAS_FRACTION),
  )
  return Math.min(Math.max(w, minChat), Math.max(minChat, maxChat))
}

/** Slide + fade when canvas chat moves between left and right dock (edit mode). */
function canvasChatDockPresence(side: 'left' | 'right') {
  const x = side === 'left' ? -CANVAS_DOCK_SLIDE_PX : CANVAS_DOCK_SLIDE_PX
  return {
    initial: { opacity: 0, x },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x },
    transition: { duration: CANVAS_DOCK_SWAP_DURATION, ease: CANVAS_DOCK_SWAP_EASE },
  }
}

/** No persistent left rail — nav opens as an overlay from the hamburger (workflow, dashboard, canvas, immersive reports). */
function navUsesOverlayOnly(
  page: PageId | null,
  reportFullscreen: boolean,
  reportBuilderEditOpen: boolean,
  chatSplitRailOpen: boolean,
): boolean {
  return (
    page === 'flow' ||
    page === 'stepper' ||
    page === 'canvas' ||
    page === 'dashboard' ||
    reportFullscreen ||
    reportBuilderEditOpen ||
    chatSplitRailOpen
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [interactionModel, setInteractionModel] = useState<'in' | 'out'>(PROTOTYPE_DEFAULTS.interactionModel)
  const [elevation, setElevation]               = useState<'base' | 'shadow' | 'variable'>(PROTOTYPE_DEFAULTS.elevation)
  const [hoveredPanel, setHoveredPanel]         = useState<'chat' | 'nav' | null>(null)
  const [colorScheme, setColorScheme]           = useState<ColorScheme>(PROTOTYPE_DEFAULTS.colorScheme)
  const [chatDockPolicy, setChatDockPolicy]     = useState<ChatDockPolicy>(PROTOTYPE_DEFAULTS.chatDockPolicy)
  const [corners, setCorners]                   = useState<'none' | 'round'>(PROTOTYPE_DEFAULTS.corners)
  const [drawerMode, setDrawerMode]             = useState<'floating' | 'embedded' | 'collapse'>(PROTOTYPE_DEFAULTS.drawerMode)
  const [activePage, setActivePage]             = useState<PageId | null>(PROTOTYPE_DEFAULTS.activePage)
  const [chatOpen, setChatOpen]                 = useState(PROTOTYPE_DEFAULTS.chatOpen)
  const [chatOrientation, setChatOrientation]   = useState<ChatOrientation>(PROTOTYPE_DEFAULTS.chatOrientation)
  const [pendingMessage, setPendingMessage]     = useState('')
  /** ChatPanel workflow/report split — docked shell expands to full stage width so chat + rail fit. */
  const [chatSplitRailOpen, setChatSplitRailOpen] = useState(false)
  /** Report/workflow/schedule beside chat: AI top bar toggles chat column (same as double-chevron hide). */
  const [splitChatColumnHidden, setSplitChatColumnHidden] = useState(false)
  /** Side-by-side nav → ChatPanel opens report/workflow split when nonce bumps. */
  const [navSplitNonce, setNavSplitNonce] = useState(0)
  const [navSplitKind, setNavSplitKind] = useState<'reports' | 'workflows' | null>(null)
  const [sideBySideActive, setSideBySideActive] = useState<SideBySideNavId | null>(null)
  const [reportFullscreen, setReportFullscreen] = useState(false)
  const [reportBuilderEditOpen, setReportBuilderEditOpen] = useState(false)
  const navOverlayOnly = navUsesOverlayOnly(
    activePage,
    reportFullscreen,
    reportBuilderEditOpen,
    chatSplitRailOpen,
  )
  /** Canvas: chat docks right until “edit mode” moves it left + outlines widgets. */
  const [canvasDashboardEditMode, setCanvasDashboardEditMode] = useState(PROTOTYPE_DEFAULTS.canvasDashboardEditMode)
  /** Canvas page: WIW schedule beside docked chat (same resize shell as dashboard edit). */
  const [scheduleCanvasSplitMode, setScheduleCanvasSplitMode] = useState(false)
  const [canvasLeftChatExpanded, setCanvasLeftChatExpanded] = useState(PROTOTYPE_DEFAULTS.canvasLeftChatExpanded)

  const isFullchat = chatOpen && chatOrientation === 'fullscreen'
  /** OUT model: docked chat is z-10 under the nav overlay (z-20/40); fullscreen must stack above so the left edge resize strip gets pointer events. */
  const outDockedChatZIndex = isFullchat ? 45 : 10
  const isFloating = chatOpen && chatOrientation === 'floating'
  const [snapHint, setSnapHint] = useState(false)
  const floatingRef = useRef<HTMLDivElement>(null)
  const [floatSize, setFloatSize] = useState(PROTOTYPE_DEFAULTS.floatingSize)
  const floatResizeState = useRef<{
    dir: string; startX: number; startY: number; startW: number; startH: number
  } | null>(null)
  // When floating, the sidebar slot is empty (panel renders at root level)
  const chatInSidebar = chatOpen && chatOrientation === 'sidebar'
  const showNav = !isFullchat

  /** Canvas is split beside docked chat (dashboard edit or schedule from links / nav). */
  const canvasChatSplitDocked =
    activePage === 'canvas' &&
    (canvasDashboardEditMode || scheduleCanvasSplitMode) &&
    !isFloating &&
    chatInSidebar &&
    !isFullchat
  /** When split, dock chat on the **left** only in `right_and_left` policy (`always_right` keeps chat on the right). */
  const useCanvasLeftDock =
    canvasChatSplitDocked && chatDockPolicy === 'right_and_left'

  /** Canvas dashboard or schedule split + docked sidebar chat — split resize clamp applies. */
  const canvasStageSideBySideExpanded =
    activePage === 'canvas' &&
    (canvasDashboardEditMode || scheduleCanvasSplitMode) &&
    chatInSidebar &&
    !isFullchat &&
    !isFloating &&
    canvasLeftChatExpanded

  useEffect(() => {
    if (activePage !== 'canvas') {
      setCanvasDashboardEditMode(false)
      setScheduleCanvasSplitMode(false)
    }
  }, [activePage])
  const nav = useNavToggle(true)
  const navOpen = nav.isOpen
  /**
   * Canvas side-by-side: hide the left rail until Menu opens.
   * Overlay-only shells (flow, canvas, dashboard, …): hide the collapsed 56px strip too — same as canvas split.
   */
  const navRailDisplayed =
    showNav && (!canvasChatSplitDocked || navOpen) && (!navOverlayOnly || navOpen)
  const windowWidth = useWindowWidth()
  const chatWidth   = getChatWidth(windowWidth)
  /** User-dragged docked width; `null` = follow responsive `chatWidth`. */
  const [dockedChatUserWidth, setDockedChatUserWidth] = useState<number | null>(null)
  const effectiveChatWidth = dockedChatUserWidth ?? chatWidth
  const effectiveChatWidthRef = useRef(effectiveChatWidth)
  useLayoutEffect(() => {
    effectiveChatWidthRef.current = effectiveChatWidth
  }, [effectiveChatWidth])

  // Auto-collapse nav when viewport is too narrow
  const isNarrow = windowWidth < NAV_COLLAPSE_BP
  useEffect(() => {
    if (isNarrow) nav.close()
  }, [isNarrow]) // eslint-disable-line react-hooks/exhaustive-deps

  // Overlay-only shells — start with nav drawer closed so the stage isn’t narrow.
  useEffect(() => {
    if (navOverlayOnly) nav.close()
  }, [navOverlayOnly, nav])

  // Entering canvas + chat split: dismiss nav so the shell isn’t narrowed by the collapsed rail.
  useEffect(() => {
    if (canvasChatSplitDocked) nav.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to split mode, not every nav.toggle
  }, [canvasChatSplitDocked])

  // ── Drag-to-resize (shared by both interaction models) ───────────────────────
  const stageRef       = useRef<HTMLDivElement>(null)
  const panelWidthMV   = useMotionValue(0)
  const navStageOffsetPx = navRailDisplayed ? navRailWidthPx(navOpen) : 0
  const navDockOffsetMV = useMotionValue(navStageOffsetPx)
  useLayoutEffect(() => {
    navDockOffsetMV.set(navStageOffsetPx)
  }, [navStageOffsetPx, navDockOffsetMV])
  /** Left edge of dashboard gutter strip (OUT model): flush after docked chat when nav rail is open. */
  const outDashboardGutterLeft = useTransform([panelWidthMV, navDockOffsetMV], ([w, o]) => Number(w) + Number(o))
  /** Distance from stage right to inner edge of right-docked chat — aligns gutter beside canvas. */
  const outDashboardGutterRight = useTransform(panelWidthMV, (w) => w)
  const dragStartW     = useRef<number>(0)
  const dragStartX     = useRef<number | null>(null)
  const resizeDockRef  = useRef<'left' | 'right'>('right')

  // Clamp saved docked width when the viewport shrinks
  useEffect(() => {
    const containerW = stageRef.current?.clientWidth ?? window.innerWidth
    const maxW = Math.max(MIN_CHAT_W + 1, containerW - 16)
    setDockedChatUserWidth((prev) => {
      if (prev == null) return null
      let next = Math.min(Math.max(MIN_CHAT_W, prev), maxW)
      if (canvasStageSideBySideExpanded) {
        next = clampPanelWidthDashboardSideBySide(next, containerW)
      }
      return next
    })
  }, [windowWidth, canvasStageSideBySideExpanded])

  useEffect(() => {
    if (!chatOpen) {
      setChatSplitRailOpen(false)
      setSplitChatColumnHidden(false)
    }
  }, [chatOpen])

  useEffect(() => {
    if (!chatSplitRailOpen) setSplitChatColumnHidden(false)
  }, [chatSplitRailOpen])

  // Keep panelWidthMV in sync with chat open/close state and responsive width
  useEffect(() => {
    const containerW = stageRef.current?.clientWidth ?? window.innerWidth
    if (isFullchat) {
      // Don't fight an in-progress dock resize (e.g. shrinking from fullscreen)
      if (dragStartX.current !== null) return
      animate(panelWidthMV, containerW, SPRING)
    } else if (chatInSidebar) {
      if (canvasChatSplitDocked && !canvasLeftChatExpanded) {
        animate(panelWidthMV, 0, SPRING)
      } else if (chatSplitRailOpen) {
        animate(panelWidthMV, containerW, SPRING)
      } else {
        const target =
          canvasStageSideBySideExpanded && !chatSplitRailOpen
            ? clampPanelWidthDashboardSideBySide(effectiveChatWidth, containerW)
            : effectiveChatWidth
        animate(panelWidthMV, target, SPRING)
      }
    } else {
      animate(panelWidthMV, 0, SPRING)
    }
    // panelWidthMV is a stable motion value — omit from deps to avoid spurious re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps -- panelWidthMV
  }, [
    chatOpen,
    chatOrientation,
    interactionModel,
    chatWidth,
    dockedChatUserWidth,
    effectiveChatWidth,
    canvasChatSplitDocked,
    canvasLeftChatExpanded,
    isFullchat,
    chatInSidebar,
    chatSplitRailOpen,
    canvasStageSideBySideExpanded,
    chatDockPolicy,
  ])

  // Fade page content out as panel widens toward full-screen
  const contentOpacityMV = useTransform(panelWidthMV, (w) => {
    const containerW = stageRef.current?.clientWidth ?? window.innerWidth
    if (containerW <= 0) return 1
    // 1 at sidebar width → 0 at 75% container width
    const fadeStart = effectiveChatWidthRef.current
    const fadeEnd   = containerW * 0.75
    if (w <= fadeStart) return 1
    if (w >= fadeEnd)   return 0
    return 1 - (w - fadeStart) / (fadeEnd - fadeStart)
  })

  function handleResizePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    panelWidthMV.stop()
    const dock = (e.currentTarget as HTMLElement).dataset.dock
    resizeDockRef.current = dock === 'left' ? 'left' : 'right'
    dragStartX.current = e.clientX
    dragStartW.current = panelWidthMV.get()
  }

  function handleResizePointerMove(e: React.PointerEvent) {
    if (dragStartX.current === null) return
    const containerW = stageRef.current?.clientWidth ?? window.innerWidth
    const delta =
      resizeDockRef.current === 'left'
        ? e.clientX - dragStartX.current
        : dragStartX.current - e.clientX
    let newW = Math.min(Math.max(MIN_CHAT_W, dragStartW.current + delta), containerW - 16)
    if (canvasStageSideBySideExpanded) {
      newW = clampPanelWidthDashboardSideBySide(newW, containerW)
    }
    panelWidthMV.set(newW)
  }

  function handleResizePointerUp() {
    if (dragStartX.current === null) return
    dragStartX.current = null
    const containerW = stageRef.current?.clientWidth ?? window.innerWidth
    const currentW   = panelWidthMV.get()

    if (currentW > containerW * PROTOTYPE_DEFAULTS.fullscreenSnapThreshold) {
      animate(panelWidthMV, containerW, {
        ...SPRING,
        onComplete: () => {
          setChatOrientation('fullscreen')
          setChatOpen(true)
        },
      })
    } else if (!canvasStageSideBySideExpanded && currentW < MIN_CHAT_W + 20) {
      if (resizeDockRef.current === 'left' || canvasChatSplitDocked) {
        animate(panelWidthMV, 0, { ...SPRING, onComplete: () => { setCanvasLeftChatExpanded(false) } })
      } else {
        animate(panelWidthMV, 0, { ...SPRING, onComplete: () => setChatOpen(false) })
      }
    } else {
      let clamped = Math.min(Math.max(MIN_CHAT_W, currentW), containerW - 16)
      if (canvasStageSideBySideExpanded) {
        clamped = clampPanelWidthDashboardSideBySide(currentW, containerW)
      }
      setDockedChatUserWidth(clamped)
      animate(panelWidthMV, clamped, SPRING)
      if (chatOrientation === 'fullscreen') setChatOrientation('sidebar')
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  const handleModeBarNavToggle = useCallback(() => {
    nav.toggle()
  }, [nav])

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
      panelWidthMV.set(effectiveChatWidth)
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

  /** Main chat fullscreen; optional `initialQuery` re-seeds the thread (e.g. collapse drawer history). */
  const openMainChatFullscreen = useCallback(
    (options?: { initialQuery?: string }) => {
      if (options?.initialQuery !== undefined) setPendingMessage(options.initialQuery)
      panelWidthMV.set(stageRef.current?.clientWidth ?? window.innerWidth)
      setChatOrientation('fullscreen')
      setChatOpen(true)
    },
    [panelWidthMV],
  )

  const openChatFloating = useCallback((msg: string) => {
    setPendingMessage(msg)
    setChatOrientation('floating')
    setChatOpen(true)
  }, [])

  const closeMainChat = useCallback(() => {
    setChatOpen(false)
    setChatOrientation('sidebar')
  }, [])

  /** Sidebar / floating: full-screen overlay. Full-screen chat uses inline split in `ChatPanel` instead. */
  const handleOpenReportInEditMode = useCallback(() => {
    setReportBuilderEditOpen(true)
  }, [])

  /** Report-created card: open Canvas page (not inline payroll report); sidebar chat so the grid stays visible. */
  const handleOpenReportCreatedPage = useCallback(() => {
    setPendingMessage('')
    setActivePage('canvas')
    setChatOrientation('sidebar')
    setChatOpen(true)
    if (interactionModel === 'in') {
      panelWidthMV.set(effectiveChatWidth)
    }
  }, [interactionModel, effectiveChatWidth, panelWidthMV])

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

  // When elevation = 'variable', shadow tracks the hovered panel
  const navHasShadow  = elevation === 'shadow' || (elevation === 'variable' && hoveredPanel === 'nav')
  const chatHasShadow = elevation === 'shadow' || (elevation === 'variable' && hoveredPanel === 'chat')
  // The prop we pass down — NavPanel + ChatPanel only need to know shadow vs base
  const navElevation  = navHasShadow  ? 'shadow' : 'base'
  const chatElevation = chatHasShadow ? 'shadow' : 'base'

  // When colorScheme = 'variable', background tracks the hovered panel
  const navBg = colorScheme === 'white' ? '#ffffff'
    : colorScheme === 'grey'     ? 'var(--grey-200)'
    : 'var(--grey-100)'                            // variable: nav always grey-100

  const chatBg = colorScheme === 'white' ? '#ffffff'
    : colorScheme === 'grey'     ? 'var(--grey-200)'
    : '#ffffff'                                    // variable: chat always white

  // Home page background — white in grey scheme, grey-100 otherwise
  const pageBg = colorScheme === 'grey' ? 'var(--grey-50)' : 'var(--grey-100)'

  const chatMode: Mode = isFullchat ? 'fullchat' : 'copilot'
  const showSidebarChat = chatInSidebar || isFullchat

  const showDockedChatLeft  = useCanvasLeftDock && canvasLeftChatExpanded && chatOpen
  const showDockedChatRight = showSidebarChat && !useCanvasLeftDock

  const expandCanvasLeftChat = useCallback(() => {
    setCanvasLeftChatExpanded(true)
    setChatOpen(true)
    setChatOrientation('sidebar')
    animate(panelWidthMV, dockedChatUserWidth ?? chatWidth, SPRING)
  }, [chatWidth, dockedChatUserWidth, panelWidthMV])

  /** Double chevron in dashboard side-by-side: slide chat column off to the left; chat stays “open” for restore from canvas. */
  const collapseCanvasLeftChat = useCallback(() => {
    setCanvasLeftChatExpanded(false)
    animate(panelWidthMV, 0, SPRING)
  }, [panelWidthMV])

  function handleChatToggle() {
    if (chatSplitRailOpen) {
      setSplitChatColumnHidden((h) => !h)
      return
    }
    if (canvasChatSplitDocked) {
      if (!canvasLeftChatExpanded) {
        expandCanvasLeftChat()
      } else {
        collapseCanvasLeftChat()
      }
      return
    }
    if (!chatOpen) {
      setDockedChatUserWidth(SIDEBAR_CHAT_OPEN_FROM_NAV_PX)
      panelWidthMV.set(0)
      setChatOrientation('sidebar')
    }
    setChatOpen((v) => !v)
  }

  /** ModeBar AI control reflects whether the chat column is visible (incl. split hide + canvas strip collapse). */
  const modeBarChatOpen =
    chatOpen &&
    !(chatSplitRailOpen && splitChatColumnHidden) &&
    !(canvasChatSplitDocked && !canvasLeftChatExpanded)

  const enterCanvasDashboardEditMode = useCallback(() => {
    setScheduleCanvasSplitMode(false)
    setCanvasDashboardEditMode(true)
    setCanvasLeftChatExpanded(true)
    setChatOrientation('sidebar')
    setChatOpen(true)
    animate(panelWidthMV, dockedChatUserWidth ?? chatWidth, SPRING)
  }, [chatWidth, dockedChatUserWidth, panelWidthMV])

  /** Figma AI-components link card — canvas + WIW schedule beside chat (same resize rules as dashboard split). */
  const openScheduleCanvasFromFigmaLink = useCallback(() => {
    setPendingMessage('')
    setCanvasDashboardEditMode(false)
    setScheduleCanvasSplitMode(true)
    setActivePage('canvas')
    setCanvasLeftChatExpanded(true)
    setChatOpen(true)
    setChatOrientation('sidebar')
    setDockedChatUserWidth(SIDEBAR_CHAT_OPEN_FROM_NAV_PX)
    animate(panelWidthMV, SIDEBAR_CHAT_OPEN_FROM_NAV_PX, SPRING)
  }, [panelWidthMV])

  const closeScheduleSideBySide = useCallback(() => {
    setScheduleCanvasSplitMode(false)
  }, [])

  /** Canvas dashboard hero “Edit”, or Beta Dashboard page → navigate to canvas then edit. */
  const openDashboardEditFromChat = useCallback(() => {
    /** Clear stale `initialQuery` so ChatPanel isn’t stuck with a seeded user message (hides empty-state Edit / Summarize). */
    setPendingMessage('')
    setActivePage((p) => (p === 'dashboard' ? 'canvas' : p))
    enterCanvasDashboardEditMode()
  }, [enterCanvasDashboardEditMode])

  /** Exit dashboard canvas edit side-by-side (unified header close). */
  const closeDashboardSideBySide = useCallback(() => {
    setCanvasDashboardEditMode(false)
  }, [])

  const handleNavPageChange = useCallback((page: PageId | null) => {
    setSideBySideActive(null)
    setActivePage(page)
  }, [])

  const handleGoHome = useCallback(() => {
    handleNavPageChange(null)
    setNavSplitKind(null)
    /** Bump so ChatPanel closes report/workflow rails when kind becomes null (Home leaves AI fullscreen only). */
    setNavSplitNonce((n) => n + 1)
    setReportFullscreen(false)
    setReportBuilderEditOpen(false)
    setCanvasDashboardEditMode(false)
    setScheduleCanvasSplitMode(false)
    setChatSplitRailOpen(false)
    /** Left-docked chat (`right_and_left`): logo = leave AI behind — close docked chat on Home. */
    if (chatDockPolicy === 'right_and_left') {
      setChatOpen(false)
      setChatOrientation('sidebar')
      return
    }
    /** Leave canvas / report split behind but keep AI fullscreen — do not collapse to sidebar (that felt like minimizing both panes). */
    if (chatOrientation === 'fullscreen') {
      setChatOpen(true)
      const containerW = stageRef.current?.clientWidth ?? window.innerWidth
      animate(panelWidthMV, containerW, SPRING)
    }
  }, [chatDockPolicy, chatOrientation, handleNavPageChange, panelWidthMV])

  const handleSideBySideSelect = useCallback(
    (id: SideBySideNavId) => {
      setSideBySideActive(id)
      setChatOpen(true)
      if (id === 'dashboard') {
        setNavSplitKind(null)
        setActivePage('canvas')
        enterCanvasDashboardEditMode()
        return
      }
      setNavSplitKind(id)
      setNavSplitNonce((n) => n + 1)
      setActivePage(null)
    },
    [enterCanvasDashboardEditMode],
  )

  const chatNavSplitBootstrap = {
    navSplitBootstrapNonce: navSplitNonce,
    navSplitBootstrapKind: navSplitKind,
  }

  const canvasDashboardHero =
    !canvasDashboardEditMode &&
    !scheduleCanvasSplitMode &&
    (activePage === 'canvas' || activePage === 'dashboard')
  const canvasDashboardEditHero = activePage === 'canvas' && canvasDashboardEditMode
  /** Sidebar dock only — animates when swapping canvas chat left ↔ right. */
  const canvasSidebarDockSwap =
    activePage === 'canvas' && chatInSidebar && !isFullchat && !isFloating

  /** Canvas dashboard edit: shadow beside docked chat (canvas is on the opposite side). */
  const canvasEdgeShadow: 'none' | 'left' | 'right' | 'ambient' =
    activePage === 'canvas' && (canvasDashboardEditMode || scheduleCanvasSplitMode)
      ? chatOpen && chatInSidebar && !isFloating && !isFullchat
        ? useCanvasLeftDock
          ? 'left'
          : 'right'
        : 'ambient'
      : 'none'

  /** Prefer canvas shadow over chat shadow when canvas stage split + docked sidebar chat. */
  const muteDockedChatShadowBesideCanvasStage =
    activePage === 'canvas' &&
    (canvasDashboardEditMode || scheduleCanvasSplitMode) &&
    chatOpen &&
    chatInSidebar &&
    !isFullchat &&
    !isFloating

  const dockChatHeavyShadow = chatHasShadow && !muteDockedChatShadowBesideCanvasStage

  const canvasSplitFlat = !(corners === 'round' && !isFullchat)
  const canvasStageGutterLeft =
    (canvasDashboardEditMode || scheduleCanvasSplitMode) && showDockedChatLeft && canvasSplitFlat
  const canvasStageGutterRight =
    (canvasDashboardEditMode || scheduleCanvasSplitMode) && showDockedChatRight && canvasSplitFlat
  const inDashboardCanvasOrder =
    canvasStageGutterLeft && canvasStageGutterRight ? 3 : canvasStageGutterLeft ? 3 : 2
  const inDashboardChatRightOrder =
    canvasStageGutterLeft && canvasStageGutterRight ? 5 : canvasStageGutterLeft || canvasStageGutterRight ? 4 : 3
  const inDashboardGutterRightOrder =
    canvasStageGutterLeft && canvasStageGutterRight ? 4 : canvasStageGutterRight ? 3 : undefined

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh',
        background: 'color-mix(in srgb, var(--brand) 3.5%, #e0e0e0)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar — visible in full-screen chat too so nav/search/org context staysPut */}
      <div style={{ flexShrink: 0, zIndex: 50 }}>
        <ModeBar
          mode={chatMode}
          onModeChange={() => {}}
          navOpen={navRailDisplayed && navOpen}
          onNavOpen={handleModeBarNavToggle}
          onLogoClick={handleGoHome}
          chatOpen={modeBarChatOpen}
          onChatToggle={handleChatToggle}
        />
      </div>


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
                elevation={chatElevation}
                panelBg={chatBg}
                chatFill={PROTOTYPE_DEFAULTS.chatFill}
                chatDockPolicy={chatDockPolicy}
                splitChatColumnHidden={splitChatColumnHidden}
                onSplitChatColumnHiddenChange={setSplitChatColumnHidden}
                onSplitCanvasOpenChange={setChatSplitRailOpen}
                onReportFullscreen={handleReportFullscreen}
                onOpenReportInEditMode={handleOpenReportInEditMode}
                onOpenReportCreatedPage={handleOpenReportCreatedPage}
                canvasDashboardHero={canvasDashboardHero}
                canvasDashboardEditHero={canvasDashboardEditHero}
                onOpenDashboardEditMode={openDashboardEditFromChat}
                onOpenScheduleShellSplit={openScheduleCanvasFromFigmaLink}
                scheduleCanvasShellSplit={scheduleCanvasSplitMode && activePage === 'canvas'}
                {...chatNavSplitBootstrap}
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
            <motion.div
              style={{
                position: 'absolute', inset: 0,
                opacity: contentOpacityMV,
                pointerEvents: isFullchat ? 'none' : 'auto',
                display: 'flex', flexDirection: 'column',
                minHeight: 0,
              }}
            >
              {activePage === null
                ? <CopilotContent onAskAI={openChatWithMessage} chatOpen={chatOpen} elevation={elevation} pageBg={pageBg} />
                : <PageContent
                    activePage={activePage} onAskAI={openChatWithMessage} onAskAIFromChip={openChatFloating} elevation={elevation} pageBg={pageBg}
                    drawerMode={drawerMode} onOpenFloating={openChatFloating} onOpenFullscreen={openMainChatFullscreen} onCloseMainChat={closeMainChat}
                    canvasLeftChatCollapsed={canvasChatSplitDocked && !canvasLeftChatExpanded}
                    onExpandCanvasLeftChat={expandCanvasLeftChat}
                    dashboardEditMode={canvasDashboardEditMode}
                    canvasEdgeShadow={canvasEdgeShadow}
                    onDashboardEnterEdit={openDashboardEditFromChat}
                    chatDockPolicy={chatDockPolicy}
                    scheduleSplitMode={scheduleCanvasSplitMode && activePage === 'canvas'}
                    onCloseScheduleSplit={closeScheduleSideBySide}
                  />
              }
            </motion.div>

            {/* Nav overlay — slides in from left on top of content */}
            {navRailDisplayed && (
              <div
                onMouseEnter={() => setHoveredPanel('nav')}
                onMouseLeave={() => setHoveredPanel(null)}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: navOverlayOnly ? 40 : 20,
                  display: 'flex',
                  pointerEvents: 'auto',
                }}
              >
                <NavPanel
                  isOpen={navOpen}
                  onToggle={nav.toggle}
                  activePage={activePage}
                  onPageChange={handleNavPageChange}
                  activeSideBySide={sideBySideActive}
                  onSideBySideSelect={handleSideBySideSelect}
                  elevation={navElevation}
                  background={navBg}
                />
              </div>
            )}

            {/* Chat overlays — canvas swaps left ↔ right with slide + fade; other pages unchanged */}
            {canvasSidebarDockSwap ? (
              <>
              <AnimatePresence mode="sync" initial={false}>
                {showDockedChatRight && (() => {
                  const rounded = corners === 'round' && !isFullchat
                  return (
                    <motion.div
                      key="canvas-out-right"
                      {...canvasChatDockPresence('right')}
                      onMouseEnter={() => setHoveredPanel('chat')}
                      onMouseLeave={() => setHoveredPanel(null)}
                      style={{
                        position: 'absolute',
                        right:   rounded ? 16 : 0,
                        top:     rounded ? 16 : 0,
                        bottom:  rounded ? 16 : 0,
                        width: panelWidthMV,
                        overflow: rounded ? 'visible' : 'hidden',
                        minWidth: 0,
                        display: 'flex', flexDirection: 'column',
                        background: rounded ? pageBg : 'transparent',
                        transition: 'right 0.25s ease, top 0.25s ease, bottom 0.25s ease, box-shadow 0.2s ease, background 0.2s ease',
                        borderLeft: !rounded && !chatHasShadow && !canvasStageGutterRight ? '1px solid #e8e8e8' : 'none',
                        boxShadow: !rounded && chatHasShadow
                          ? '-4px 0 20px rgba(0,0,0,0.09), -8px 0 40px rgba(0,0,0,0.05)'
                          : 'none',
                        zIndex: outDockedChatZIndex,
                      }}
                    >
                      <div style={{
                        position: 'relative', zIndex: 0,
                        height: '100%', width: '100%',
                        display: 'flex', flexDirection: 'column',
                        borderRadius: rounded ? 12 : 0,
                        overflow: 'hidden',
                        boxShadow: rounded && chatHasShadow
                          ? '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)'
                          : 'none',
                        transition: 'border-radius 0.25s ease, box-shadow 0.25s ease',
                      }}>
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
                          elevation={chatElevation}
                          panelBg={chatBg}
                          chatFill={PROTOTYPE_DEFAULTS.chatFill}
                          chatDockPolicy={chatDockPolicy}
                          splitChatColumnHidden={splitChatColumnHidden}
                          onSplitChatColumnHiddenChange={setSplitChatColumnHidden}
                          onSplitCanvasOpenChange={setChatSplitRailOpen}
                          onReportFullscreen={handleReportFullscreen}
                          onOpenReportInEditMode={handleOpenReportInEditMode}
                          onOpenReportCreatedPage={handleOpenReportCreatedPage}
                          canvasDashboardHero={canvasDashboardHero}
                          canvasDashboardEditHero={canvasDashboardEditHero}
                          onOpenDashboardEditMode={openDashboardEditFromChat}
                          onOpenScheduleShellSplit={openScheduleCanvasFromFigmaLink}
                          scheduleCanvasShellSplit={scheduleCanvasSplitMode && activePage === 'canvas'}
                          {...chatNavSplitBootstrap}
                        />
                      </div>
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize chat"
                        data-dock="right"
                        onPointerDown={handleResizePointerDown}
                        onPointerMove={handleResizePointerMove}
                        onPointerUp={handleResizePointerUp}
                        onPointerCancel={handleResizePointerUp}
                        style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: 8, cursor: 'col-resize', zIndex: 40, touchAction: 'none', pointerEvents: 'auto',
                        }}
                      />
                    </motion.div>
                  )
                })()}
                {showDockedChatLeft && (() => {
                  const rounded = corners === 'round' && !isFullchat
                  const navOff = navStageOffsetPx
                  return (
                    <motion.div
                      key="canvas-out-left"
                      {...canvasChatDockPresence('left')}
                      onMouseEnter={() => setHoveredPanel('chat')}
                      onMouseLeave={() => setHoveredPanel(null)}
                      style={{
                        position: 'absolute',
                        left:   rounded ? 16 + navOff : navOff,
                        top:    rounded ? 16 : 0,
                        bottom: rounded ? 16 : 0,
                        width: panelWidthMV,
                        overflow: rounded ? 'visible' : 'hidden',
                        minWidth: 0,
                        display: 'flex', flexDirection: 'column',
                        background: rounded ? pageBg : 'transparent',
                        transition: 'left 0.25s ease, top 0.25s ease, bottom 0.25s ease, box-shadow 0.2s ease, background 0.2s ease',
                        borderRight: !rounded && !chatHasShadow && !canvasStageGutterLeft ? '1px solid #e8e8e8' : 'none',
                        boxShadow: !rounded && chatHasShadow
                          ? '4px 0 20px rgba(0,0,0,0.09), 8px 0 40px rgba(0,0,0,0.05)'
                          : 'none',
                        zIndex: outDockedChatZIndex,
                      }}
                    >
                      <div style={{
                        position: 'relative', zIndex: 0,
                        height: '100%', width: '100%',
                        display: 'flex', flexDirection: 'column',
                        borderRadius: rounded ? 12 : 0,
                        overflow: 'hidden',
                        boxShadow: rounded && chatHasShadow
                          ? '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)'
                          : 'none',
                        transition: 'border-radius 0.25s ease, box-shadow 0.25s ease',
                      }}>
                        <ChatPanel
                          mode={chatMode}
                          orientation={chatOrientation}
                          onOrientationChange={handleOrientationChange}
                          onClose={() => setChatOpen(false)}
                          onCollapseDashboardSideChat={collapseCanvasLeftChat}
                          initialQuery={pendingMessage}
                          elevation={chatElevation}
                          panelBg={chatBg}
                          chatFill={PROTOTYPE_DEFAULTS.chatFill}
                          chatDockPolicy={chatDockPolicy}
                          splitChatColumnHidden={splitChatColumnHidden}
                          onSplitChatColumnHiddenChange={setSplitChatColumnHidden}
                          onSplitCanvasOpenChange={setChatSplitRailOpen}
                          onReportFullscreen={handleReportFullscreen}
                          onOpenReportInEditMode={handleOpenReportInEditMode}
                          onOpenReportCreatedPage={handleOpenReportCreatedPage}
                          canvasDashboardHero={canvasDashboardHero}
                          canvasDashboardEditHero={canvasDashboardEditHero}
                          onOpenDashboardEditMode={openDashboardEditFromChat}
                          onOpenScheduleShellSplit={openScheduleCanvasFromFigmaLink}
                          scheduleCanvasShellSplit={scheduleCanvasSplitMode && activePage === 'canvas'}
                          {...chatNavSplitBootstrap}
                        />
                      </div>
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize chat"
                        data-dock="left"
                        onPointerDown={handleResizePointerDown}
                        onPointerMove={handleResizePointerMove}
                        onPointerUp={handleResizePointerUp}
                        onPointerCancel={handleResizePointerUp}
                        style={{
                          position: 'absolute', right: 0, top: 0, bottom: 0,
                          width: 8, cursor: 'col-resize', zIndex: 40, touchAction: 'none', pointerEvents: 'auto',
                        }}
                      />
                    </motion.div>
                  )
                })()}
              </AnimatePresence>
              {canvasStageGutterLeft && (
                <motion.div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    zIndex: 9,
                    top: 0,
                    bottom: 0,
                    width: DASHBOARD_CHAT_CANVAS_GUTTER_PX,
                    left: outDashboardGutterLeft,
                    pointerEvents: 'none',
                    background: 'var(--grey-100)',
                    borderLeft: '1px solid var(--grey-200)',
                    borderRight: '1px solid var(--grey-200)',
                  }}
                />
              )}
              {canvasStageGutterRight && (
                <motion.div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    zIndex: 9,
                    top: 0,
                    bottom: 0,
                    width: DASHBOARD_CHAT_CANVAS_GUTTER_PX,
                    right: outDashboardGutterRight,
                    pointerEvents: 'none',
                    background: 'var(--grey-100)',
                    borderLeft: '1px solid var(--grey-200)',
                    borderRight: '1px solid var(--grey-200)',
                  }}
                />
              )}
              </>
            ) : (
              <>
                {showDockedChatRight && (() => {
                  const rounded = corners === 'round' && !isFullchat
                  return (
                    <motion.div
                      onMouseEnter={() => setHoveredPanel('chat')}
                      onMouseLeave={() => setHoveredPanel(null)}
                      style={{
                        position: 'absolute',
                        right:   rounded ? 16 : 0,
                        top:     rounded ? 16 : 0,
                        bottom:  rounded ? 16 : 0,
                        width: panelWidthMV,
                        overflow: rounded ? 'visible' : 'hidden',
                        minWidth: 0,
                        display: 'flex', flexDirection: 'column',
                        background: rounded ? pageBg : 'transparent',
                        transition: 'right 0.25s ease, top 0.25s ease, bottom 0.25s ease, box-shadow 0.2s ease, background 0.2s ease',
                        borderLeft: !rounded && !chatHasShadow ? '1px solid #e8e8e8' : 'none',
                        boxShadow: !rounded && chatHasShadow
                          ? '-4px 0 20px rgba(0,0,0,0.09), -8px 0 40px rgba(0,0,0,0.05)'
                          : 'none',
                        zIndex: outDockedChatZIndex,
                      }}
                    >
                      <div style={{
                        position: 'relative', zIndex: 0,
                        height: '100%', width: '100%',
                        display: 'flex', flexDirection: 'column',
                        borderRadius: rounded ? 12 : 0,
                        overflow: 'hidden',
                        boxShadow: rounded && chatHasShadow
                          ? '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)'
                          : 'none',
                        transition: 'border-radius 0.25s ease, box-shadow 0.25s ease',
                      }}>
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
                          elevation={chatElevation}
                          panelBg={chatBg}
                          chatFill={PROTOTYPE_DEFAULTS.chatFill}
                          chatDockPolicy={chatDockPolicy}
                          splitChatColumnHidden={splitChatColumnHidden}
                          onSplitChatColumnHiddenChange={setSplitChatColumnHidden}
                          onSplitCanvasOpenChange={setChatSplitRailOpen}
                          onReportFullscreen={handleReportFullscreen}
                          onOpenReportInEditMode={handleOpenReportInEditMode}
                          onOpenReportCreatedPage={handleOpenReportCreatedPage}
                          canvasDashboardHero={canvasDashboardHero}
                          canvasDashboardEditHero={canvasDashboardEditHero}
                          onOpenDashboardEditMode={openDashboardEditFromChat}
                          onOpenScheduleShellSplit={openScheduleCanvasFromFigmaLink}
                          scheduleCanvasShellSplit={scheduleCanvasSplitMode && activePage === 'canvas'}
                          {...chatNavSplitBootstrap}
                        />
                      </div>
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize chat"
                        data-dock="right"
                        onPointerDown={handleResizePointerDown}
                        onPointerMove={handleResizePointerMove}
                        onPointerUp={handleResizePointerUp}
                        onPointerCancel={handleResizePointerUp}
                        style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: 8, cursor: 'col-resize', zIndex: 40, touchAction: 'none', pointerEvents: 'auto',
                        }}
                      />
                    </motion.div>
                  )
                })()}
                {showDockedChatLeft && (() => {
                  const rounded = corners === 'round' && !isFullchat
                  const navOff = navStageOffsetPx
                  return (
                    <motion.div
                      onMouseEnter={() => setHoveredPanel('chat')}
                      onMouseLeave={() => setHoveredPanel(null)}
                      style={{
                        position: 'absolute',
                        left:   rounded ? 16 + navOff : navOff,
                        top:    rounded ? 16 : 0,
                        bottom: rounded ? 16 : 0,
                        width: panelWidthMV,
                        overflow: rounded ? 'visible' : 'hidden',
                        minWidth: 0,
                        display: 'flex', flexDirection: 'column',
                        background: rounded ? pageBg : 'transparent',
                        transition: 'left 0.25s ease, top 0.25s ease, bottom 0.25s ease, box-shadow 0.2s ease, background 0.2s ease',
                        borderRight: !rounded && !chatHasShadow ? '1px solid #e8e8e8' : 'none',
                        boxShadow: !rounded && chatHasShadow
                          ? '4px 0 20px rgba(0,0,0,0.09), 8px 0 40px rgba(0,0,0,0.05)'
                          : 'none',
                        zIndex: outDockedChatZIndex,
                      }}
                    >
                      <div style={{
                        position: 'relative', zIndex: 0,
                        height: '100%', width: '100%',
                        display: 'flex', flexDirection: 'column',
                        borderRadius: rounded ? 12 : 0,
                        overflow: 'hidden',
                        boxShadow: rounded && chatHasShadow
                          ? '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)'
                          : 'none',
                        transition: 'border-radius 0.25s ease, box-shadow 0.25s ease',
                      }}>
                        <ChatPanel
                          mode={chatMode}
                          orientation={chatOrientation}
                          onOrientationChange={handleOrientationChange}
                          onClose={() => setChatOpen(false)}
                          onCollapseDashboardSideChat={collapseCanvasLeftChat}
                          initialQuery={pendingMessage}
                          elevation={chatElevation}
                          panelBg={chatBg}
                          chatFill={PROTOTYPE_DEFAULTS.chatFill}
                          chatDockPolicy={chatDockPolicy}
                          splitChatColumnHidden={splitChatColumnHidden}
                          onSplitChatColumnHiddenChange={setSplitChatColumnHidden}
                          onSplitCanvasOpenChange={setChatSplitRailOpen}
                          onReportFullscreen={handleReportFullscreen}
                          onOpenReportInEditMode={handleOpenReportInEditMode}
                          onOpenReportCreatedPage={handleOpenReportCreatedPage}
                          canvasDashboardHero={canvasDashboardHero}
                          canvasDashboardEditHero={canvasDashboardEditHero}
                          onOpenDashboardEditMode={openDashboardEditFromChat}
                          onOpenScheduleShellSplit={openScheduleCanvasFromFigmaLink}
                          scheduleCanvasShellSplit={scheduleCanvasSplitMode && activePage === 'canvas'}
                          {...chatNavSplitBootstrap}
                        />
                      </div>
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize chat"
                        data-dock="left"
                        onPointerDown={handleResizePointerDown}
                        onPointerMove={handleResizePointerMove}
                        onPointerUp={handleResizePointerUp}
                        onPointerCancel={handleResizePointerUp}
                        style={{
                          position: 'absolute', right: 0, top: 0, bottom: 0,
                          width: 8, cursor: 'col-resize', zIndex: 40, touchAction: 'none', pointerEvents: 'auto',
                        }}
                      />
                    </motion.div>
                  )
                })()}
              </>
            )}

          </div>
        ) : (
          // ── IN: panels push content (flex row) ───────────────────────────────
          <>
            {navRailDisplayed && !navOverlayOnly && (
              <div
                onMouseEnter={() => setHoveredPanel('nav')}
                onMouseLeave={() => setHoveredPanel(null)}
                style={{ display: 'flex', height: '100%' }}
              >
                <NavPanel
                  isOpen={navOpen}
                  onToggle={nav.toggle}
                  activePage={activePage}
                  onPageChange={handleNavPageChange}
                  activeSideBySide={sideBySideActive}
                  onSideBySideSelect={handleSideBySideSelect}
                  elevation={navElevation}
                  background={navBg}
                />
              </div>
            )}

            <div ref={stageRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0, position: 'relative' }}>
              {/* Workflow / Flow / Canvas — nav drawer on top of content (no persistent rail) */}
              {navRailDisplayed && navOverlayOnly && (
                <div
                  onMouseEnter={() => setHoveredPanel('nav')}
                  onMouseLeave={() => setHoveredPanel(null)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 40,
                    display: 'flex',
                    pointerEvents: 'auto',
                  }}
                >
                  <NavPanel
                    isOpen={navOpen}
                    onToggle={nav.toggle}
                    activePage={activePage}
                    onPageChange={handleNavPageChange}
                    activeSideBySide={sideBySideActive}
                    onSideBySideSelect={handleSideBySideSelect}
                    elevation={navElevation}
                    background={navBg}
                  />
                </div>
              )}

              {canvasSidebarDockSwap ? (
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {scheduleCanvasSplitMode && (
                    <ShellSplitUnifiedHeader
                      segments={['Scheduling', 'WIW', SCHEDULE_CANVAS_DISPLAY_NAME]}
                      onClose={closeScheduleSideBySide}
                      panelBg={chatBg}
                      aiCompDocked
                    />
                  )}
                  {canvasDashboardEditMode && !scheduleCanvasSplitMode && (
                    <ShellSplitUnifiedHeader
                      segments={['Dashboards & Reports', 'People analytics', CHAT_PANEL_DEFAULT_TITLE]}
                      onClose={closeDashboardSideBySide}
                      panelBg={chatBg}
                      aiCompDocked
                    />
                  )}
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'row',
                      overflow: 'hidden',
                    }}
                  >
                  {/* display:contents → chat columns participate in stage flex + flex order with main */}
                  <div style={{ display: 'contents' }}>
                  <AnimatePresence mode="sync" initial={false}>
                    {showDockedChatLeft && (() => {
                      const rounded = corners === 'round' && !isFullchat
                      return (
                        <motion.div
                          key="canvas-in-left"
                          {...canvasChatDockPresence('left')}
                          onMouseEnter={() => setHoveredPanel('chat')}
                          onMouseLeave={() => setHoveredPanel(null)}
                          style={{
                            order: 1,
                            width: panelWidthMV,
                            overflow: rounded ? 'visible' : 'hidden',
                            minWidth: 0,
                            display: 'flex', flexDirection: 'column',
                            padding: rounded ? '16px 0 16px 16px' : 0,
                            background: rounded ? pageBg : 'transparent',
                            borderRight:
                              canvasStageGutterLeft
                                ? 'none'
                                : !rounded && (!chatHasShadow || muteDockedChatShadowBesideCanvasStage)
                                  ? '1px solid #e8e8e8'
                                  : 'none',
                            boxShadow: !rounded && dockChatHeavyShadow
                              ? '4px 0 20px rgba(0,0,0,0.09), 8px 0 40px rgba(0,0,0,0.05)'
                              : 'none',
                            transition: 'box-shadow 0.2s ease, padding 0.25s ease, background 0.2s ease',
                            position: 'relative', zIndex: 2,
                          }}
                        >
                          <div style={{
                            position: 'relative', zIndex: 0,
                            flex: 1, display: 'flex', flexDirection: 'column',
                            borderRadius: rounded ? 12 : 0,
                            overflow: 'hidden',
                            boxShadow: rounded && dockChatHeavyShadow
                              ? '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)'
                              : 'none',
                            transition: 'border-radius 0.25s ease, box-shadow 0.25s ease',
                          }}>
                            <ChatPanel
                              mode={chatMode}
                              orientation={chatOrientation}
                              onOrientationChange={handleOrientationChange}
                              onClose={() => setChatOpen(false)}
                              onCollapseDashboardSideChat={collapseCanvasLeftChat}
                              initialQuery={pendingMessage}
                              elevation={chatElevation}
                              panelBg={chatBg}
                              chatFill={PROTOTYPE_DEFAULTS.chatFill}
                              chatDockPolicy={chatDockPolicy}
                              splitChatColumnHidden={splitChatColumnHidden}
                              onSplitChatColumnHiddenChange={setSplitChatColumnHidden}
                              onSplitCanvasOpenChange={setChatSplitRailOpen}
                              onReportFullscreen={handleReportFullscreen}
                              onOpenReportInEditMode={handleOpenReportInEditMode}
                              onOpenReportCreatedPage={handleOpenReportCreatedPage}
                              canvasDashboardHero={canvasDashboardHero}
                              canvasDashboardEditHero={canvasDashboardEditHero}
                              onOpenDashboardEditMode={openDashboardEditFromChat}
                              onOpenScheduleShellSplit={openScheduleCanvasFromFigmaLink}
                              scheduleCanvasShellSplit={scheduleCanvasSplitMode && activePage === 'canvas'}
                              {...chatNavSplitBootstrap}
                            />
                          </div>
                          <div
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Resize chat"
                            data-dock="left"
                            onPointerDown={handleResizePointerDown}
                            onPointerMove={handleResizePointerMove}
                            onPointerUp={handleResizePointerUp}
                            onPointerCancel={handleResizePointerUp}
                            style={{
                              position: 'absolute', right: 0, top: 0, bottom: 0,
                              width: 8, cursor: 'col-resize', zIndex: 40, touchAction: 'none', pointerEvents: 'auto',
                            }}
                          />
                        </motion.div>
                      )
                    })()}
                    {showDockedChatRight && (() => {
                      const rounded = corners === 'round' && !isFullchat
                      return (
                        <motion.div
                          key="canvas-in-right"
                          {...canvasChatDockPresence('right')}
                          onMouseEnter={() => setHoveredPanel('chat')}
                          onMouseLeave={() => setHoveredPanel(null)}
                          style={{
                            order: inDashboardChatRightOrder,
                            width: panelWidthMV,
                            overflow: rounded ? 'visible' : 'hidden',
                            minWidth: 0,
                            display: 'flex', flexDirection: 'column',
                            padding: rounded ? '16px 16px 16px 0' : 0,
                            background: rounded ? pageBg : 'transparent',
                            borderLeft:
                              canvasStageGutterRight
                                ? 'none'
                                : !rounded && (!chatHasShadow || muteDockedChatShadowBesideCanvasStage)
                                  ? '1px solid #e8e8e8'
                                  : 'none',
                            boxShadow: !rounded && dockChatHeavyShadow
                              ? '-4px 0 20px rgba(0,0,0,0.09), -8px 0 40px rgba(0,0,0,0.05)'
                              : 'none',
                            transition: 'box-shadow 0.2s ease, padding 0.25s ease, background 0.2s ease',
                            position: 'relative', zIndex: 2,
                          }}
                        >
                          <div style={{
                            position: 'relative', zIndex: 0,
                            flex: 1, display: 'flex', flexDirection: 'column',
                            borderRadius: rounded ? 12 : 0,
                            overflow: 'hidden',
                            boxShadow: rounded && dockChatHeavyShadow
                              ? '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)'
                              : 'none',
                            transition: 'border-radius 0.25s ease, box-shadow 0.25s ease',
                          }}>
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
                              elevation={chatElevation}
                              panelBg={chatBg}
                              chatFill={PROTOTYPE_DEFAULTS.chatFill}
                              chatDockPolicy={chatDockPolicy}
                              splitChatColumnHidden={splitChatColumnHidden}
                              onSplitChatColumnHiddenChange={setSplitChatColumnHidden}
                              onSplitCanvasOpenChange={setChatSplitRailOpen}
                              onReportFullscreen={handleReportFullscreen}
                              onOpenReportInEditMode={handleOpenReportInEditMode}
                              onOpenReportCreatedPage={handleOpenReportCreatedPage}
                              canvasDashboardHero={canvasDashboardHero}
                              canvasDashboardEditHero={canvasDashboardEditHero}
                              onOpenDashboardEditMode={openDashboardEditFromChat}
                              onOpenScheduleShellSplit={openScheduleCanvasFromFigmaLink}
                              scheduleCanvasShellSplit={scheduleCanvasSplitMode && activePage === 'canvas'}
                              {...chatNavSplitBootstrap}
                            />
                          </div>
                          <div
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="Resize chat"
                            data-dock="right"
                            onPointerDown={handleResizePointerDown}
                            onPointerMove={handleResizePointerMove}
                            onPointerUp={handleResizePointerUp}
                            onPointerCancel={handleResizePointerUp}
                            style={{
                              position: 'absolute', left: 0, top: 0, bottom: 0,
                              width: 8, cursor: 'col-resize', zIndex: 40, touchAction: 'none', pointerEvents: 'auto',
                            }}
                          />
                        </motion.div>
                      )
                    })()}
                  </AnimatePresence>
                  </div>
                  {canvasStageGutterLeft && (
                    <div
                      aria-hidden
                      style={{
                        order: 2,
                        flexShrink: 0,
                        width: DASHBOARD_CHAT_CANVAS_GUTTER_PX,
                        alignSelf: 'stretch',
                        background: 'var(--grey-100)',
                        borderLeft: '1px solid var(--grey-200)',
                        borderRight: '1px solid var(--grey-200)',
                      }}
                    />
                  )}
                  {canvasStageGutterRight && inDashboardGutterRightOrder != null && (
                    <div
                      aria-hidden
                      style={{
                        order: inDashboardGutterRightOrder,
                        flexShrink: 0,
                        width: DASHBOARD_CHAT_CANVAS_GUTTER_PX,
                        alignSelf: 'stretch',
                        background: 'var(--grey-100)',
                        borderLeft: '1px solid var(--grey-200)',
                        borderRight: '1px solid var(--grey-200)',
                      }}
                    />
                  )}
                  <motion.div
                    style={{
                      order: inDashboardCanvasOrder,
                      flex: 1,
                      overflow: 'hidden', minWidth: 0, minHeight: 0,
                      opacity: contentOpacityMV,
                      pointerEvents: isFullchat ? 'none' : 'auto',
                      background: 'var(--grey-100)',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    {activePage === null
                    ? <CopilotContent onAskAI={openChatWithMessage} chatOpen={chatOpen} elevation={elevation} pageBg={pageBg} />
                    : <PageContent
                        activePage={activePage} onAskAI={openChatWithMessage} onAskAIFromChip={openChatFloating} elevation={elevation} pageBg={pageBg}
                        drawerMode={drawerMode} onOpenFloating={openChatFloating} onOpenFullscreen={openMainChatFullscreen} onCloseMainChat={closeMainChat}
                        canvasLeftChatCollapsed={canvasChatSplitDocked && !canvasLeftChatExpanded}
                        onExpandCanvasLeftChat={expandCanvasLeftChat}
                        dashboardEditMode={canvasDashboardEditMode}
                        canvasEdgeShadow={canvasEdgeShadow}
                        onDashboardEnterEdit={openDashboardEditFromChat}
                        chatDockPolicy={chatDockPolicy}
                        scheduleSplitMode={scheduleCanvasSplitMode && activePage === 'canvas'}
                        onCloseScheduleSplit={closeScheduleSideBySide}
                      />
                    }
                  </motion.div>
                  </div>
                </div>
              ) : (
                <>
                  {showDockedChatLeft && (() => {
                    const rounded = corners === 'round' && !isFullchat
                    return (
                      <motion.div
                        onMouseEnter={() => setHoveredPanel('chat')}
                        onMouseLeave={() => setHoveredPanel(null)}
                        style={{
                          width: panelWidthMV,
                          overflow: rounded ? 'visible' : 'hidden',
                          minWidth: 0,
                          display: 'flex', flexDirection: 'column',
                          padding: rounded ? '16px 0 16px 16px' : 0,
                          background: rounded ? pageBg : 'transparent',
                          borderRight:
                            !rounded && (!chatHasShadow || muteDockedChatShadowBesideCanvasStage)
                              ? '1px solid #e8e8e8'
                              : 'none',
                          boxShadow: !rounded && dockChatHeavyShadow
                            ? '4px 0 20px rgba(0,0,0,0.09), 8px 0 40px rgba(0,0,0,0.05)'
                            : 'none',
                          transition: 'box-shadow 0.2s ease, padding 0.25s ease, background 0.2s ease',
                          position: 'relative', zIndex: 2,
                        }}
                      >
                        <div style={{
                          position: 'relative', zIndex: 0,
                          flex: 1, display: 'flex', flexDirection: 'column',
                          borderRadius: rounded ? 12 : 0,
                          overflow: 'hidden',
                          boxShadow: rounded && dockChatHeavyShadow
                            ? '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)'
                            : 'none',
                          transition: 'border-radius 0.25s ease, box-shadow 0.25s ease',
                        }}>
                          <ChatPanel
                            mode={chatMode}
                            orientation={chatOrientation}
                            onOrientationChange={handleOrientationChange}
                            onClose={() => setChatOpen(false)}
                            onCollapseDashboardSideChat={collapseCanvasLeftChat}
                            initialQuery={pendingMessage}
                            elevation={chatElevation}
                            panelBg={chatBg}
                            chatFill={PROTOTYPE_DEFAULTS.chatFill}
                            chatDockPolicy={chatDockPolicy}
                            splitChatColumnHidden={splitChatColumnHidden}
                            onSplitChatColumnHiddenChange={setSplitChatColumnHidden}
                            onSplitCanvasOpenChange={setChatSplitRailOpen}
                            onReportFullscreen={handleReportFullscreen}
                            onOpenReportInEditMode={handleOpenReportInEditMode}
                            onOpenReportCreatedPage={handleOpenReportCreatedPage}
                            canvasDashboardHero={canvasDashboardHero}
                            canvasDashboardEditHero={canvasDashboardEditHero}
                            onOpenDashboardEditMode={openDashboardEditFromChat}
                            onOpenScheduleShellSplit={openScheduleCanvasFromFigmaLink}
                            scheduleCanvasShellSplit={scheduleCanvasSplitMode && activePage === 'canvas'}
                            {...chatNavSplitBootstrap}
                          />
                        </div>
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label="Resize chat"
                          data-dock="left"
                          onPointerDown={handleResizePointerDown}
                          onPointerMove={handleResizePointerMove}
                          onPointerUp={handleResizePointerUp}
                          onPointerCancel={handleResizePointerUp}
                          style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0,
                            width: 8, cursor: 'col-resize', zIndex: 40, touchAction: 'none', pointerEvents: 'auto',
                          }}
                        />
                      </motion.div>
                    )
                  })()}

                  <motion.div
                    style={{
                      flex: 1,
                      overflow: 'hidden', minWidth: 0, minHeight: 0,
                      opacity: contentOpacityMV,
                      pointerEvents: isFullchat ? 'none' : 'auto',
                      background: 'var(--grey-100)',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    {activePage === null
                    ? <CopilotContent onAskAI={openChatWithMessage} chatOpen={chatOpen} elevation={elevation} pageBg={pageBg} />
                    : <PageContent
                        activePage={activePage} onAskAI={openChatWithMessage} onAskAIFromChip={openChatFloating} elevation={elevation} pageBg={pageBg}
                        drawerMode={drawerMode} onOpenFloating={openChatFloating} onOpenFullscreen={openMainChatFullscreen} onCloseMainChat={closeMainChat}
                        canvasLeftChatCollapsed={canvasChatSplitDocked && !canvasLeftChatExpanded}
                        onExpandCanvasLeftChat={expandCanvasLeftChat}
                        dashboardEditMode={canvasDashboardEditMode}
                        canvasEdgeShadow={canvasEdgeShadow}
                        onDashboardEnterEdit={openDashboardEditFromChat}
                        chatDockPolicy={chatDockPolicy}
                        scheduleSplitMode={scheduleCanvasSplitMode && activePage === 'canvas'}
                        onCloseScheduleSplit={closeScheduleSideBySide}
                      />
                    }
                  </motion.div>

                  {showDockedChatRight && (() => {
                    const rounded = corners === 'round' && !isFullchat
                    return (
                      <motion.div
                        onMouseEnter={() => setHoveredPanel('chat')}
                        onMouseLeave={() => setHoveredPanel(null)}
                        style={{
                          width: panelWidthMV,
                          overflow: rounded ? 'visible' : 'hidden',
                          minWidth: 0,
                          display: 'flex', flexDirection: 'column',
                          padding: rounded ? '16px 16px 16px 0' : 0,
                          background: rounded ? pageBg : 'transparent',
                          borderLeft:
                            !rounded && (!chatHasShadow || muteDockedChatShadowBesideCanvasStage)
                              ? '1px solid #e8e8e8'
                              : 'none',
                          boxShadow: !rounded && dockChatHeavyShadow
                            ? '-4px 0 20px rgba(0,0,0,0.09), -8px 0 40px rgba(0,0,0,0.05)'
                            : 'none',
                          transition: 'box-shadow 0.2s ease, padding 0.25s ease, background 0.2s ease',
                          position: 'relative', zIndex: 2,
                        }}
                      >
                        <div style={{
                          position: 'relative', zIndex: 0,
                          flex: 1, display: 'flex', flexDirection: 'column',
                          borderRadius: rounded ? 12 : 0,
                          overflow: 'hidden',
                          boxShadow: rounded && dockChatHeavyShadow
                            ? '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)'
                            : 'none',
                          transition: 'border-radius 0.25s ease, box-shadow 0.25s ease',
                        }}>
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
                            elevation={chatElevation}
                            panelBg={chatBg}
                            chatFill={PROTOTYPE_DEFAULTS.chatFill}
                            chatDockPolicy={chatDockPolicy}
                            splitChatColumnHidden={splitChatColumnHidden}
                            onSplitChatColumnHiddenChange={setSplitChatColumnHidden}
                            onSplitCanvasOpenChange={setChatSplitRailOpen}
                            onReportFullscreen={handleReportFullscreen}
                            onOpenReportInEditMode={handleOpenReportInEditMode}
                            onOpenReportCreatedPage={handleOpenReportCreatedPage}
                            canvasDashboardHero={canvasDashboardHero}
                            canvasDashboardEditHero={canvasDashboardEditHero}
                            onOpenDashboardEditMode={openDashboardEditFromChat}
                            onOpenScheduleShellSplit={openScheduleCanvasFromFigmaLink}
                            scheduleCanvasShellSplit={scheduleCanvasSplitMode && activePage === 'canvas'}
                            {...chatNavSplitBootstrap}
                          />
                        </div>
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label="Resize chat"
                          data-dock="right"
                          onPointerDown={handleResizePointerDown}
                          onPointerMove={handleResizePointerMove}
                          onPointerUp={handleResizePointerUp}
                          onPointerCancel={handleResizePointerUp}
                          style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: 8, cursor: 'col-resize', zIndex: 40, touchAction: 'none', pointerEvents: 'auto',
                          }}
                        />
                      </motion.div>
                    )
                  })()}
                </>
              )}

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
              <span style={{ fontSize: 11, color: '#bbb', background: '#f5f5f5', borderRadius: 4, padding: '2px 7px', fontWeight: 400 }}>
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

      {/* ── Report builder (edit) — opened from chart artifact in chat ── */}
      <AnimatePresence>
        {reportBuilderEditOpen && (
          <motion.div
            key="report-builder-edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 410,
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ReportBuilderEditMode onClose={() => setReportBuilderEditOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Prototype options ── */}
      <PrototypeOptions
        model={interactionModel} onModelChange={setInteractionModel}
        elevation={elevation}    onElevationChange={setElevation}
        colorScheme={colorScheme} onColorSchemeChange={setColorScheme}
        corners={corners}        onCornersChange={setCorners}
        drawerMode={drawerMode}  onDrawerModeChange={setDrawerMode}
        chatDockPolicy={chatDockPolicy}
        onChatDockPolicyChange={(p) => {
          setChatDockPolicy(p)
          if (!chatOpen) {
            setChatOpen(true)
            setChatOrientation('sidebar')
          }
        }}
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
              color: value === opt.value ? 'var(--brand)' : 'var(--grey-500)',
              fontSize: 12, fontWeight: value === opt.value ? 500 : 400,
              boxShadow: value === opt.value
                ? '0 0 0 1px var(--brand-ring), 0 1px 3px rgba(0,0,0,0.08)'
                : 'none',
              transition: 'background 0.1s, color 0.1s, box-shadow 0.1s',
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
  corners, onCornersChange,
  drawerMode, onDrawerModeChange,
  chatDockPolicy, onChatDockPolicyChange,
}: {
  model: 'in' | 'out'; onModelChange: (m: 'in' | 'out') => void
  elevation: 'base' | 'shadow' | 'variable'; onElevationChange: (e: 'base' | 'shadow' | 'variable') => void
  colorScheme: ColorScheme; onColorSchemeChange: (c: ColorScheme) => void
  corners: 'none' | 'round'; onCornersChange: (c: 'none' | 'round') => void
  drawerMode: 'floating' | 'embedded' | 'collapse'; onDrawerModeChange: (d: 'floating' | 'embedded' | 'collapse') => void
  chatDockPolicy: ChatDockPolicy; onChatDockPolicyChange: (p: ChatDockPolicy) => void
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
              border: '1px solid color-mix(in srgb, var(--brand) 14%, var(--grey-200))',
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
              padding: '14px 16px',
              minWidth: 260,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Prototype Options
            </span>
            <OptionRow
              label="Motion"
              options={[{ value: 'out', label: 'Out' }, { value: 'in', label: 'In' }]}
              value={model} onChange={onModelChange}
            />
            <OptionRow
              label="Height"
              options={[
                { value: 'base',     label: 'Base' },
                { value: 'shadow',   label: 'Shadow' },
                { value: 'variable', label: 'Variable' },
              ]}
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
              label="Corners"
              options={[
                { value: 'none',  label: 'None' },
                { value: 'round', label: 'Round' },
              ]}
              value={corners} onChange={onCornersChange}
            />
            <OptionRow
              label="Drawer"
              options={[
                { value: 'floating',  label: 'Floating' },
                { value: 'embedded',  label: 'Embedded' },
                { value: 'collapse',  label: 'Collapse' },
              ]}
              value={drawerMode} onChange={onDrawerModeChange}
            />
            <OptionRow
              label="AI dock"
              options={[
                { value: 'always_right', label: 'Always right' },
                { value: 'right_and_left', label: 'Right & left' },
              ]}
              value={chatDockPolicy} onChange={onChatDockPolicyChange}
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
          border: `1px solid ${open ? 'var(--brand)' : 'var(--brand-ring)'}`,
          background: open ? 'var(--brand)' : '#ffffff',
          color: open ? '#ffffff' : 'var(--grey-600)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open
            ? '0 2px 12px color-mix(in srgb, var(--brand) 30%, transparent)'
            : '0 2px 8px rgba(0,0,0,0.10)',
          transition: 'background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M2 5h11M2 10h11M5 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM10 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </motion.button>
    </div>
  )
}
