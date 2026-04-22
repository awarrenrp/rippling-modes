import { memo } from 'react'
import { TablePage }    from './pages/TablePage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { DetailPage }   from './pages/DetailPage'
import { FlowPage }     from './pages/FlowPage'
import { CanvasPage }   from './pages/CanvasPage'

export type PageId = 'table' | 'dashboard' | 'settings' | 'detail' | 'flow' | 'canvas'

interface PageContentProps {
  activePage: PageId
  onAskAI: (msg: string) => void
  onAskAIFromChip?: (msg: string) => void
  elevation?: 'base' | 'shadow'
  pageBg?: string
}

/** Renders one of the real pages. Never re-renders due to chat state changes. */
export const PageContent = memo(function PageContent({
  activePage, onAskAI, onAskAIFromChip, pageBg,
}: PageContentProps) {
  const chipHandler = onAskAIFromChip ?? onAskAI

  return (
    <div style={{ flex: 1, overflow: 'auto', background: pageBg ?? 'var(--grey-100)', display: 'flex', flexDirection: 'column' }}>
      {activePage === 'table'     && <TablePage     onAskAI={chipHandler} />}
      {activePage === 'dashboard' && <DashboardPage onAskAI={chipHandler} />}
      {activePage === 'settings'  && <SettingsPage  onAskAI={chipHandler} />}
      {activePage === 'detail'    && <DetailPage    onAskAI={chipHandler} />}
      {activePage === 'flow'      && <FlowPage      onAskAI={chipHandler} />}
      {activePage === 'canvas'    && <CanvasPage />}
    </div>
  )
})
