import { motion } from 'motion/react'
import { Icon } from './Icon'

export function CanvasPanel() {
  return (
    <motion.div
      layout
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#f3f4f6',
      }}
    >
      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1, zIndex: 20 }}>
        {(['add', 'remove'] as const).map((name, i) => (
          <button
            key={name}
            title={i === 0 ? 'Zoom in' : 'Zoom out'}
            style={{
              width: 28, height: 28, borderRadius: i === 0 ? '5px 5px 0 0' : '0 0 5px 5px',
              border: '1px solid #ddd', borderBottomWidth: i === 0 ? 0 : 1,
              background: '#fff', color: '#888', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name={name} size={14} />
          </button>
        ))}
      </div>
    </motion.div>
  )
}
