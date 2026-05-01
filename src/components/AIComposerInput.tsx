import React, { forwardRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { Icon } from './Icon'

export type AIComposerVariant = 'pane' | 'fullscreen'

/** Default placeholder — Figma AI-components `28:12366` (Type=Text, Width=Medium). */
export const AI_COMPOSER_DEFAULT_PLACEHOLDER = 'Ask, make, or searching anything…'

type NativeField = HTMLTextAreaElement | HTMLInputElement

export type AIComposerInputProps = {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  variant?: AIComposerVariant
  className?: string
  style?: React.CSSProperties
  /** Fired after value/caret updates (mentions, @ picker). */
  onCaretActivity?: (detail: { value: string; selectionStart: number }) => void
}

/**
 * Standard AI message composer — matches Rippling AI-components
 * (`Type=Text` large + small): white field, 8px radius, action row (attach, Fast, mic, send).
 * Use `variant="fullscreen"` for full-screen chat; `variant="pane"` for sidebar, drawers, and canvas.
 */
export const AIComposerInput = forwardRef<NativeField, AIComposerInputProps>(function AIComposerInput(
  {
    value,
    onChange,
    onSend,
    placeholder = AI_COMPOSER_DEFAULT_PLACEHOLDER,
    disabled,
    readOnly,
    variant = 'pane',
    className,
    style,
    onCaretActivity,
  },
  ref,
) {
  const canSend = value.trim().length > 0 && !disabled && !readOnly
  const multiline = variant === 'fullscreen'
  /** Sidebar / docked chat — matches AI-components mock stroke + send treatment. */
  const paneChrome = !multiline

  const emitCaret = useCallback(
    (el: NativeField | null, v: string) => {
      if (!onCaretActivity || !el) return
      onCaretActivity({ value: v, selectionStart: el.selectionStart ?? v.length })
    },
    [onCaretActivity],
  )

  const shell: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: 8,
    border: paneChrome ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid var(--ring)',
    padding: 8,
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: paneChrome ? 111 : 112,
    fontFamily: 'var(--font-composer-field)',
    fontWeight: 'var(--ai-composer-field-weight)',
    ...(multiline
      ? { gap: 8, justifyContent: 'flex-start' as const }
      : { gap: 0, justifyContent: 'space-between' as const }),
  }

  /** Typography for input/textarea comes from `index.css` `.ai-composer-input input` (explicit `font` + smoothing). */
  const inputBase: React.CSSProperties = {
    width: '100%',
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: paneChrome ? '#000000' : '#111',
    resize: 'none' as const,
  }

  const hairline = paneChrome ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)'

  const ghostIconBtn: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: hairline,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: paneChrome ? '#000000' : '#111',
    padding: 0,
    flexShrink: 0,
  }

  const fastBtn: React.CSSProperties = {
    height: 32,
    borderRadius: 6,
    border: hairline,
    background: '#fff',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 'var(--ai-composer-medium-weight)',
    lineHeight: '20px',
    letterSpacing: 0,
    color: paneChrome ? '#000000' : '#111',
    fontFamily: 'var(--font-composer-field)',
    flexShrink: 0,
  }

  return (
    <div
      className={['ai-composer-input', className].filter(Boolean).join(' ')}
      style={{ ...shell, ...style }}
    >
      <div
        style={
          multiline
            ? { flex: 1, minHeight: 48, display: 'flex' }
            : { flexShrink: 0, display: 'flex', alignItems: 'center', minHeight: 20 }
        }
      >
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            value={value}
            readOnly={readOnly}
            onChange={(e) => {
              onChange(e.target.value)
              requestAnimationFrame(() => emitCaret(e.target, e.target.value))
            }}
            onSelect={(e) => emitCaret(e.target as HTMLTextAreaElement, value)}
            onKeyUp={(e) => emitCaret(e.target as HTMLTextAreaElement, value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (canSend) onSend()
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
            rows={3}
            aria-label={placeholder}
            style={{
              ...inputBase,
              flex: 1,
              minHeight: 52,
              display: 'block',
              padding: 0,
            }}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            value={value}
            readOnly={readOnly}
            onChange={(e) => {
              onChange(e.target.value)
              requestAnimationFrame(() => emitCaret(e.target, e.target.value))
            }}
            onSelect={(e) => emitCaret(e.target as HTMLInputElement, value)}
            onKeyUp={(e) => emitCaret(e.target as HTMLInputElement, value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (canSend) onSend()
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
            style={{
              ...inputBase,
              height: 20,
              padding: 0,
            }}
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 32,
          flexShrink: 0,
        }}
      >
        <button type="button" aria-label="Add attachment" style={ghostIconBtn}>
          <Icon name="add" size={20} />
        </button>
        <button type="button" aria-label="Model speed" style={fastBtn}>
          <Icon name="bolt" size={16} />
          Fast
          <Icon name="expand_more" size={16} />
          {paneChrome && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9999,
                background: '#1e4aa9',
                color: '#fff',
                fontSize: 11,
                fontWeight: 'var(--ai-composer-medium-weight)',
                lineHeight: '14px',
                letterSpacing: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                marginLeft: 2,
                fontFamily: 'var(--font-composer-field)',
              }}
            >
              1
            </span>
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }} />
        <button type="button" aria-label="Voice input" style={ghostIconBtn}>
          <Icon name="mic" size={20} />
        </button>
        <motion.button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          whileHover={canSend ? { scale: 1.04 } : undefined}
          whileTap={canSend ? { scale: 0.96 } : undefined}
          aria-label="Send"
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: 'none',
            background: canSend
              ? (paneChrome ? '#000000' : '#7a005d')
              : (paneChrome ? '#f2f2f2' : '#eceaee'),
            color: canSend ? '#fff' : (paneChrome ? '#999' : '#aaa'),
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s, color 0.2s',
            padding: 0,
          }}
        >
          <Icon name="send" size={18} filled={canSend} style={{ color: canSend && paneChrome ? '#ffffff' : 'inherit' }} />
        </motion.button>
      </div>
    </div>
  )
})
