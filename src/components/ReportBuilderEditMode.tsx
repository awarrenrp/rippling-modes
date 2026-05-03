import React from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { Icon } from './Icon'

/** Shared with chat split header so columns align when report is docked beside Rippling AI. */
export const REPORT_BUILDER_HEADER_HEIGHT_PX = 52

/** Matches canvas header + unified split breadcrumbs (Dashboards & Reports › Reports › …) */
export const REPORT_BUILDER_DISPLAY_NAME = 'People by department'

const PREVIEW_NAMES = [
  'Prashanthi Chandrasekaran',
  'Karen Huang',
  'Richard Satherland',
  'Maria Scrivner',
  'John Martin',
  'Sofia Rodriguez',
  'Daniel Park',
  'Alice Warren',
]

export type ReportBuilderEditModeProps = {
  onClose: () => void
  /** When true, first control is “back to chat” (split with Rippling AI). */
  embeddedInChatSplit?: boolean
  /** Full-screen 50/50 chat split — hide “Available data” to give editor + preview more room. */
  omitAvailableDataPanel?: boolean
  /** Parent shows unified split chrome — hide duplicate back / expand in this rail header. */
  suppressEmbeddedNav?: boolean
  /** Match Rippling AI chat title typography (sans, regular weight). */
  embeddedTitleMatchChat?: boolean
  embeddedTitleFontSize?: number
  embeddedTitleColor?: string
  /** Shown in split mode — opens full-screen report (parent should collapse the split). */
  onRequestFullscreen?: () => void
  /** `always_right` dock: breadcrumb trail in this row beside Share / Save (unified strip hidden in chat). */
  embeddedSplitBreadcrumbs?: ReactNode
  /** When set (e.g. chart preset title), replaces default “People by department” so rail matches artifact. */
  embeddedReportTitle?: string
}

const reportHeaderGhostNavBtn: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#555',
}

const reportHeaderGhostToolbarIconBtn: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 7,
  border: 'none',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#666',
}

const reportHeaderFilledToolbarIconBtn: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 7,
  border: '1px solid var(--grey-200)',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#666',
}

const toolbarChip: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid var(--grey-200)',
  background: '#fff',
  fontSize: 12,
  fontWeight: 400,
  cursor: 'pointer',
  color: '#333',
}

/**
 * Report editor prototype (Data tab, pivot slots, preview) — full-screen overlay or
 * right rail beside full-screen chat when `embeddedInChatSplit` is set.
 */
export function ReportBuilderEditMode({
  onClose,
  embeddedInChatSplit,
  omitAvailableDataPanel,
  suppressEmbeddedNav,
  embeddedTitleMatchChat,
  embeddedTitleFontSize = 13,
  embeddedTitleColor = '#111',
  onRequestFullscreen,
  embeddedSplitBreadcrumbs,
  embeddedReportTitle,
}: ReportBuilderEditModeProps) {
  const headerReportTitle = embeddedReportTitle ?? REPORT_BUILDER_DISPLAY_NAME
  const showAvailableDataPanel = !embeddedInChatSplit || !omitAvailableDataPanel
  const showRailNav = embeddedInChatSplit && !suppressEmbeddedNav && !embeddedSplitBreadcrumbs
  const titleSpanStyle: CSSProperties = embeddedTitleMatchChat
    ? {
        fontSize: embeddedTitleFontSize,
        fontWeight: 400,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '-0.1px',
        color: embeddedTitleColor,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }
    : {
        fontSize: 16,
        fontWeight: 700,
        fontFamily: 'var(--font-heading)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: '#111',
      }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        fontFamily: 'var(--font-composer)',
        fontWeight: 400,
        fontSynthesis: 'none',
        color: '#111',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          height: REPORT_BUILDER_HEADER_HEIGHT_PX,
          flexShrink: 0,
          borderBottom: '1px solid var(--grey-200)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px 0 12px',
          gap: 10,
        }}
      >
        {!embeddedInChatSplit && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onClose}
            title="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid var(--grey-200)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#555',
            }}
          >
            <Icon name="close" size={18} />
          </motion.button>
        )}
        {showRailNav && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onClose}
            title="Back to chat"
            style={reportHeaderGhostNavBtn}
          >
            <Icon name="chevron_left" size={18} />
          </motion.button>
        )}
        {showRailNav && onRequestFullscreen && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onRequestFullscreen}
            title="Open report in full screen"
            style={reportHeaderGhostNavBtn}
          >
            <Icon name="open_in_full" size={18} />
          </motion.button>
        )}
        {embeddedSplitBreadcrumbs ? (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>{embeddedSplitBreadcrumbs}</div>
            <Icon name="edit" size={16} style={{ color: '#888', flexShrink: 0 }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <span style={titleSpanStyle}>{headerReportTitle}</span>
            <Icon name="edit" size={16} style={{ color: '#888', flexShrink: 0 }} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {(['refresh', 'undo', 'redo', 'more_horiz'] as const).map((name) => (
            <button
              key={name}
              type="button"
              style={embeddedInChatSplit ? reportHeaderGhostToolbarIconBtn : reportHeaderFilledToolbarIconBtn}
            >
              <Icon name={name} size={18} />
            </button>
          ))}
          <button
            type="button"
            style={{
              padding: '7px 14px',
              borderRadius: 7,
              border: '1px solid var(--grey-200)',
              background: '#fff',
              fontSize: 13,
              fontWeight: 400,
              cursor: 'pointer',
            }}
          >
            Share
          </button>
          <button
            type="button"
            style={{
              padding: '7px 18px',
              borderRadius: 7,
              border: 'none',
              background: 'var(--brand)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </header>

      {/* Three-column body — hide “Available data” beside chat to maximize editor + preview */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {showAvailableDataPanel && (
          <aside
            style={{
              width: 232,
              flexShrink: 0,
              borderRight: '1px solid var(--grey-200)',
              display: 'flex',
              flexDirection: 'column',
              background: '#fafafa',
            }}
          >
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--grey-200)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Available data</span>
                <Icon name="chevron_left" size={18} style={{ color: '#999' }} />
              </div>
              <div style={{ padding: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--grey-200)',
                    background: '#fff',
                    fontSize: 12,
                    color: '#888',
                  }}
                >
                  <Icon name="search" size={16} />
                  Search
                </div>
              </div>
              <div style={{ padding: '0 10px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['All objects', 'Favorites', 'In use'].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    style={{
                      padding: '4px 10px',
                      borderRadius: 99,
                      border: i === 2 ? 'none' : '1px solid var(--grey-200)',
                      background: i === 2 ? 'var(--brand)' : '#fff',
                      color: i === 2 ? '#fff' : '#555',
                      fontSize: 11,
                      fontWeight: 400,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                    {i === 2 ? ' · 1' : ''}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 16px', fontSize: 12, color: '#555' }}>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8, color: '#333' }}>Formulas</div>
                <div style={{ paddingLeft: 4, marginBottom: 12, lineHeight: 1.6, color: '#666' }}>
                  <div>Report Formulas</div>
                  <div>Custom SQL</div>
                  <div>Parameters</div>
                </div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6, color: '#333' }}>Employee</div>
                <div style={{ padding: '8px 10px', borderRadius: 6, background: '#fff', border: '1px solid var(--grey-200)' }}>
                  <div style={{ fontWeight: 500 }}>Employee</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 4, lineHeight: 1.35 }}>
                    Individuals employed or contracted by your company…
                  </div>
                </div>
              </div>
            </aside>
        )}

        {/* Middle — Data / Settings */}
        <section
          style={{
            width: 300,
            flexShrink: 0,
            borderRight: '1px solid var(--grey-200)',
            borderLeft: !showAvailableDataPanel ? 'none' : undefined,
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', borderBottom: '1px solid var(--grey-200)' }}>
            {(['Data', 'Settings'] as const).map((tab, i) => (
              <button
                key={tab}
                type="button"
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 13,
                  fontWeight: i === 0 ? 600 : 400,
                  fontFamily: i === 0 ? 'var(--font-heading)' : 'inherit',
                  color: i === 0 ? '#111' : '#888',
                  cursor: 'pointer',
                  borderBottom: i === 0 ? '2px solid #111' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Chart type</div>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--grey-200)',
                fontSize: 13,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              Pivot Table
              <Icon name="expand_more" size={20} style={{ color: '#999' }} />
            </div>
            {[
              { label: 'Columns', hint: 'Drag fields here', empty: true },
              { label: 'Rows', field: 'Employee', filled: true },
              { label: 'Values', hint: 'Drag fields here', empty: true },
            ].map((row) => (
              <div key={row.label} style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{row.label}</div>
                <div
                  style={{
                    minHeight: 44,
                    borderRadius: 6,
                    border: `1px dashed ${row.empty ? 'var(--grey-300)' : 'var(--grey-200)'}`,
                    background: row.filled ? 'var(--grey-50)' : '#fafafa',
                    padding: '10px 12px',
                    fontSize: 12,
                    color: row.empty ? '#aaa' : '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {row.filled && (
                    <>
                      <span style={{ color: '#c00', fontSize: 14 }}>×</span>
                      <span>{row.field}</span>
                    </>
                  )}
                  {row.empty && row.hint}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, fontSize: 11, color: '#888', marginBottom: 6 }}>Selected fields</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Employee', 'Department'].map((f) => (
                <div
                  key={f}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'var(--grey-100)',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ color: '#c00' }}>×</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right — Preview */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--grey-200)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <button type="button" style={toolbarChip}>
              + Parameter
            </button>
            <button type="button" style={toolbarChip}>
              Filters (1)
            </button>
            <input
              placeholder="Search Employee"
              style={{
                flex: 1,
                minWidth: 140,
                maxWidth: 220,
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid var(--grey-200)',
                fontSize: 12,
              }}
            />
            <span style={{ fontSize: 11, color: '#888' }}>Data as of: 04/30/2026</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#666', marginBottom: 10 }}>Employee</div>
            <div style={{ border: '1px solid var(--grey-200)', borderRadius: 8, overflow: 'hidden' }}>
              {PREVIEW_NAMES.map((name, i) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--grey-100)',
                    background: i % 2 === 0 ? '#fff' : 'var(--grey-50)',
                    fontSize: 13,
                    fontWeight: 400,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--grey-200)',
                      flexShrink: 0,
                    }}
                  />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
