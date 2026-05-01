import { useState, memo, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronRight } from 'lucide-react'

// ── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  id: string
  label: string
  description: string
}

const STEPS: Step[] = [
  { id: 'basics',       label: 'Basic info',        description: 'Name, role, and work email' },
  { id: 'role',         label: 'Role & compensation', description: 'Department, manager, salary' },
  { id: 'benefits',     label: 'Benefits',           description: 'Health, 401k, and PTO' },
  { id: 'it',           label: 'IT & equipment',     description: 'Devices and software access' },
  { id: 'documents',    label: 'Documents',          description: 'Offer letter and agreements' },
  { id: 'review',       label: 'Review & send',      description: 'Confirm and send onboarding' },
]

// ── Field types ───────────────────────────────────────────────────────────────

interface Field {
  id: string
  label: string
  type: 'text' | 'email' | 'select' | 'date' | 'currency' | 'toggle' | 'radio' | 'file'
  placeholder?: string
  options?: string[]
  value?: string
  hint?: string
}

// ── Step content ──────────────────────────────────────────────────────────────

const STEP_CONTENT: Record<string, { title: string; subtitle: string; fields: Field[] }> = {
  basics: {
    title: 'Basic information',
    subtitle: 'Tell us about the new hire.',
    fields: [
      { id: 'firstName',  label: 'First name',    type: 'text',  placeholder: 'e.g. Jordan' },
      { id: 'lastName',   label: 'Last name',     type: 'text',  placeholder: 'e.g. Smith' },
      { id: 'email',      label: 'Work email',    type: 'email', placeholder: 'jordan@acme.com' },
      { id: 'personal',   label: 'Personal email', type: 'email', placeholder: 'For onboarding access', hint: 'Used to send offer letter before work email is active' },
      { id: 'startDate',  label: 'Start date',    type: 'date' },
    ],
  },
  role: {
    title: 'Role & compensation',
    subtitle: 'Define the position and pay.',
    fields: [
      { id: 'title',      label: 'Job title',     type: 'text',     placeholder: 'e.g. Senior Software Engineer' },
      { id: 'dept',       label: 'Department',    type: 'select',   options: ['Engineering', 'Design', 'Marketing', 'Finance', 'Sales', 'HR'] },
      { id: 'manager',    label: 'Reporting to',  type: 'select',   options: ['Alicia Warren', 'Richard Satherland', 'Wanda Woodz', 'John List'] },
      { id: 'employment', label: 'Employment type', type: 'radio',  options: ['Full-time', 'Part-time', 'Contractor'] },
      { id: 'salary',     label: 'Annual salary', type: 'currency', placeholder: '120,000' },
      { id: 'bonus',      label: 'Target bonus',  type: 'currency', placeholder: '10,000', hint: 'As a percentage or fixed amount' },
    ],
  },
  benefits: {
    title: 'Benefits enrollment',
    subtitle: 'Select plans for the new hire.',
    fields: [
      { id: 'health',     label: 'Health plan',   type: 'select',  options: ['Gold PPO', 'Silver HMO', 'Bronze HDHP', 'Waive coverage'] },
      { id: 'dental',     label: 'Dental plan',   type: 'select',  options: ['Standard Dental', 'Premium Dental', 'Waive coverage'] },
      { id: 'vision',     label: 'Vision plan',   type: 'select',  options: ['Standard Vision', 'Waive coverage'] },
      { id: 'k401',       label: '401(k) enrollment', type: 'toggle', hint: 'Employee can update contribution later' },
      { id: 'pto',        label: 'PTO policy',    type: 'select',  options: ['Unlimited PTO', 'Accrual — 15 days/yr', 'Accrual — 20 days/yr'] },
    ],
  },
  it: {
    title: 'IT setup & equipment',
    subtitle: 'Configure tools and hardware.',
    fields: [
      { id: 'device',     label: 'Primary device', type: 'radio',  options: ['MacBook Pro 14"', 'MacBook Air M3', 'Dell XPS 15 (Windows)'] },
      { id: 'monitor',    label: 'Monitor',        type: 'toggle', hint: 'Ships with standard single monitor' },
      { id: 'slack',      label: 'Slack workspace', type: 'select', options: ['#engineering', '#design', '#marketing', '#general'] },
      { id: 'software',   label: 'Software bundle', type: 'select', options: ['Engineering stack', 'Design stack', 'Standard business', 'Custom'] },
      { id: 'vpn',        label: 'VPN access',     type: 'toggle', hint: 'Required for engineering roles' },
    ],
  },
  documents: {
    title: 'Documents & agreements',
    subtitle: 'Attach required paperwork.',
    fields: [
      { id: 'offer',      label: 'Offer letter template', type: 'select', options: ['Standard FTE Offer', 'Senior Offer', 'Executive Offer', 'Custom upload'] },
      { id: 'nda',        label: 'NDA',            type: 'toggle', hint: 'Standard mutual NDA' },
      { id: 'ipca',       label: 'IP & Confidentiality agreement', type: 'toggle', hint: 'Required for engineering and design roles' },
      { id: 'handbook',   label: 'Employee handbook', type: 'toggle', hint: 'Latest version — Apr 2026' },
      { id: 'i9',         label: 'I-9 (work authorization)', type: 'toggle', hint: 'Collected on day one' },
    ],
  },
  review: {
    title: 'Review & send',
    subtitle: 'Confirm details and kick off onboarding.',
    fields: [
      { id: 'email_preview', label: 'Onboarding email preview', type: 'file', hint: 'Employee will receive this on their personal email' },
      { id: 'notify_it',    label: 'Notify IT team',       type: 'toggle', hint: 'Sends IT setup ticket automatically' },
      { id: 'notify_mgr',   label: 'Notify hiring manager', type: 'toggle', hint: 'Sends a summary to the manager' },
      { id: 'start_reminder', label: 'Send day-1 reminder', type: 'toggle', hint: '24 hours before start date' },
    ],
  },
}

// ── Field renderers ───────────────────────────────────────────────────────────

const inputBase: CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #e0e0e0', fontSize: 13, outline: 'none',
  background: '#fff', color: '#111', boxSizing: 'border-box',
  fontFamily: 'inherit',
}

function FieldRow({ field, value, onChange }: {
  field: Field
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>{field.label}</label>

      {(field.type === 'text' || field.type === 'email' || field.type === 'date') && (
        <input
          type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
          placeholder={field.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={inputBase}
        />
      )}

      {field.type === 'currency' && (
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#999' }}>$</span>
          <input
            type="text"
            placeholder={field.placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ ...inputBase, paddingLeft: 24 }}
          />
        </div>
      )}

      {field.type === 'select' && (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputBase, cursor: 'pointer', appearance: 'none' }}>
          <option value="">Select…</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}

      {field.type === 'radio' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {field.options?.map(o => (
            <label key={o} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              border: value === o ? '1px solid #111' : '1px solid #e0e0e0',
              background: value === o ? '#111' : '#fff',
              color: value === o ? '#fff' : '#444',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.12s',
            }}>
              <input
                type="radio"
                name={field.id}
                value={o}
                checked={value === o}
                onChange={() => onChange(o)}
                style={{ display: 'none' }}
              />
              {o}
            </label>
          ))}
        </div>
      )}

      {field.type === 'toggle' && (
        <div
          onClick={() => onChange(value === 'on' ? 'off' : 'on')}
          style={{
            width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
            background: value === 'on' ? '#111' : '#ddd',
            position: 'relative', transition: 'background 0.15s',
            flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 3, left: value === 'on' ? 21 : 3,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 0.15s',
          }} />
        </div>
      )}

      {field.type === 'file' && (
        <div style={{
          padding: '20px 16px', borderRadius: 8, border: '2px dashed #e0e0e0',
          background: '#fafafa', textAlign: 'center', cursor: 'pointer',
        }}>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>📧 Offer letter · Welcome to Acme!</p>
          <p style={{ fontSize: 11, color: '#bbb', margin: '4px 0 0' }}>Preview will be generated on send</p>
        </div>
      )}

      {field.hint && (
        <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{field.hint}</p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export const StepperPage = memo(function StepperPage() {
  const [activeStep, setActiveStep]   = useState(0)
  const [direction, setDirection]     = useState<1 | -1>(1)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [completed, setCompleted]     = useState<Set<number>>(new Set())

  const step    = STEPS[activeStep]
  const content = STEP_CONTENT[step.id]

  function setField(id: string, val: string) {
    setFieldValues(v => ({ ...v, [id]: val }))
  }

  function goTo(index: number) {
    setDirection(index > activeStep ? 1 : -1)
    setCompleted(c => { const n = new Set(c); n.add(activeStep); return n })
    setActiveStep(index)
  }

  function next() { if (activeStep < STEPS.length - 1) goTo(activeStep + 1) }
  function back() { if (activeStep > 0) goTo(activeStep - 1) }

  const isLast = activeStep === STEPS.length - 1

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--grey-100)' }}>

      {/* ── Left: step list ──────────────────────────────────────────────── */}
      <div style={{
        width: 240, flexShrink: 0, background: '#fff',
        borderRight: '1px solid #ebebeb',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>
            New hire onboarding
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#111' }}>Hire new employee</p>
          <p style={{ fontSize: 12, color: '#aaa', margin: '6px 0 0' }}>
            Step {activeStep + 1} of {STEPS.length}
          </p>
          {/* Progress bar */}
          <div style={{ height: 3, borderRadius: 2, background: '#f0f0f0', marginTop: 10, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ height: '100%', background: '#111', borderRadius: 2 }}
            />
          </div>
        </div>

        {/* Steps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {STEPS.map((s, i) => {
            const isActive = i === activeStep
            const isDone   = completed.has(i)
            return (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                style={{
                  width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 10px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  background: isActive ? '#f0f0f0' : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f7f7f7' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {/* Step indicator */}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 1,
                  background: isDone ? '#111' : isActive ? '#333' : '#f0f0f0',
                  border: isActive && !isDone ? '2px solid #111' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {isDone
                    ? <Check size={12} color="#fff" strokeWidth={3} />
                    : <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : '#aaa' }}>{i + 1}</span>
                  }
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 12, fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#111' : isDone ? '#555' : '#888',
                    margin: 0, lineHeight: 1.3,
                  }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: '#bbb', margin: '2px 0 0', lineHeight: 1.3 }}>{s.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: step content ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Breadcrumb */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #ebebeb',
          padding: '0 32px', height: 44, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: '#aaa',
        }}>
          <span>Onboarding</span>
          <ChevronRight size={12} />
          <span>New hire</span>
          <ChevronRight size={12} />
          <span style={{ color: '#111', fontWeight: 500 }}>{step.label}</span>
        </div>

        {/* Animated step form */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              initial={{ x: direction * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              style={{ padding: '36px 48px 120px', minHeight: '100%' }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#111', letterSpacing: '-0.3px' }}>
                {content.title}
              </h2>
              <p style={{ fontSize: 14, fontWeight: 400, color: '#888', margin: '0 0 32px' }}>
                {content.subtitle}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 32px', maxWidth: 640 }}>
                {content.fields.map(field => (
                  <div
                    key={field.id}
                    style={{
                      gridColumn: (field.type === 'toggle' || field.type === 'file' || field.type === 'radio')
                        ? 'span 2'
                        : 'span 1',
                    }}
                  >
                    {field.type === 'toggle' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: '1px solid #ebebeb', background: '#fff' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#222', margin: 0 }}>{field.label}</p>
                          {field.hint && <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0' }}>{field.hint}</p>}
                        </div>
                        <FieldRow
                          field={{ ...field, label: '' }}
                          value={fieldValues[field.id] ?? 'on'}
                          onChange={v => setField(field.id, v)}
                        />
                      </div>
                    ) : (
                      <FieldRow
                        field={field}
                        value={fieldValues[field.id] ?? ''}
                        onChange={v => setField(field.id, v)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sticky footer nav */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: '#fff', borderTop: '1px solid #ebebeb',
          padding: '14px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <button
            onClick={back}
            disabled={activeStep === 0}
            style={{
              padding: '9px 20px', borderRadius: 8,
              border: '1px solid #e0e0e0', background: '#fff',
              fontSize: 13, fontWeight: 500, cursor: activeStep === 0 ? 'not-allowed' : 'pointer',
              color: activeStep === 0 ? '#ccc' : '#444',
            }}
          >
            Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Dot indicators */}
            {STEPS.map((_, i) => (
              <div
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === activeStep ? 20 : 6,
                  height: 6, borderRadius: 3,
                  background: i === activeStep ? '#111' : completed.has(i) ? '#666' : '#ddd',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          <button
            onClick={isLast ? undefined : next}
            style={{
              padding: '9px 24px', borderRadius: 8,
              border: 'none',
              background: isLast ? '#16a34a' : '#111',
              color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {isLast ? '✓ Send onboarding' : 'Continue'}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
})
