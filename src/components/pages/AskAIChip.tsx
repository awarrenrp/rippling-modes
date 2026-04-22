import React from 'react'

interface AskAIChipProps {
  onClick: (e: React.MouseEvent) => void
  /** 'pill' shows label; 'icon' shows just the sparkle (for tight spaces) */
  variant?: 'pill' | 'icon'
}

export function AskAIChip({ onClick, variant = 'pill' }: AskAIChipProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e) }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: variant === 'icon' ? '4px 6px' : '3px 9px',
        borderRadius: 6,
        border: '1px solid #e0e0e0',
        background: '#fff',
        fontSize: 11, color: '#555',
        cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 500,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 11, lineHeight: 1 }}>✦</span>
      {variant === 'pill' && 'Ask AI'}
    </button>
  )
}
