import { memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TablePage }    from './pages/TablePage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { DetailPage }   from './pages/DetailPage'
import { FlowPage }     from './pages/FlowPage'
import { StepperPage }  from './pages/StepperPage'
import { CanvasPage }   from './pages/CanvasPage'
import { ScheduleCanvasView } from './ScheduleCanvasView'

export type PageId = 'table' | 'dashboard' | 'settings' | 'detail' | 'flow' | 'stepper' | 'canvas'

interface PageContentProps {
  activePage: PageId
  onAskAI: (msg: string) => void
  onAskAIFromChip?: (msg: string) => void
  elevation?: 'base' | 'shadow' | 'variable'
  pageBg?: string
  drawerMode?: 'floating' | 'embedded' | 'collapse'
  onOpenFloating?: (msg: string) => void
  /** When `initialQuery` is passed, the main `ChatPanel` re-seeds with that thread. */
  onOpenFullscreen?: (options?: { initialQuery?: string }) => void
  /** Closes the app chat (e.g. when the table drawer is open in embedded/collapse and must not show floating chat). */
  onCloseMainChat?: () => void
  /** Canvas + chat left: show expand chevron in the dashboard toolbar when the dock is collapsed. */
  canvasLeftChatCollapsed?: boolean
  onExpandCanvasLeftChat?: () => void
  /** Canvas: dashboard widgets show edit outlines. */
  dashboardEditMode?: boolean
  /**
   * Canvas in edit mode: which edge gets the lift shadow beside docked chat.
   * `ambient` = edit mode without side-by-side chat (soft card shadow).
   */
  canvasEdgeShadow?: 'none' | 'left' | 'right' | 'ambient'
  /** Beta dashboard: transition into canvas edit + side-by-side chat. */
  onDashboardEnterEdit?: () => void
  /** Canvas + WIW schedule beside docked chat (app shell split). */
  scheduleSplitMode?: boolean
  onCloseScheduleSplit?: () => void
}

/** Renders one of the real pages. Never re-renders due to chat state changes. */
export const PageContent = memo(function PageContent({
  activePage, onAskAI, onAskAIFromChip, pageBg,
  drawerMode = 'collapse', onOpenFloating, onOpenFullscreen, onCloseMainChat,
  canvasLeftChatCollapsed, onExpandCanvasLeftChat, dashboardEditMode, canvasEdgeShadow = 'none',
  onDashboardEnterEdit,
  scheduleSplitMode,
  onCloseScheduleSplit,
}: PageContentProps) {
  const chipHandler = onAskAIFromChip ?? onAskAI
  // Table: only the floating drawer mode should use the global floating chat; embedded/collapse use full-screen ask.
  const tableAskHandler = drawerMode === 'floating' ? chipHandler : onAskAI

  const dashboardCanvasBranch = activePage === 'dashboard' || activePage === 'canvas'

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: pageBg ?? 'var(--grey-100)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {activePage === 'table'     && <TablePage onAskAI={tableAskHandler} drawerMode={drawerMode} onOpenFloating={onOpenFloating} onOpenFullscreen={onOpenFullscreen} onCloseMainChat={onCloseMainChat} />}
      {activePage === 'settings'  && <SettingsPage  onAskAI={chipHandler} />}
      {activePage === 'detail'    && <DetailPage    onAskAI={chipHandler} />}
      {activePage === 'flow'      && <FlowPage      onAskAI={chipHandler} />}
      {activePage === 'stepper'   && <StepperPage />}
      <AnimatePresence mode="wait" initial={false}>
        {dashboardCanvasBranch && (
          <motion.div
            key={activePage}
            role="presentation"
            initial={
              activePage === 'canvas'
                ? { opacity: 0, x: 56 }
                : undefined
            }
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28, scale: 0.99, filter: 'blur(1px)' }}
            transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.85 }}
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {activePage === 'dashboard' ? (
              <DashboardPage onEnterEdit={onDashboardEnterEdit} />
            ) : scheduleSplitMode ? (
              <ScheduleCanvasView
                onClose={onCloseScheduleSplit ?? (() => {})}
                embeddedInChatSplit
                suppressEmbeddedNav
                embeddedTitleMatchChat
                embeddedTitleFontSize={14}
                embeddedTitleColor="#000000"
                onOpenChat={
                  canvasLeftChatCollapsed && onExpandCanvasLeftChat ? onExpandCanvasLeftChat : undefined
                }
              />
            ) : (
              <CanvasPage
                canvasLeftChatCollapsed={canvasLeftChatCollapsed}
                onExpandCanvasLeftChat={onExpandCanvasLeftChat}
                dashboardEditMode={dashboardEditMode}
                canvasEdgeShadow={canvasEdgeShadow}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
