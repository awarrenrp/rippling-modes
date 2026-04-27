import { memo } from 'react'
import { TablePage }    from './pages/TablePage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { DetailPage }   from './pages/DetailPage'
import { FlowPage }     from './pages/FlowPage'
import { StepperPage }  from './pages/StepperPage'
import { CanvasPage }   from './pages/CanvasPage'

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
}

/** Renders one of the real pages. Never re-renders due to chat state changes. */
export const PageContent = memo(function PageContent({
  activePage, onAskAI, onAskAIFromChip, pageBg,
  drawerMode = 'collapse', onOpenFloating, onOpenFullscreen, onCloseMainChat,
  canvasLeftChatCollapsed, onExpandCanvasLeftChat,
}: PageContentProps) {
  const chipHandler = onAskAIFromChip ?? onAskAI
  // Table: only the floating drawer mode should use the global floating chat; embedded/collapse use full-screen ask.
  const tableAskHandler = drawerMode === 'floating' ? chipHandler : onAskAI

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: pageBg ?? 'var(--grey-100)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {activePage === 'table'     && <TablePage onAskAI={tableAskHandler} drawerMode={drawerMode} onOpenFloating={onOpenFloating} onOpenFullscreen={onOpenFullscreen} onCloseMainChat={onCloseMainChat} />}
      {activePage === 'dashboard' && <DashboardPage onAskAI={chipHandler} />}
      {activePage === 'settings'  && <SettingsPage  onAskAI={chipHandler} />}
      {activePage === 'detail'    && <DetailPage    onAskAI={chipHandler} />}
      {activePage === 'flow'      && <FlowPage      onAskAI={chipHandler} />}
      {activePage === 'stepper'   && <StepperPage />}
      {activePage === 'canvas'    && (
        <CanvasPage
          canvasLeftChatCollapsed={canvasLeftChatCollapsed}
          onExpandCanvasLeftChat={onExpandCanvasLeftChat}
        />
      )}
    </div>
  )
})
