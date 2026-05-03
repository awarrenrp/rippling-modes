import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { Icon } from './Icon'
import { REPORT_BUILDER_HEADER_HEIGHT_PX } from './ReportBuilderEditMode'

/**
 * Full workflow edit canvas — Workflows Co-pilot style (prototype; Figma file `mTc0ZstIw8qj620DrFiRPa`).
 * In chat split: fills space to the right of the resizable chat rail (default width `WORKFLOW_CHAT_PANEL_WIDTH_PX`).
 */

/** Single source for unified split breadcrumbs + canvas header title */
export const WORKFLOW_CANVAS_DISPLAY_NAME = 'Employee onboarding'

export type WorkflowCanvasViewProps = {
  onClose: () => void
  /** When chat was collapsed beside split — show hamburger next to the workflow title to reopen it. */
  onOpenChat?: () => void
  embeddedInChatSplit?: boolean
  suppressEmbeddedNav?: boolean
  embeddedTitleMatchChat?: boolean
  embeddedTitleFontSize?: number
  embeddedTitleColor?: string
  /** `always_right` dock: breadcrumbs beside workflow actions (unified chat strip hidden). */
  embeddedSplitBreadcrumbs?: ReactNode
}

const CANVAS_BG = '#ececef'
const CARD = '#ffffff'
const EDGE = '#c4c4c8'
const TEXT_MUTED = '#737373'

const PALETTE_ITEMS: { icon: string; label: string; sub: string }[] = [
  { icon: 'bolt', label: 'Trigger', sub: 'Start when…' },
  { icon: 'edit_note', label: 'Form', sub: 'Collect fields' },
  { icon: 'fact_check', label: 'Approval', sub: 'Manager sign-off' },
  { icon: 'call_split', label: 'Condition', sub: 'Branch logic' },
  { icon: 'cloud_sync', label: 'HTTP', sub: 'Call external API' },
  { icon: 'schedule', label: 'Delay', sub: 'Wait duration' },
  { icon: 'flag', label: 'End', sub: 'Complete run' },
]

type NodeDef = {
  id: string
  label: string
  sub?: string
  x: number
  y: number
  w: number
  h: number
  kind: 'start' | 'task' | 'decision' | 'end'
}

/** Wide layout for editor canvas scroll region (Co-pilot edit surface). */
const NODES: NodeDef[] = [
  { id: 'a', label: 'Start', sub: 'Employee hired', x: 140, y: 48, w: 120, h: 48, kind: 'start' },
  { id: 'b', label: 'Collect employee info', sub: 'Form · HRIS', x: 140, y: 140, w: 220, h: 64, kind: 'task' },
  { id: 'c', label: 'Manager approval', sub: 'Slack · optional', x: 140, y: 260, w: 220, h: 64, kind: 'task' },
  { id: 'd', label: 'Approved?', sub: 'Routing', x: 520, y: 200, w: 140, h: 96, kind: 'decision' },
  { id: 'e', label: 'Provision accounts', sub: 'IT · Okta', x: 520, y: 360, w: 220, h: 64, kind: 'task' },
  { id: 'f', label: 'Notify stakeholders', sub: 'Email', x: 820, y: 260, w: 200, h: 56, kind: 'task' },
  { id: 'g', label: 'End', sub: 'Done', x: 140, y: 460, w: 120, h: 48, kind: 'end' },
]

const EDITOR_SURFACE_W = 1680
const EDITOR_SURFACE_H = 720

export function WorkflowCanvasView({
  onClose,
  onOpenChat,
  embeddedInChatSplit,
  suppressEmbeddedNav,
  embeddedTitleMatchChat,
  embeddedTitleFontSize = 13,
  embeddedTitleColor = '#111',
  embeddedSplitBreadcrumbs,
}: WorkflowCanvasViewProps) {
  const showRailBack = embeddedInChatSplit && !suppressEmbeddedNav && !embeddedSplitBreadcrumbs

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        fontFamily: 'var(--font-sans)',
        color: '#111',
        minWidth: 0,
      }}
    >
      {/* ── App header (toolbar) ── */}
      <header
        style={{
          height: REPORT_BUILDER_HEADER_HEIGHT_PX,
          flexShrink: 0,
          borderBottom: '1px solid var(--grey-200)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px 0 10px',
          gap: 8,
        }}
      >
        {!embeddedInChatSplit && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            title="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
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
        {showRailBack && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            title="Back to chat"
            style={{
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
            }}
          >
            <Icon name="chevron_left" size={18} />
          </motion.button>
        )}
        {embeddedSplitBreadcrumbs ? (
          <div style={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>{embeddedSplitBreadcrumbs}</div>
        ) : (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            {onOpenChat && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenChat}
                title="Open chat"
                style={{
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
                  flexShrink: 0,
                }}
              >
                <Icon name="view_sidebar" size={20} />
              </motion.button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={
                  embeddedTitleMatchChat
                    ? {
                        fontSize: embeddedTitleFontSize,
                        fontWeight: 400,
                        fontFamily: 'var(--font-sans)',
                        letterSpacing: '-0.1px',
                        color: embeddedTitleColor,
                        lineHeight: 1.25,
                      }
                    : {
                        fontSize: 15,
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading)',
                        lineHeight: 1.25,
                      }
                }
              >
                {WORKFLOW_CANVAS_DISPLAY_NAME}
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>Workflows · Last edited 2h ago</div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--grey-200)',
              background: '#fff',
              fontSize: 12,
              cursor: 'pointer',
              color: '#444',
            }}
          >
            Run test
          </button>
          {(['zoom_out', 'zoom_in', 'undo', 'redo'] as const).map((name) => (
            <button
              key={name}
              type="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={name} size={18} />
            </button>
          ))}
          <button
            type="button"
            style={{
              marginLeft: 4,
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--grey-200)',
              background: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Share
          </button>
          <button
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--brand)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Publish
          </button>
        </div>
      </header>

      {/* Build / Test / Runs */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          borderBottom: '1px solid var(--grey-200)',
          background: '#fafafa',
          paddingLeft: 8,
        }}
      >
        {(['Build', 'Test', 'Runs', 'Versions'] as const).map((tab, i) => (
          <button
            key={tab}
            type="button"
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: i === 0 ? 500 : 400,
              color: i === 0 ? '#111' : TEXT_MUTED,
              border: 'none',
              borderBottom: i === 0 ? '2px solid var(--brand)' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Editor: palette | canvas (inspector omitted in chat side-by-side for width) */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0 }}>
        {/* Steps palette */}
        <aside
          style={{
            width: 236,
            flexShrink: 0,
            borderRight: '1px solid var(--grey-200)',
            background: 'var(--grey-50)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 12px 8px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: '#888',
              textTransform: 'uppercase',
            }}
          >
            Steps
          </div>
          <div style={{ padding: '0 10px 10px' }}>
            <div style={{ position: 'relative' }}>
              <Icon
                name="search"
                size={16}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }}
              />
              <input
                type="search"
                placeholder="Search steps…"
                aria-label="Search steps"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 10px 8px 34px',
                  borderRadius: 8,
                  border: '1px solid var(--grey-200)',
                  fontSize: 12,
                  background: '#fff',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PALETTE_ITEMS.map((p) => (
              <button
                key={p.label}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--grey-200)',
                  background: '#fff',
                  cursor: 'grab',
                  textAlign: 'left',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <Icon name={p.icon} size={18} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#111' }}>{p.label}</span>
                  <span style={{ display: 'block', fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>{p.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas surface */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            overflow: 'auto',
            background: CANVAS_BG,
          }}
        >
          <div
            style={{
              minWidth: EDITOR_SURFACE_W,
              minHeight: EDITOR_SURFACE_H,
              position: 'relative',
              backgroundColor: CANVAS_BG,
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            <svg
              width={EDITOR_SURFACE_W}
              height={EDITOR_SURFACE_H}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              aria-hidden
            >
              <defs>
                <marker id="wf-arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" fill={EDGE} />
                </marker>
              </defs>
              <path d="M 200 96 L 200 140" stroke={EDGE} strokeWidth={2} fill="none" markerEnd="url(#wf-arrow)" />
              <path d="M 200 204 L 200 260" stroke={EDGE} strokeWidth={2} fill="none" markerEnd="url(#wf-arrow)" />
              <path d="M 360 292 L 520 248" stroke={EDGE} strokeWidth={2} fill="none" markerEnd="url(#wf-arrow)" />
              <path d="M 660 248 L 820 288" stroke={EDGE} strokeWidth={2} fill="none" markerEnd="url(#wf-arrow)" />
              <path d="M 590 296 L 590 360" stroke={EDGE} strokeWidth={2} fill="none" markerEnd="url(#wf-arrow)" />
              <path d="M 520 420 L 260 484" stroke={EDGE} strokeWidth={2} fill="none" markerEnd="url(#wf-arrow)" />
              <path d="M 200 424 L 200 460" stroke={EDGE} strokeWidth={2} fill="none" markerEnd="url(#wf-arrow)" />
            </svg>

            <div style={{ position: 'relative', width: EDITOR_SURFACE_W, height: EDITOR_SURFACE_H }}>
              {NODES.map((n) => (
                <div
                  key={n.id}
                  style={{
                    position: 'absolute',
                    left: n.x,
                    top: n.y,
                    width: n.w,
                    minHeight: n.h,
                    borderRadius: 8,
                    border:
                      n.kind === 'task'
                        ? '1.5px solid color-mix(in srgb, var(--brand) 45%, transparent)'
                        : `1px solid ${EDGE}`,
                    background: CARD,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    cursor: 'default',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{n.label}</span>
                  {n.sub && (
                    <span style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 6 }}>{n.sub}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Floating zoom / fit */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: 6,
              borderRadius: 8,
              border: '1px solid var(--grey-200)',
              background: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              zIndex: 2,
            }}
          >
            <button type="button" style={floatMiniBtn} title="Zoom in">
              <Icon name="add" size={16} />
            </button>
            <button type="button" style={floatMiniBtn} title="Zoom out">
              <Icon name="remove" size={16} />
            </button>
            <button type="button" style={{ ...floatMiniBtn, fontSize: 10, fontWeight: 600, color: '#666' }} title="Fit">
              ⊡
            </button>
          </div>
        </div>

        {!embeddedInChatSplit && (
          <aside
            style={{
              width: 288,
              flexShrink: 0,
              borderLeft: '1px solid var(--grey-200)',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--grey-200)',
                fontSize: 13,
                fontWeight: 600,
                color: '#111',
              }}
            >
              Inspector
            </div>
            <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
              <p style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.5, margin: 0 }}>
                Select a step on the canvas to configure triggers, fields, and downstream actions.
              </p>
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  border: '1px dashed var(--grey-300)',
                  background: 'var(--grey-50)',
                  fontSize: 11,
                  color: TEXT_MUTED,
                }}
              >
                Tip: drag steps from the palette or ask Rippling AI to insert a block.
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

const floatMiniBtn: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: 'none',
  background: '#f4f4f5',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#555',
}
