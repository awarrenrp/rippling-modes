import { Icon } from '../Icon'

/** User message implies a schedule artifact — checked before workflow intent. */
export function inferScheduleIntent(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (/@schedule\b/i.test(text)) return true
  return (
    /\b(create|make|build|generate|draft)\b[\s\S]{0,40}\bschedule\b/i.test(t) ||
    /\bschedule\b[\s\S]{0,24}\b(create|make|build|draft)\b/i.test(t) ||
    /\b(wiw|work\s+schedule|shift\s+schedule|weekly\s+schedule|team\s+schedule)\b/i.test(t)
  )
}

/**
 * Inline preview card — AI-components schedule link artifact (Figma AI-components ~427:103803).
 * Opens full WIW-style canvas beside chat when clicked from `ChatPanel`.
 */
export function SchedulePreviewArtifact({ fluid }: { fluid?: boolean }) {
  const brand = '#7A005D'
  const ink = '#000000'
  const muted = '#716f6c'
  const surface = '#ffffff'

  return (
    <div
      style={{
        width: fluid ? '100%' : '100%',
        maxWidth: fluid ? 'none' : 360,
        borderRadius: 10,
        overflow: 'hidden',
        background: surface,
        border: 'none',
        outline: '1px solid var(--border)',
        outlineOffset: -1,
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '8px 14px 10px',
          background: surface,
        }}
      >
        <Icon name="calendar_month" size={14} style={{ color: brand, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: 'var(--font-heading)',
                color: ink,
                lineHeight: 1.35,
              }}
            >
              Engineering cohort · WIW
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 6,
                background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
                color: 'var(--brand)',
                flexShrink: 0,
                lineHeight: 1.25,
              }}
            >
              Draft
            </span>
          </div>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 11,
              fontWeight: 400,
              color: muted,
              lineHeight: 1.45,
            }}
          >
            Weekly schedule linked for your team — open to review shifts and coverage in the WIW canvas.
          </p>
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              fontWeight: 500,
              color: brand,
              textDecoration: 'underline',
              textUnderlineOffset: 2,
              letterSpacing: '-0.02em',
            }}
          >
            Open schedule →
          </div>
        </div>
      </div>
      <div
        style={{
          padding: '6px 14px 8px',
          fontSize: 10,
          fontWeight: 400,
          color: muted,
          background: surface,
          borderTop: '1px solid var(--border)',
        }}
      >
        Schedule · Updated Apr 30, 2026
      </div>
    </div>
  )
}
