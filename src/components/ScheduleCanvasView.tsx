import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { Icon } from './Icon'
import { REPORT_BUILDER_HEADER_HEIGHT_PX } from './ReportBuilderEditMode'

/**
 * WIW-style weekly schedule canvas (prototype; WIW Migration cohort screens).
 * Opens beside chat in split view — chat docks left; this fills the right pane.
 */

export const SCHEDULE_CANVAS_DISPLAY_NAME = 'Engineering cohort · WIW'

export type ScheduleCanvasViewProps = {
  onClose: () => void
  onOpenChat?: () => void
  embeddedInChatSplit?: boolean
  suppressEmbeddedNav?: boolean
  embeddedTitleMatchChat?: boolean
  embeddedTitleFontSize?: number
  embeddedTitleColor?: string
}

const BG = '#f4f4f5'
const CELL = '#ffffff'
const LINE = '#e4e4e7'
const MUTED = '#71717a'
const INK = '#18181b'

const DAYS = ['Mon 28', 'Tue 29', 'Wed 30', 'Thu 1', 'Fri 2', 'Sat 3', 'Sun 4'] as const

const ROWS: { name: string; shifts: (string | null)[] }[] = [
  {
    name: 'Maria K.',
    shifts: ['9–5 Ops', '9–5 Ops', null, '9–5 Ops', '9–5 Ops', null, null],
  },
  {
    name: 'James T.',
    shifts: [null, '12–8 Front', '12–8 Front', '12–8 Front', null, 'Weekend', 'Weekend'],
  },
  {
    name: 'Priya S.',
    shifts: ['On-call', 'On-call', 'On-call', null, '9–5 Ops', null, null],
  },
  {
    name: 'Alex R.',
    shifts: ['Training', 'Training', null, '9–5 Ops', '9–5 Ops', '9–5 Ops', null],
  },
]

function shiftStyle(label: string | null): CSSProperties | undefined {
  if (!label) return { background: 'transparent' }
  if (label.includes('On-call'))
    return {
      background: 'color-mix(in srgb, var(--brand) 14%, transparent)',
      color: 'var(--brand)',
      border: '1px solid color-mix(in srgb, var(--brand) 35%, transparent)',
    }
  if (label.includes('Weekend'))
    return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }
  if (label.includes('Training'))
    return { background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }
  return { background: '#f4f4f5', color: INK, border: `1px solid ${LINE}` }
}

export function ScheduleCanvasView({
  onClose,
  onOpenChat,
  embeddedInChatSplit,
  suppressEmbeddedNav,
  embeddedTitleMatchChat,
  embeddedTitleFontSize = 13,
  embeddedTitleColor = '#111',
}: ScheduleCanvasViewProps) {
  const showRailBack = embeddedInChatSplit && !suppressEmbeddedNav

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: BG,
        fontFamily: 'var(--font-sans)',
        color: INK,
        minWidth: 0,
      }}
    >
      <header
        style={{
          height: REPORT_BUILDER_HEADER_HEIGHT_PX,
          flexShrink: 0,
          borderBottom: `1px solid ${LINE}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px 0 10px',
          gap: 8,
          background: CELL,
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
              background: CELL,
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
        {showRailBack && onOpenChat && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenChat}
            title="Show chat"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: CELL,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#555',
            }}
          >
            <Icon name="view_sidebar" size={18} />
          </motion.button>
        )}
        <Icon name="calendar_month" size={18} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: embeddedTitleFontSize,
              fontWeight: embeddedTitleMatchChat ? 400 : 600,
              color: embeddedTitleColor,
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {SCHEDULE_CANVAS_DISPLAY_NAME}
          </div>
          {!suppressEmbeddedNav && (
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
              WIW migration · Cohort 3 · Weekly view
            </div>
          )}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'color-mix(in srgb, var(--brand) 10%, transparent)',
            color: 'var(--brand)',
            flexShrink: 0,
          }}
        >
          Draft
        </span>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          padding: 12,
        }}
      >
        <div
          style={{
            background: CELL,
            borderRadius: 10,
            border: `1px solid ${LINE}`,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `140px repeat(${DAYS.length}, minmax(72px, 1fr))`,
              borderBottom: `1px solid ${LINE}`,
              background: '#fafafa',
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: MUTED,
                borderRight: `1px solid ${LINE}`,
              }}
            >
              Employee
            </div>
            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  padding: '10px 8px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: MUTED,
                  textAlign: 'center',
                  borderRight: `1px solid ${LINE}`,
                }}
              >
                {d}
              </div>
            ))}
          </div>
          {ROWS.map((row, ri) => (
            <div
              key={row.name}
              style={{
                display: 'grid',
                gridTemplateColumns: `140px repeat(${DAYS.length}, minmax(72px, 1fr))`,
                borderBottom: ri < ROWS.length - 1 ? `1px solid ${LINE}` : undefined,
              }}
            >
              <div
                style={{
                  padding: '12px',
                  fontSize: 12,
                  fontWeight: 500,
                  borderRight: `1px solid ${LINE}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#fafafa',
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: '#e4e4e7',
                    fontSize: 10,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#52525b',
                  }}
                >
                  {row.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                {row.name}
              </div>
              {row.shifts.map((shift, si) => (
                <div
                  key={`${row.name}-${si}`}
                  style={{
                    padding: 6,
                    borderRight: si < DAYS.length - 1 ? `1px solid ${LINE}` : undefined,
                    minHeight: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {shift ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        padding: '5px 8px',
                        borderRadius: 6,
                        textAlign: 'center',
                        lineHeight: 1.25,
                        maxWidth: '100%',
                        ...shiftStyle(shift),
                      }}
                    >
                      {shift}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: '#d4d4d8' }}>—</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <p style={{ margin: '12px 4px 0', fontSize: 11, color: MUTED, lineHeight: 1.45 }}>
          Coverage rules and WIW migration exceptions apply. Drag-and-drop editing coming soon.
        </p>
      </div>
    </div>
  )
}
