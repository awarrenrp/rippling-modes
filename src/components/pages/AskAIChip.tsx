import type { CSSProperties, MouseEvent } from 'react'

const AI_BTN_BASE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26,
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  flexShrink: 0,
  border: '1px solid #e0e0e0',
  background: '#fff',
  color: '#555',
}

export interface AIButtonProps {
  onClick: (e: MouseEvent) => void
  title?: string
  /** “On” / chat-open state (e.g. collapse drawer: AI column visible). */
  active?: boolean
  /** Stop table row / parent clicks from firing */
  stopPropagation?: boolean
}

/**
 * Trailing ✦ control used in lists and the table drawer to open Ask AI.
 * When `active`, uses inverted fill to match a toggled / open state.
 */
export function AIButton({ onClick, title = 'Open AI', active, stopPropagation = true }: AIButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => { if (stopPropagation) e.stopPropagation(); onClick(e) }}
      title={title}
      style={{
        ...AI_BTN_BASE,
        border: active ? '1px solid #111' : '1px solid #e0e0e0',
        background: active ? '#111' : '#fff',
        color: active ? '#fff' : '#555',
      }}
    >
      ✦
    </button>
  )
}

interface AskAIChipProps {
  onClick: (e: MouseEvent) => void
}

export function AskAIChip({ onClick }: AskAIChipProps) {
  return <AIButton onClick={onClick} title="Ask AI" />
}
