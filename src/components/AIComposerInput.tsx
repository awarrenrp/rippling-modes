import { motion } from 'motion/react'
import { Icon } from './Icon'

/**
 * Standard AI message composer (matches Rippling AI-components / ChatPanel copilot field).
 * Use for table drawer mini-chat, canvas, and chat sidebar.
 */
export function AIComposerInput({
  value,
  onChange,
  onSend,
  placeholder = 'Message AI…',
  disabled,
  sendIconSize = 13,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
  /** @default 13 */
  sendIconSize?: number
}) {
  const canSend = value.trim().length > 0 && !disabled

  return (
    <div
      className="ai-composer-input"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fafafa', borderRadius: 16,
        padding: '11px 12px 11px 16px', border: '1px solid #e0e0e0', boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (canSend) onSend()
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0, background: 'transparent', border: 'none',
          outline: 'none', fontSize: 14, color: '#111', fontFamily: 'inherit', lineHeight: 1.4,
        }}
      />
      <motion.button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        whileHover={canSend ? { scale: 1.05 } : undefined}
        whileTap={canSend ? { scale: 0.95 } : undefined}
        aria-label="Send"
        style={{
          width: 32, height: 32, borderRadius: 8, border: 'none',
          background: canSend ? '#111' : '#e8e8e8',
          color: canSend ? '#fff' : '#aaa',
          cursor: canSend ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.2s, color 0.2s',
        }}
      >
        <Icon name="send" size={sendIconSize} />
      </motion.button>
    </div>
  )
}
