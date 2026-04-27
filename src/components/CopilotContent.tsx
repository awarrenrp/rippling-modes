import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from './Icon'

// ─── Constants ───────────────────────────────────────────────────────────────

export const SSO_APPS = [
  { name: 'Gmail',   bg: '#e8e8e8', text: '#555', label: 'G'  },
  { name: 'Slack',   bg: '#e8e8e8', text: '#555', label: 'S'  },
  { name: 'Notion',  bg: '#e8e8e8', text: '#555', label: 'N'  },
  { name: 'Figma',   bg: '#e8e8e8', text: '#555', label: 'F'  },
  { name: 'GitHub',  bg: '#e8e8e8', text: '#555', label: 'GH' },
  { name: 'Zoom',    bg: '#e8e8e8', text: '#555', label: 'Z'  },
  { name: 'Jira',    bg: '#e8e8e8', text: '#555', label: 'J'  },
  { name: 'Accrue',  bg: '#e8e8e8', text: '#555', label: 'A'  },
]

// Phase: idle → lifting → reasoning → onAskAI fires
type InputPhase = 'idle' | 'lifting' | 'reasoning'

const SHADOW: Record<InputPhase | 'sent', string> = {
  idle:      '0 2px 8px rgba(0,0,0,0.08), 0 8px 28px rgba(0,0,0,0.10), 0 20px 52px rgba(0,0,0,0.08)',
  lifting:   '0 8px 20px rgba(0,0,0,0.13), 0 20px 48px rgba(0,0,0,0.18), 0 40px 80px rgba(0,0,0,0.13)',
  reasoning: '0 14px 32px rgba(0,0,0,0.16), 0 30px 64px rgba(0,0,0,0.19), 0 52px 96px rgba(0,0,0,0.12)',
  sent:      '0 2px 8px rgba(0,0,0,0.08), 0 8px 28px rgba(0,0,0,0.10), 0 20px 52px rgba(0,0,0,0.08)',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CopilotContent({
  onAskAI,
  chatOpen,
  elevation = 'base',
  pageBg = 'var(--grey-100)',
}: {
  onAskAI: (msg: string) => void
  chatOpen: boolean
  elevation?: 'base' | 'shadow' | 'variable'
  pageBg?: string
}) {
  const [triggerInput, setTriggerInput] = useState('')
  const [phase, setPhase] = useState<InputPhase>('idle')
  const [sentQuery, setSentQuery] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!chatOpen) {
      setPhase('idle')
      setSentQuery('')
      setTriggerInput('')
    }
  }, [chatOpen])

  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  function handleSubmit() {
    const msg = triggerInput.trim()
    if (!msg || phase !== 'idle') return

    setSentQuery(msg)
    setPhase('lifting')

    const t1 = setTimeout(() => setPhase('reasoning'), 180)
    const t2 = setTimeout(() => {
      setPhase('idle')
      setTriggerInput('')
      onAskAI(msg)
    }, 800)
    timers.current = [t1, t2]
  }

  const isSent = chatOpen && !!sentQuery

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: pageBg,
        overflow: 'visible',
      }}
    >
      {/* ── SSO Ribbon ── */}
      <div
        style={{
          flexShrink: 0,
          height: 44,
          background: pageBg,
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: '#999', whiteSpace: 'nowrap', letterSpacing: '0.1px' }}>
          Quick sign-in
        </span>

        <div style={{ width: 1, height: 20, background: '#dadce0', margin: '0 18px', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          {SSO_APPS.map((app) => (
            <motion.button
              key={app.name}
              whileHover={{ scale: 1.06, backgroundColor: '#f0f0f0' }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 6, border: 'none',
                background: 'transparent', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: app.bg, color: app.text,
                  fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, letterSpacing: '-0.3px',
                }}
              >
                {app.label}
              </div>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 400 }}>{app.name}</span>
            </motion.button>
          ))}

          <motion.button
            whileHover={{ scale: 1.04 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 6, border: 'none',
              background: 'transparent', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18, height: 18, borderRadius: 4,
                background: '#e8eaed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 8, color: '#5f6368', fontWeight: 700, letterSpacing: '-0.5px' }}>≡</span>
            </div>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>+16 more</span>
          </motion.button>
        </div>
      </div>

      {/* ── Centered input area ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <motion.div
          animate={{ y: phase === 'lifting' ? -5 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={{ width: '100%', maxWidth: 620, padding: '0 32px' }}
        >
          {/* Card */}
          <motion.div
            animate={{
              boxShadow: elevation === 'base' || elevation === 'variable'
                ? '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)'
                : (isSent ? SHADOW.sent : SHADOW[phase]),
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
            }}
          >
            {/* Input row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px 18px 22px' }}>
              <img
                src="/rippling-ai.png"
                width={18} height={18}
                style={{ display: 'block', opacity: isSent ? 1 : 0.25, transition: 'opacity 0.3s', flexShrink: 0 }}
              />
              <input
                value={isSent ? sentQuery : triggerInput}
                readOnly={isSent || phase !== 'idle'}
                onChange={(e) => setTriggerInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Describe what you want to get done..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  background: 'transparent', fontSize: 15,
                  color: isSent ? '#aaa' : '#111',
                  fontStyle: isSent ? 'italic' : 'normal',
                  transition: 'color 0.25s',
                }}
              />
              <motion.button
                onClick={!isSent && phase === 'idle' ? handleSubmit : undefined}
                whileHover={triggerInput.trim() && !isSent ? { scale: 1.06 } : {}}
                whileTap={triggerInput.trim() && !isSent ? { scale: 0.93 } : {}}
                animate={{ background: triggerInput.trim() && !isSent ? '#111' : '#ebebeb' }}
                transition={{ duration: 0.2 }}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none',
                  color: triggerInput.trim() && !isSent ? '#fff' : '#aaa',
                  cursor: triggerInput.trim() && !isSent ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'color 0.2s',
                }}
              >
                <Icon name="arrow_upward" size={16} />
              </motion.button>
            </div>

            {/* Reasoning expansion */}
            <AnimatePresence>
              {phase === 'reasoning' && (
                <motion.div
                  key="reasoning-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      borderTop: '1px solid #f0f0f0',
                      padding: '14px 18px 16px',
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: '#111',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}
                    >
                      <img src="/rippling-ai.png" width={11} height={11}
                        style={{ display: 'block', filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#333', letterSpacing: '0.1px', marginBottom: 7 }}>
                        Rippling AI
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.25, 1, 0.25], scale: [0.65, 1, 0.65] }}
                            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                            style={{ width: 5, height: 5, borderRadius: '50%', background: '#999' }}
                          />
                        ))}
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}
                        >
                          Searching your workspace…
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Status bar — always mounted so its height never changes and the
              card above never shifts. Opacity/y animate to hide it when chat
              is open, but the element keeps its layout space. */}
          <motion.div
            animate={{ opacity: chatOpen ? 0 : 1, y: chatOpen ? 4 : 0 }}
            initial={false}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 14, padding: '0 2px',
              pointerEvents: chatOpen ? 'none' : 'auto',
            }}
          >
            <span style={{ fontSize: 12, color: '#bbb' }}>
              No credits remaining · Basic mode until May 1
            </span>
            <motion.button
              whileHover={{ color: '#111' }}
              style={{
                fontSize: 12, color: '#888', fontWeight: 400,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Request upgrade ›
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
