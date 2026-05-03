import { memo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Icon } from '@/components/Icon'
import { CHAT_PANEL_DEFAULT_TITLE } from '@/components/ChatPanel'
import { DashboardChartsGrid } from '@/components/pages/dashboardBetaCharts'
import type { ChatDockPolicy } from '@/prototypeDefaults'

const SAVE_BRAND = '#7a005d'

interface CanvasPageProps {
  canvasLeftChatCollapsed?: boolean
  onExpandCanvasLeftChat?: () => void
  dashboardEditMode?: boolean
  canvasEdgeShadow?: 'none' | 'left' | 'right' | 'ambient'
  chatDockPolicy?: ChatDockPolicy
  /** Opens canvas dashboard edit (same as Beta dashboard Edit). */
  onEnterEdit?: () => void
}

const SHADOW_L = '-14px 0 48px rgba(0,0,0,0.14), -6px 0 22px rgba(0,0,0,0.09)'
const SHADOW_R = '14px 0 48px rgba(0,0,0,0.14), 6px 0 22px rgba(0,0,0,0.09)'
const SHADOW_AMBIENT = '0 6px 28px rgba(0,0,0,0.1), 0 16px 48px rgba(0,0,0,0.06)'

export const CanvasPage = memo(function CanvasPage({
  canvasLeftChatCollapsed,
  onExpandCanvasLeftChat,
  dashboardEditMode,
  canvasEdgeShadow = 'none',
  chatDockPolicy = 'right_and_left',
  onEnterEdit,
}: CanvasPageProps) {
  const editCanvasShadow =
    canvasEdgeShadow === 'left'
      ? SHADOW_L
      : canvasEdgeShadow === 'right'
        ? SHADOW_R
        : canvasEdgeShadow === 'ambient'
          ? SHADOW_AMBIENT
          : 'none'

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--grey-100)' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--surface)',
          minWidth: 0,
          boxShadow: editCanvasShadow,
          position: 'relative',
          zIndex: dashboardEditMode && canvasEdgeShadow !== 'none' ? 3 : dashboardEditMode ? 1 : undefined,
        }}
      >
        <div style={{
          background: '#fff', borderBottom: '1px solid #ebebeb',
          padding: '0 20px', height: 50, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {canvasLeftChatCollapsed && onExpandCanvasLeftChat && (
              <button
                type="button"
                onClick={onExpandCanvasLeftChat}
                title="Expand AI chat"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                  border: '1px solid #e8e8e8', background: '#fafafa', cursor: 'pointer', color: '#555',
                }}
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
            )}
            <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: '-0.1px', color: '#111' }}>
              {CHAT_PANEL_DEFAULT_TITLE}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 400, padding: '2px 8px', borderRadius: 20,
              background: dashboardEditMode ? 'color-mix(in srgb, var(--brand) 12%, #f5f0f4)' : '#f0f0f0',
              color: dashboardEditMode ? SAVE_BRAND : '#888',
              textTransform: 'uppercase', letterSpacing: '0.4px',
            }}>{dashboardEditMode ? 'Editing' : 'Live'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {chatDockPolicy === 'always_right' ? (
              <>
                {!dashboardEditMode ? (
                  <button
                    type="button"
                    title="Edit dashboard"
                    disabled={!onEnterEdit}
                    onClick={() => onEnterEdit?.()}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: '1px solid #e0e0e0',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: onEnterEdit ? 'pointer' : 'default',
                      flexShrink: 0,
                      padding: 0,
                      color: '#111',
                      opacity: onEnterEdit ? 1 : 0.45,
                    }}
                  >
                    <Icon name="edit" size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Save dashboard"
                    style={{
                      height: 32,
                      padding: '0 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: SAVE_BRAND,
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="save" size={16} style={{ color: '#fff' }} />
                    Save
                  </button>
                )}
              </>
            ) : (
              <>
                {['This month', 'Q1 2026', 'YTD'].map((label, i) => (
                  <button key={label} type="button" style={{
                    padding: '5px 12px', borderRadius: 6, border: '1px solid #e0e0e0',
                    background: i === 0 ? '#111' : '#fff',
                    color: i === 0 ? '#fff' : '#555',
                    fontSize: 12, fontWeight: 400, cursor: 'pointer',
                  }}>
                    {label}
                  </button>
                ))}
                {dashboardEditMode && (
                  <button
                    type="button"
                    title="Save dashboard"
                    style={{
                      height: 32,
                      padding: '0 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: SAVE_BRAND,
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="save" size={16} style={{ color: '#fff' }} />
                    Save
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DashboardChartsGrid />
        </div>
      </div>
    </div>
  )
})
