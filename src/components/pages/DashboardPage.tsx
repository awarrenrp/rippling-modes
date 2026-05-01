import { memo } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { Icon } from '@/components/Icon'
import { CHAT_PANEL_DEFAULT_TITLE } from '@/components/ChatPanel'
import { DashboardChartsGrid, DASHBOARD_BETA } from '@/components/pages/dashboardBetaCharts'

/**
 * Dashboards Beta canvas shell — title bar + main canvas (zoom strip + chart grid).
 * Canvas uses semantic `--surface` (warm #F9F7F6).
 */
const CANVAS_BG = 'var(--surface)'
const SAVE = '#7a005d'
const RAIL_ACCENT = '#B9DBF3'

function toolbarIconBtn(active?: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: active ? '1px solid #c5d8ec' : '1px solid transparent',
    background: active ? RAIL_ACCENT : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#111',
    padding: 0,
    flexShrink: 0,
  }
}

export const DashboardPage = memo(function DashboardPage({ onEnterEdit }: { onEnterEdit?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: CANVAS_BG,
      }}
    >
      {/* Title row — Figma `title` 3335:37977 */}
      <header
        style={{
          flexShrink: 0,
          background: '#fff',
          borderBottom: `1px solid ${DASHBOARD_BETA.stroke}`,
          padding: 8,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          rowGap: 10,
          minHeight: 50,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
            flex: '1 1 280px',
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              color: '#000',
              letterSpacing: '-0.2px',
              lineHeight: 1.25,
            }}
          >
            {CHAT_PANEL_DEFAULT_TITLE}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
          <span style={{ fontSize: 14, lineHeight: '20px', color: '#111', whiteSpace: 'nowrap' }}>Last saved Jan 23</span>
          <button
            type="button"
            style={{
              height: 32,
              padding: '0 12px',
              borderRadius: 6,
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff',
              fontSize: 14,
              fontWeight: 400,
              color: '#111',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Share
          </button>
          <motion.button
            type="button"
            disabled={!onEnterEdit}
            onClick={() => onEnterEdit?.()}
            whileHover={onEnterEdit ? { scale: 1.03, boxShadow: '0 4px 18px rgba(122, 0, 93, 0.35)' } : undefined}
            whileTap={onEnterEdit ? { scale: 0.96 } : undefined}
            transition={{ type: 'spring', stiffness: 520, damping: 28 }}
            style={{
              height: 32,
              padding: '0 12px',
              borderRadius: 6,
              border: 'none',
              background: SAVE,
              fontSize: 14,
              fontWeight: 400,
              color: '#fff',
              cursor: onEnterEdit ? 'pointer' : 'default',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: onEnterEdit ? 1 : 0.75,
            }}
          >
            <Icon name="edit" size={16} style={{ color: '#fff' }} />
            Edit
            <span
              style={{
                minWidth: 19,
                height: 12,
                borderRadius: 9999,
                background: '#f0d0f5',
                fontSize: 11,
                fontWeight: 400,
                color: '#5a1a6e',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
              }}
            >
              3
            </span>
          </motion.button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, background: CANVAS_BG }}>
          {/* Inner controls strip — Figma `controls` under canvas frame */}
          <div
            style={{
              flexShrink: 0,
              height: 50,
              background: '#fff',
              borderBottom: `1px solid ${DASHBOARD_BETA.stroke}`,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" style={{ ...toolbarIconBtn(false), width: 28, height: 28 }}>
                <Icon name="remove" size={18} />
              </button>
              <span style={{ fontSize: 13, color: '#888', minWidth: 36, textAlign: 'center' }}>100%</span>
              <button type="button" style={{ ...toolbarIconBtn(false), width: 28, height: 28 }}>
                <Icon name="add" size={18} />
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <DashboardChartsGrid />
          </div>
      </div>
    </div>
  )
})
