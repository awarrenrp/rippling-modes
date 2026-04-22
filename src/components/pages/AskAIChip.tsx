import React from 'react'

interface AskAIChipProps {
  onClick: (e: React.MouseEvent) => void
}

export function AskAIChip({ onClick }: AskAIChipProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e) }}
      title="Ask AI"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26,
        borderRadius: 6,
        border: '1px solid #e0e0e0',
        background: '#fff',
        fontSize: 12, color: '#555',
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        flexShrink: 0,
      }}
    >
      ✦
    </button>
  )
}
