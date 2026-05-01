/**
 * Prototype defaults → interaction rules (single copy-paste unit for another repo).
 *
 * Matches **Prototype Options** + shell layout in App — motion model, elevation, chat dock/orientation,
 * nav breakpoint, responsive dock widths, fullscreen snap threshold. Pair with `getChatWidth()` usage
 * in your shell resize logic.
 */
import type { ChatOrientation } from './components/ChatPanel'
import type { PageId } from './components/PageContent'

export type ColorScheme = 'white' | 'grey' | 'variable'

/** Viewport width below which the nav auto-collapses. */
export const NAV_COLLAPSE_BP = 1024

/** Minimum docked chat width while resizing (px). */
export const MIN_CHAT_W = 260

/** Chat sidebar width responsive to viewport. */
export function getChatWidth(windowWidth: number): number {
  if (windowWidth >= 1440) return 400
  if (windowWidth >= 1280) return 360
  if (windowWidth >= 1024) return 320
  return 280
}

export const PROTOTYPE_DEFAULTS = {
  interactionModel: 'in' as const,
  elevation: 'variable' as const,
  colorScheme: 'variable' as ColorScheme,
  corners: 'none' as const,
  drawerMode: 'collapse' as const,
  chatFill: 'empty' as const,
  chatOpen: true,
  chatOrientation: 'sidebar' as ChatOrientation,
  activePage: null as PageId | null,
  canvasDashboardEditMode: false,
  canvasLeftChatExpanded: true,
  floatingSize: { w: 380, h: 520 },
  /** Same value as `NAV_COLLAPSE_BP` — viewport width below which nav auto-collapses. */
  navCollapseBreakpoint: NAV_COLLAPSE_BP,
  /** Same value as `MIN_CHAT_W` — minimum docked chat width while dragging (px). */
  minDockedChatWidth: MIN_CHAT_W,
  /**
   * Default docked chat column width by viewport minimum — mirrors `getChatWidth()` breakpoints.
   * Use when implementing responsive chat without importing `getChatWidth`.
   */
  chatDockWidthBreakpoints: [
    { minViewport: 1440, width: 400 },
    { minViewport: 1280, width: 360 },
    { minViewport: 1024, width: 320 },
    { minViewport: 0, width: 280 },
  ],
  /** Drag-release: above this fraction of stage width, snap chat to fullscreen. */
  fullscreenSnapThreshold: 0.65,
}
