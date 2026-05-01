import { Icon } from '../Icon'

/** User message implies a workflow preview — checked before chart NLP. */
export function inferWorkflowIntent(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (/@workflow\b/i.test(text)) return true
  return /\bworkflow(s)?\b/.test(t) || /\bflow\s+chart\b/i.test(t) || /\bonboarding\s+flow\b/i.test(t)
}

/** Aligns with AI-components chart frames (`chartArtifacts` / Figma AI-components). */
const WF = {
  brand: '#7A005D',
  reportInk: '#000000',
  axisMuted: '#716f6c',
  surface: '#ffffff',
} as const

/**
 * Text-only workflow preview — AI-components workflow artifact (Figma `476:6816`).
 * Summary copy opens the full canvas on click (handled in `ChatPanel`).
 */
export function WorkflowPreviewArtifact({ fluid }: { fluid?: boolean }) {
  return (
    <div
      style={{
        width: fluid ? '100%' : '100%',
        maxWidth: fluid ? 'none' : 360,
        borderRadius: 10,
        overflow: 'hidden',
        background: WF.surface,
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
          background: WF.surface,
        }}
      >
        <Icon name="account_tree" size={14} style={{ color: WF.brand, flexShrink: 0, marginTop: 2 }} />
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
                color: WF.reportInk,
                lineHeight: 1.35,
              }}
            >
              Employee onboarding
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
              color: WF.axisMuted,
              lineHeight: 1.45,
            }}
          >
            Collects new-hire details, routes manager approval, provisions accounts, and notifies stakeholders
            when the workflow completes.
          </p>
        </div>
      </div>
      <div
        style={{
          padding: '6px 14px 8px',
          fontSize: 10,
          fontWeight: 400,
          color: WF.axisMuted,
          background: WF.surface,
          borderTop: '1px solid var(--border)',
        }}
      >
        Workflow · Updated Apr 28, 2026
      </div>
    </div>
  )
}
