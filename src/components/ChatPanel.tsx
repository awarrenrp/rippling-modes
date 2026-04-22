import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from './Icon'
import { useContainerWidth } from '../hooks/useContainerWidth'
import type { Mode } from './ModeBar'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TextMessage {
  id: number
  role: 'user' | 'assistant'
  type: 'text'
  text: string
}

interface ChartMessage {
  id: number
  role: 'assistant'
  type: 'chart'
  title: string
  data: { label: string; value: number; color: string }[]
}

interface ArtifactMessage {
  id: number
  role: 'assistant'
  type: 'table-sm' | 'table-lg' | 'dashboard' | 'candidate' | 'expense'
}

interface ReportCreatedMessage {
  id: number
  role: 'assistant'
  type: 'report-created'
  title: string
}

type Message = TextMessage | ChartMessage | ArtifactMessage | ReportCreatedMessage

// ─── Chart card ─────────────────────────────────────────────────────────────

const CHART_DATA = [
  { label: 'Eng',   value: 312, color: '#444' },
  { label: 'Sales', value: 198, color: '#666' },
  { label: 'Ops',   value: 247, color: '#555' },
  { label: 'Mktg',  value: 134, color: '#777' },
  { label: 'HR',    value: 89,  color: '#888' },
  { label: 'Fin',   value: 102, color: '#999' },
]

function ChartCard({ data, title }: Pick<ChartMessage, 'data' | 'title'>) {
  const max = Math.max(...data.map((d) => d.value))

  return (
    <div style={{ border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden', width: '100%', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.10)' }}>
      {/* Chart section — grey-100 */}
      <div style={{ background: 'var(--grey-100)', padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#333', marginBottom: 10 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 70 }}>
          {data.map((d, i) => (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
                style={{
                  width: '100%',
                  height: `${(d.value / max) * 56}px`,
                  background: d.color,
                  borderRadius: '2px 2px 0 0',
                  transformOrigin: 'bottom',
                  opacity: 0.6 + i * 0.05,
                }}
              />
              <span style={{ fontSize: 8, color: '#bbb' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Summary footer — white */}
      <div style={{
        background: '#ffffff', borderTop: '1px solid var(--grey-200)',
        padding: '8px 14px',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: '#aaa',
      }}>
        <span>Total: <strong style={{ color: '#333' }}>1,082</strong></span>
        <span style={{ color: '#555' }}>↑ 8.4% YoY</span>
      </div>
    </div>
  )
}

// ─── Artifact: 3-column table (Leave Requests) ───────────────────────────────

const LEAVE_ROWS = [
  { name: 'Maria Scrivner',  type: 'PTO',          days: 5,  status: 'Approved', start: 'Apr 14' },
  { name: 'John Martin',     type: 'Sick Leave',   days: 2,  status: 'Approved', start: 'Apr 9'  },
  { name: 'Jenny Jones',     type: 'PTO',          days: 10, status: 'Pending',  start: 'May 1'  },
  { name: 'Sarah Monday',    type: 'Bereavement',  days: 3,  status: 'Approved', start: 'Apr 3'  },
  { name: 'Daniel Park',     type: 'PTO',          days: 7,  status: 'Denied',   start: 'Apr 22' },
]

const STATUS_COLOR: Record<string, string> = {
  Approved: '#d4edda',
  Pending:  '#e8e8e8',
  Denied:   '#ededed',
}
const STATUS_TEXT: Record<string, string> = {
  Approved: '#2d6a4f',
  Pending:  '#666',
  Denied:   '#999',
}

function TableSmallArtifact({ cw }: { cw: number }) {
  const wide = cw > 480
  return (
    <ArtifactShell title="Leave Requests" subtitle="5 records · Apr 2026" icon="event_available">
      {/* Table section — grey-100 */}
      <div style={{ background: 'var(--grey-100)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: wide ? 13 : 11.5 }}>
          <thead>
            <tr style={{ background: 'var(--grey-200)' }}>
              {['Employee', 'Type', 'Days', ...(wide ? ['Status', 'Starts'] : ['Status'])].map((h) => (
                <th key={h} style={{ padding: wide ? '7px 12px' : '6px 8px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid var(--grey-200)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEAVE_ROWS.map((r, i) => (
              <tr key={r.name} style={{ background: '#ffffff', borderBottom: i < LEAVE_ROWS.length - 1 ? '1px solid var(--grey-200)' : 'none' }}>
                <td style={{ padding: wide ? '8px 12px' : '6px 8px', fontWeight: 500, color: '#111', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: wide ? 24 : 20, height: wide ? 24 : 20, borderRadius: '50%', background: 'var(--grey-200)', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                      {r.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontSize: wide ? 13 : 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: wide ? 120 : 80 }}>{r.name}</span>
                  </div>
                </td>
                <td style={{ padding: wide ? '8px 12px' : '6px 8px', color: '#555' }}>{r.type}</td>
                <td style={{ padding: wide ? '8px 12px' : '6px 8px', color: '#555', textAlign: 'center' }}>{r.days}d</td>
                {wide && <td style={{ padding: '8px 12px' }}>
                  <span style={{ background: STATUS_COLOR[r.status], color: STATUS_TEXT[r.status], fontSize: 11, fontWeight: 500, borderRadius: 99, padding: '2px 8px' }}>{r.status}</span>
                </td>}
                {!wide && <td style={{ padding: '6px 8px' }}>
                  <span style={{ background: STATUS_COLOR[r.status], color: STATUS_TEXT[r.status], fontSize: 10, fontWeight: 500, borderRadius: 99, padding: '2px 6px' }}>{r.status}</span>
                </td>}
                {wide && <td style={{ padding: '8px 12px', color: '#999', fontSize: 12 }}>{r.start}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ArtifactShell>
  )
}

// ─── Artifact: 12-column table (Global Payroll) ───────────────────────────────

const PAYROLL_COLS = ['Employee', 'Dept', 'Base', 'Bonus', 'Tax', 'Net Pay', 'Status', 'Country', 'Currency', 'FX Rate', 'Pay Date', 'Method']
const PAYROLL_ROWS = [
  ['Richard Satherland', 'Engineering', '$12,500', '$1,200', '$3,100', '$10,600', 'Processed', 'US', 'USD', '1.00', 'Mar 28', 'Direct Dep.'],
  ['Peter Mayfield',     'Design',      '£8,200',  '£500',   '£2,460', '£6,240',  'Processed', 'UK', 'GBP', '1.27', 'Mar 28', 'Direct Dep.'],
  ['John List',          'Marketing',   '€9,000',  '€800',   '€2,520', '€7,280',  'Pending',   'DE', 'EUR', '1.09', 'Mar 31', 'Wire'],
  ['Sahill Mahood',      'Design',      '$7,800',  '$0',     '$1,950', '$5,850',  'Processed', 'US', 'USD', '1.00', 'Mar 28', 'Direct Dep.'],
  ['Yuki Tanaka',        'Eng',         '¥1,200K', '¥100K',  '¥336K',  '¥964K',   'Processed', 'JP', 'JPY', '0.0066','Mar 28', 'Direct Dep.'],
]

function TableLargeArtifact({ cw }: { cw: number }) {
  const wide = cw > 560
  // Visible columns depend on width
  const visibleCols = wide ? PAYROLL_COLS : PAYROLL_COLS.slice(0, 6)
  const visibleRows = PAYROLL_ROWS.map(r => wide ? r : r.slice(0, 6))

  return (
    <ArtifactShell title="Global Payroll — March 2026" subtitle={`${PAYROLL_COLS.length} columns · ${PAYROLL_ROWS.length} records`} icon="payments" badge={wide ? undefined : `+${PAYROLL_COLS.length - 6} cols`}>
      {/* Table section — grey-100 */}
      <div style={{ background: 'var(--grey-100)', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: wide ? 12 : 11, minWidth: wide ? '100%' : 480 }}>
          <thead>
            <tr style={{ background: 'var(--grey-200)' }}>
              {visibleCols.map((h) => (
                <th key={h} style={{ padding: wide ? '6px 10px' : '5px 8px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid var(--grey-200)', whiteSpace: 'nowrap', fontSize: wide ? 11 : 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr key={i} style={{ background: '#ffffff', borderBottom: i < visibleRows.length - 1 ? '1px solid var(--grey-200)' : 'none' }}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    style={{
                      padding: wide ? '7px 10px' : '5px 8px',
                      color: j === 0 ? '#111' : '#666',
                      fontWeight: j === 0 ? 500 : 400,
                      whiteSpace: 'nowrap',
                      fontSize: wide ? 12 : 11,
                    }}
                  >
                    {j === 6 && typeof cell === 'string' ? (
                      <span style={{ background: cell === 'Processed' ? '#d4edda' : 'var(--grey-200)', color: cell === 'Processed' ? '#2d6a4f' : '#888', fontSize: 10, borderRadius: 99, padding: '2px 7px', fontWeight: 500 }}>{cell}</span>
                    ) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Footer — white */}
      {!wide && (
        <div style={{ background: '#ffffff', borderTop: '1px solid var(--grey-200)', padding: '7px 12px', fontSize: 11, color: '#aaa' }}>
          Expand panel to see all {PAYROLL_COLS.length} columns
        </div>
      )}
    </ArtifactShell>
  )
}

// ─── Artifact: Dashboard ──────────────────────────────────────────────────────

const DASH_STATS = [
  { label: 'Headcount',    value: '312',  delta: '+12',  bad: false },
  { label: 'Open Roles',   value: '18',   delta: '+5',   bad: true  },
  { label: 'Avg Tenure',   value: '3.2y', delta: '+0.2', bad: false },
  { label: 'Turnover',     value: '8.4%', delta: '+1.1%',bad: true  },
]

const DASH_DEPT = [
  { name: 'Engineering', hc: 98,  pct: 78 },
  { name: 'Sales',       hc: 72,  pct: 58 },
  { name: 'Marketing',   hc: 41,  pct: 33 },
  { name: 'Operations',  hc: 57,  pct: 45 },
  { name: 'HR',          hc: 23,  pct: 18 },
]

function DashboardArtifact({ cw }: { cw: number }) {
  const cols = cw > 520 ? 4 : cw > 340 ? 2 : 1
  const wide = cw > 520

  return (
    <ArtifactShell title="Team Overview" subtitle="Live · Updated 2m ago" icon="dashboard">
      {/* Stats + dept — grey-100 */}
      <div style={{ background: 'var(--grey-100)', padding: '12px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: wide ? 10 : 8, marginBottom: cw > 320 ? 14 : 0 }}>
          {DASH_STATS.map((s) => (
            <div key={s.label} style={{ background: '#ffffff', border: '1px solid var(--grey-200)', borderRadius: 8, padding: wide ? '10px 12px' : '8px 10px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: wide ? 22 : 18, fontWeight: 700, color: '#111', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: s.bad ? '#c0392b' : '#27ae60', marginTop: 3, fontWeight: 500 }}>{s.delta} this quarter</div>
            </div>
          ))}
        </div>
        {cw > 320 && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>By Department</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DASH_DEPT.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: wide ? 10 : 8 }}>
                  <span style={{ fontSize: wide ? 12 : 11, color: '#555', width: wide ? 90 : 70, flexShrink: 0 }}>{d.name}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--grey-200)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ height: '100%', background: '#555', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: wide ? 11 : 10, color: '#999', width: 28, textAlign: 'right', flexShrink: 0 }}>{d.hc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ArtifactShell>
  )
}

// ─── Artifact: Candidate Profile ─────────────────────────────────────────────

const SKILLS = ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'React', 'Accessibility']
const EXPERIENCE = [
  { role: 'Senior Product Designer', company: 'Notion', period: '2021 – Present' },
  { role: 'Product Designer',        company: 'Dropbox',period: '2018 – 2021'   },
  { role: 'UX Designer',             company: 'IDEO',   period: '2016 – 2018'   },
]

function CandidateProfileArtifact({ cw }: { cw: number }) {
  const wide = cw > 500

  return (
    <div style={{ border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden', width: '100%', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.10)' }}>
      {/* Identity — white, at top */}
      <div style={{ background: '#ffffff', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #d0d0d0, #b0b0b0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#555',
        }}>SR</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111' }}>Sofia Rodriguez</div>
          <div style={{ fontSize: 11.5, color: '#888', marginTop: 1 }}>Senior Designer · San Francisco, CA</div>
        </div>
        <span style={{ fontSize: 10.5, color: '#bbb', flexShrink: 0 }}>Applied Apr 8</span>
      </div>

      {/* Work info — grey-100 */}
      <div style={{ background: 'var(--grey-100)', borderTop: '1px solid var(--grey-200)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Match score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Match Score</div>
            <div style={{ height: 6, background: 'var(--grey-300)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '87%' }} transition={{ duration: 0.9, ease: 'easeOut' }} style={{ height: '100%', background: '#333', borderRadius: 3 }} />
            </div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111', flexShrink: 0 }}>87%</span>
        </div>

        {/* Skills */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {SKILLS.map((s) => (
              <span key={s} style={{ fontSize: 11, background: '#ffffff', border: '1px solid var(--grey-200)', color: '#555', borderRadius: 5, padding: '3px 8px', fontWeight: 500 }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Experience</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(wide ? EXPERIENCE : EXPERIENCE.slice(0, 2)).map((e) => (
              <div key={e.company} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#222' }}>{e.role}</span>
                  <span style={{ fontSize: 11, color: '#aaa' }}> · {e.company}</span>
                </div>
                <span style={{ fontSize: 10.5, color: '#bbb', flexShrink: 0 }}>{e.period}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions — white */}
      <div style={{ background: '#ffffff', borderTop: '1px solid var(--grey-200)', padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <ActionPill label="Message" />
          <ActionPill label="Schedule" />
          <ActionPill label="Advance" primary />
        </div>
      </div>
    </div>
  )
}

// ─── Artifact: Submitted Expense ─────────────────────────────────────────────

const EXPENSE_ITEMS = [
  { desc: 'Flight SFO → NYC',   category: 'Travel',   amt: '$486.00' },
  { desc: 'Hotel — 2 nights',   category: 'Lodging',  amt: '$312.00' },
  { desc: 'Client dinner',      category: 'Meals',    amt: '$124.50' },
  { desc: 'Uber to airport',    category: 'Transport',amt: '$38.20'  },
]

function ExpenseArtifact({ cw }: { cw: number }) {
  const wide = cw > 480
  const total = '$960.70'

  return (
    <ArtifactShell title="Expense Report" subtitle="Submitted by John Martin · Mar 28" icon="receipt_long">
      {/* Line items — grey-100 */}
      <div style={{ background: 'var(--grey-100)', padding: '12px 14px', display: 'flex', flexDirection: wide ? 'row' : 'column', gap: wide ? 16 : 12, alignItems: wide ? 'flex-start' : 'stretch' }}>
        {/* Receipt mockup */}
        <div style={{
          width: wide ? 110 : '100%', flexShrink: 0,
          background: '#ffffff', border: '1px solid var(--grey-200)',
          borderRadius: 8, padding: '12px',
          display: 'flex', flexDirection: wide ? 'column' : 'row',
          alignItems: 'center', gap: wide ? 6 : 12,
          justifyContent: wide ? 'center' : 'flex-start',
        }}>
          <Icon name="receipt" size={wide ? 28 : 22} style={{ color: '#ccc' }} />
          <div style={{ textAlign: wide ? 'center' : 'left' }}>
            <div style={{ fontSize: 10, color: '#bbb', fontWeight: 500 }}>Total</div>
            <div style={{ fontSize: wide ? 17 : 15, fontWeight: 700, color: '#333' }}>{total}</div>
            <div style={{ fontSize: 10, color: '#ccc', marginTop: 1 }}>USD · Mar 28</div>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {EXPENSE_ITEMS.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < EXPENSE_ITEMS.length - 1 ? '1px solid var(--grey-200)' : 'none', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                <span style={{ fontSize: 10, background: 'var(--grey-200)', color: '#777', borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>{item.category}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#333', flexShrink: 0 }}>{item.amt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total + actions — white */}
      <div style={{ background: '#ffffff', borderTop: '1px solid var(--grey-200)', padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>Total</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{total}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <ActionPill label="Approve" primary />
          <ActionPill label="Request changes" />
        </div>
      </div>
    </ArtifactShell>
  )
}

// ─── Shared artifact shell ────────────────────────────────────────────────────

function ArtifactShell({
  title, subtitle, icon, badge, children,
}: {
  title: string
  subtitle?: string
  icon?: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ background: 'var(--grey-100)', border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden', width: '100%', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.10)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-200)' }}>
        {icon && <Icon name={icon} size={14} style={{ color: '#888', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#222' }}>{title}</span>
            {badge && (
              <span style={{ fontSize: 10, background: 'var(--grey-300)', color: '#666', borderRadius: 99, padding: '1px 6px', fontWeight: 500 }}>{badge}</span>
            )}
          </div>
          {subtitle && <div style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── Shared action pill ───────────────────────────────────────────────────────

function ActionPill({ label, primary = false }: { label: string; primary?: boolean }) {
  return (
    <button style={{
      fontSize: 11.5, fontWeight: 500, padding: '5px 11px', borderRadius: 6, cursor: 'pointer',
      border: primary ? 'none' : '1px solid #e0e0e0',
      background: primary ? '#222' : '#fff',
      color: primary ? '#fff' : '#555',
      fontFamily: 'inherit',
    }}>
      {label}
    </button>
  )
}

// ─── Report Created Card ─────────────────────────────────────────────────────

function ReportCreatedCard({ title, onOpen }: { title: string; onOpen: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden',
      background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      maxWidth: 420,
    }}>
      {/* Left: action info */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111', lineHeight: 1.4 }}>
          Created new report
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onOpen}
            style={{
              padding: '5px 12px', borderRadius: 6,
              border: '1px solid var(--grey-300)',
              background: '#fff', color: '#222',
              fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Open page
          </button>
          <button style={{
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid var(--grey-200)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#aaa',
          }}>
            <Icon name="undo" size={14} />
          </button>
        </div>
      </div>

      {/* Right: doc preview thumbnail */}
      <div style={{
        width: 90, flexShrink: 0,
        background: 'var(--grey-50)',
        borderLeft: '1px solid var(--grey-200)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '12px 10px',
      }}>
        <Icon name="description" size={18} style={{ color: '#bbb' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          {[70, 100, 85, 60, 95].map((w, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2,
              background: 'var(--grey-300)',
              width: `${w}%`,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 9, color: '#bbb', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
          Report
        </div>
      </div>
    </div>
  )
}

// ─── Inline report panel content ─────────────────────────────────────────────

const REPORT_ROWS = [
  { name: 'Engineering',    hc: 312, salary: '$8.2M', bonus: '$410K', total: '$8.61M',  change: '+4.2%' },
  { name: 'Sales',          hc: 198, salary: '$5.1M', bonus: '$612K', total: '$5.71M',  change: '+1.8%' },
  { name: 'Operations',     hc: 247, salary: '$6.0M', bonus: '$300K', total: '$6.30M',  change: '+2.1%' },
  { name: 'Marketing',      hc: 134, salary: '$3.4M', bonus: '$204K', total: '$3.60M',  change: '-0.5%' },
  { name: 'HR',             hc: 89,  salary: '$2.1M', bonus: '$89K',  total: '$2.19M',  change: '+0.9%' },
  { name: 'Finance',        hc: 102, salary: '$2.9M', bonus: '$153K', total: '$3.05M',  change: '+3.3%' },
]

export function ReportPanelContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Page header */}
      <div style={{ padding: '28px 32px 16px', borderBottom: '1px solid var(--grey-200)' }}>
        <div style={{ fontSize: 11, color: '#bbb', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
          Q1 2026
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#111', marginBottom: 4 }}>
          Payroll Summary Report
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>
          Generated by Rippling AI · Apr 20, 2026
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 0, padding: '16px 32px', borderBottom: '1px solid var(--grey-200)' }}>
        {[
          { label: 'Total headcount', value: '1,082' },
          { label: 'Total payroll',   value: '$29.46M' },
          { label: 'Avg. per head',   value: '$27.2K' },
          { label: 'QoQ change',      value: '+2.4%' },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, padding: '10px 16px',
            borderLeft: i > 0 ? '1px solid var(--grey-200)' : 'none',
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ padding: '16px 32px', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--grey-200)' }}>
              {['Department', 'Headcount', 'Base Salary', 'Bonuses', 'Total Cost', 'QoQ'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPORT_ROWS.map((row, i) => (
              <tr key={row.name} style={{ borderBottom: '1px solid var(--grey-100)', background: i % 2 === 0 ? 'transparent' : 'var(--grey-50)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: '#222' }}>{row.name}</td>
                <td style={{ padding: '10px 12px', color: '#555' }}>{row.hc}</td>
                <td style={{ padding: '10px 12px', color: '#555' }}>{row.salary}</td>
                <td style={{ padding: '10px 12px', color: '#555' }}>{row.bonus}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: '#111' }}>{row.total}</td>
                <td style={{ padding: '10px 12px', color: row.change.startsWith('-') ? '#e05' : '#090', fontWeight: 500 }}>{row.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Initial messages ────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: 'assistant',
    type: 'text',
    text: "Hi! I'm your Rippling AI. Here are a few examples showing how content adapts as you resize the panel. Try dragging the left edge wider or going full-screen.",
  },
  {
    id: 2,
    role: 'user',
    type: 'text',
    text: 'Show me current leave requests',
  },
  {
    id: 3,
    role: 'assistant',
    type: 'text',
    text: "Here are the active leave requests for your team:",
  },
  {
    id: 4,
    role: 'assistant',
    type: 'table-sm',
  },
  {
    id: 5,
    role: 'user',
    type: 'text',
    text: 'Pull up the March payroll report',
  },
  {
    id: 6,
    role: 'assistant',
    type: 'text',
    text: "Here's the global payroll summary for March 2026. Expand the panel to see all 12 columns:",
  },
  {
    id: 7,
    role: 'assistant',
    type: 'table-lg',
  },
  {
    id: 8,
    role: 'user',
    type: 'text',
    text: 'Give me a team overview',
  },
  {
    id: 9,
    role: 'assistant',
    type: 'dashboard',
  },
  {
    id: 10,
    role: 'user',
    type: 'text',
    text: 'Show Sofia Rodriguez\'s candidate profile',
  },
  {
    id: 11,
    role: 'assistant',
    type: 'candidate',
  },
  {
    id: 12,
    role: 'user',
    type: 'text',
    text: "Pull up John's latest expense report",
  },
  {
    id: 13,
    role: 'assistant',
    type: 'expense',
  },
  {
    id: 14,
    role: 'user',
    type: 'text',
    text: 'Create a Q1 payroll summary report',
  },
  {
    id: 15,
    role: 'assistant',
    type: 'text',
    text: "I've compiled the Q1 payroll data across all departments and generated the report.",
  },
  {
    id: 16,
    role: 'assistant',
    type: 'report-created',
    title: 'Q1 Payroll Summary Report',
  },
]

const SUGGESTED = ['Show org chart', 'Run payroll', 'Open PTO policy', 'Generate offer letter']

const CHAT_HISTORY = [
  { id: 'current', title: 'Headcount Report Q1', preview: 'Q1 headcount by department…', date: 'Today', active: true },
  { id: 'h2', title: 'Payroll summary March', preview: 'Total payroll this month is $2.4M…', date: 'Yesterday', active: false },
  { id: 'h3', title: 'New hire onboarding', preview: 'I can help you set up onboarding…', date: 'Mar 18', active: false },
  { id: 'h4', title: 'PTO policy questions', preview: 'Your current PTO policy allows…', date: 'Mar 15', active: false },
  { id: 'h5', title: 'Benefits enrollment', preview: 'Open enrollment closes April 30…', date: 'Mar 12', active: false },
  { id: 'h6', title: 'Org chart review', preview: 'Here is your current org chart…', date: 'Mar 8', active: false },
]

// ─── Props ───────────────────────────────────────────────────────────────────

export type ChatOrientation = 'sidebar' | 'fullscreen' | 'floating'

interface ChatPanelProps {
  mode: Mode
  orientation?: ChatOrientation
  onOrientationChange?: (o: ChatOrientation) => void
  onClose?: () => void
  /** When set, chat starts with greeting only and auto-sends this as the first message */
  initialQuery?: string
  elevation?: 'base' | 'shadow'
  /** Override the chrome background (outer container, header, messages area, input area) */
  panelBg?: string
  /** Whether to pre-populate with example messages or start empty */
  chatFill?: 'filled' | 'empty'
  /** Called when user wants the report panel to take over the full screen entirely */
  onReportFullscreen?: () => void
}

// ─── Style helpers ───────────────────────────────────────────────────────────

function headerIconBtn(active: boolean): React.CSSProperties {
  return {
    width: 32, height: 32, borderRadius: 7,
    border: '1px solid ' + (active ? '#d0d0d0' : 'transparent'),
    background: active ? '#efefef' : 'transparent',
    color: active ? '#111' : '#aaa',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.12s, color 0.12s, border-color 0.12s',
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

const GREETING: Message = {
  id: 0,
  role: 'assistant',
  type: 'text',
  text: "Hi! I'm your Rippling AI. What can I help you with today?",
}

const ORIENTATION_OPTIONS: { label: string; value: ChatOrientation; icon: string }[] = [
  { label: 'Full screen', value: 'fullscreen', icon: 'open_in_full' },
  { label: 'Side bar',    value: 'sidebar',    icon: 'dock_to_right' },
  { label: 'Floating',   value: 'floating',   icon: 'picture_in_picture' },
]

export function ChatPanel({ mode, orientation = 'sidebar', onOrientationChange, onClose, initialQuery, elevation = 'base', panelBg = 'var(--grey-50)', chatFill = 'filled', onReportFullscreen }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialQuery) {
      return [
        GREETING,
        { id: 1, role: 'user', type: 'text', text: initialQuery },
      ]
    }
    return chatFill === 'empty' ? [GREETING] : INITIAL_MESSAGES
  })
  const [input, setInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showReportPanel, setShowReportPanel] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasSentInitial = useRef(false)
  const moreMenuRef    = useRef<HTMLDivElement>(null)
  const messagesRef    = useRef<HTMLDivElement>(null)
  const isMounted      = useRef(false)
  const cw = useContainerWidth(messagesRef)

  useEffect(() => { isMounted.current = true }, [])

  const isFullChat = mode === 'fullchat'
  const isCopilot = mode === 'copilot'
  const isCanvas = mode === 'canvas'

  // Re-seed messages whenever the chatFill prop changes (e.g. toggled in prototype options)
  useEffect(() => {
    if (initialQuery) return
    setMessages(chatFill === 'empty' ? [GREETING] : INITIAL_MESSAGES)
  }, [chatFill]) // eslint-disable-line

  // Show the hero + prompts only in empty fill mode before any user message
  const showEmptyHero = chatFill === 'empty' && messages.every((m) => m.role !== 'user')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close more menu on outside click
  useEffect(() => {
    if (!showMoreMenu) return
    function handler(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMoreMenu])

  // Add the AI response after a short delay so it feels like it's "thinking"
  useEffect(() => {
    if (!initialQuery || hasSentInitial.current) return
    hasSentInitial.current = true
    const t = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          type: 'text',
          text: "I'm looking into that for you. Give me a moment to pull the latest data from your Rippling workspace...",
        } satisfies TextMessage,
      ])
    }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function sendMessage(text: string) {
    if (!text.trim()) return
    const userMsg: Message = { id: Date.now(), role: 'user', type: 'text', text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        type: 'text',
        text: "I'm looking into that for you. Give me a moment to pull the latest data from your Rippling workspace...",
      }
      setMessages((prev) => [...prev, reply])
    }, 800)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative', zIndex: 30 }}>

      {/* ── LEFT: History sidebar (fullchat mode only) ── */}
      <AnimatePresence>
        {isFullChat && showHistory && (
          <motion.div
            key="history-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              flexShrink: 0, overflow: 'hidden',
              borderRight: '1px solid var(--grey-200)',
              background: 'var(--grey-50)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ padding: '0 12px', height: 44, borderBottom: '1px solid var(--grey-200)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1 }}>Chat history</span>
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} onClick={() => setShowHistory(false)} style={headerIconBtn(false)}>
                <Icon name="close" size={16} />
              </motion.button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
              {CHAT_HISTORY.map((chat, i) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setShowHistory(false)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6,
                    border: 'none', background: chat.active ? '#e8e8e8' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: chat.active ? 500 : 400, color: '#111' }}>{chat.title}</span>
                    <span style={{ fontSize: 10, color: '#bbb' }}>{chat.date}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.preview}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CENTER: Main chat column ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: panelBg,
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
      {/* Header */}
      <div
        style={{
          padding: '0 10px',
          height: 44,
          borderBottom: '1px solid #ebebeb',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          background: panelBg,
          borderRadius: 0,
          gap: 6,
        }}
      >
        {/* Copilot header: branded label left, actions right */}
        {isCopilot && (
          <>
            {/* History toggle — leftmost: hamburger = open list, chevron = go back */}
            <motion.button
              onClick={() => setShowHistory((v) => !v)}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              title={showHistory ? 'Back to chat' : 'Chat history'}
              style={headerIconBtn(showHistory)}
            >
              <Icon name={showHistory ? 'chevron_left' : 'menu'} size={18} />
            </motion.button>

            {/* AI identity */}
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/rippling-ai.png" width={10} height={10} style={{ display: 'block', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: '-0.1px' }}>Rippling AI</span>
              <span style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#bbb', display: 'inline-block' }} />
                Ready
              </span>
            </div>

            {/* New chat */}
            <motion.button
              onClick={() => { setMessages([GREETING]); setShowHistory(false) }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              title="New chat"
              style={headerIconBtn(false)}
            >
              <Icon name="add" size={18} />
            </motion.button>

            {/* More menu */}
            {onOrientationChange && (
              <div ref={moreMenuRef} style={{ position: 'relative' }}>
                <motion.button
                  onClick={() => setShowMoreMenu((v) => !v)}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                  title="More options"
                  style={headerIconBtn(showMoreMenu)}
                >
                  <Icon name="more_horiz" size={18} />
                </motion.button>

                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute', top: 36, right: 0,
                        background: '#fff',
                        border: '1px solid #e4e4e4',
                        borderRadius: 7,
                        boxShadow: '0 6px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                        zIndex: 200,
                        minWidth: 156,
                        overflow: 'hidden',
                        padding: '3px',
                      }}
                    >
                      {ORIENTATION_OPTIONS.map(({ label, value, icon }) => {
                        const active = orientation === value
                        return (
                          <button
                            key={value}
                            onClick={() => { onOrientationChange(value); setShowMoreMenu(false) }}
                            style={{
                              width: '100%', padding: '7px 10px',
                              border: 'none', borderRadius: 5,
                              background: active ? '#f0f0f0' : 'transparent',
                              color: active ? '#111' : '#333',
                              fontSize: 13, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 9,
                              fontWeight: active ? 500 : 400,
                              textAlign: 'left',
                            }}
                          >
                            <Icon name={icon} size={15} style={{ color: active ? '#333' : '#999' }} />
                            {label}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Close panel */}
            {onClose && (
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                title="Close"
                style={headerIconBtn(false)}
              >
                <Icon name="close" size={18} />
              </motion.button>
            )}
          </>
        )}

        {/* Full screen header — same controls as copilot */}
        {!isCopilot && (
          <>
            {/* Back from history */}
            <AnimatePresence>
              {showHistory && (
                <motion.button
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                  onClick={() => setShowHistory(false)}
                  style={headerIconBtn(false)}
                >
                  <Icon name="arrow_back" size={18} />
                </motion.button>
              )}
            </AnimatePresence>

            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/rippling-ai.png" width={10} height={10} style={{ display: 'block', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingLeft: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>
                {showHistory ? 'Chat history' : 'Rippling AI'}
              </span>
              {!showHistory && (
                <span style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#bbb', display: 'inline-block' }} />
                  Ready
                </span>
              )}
            </div>

            {/* History toggle */}
            {!showHistory && (
              <motion.button
                onClick={() => setShowHistory(true)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                title="Chat history"
                style={headerIconBtn(false)}
              >
                <Icon name="history" size={18} />
              </motion.button>
            )}

            {/* New chat */}
            <motion.button
              onClick={() => { setMessages([GREETING]); setShowHistory(false) }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              title="New chat"
              style={headerIconBtn(false)}
            >
              <Icon name="add" size={18} />
            </motion.button>

            {/* More menu — orientation switcher */}
            {onOrientationChange && (
              <div ref={moreMenuRef} style={{ position: 'relative' }}>
                <motion.button
                  onClick={() => setShowMoreMenu((v) => !v)}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                  title="More options"
                  style={headerIconBtn(showMoreMenu)}
                >
                  <Icon name="more_horiz" size={18} />
                </motion.button>

                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute', top: 36, right: 0,
                        background: '#fff',
                        border: '1px solid #e4e4e4',
                        borderRadius: 7,
                        boxShadow: '0 6px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                        zIndex: 200,
                        minWidth: 156,
                        overflow: 'hidden',
                        padding: '3px',
                      }}
                    >
                      {ORIENTATION_OPTIONS.map(({ label, value, icon }) => {
                        const active = orientation === value
                        return (
                          <button
                            key={value}
                            onClick={() => { onOrientationChange(value); setShowMoreMenu(false) }}
                            style={{
                              width: '100%', padding: '7px 10px',
                              border: 'none', borderRadius: 5,
                              background: active ? '#f0f0f0' : 'transparent',
                              color: active ? '#111' : '#333',
                              fontSize: 13, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 9,
                              fontWeight: active ? 500 : 400,
                              textAlign: 'left',
                            }}
                          >
                            <Icon name={icon} size={15} style={{ color: active ? '#333' : '#999' }} />
                            {label}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat history overlay — copilot (sidebar) mode only; fullchat uses left sidebar */}
      <AnimatePresence>
        {isCopilot && showHistory && (
          <motion.div
            key="history"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            style={{
              position: 'absolute',
              top: 44, // below header
              left: 0, right: 0, bottom: 0,
              background: panelBg,
              zIndex: 40,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {CHAT_HISTORY.map((chat, i) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setShowHistory(false)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 5,
                    border: 'none',
                    background: chat.active ? '#f0f0f0' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!chat.active) (e.currentTarget as HTMLElement).style.background = '#f7f7f7'
                  }}
                  onMouseLeave={(e) => {
                    if (!chat.active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: chat.active ? 500 : 400, color: '#111' }}>
                      {chat.title}
                    </span>
                    <span style={{ fontSize: 10, color: '#bbb' }}>{chat.date}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.preview}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={messagesRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isFullChat ? '40px 20%' : '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          transition: 'padding 0.3s',
          background: panelBg,
        }}
      >
        {/* ── Empty state hero ── */}
        <AnimatePresence>
          {showEmptyHero && (
            <motion.div
              key="empty-hero"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                padding: '0 8px 32px',
                minHeight: 0,
              }}
            >
              {/* Logo + title */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <img src="/rippling-ai.png" width={36} height={36} style={{ opacity: 0.85 }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: '#111', letterSpacing: '-0.2px' }}>
                  Rippling AI
                </span>
                <span style={{ fontSize: 12.5, color: '#aaa', textAlign: 'center', lineHeight: 1.5 }}>
                  Ask me anything about your work
                </span>
              </div>

              {/* Sample prompts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280 }}>
                {[
                  'How do I update my W2',
                  'What will it cost me to visit the doctor',
                  'When does my PTO reset',
                  'Show me my recent pay stubs',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--grey-200)',
                      background: '#ffffff',
                      color: '#333',
                      fontSize: 12.5,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      lineHeight: 1.4,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      transition: 'background 0.1s, border-color 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--grey-50)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--grey-300)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#ffffff'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--grey-200)'
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.filter((msg) => !(showEmptyHero && msg.id === 0)).map((msg) => {
          // ── Report-created action card ──
          if (msg.type === 'report-created') {
            return (
              <motion.div
                key={msg.id}
                initial={isMounted.current ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <ReportCreatedCard
                  title={(msg as ReportCreatedMessage).title}
                  onOpen={() => {
                    if (isFullChat) setShowReportPanel(true)
                  }}
                />
              </motion.div>
            )
          }

          // ── Artifact messages ──
          const isArtifact = msg.type === 'table-sm' || msg.type === 'table-lg' || msg.type === 'dashboard' || msg.type === 'candidate' || msg.type === 'expense' || msg.type === 'chart'
          if (isArtifact) {
            return (
              <motion.div
                key={msg.id}
                initial={isMounted.current ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <div style={{ maxWidth: isFullChat ? 680 : '100%' }}>
                  {msg.type === 'chart'     && <ChartCard title={(msg as ChartMessage).title} data={(msg as ChartMessage).data} />}
                  {msg.type === 'table-sm'  && <TableSmallArtifact cw={cw} />}
                  {msg.type === 'table-lg'  && <TableLargeArtifact cw={cw} />}
                  {msg.type === 'dashboard' && <DashboardArtifact  cw={cw} />}
                  {msg.type === 'candidate' && <CandidateProfileArtifact cw={cw} />}
                  {msg.type === 'expense'   && <ExpenseArtifact    cw={cw} />}
                </div>
              </motion.div>
            )
          }

          // ── Text messages ──
          return (
            <motion.div
              key={msg.id}
              initial={isMounted.current ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: isFullChat ? 580 : '88%',
                  padding: msg.role === 'user' ? '9px 14px' : '0',
                  borderRadius: msg.role === 'user' ? 20 : 0,
                  background: msg.role === 'user' ? '#f0f0f0' : 'transparent',
                  color: '#111',
                  fontSize: 14,
                  lineHeight: '20px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {(msg as TextMessage).text}
              </div>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — full chat only */}
      {isFullChat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '0 20% 12px',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            background: panelBg,
          }}
        >
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid #e4e4e4',
                background: '#fafafa',
                color: '#555',
                fontSize: 12.5,
                cursor: 'pointer',
                fontWeight: 400,
                fontFamily: 'inherit',
              }}
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input */}
      <div
        style={{
          padding: isFullChat ? '8px 20% 16px' : '10px 14px',
          borderTop: isFullChat ? 'none' : '1px solid #e8e8e8',
          background: panelBg,
          flexShrink: 0,
          transition: 'padding 0.3s',
        }}
      >
        {isFullChat ? (
          /* ── Full-screen elevated input card ── */
          <div style={{
            background: '#fafafa',
            borderRadius: 18,
            border: '1px solid #e0e0e0',
            boxShadow: '0 6px 32px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05)',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder="Ask anything"
              rows={3}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 15,
                color: '#111',
                padding: '18px 18px 4px',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                boxSizing: 'border-box',
                display: 'block',
              }}
            />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 12px 12px',
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button style={{
                  width: 28, height: 28, borderRadius: 7,
                  border: '1px solid #e0e0e0', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#555', fontSize: 17, lineHeight: 1,
                }}>+</button>
                <button style={{
                  height: 28, padding: '0 10px', borderRadius: 7,
                  border: '1px solid #e0e0e0', background: '#fff',
                  cursor: 'pointer', color: '#555', fontSize: 12, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
                }}>
                  Pro
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
              <motion.button
                onClick={() => sendMessage(input)}
                whileHover={input.trim() ? { scale: 1.05 } : {}}
                whileTap={input.trim() ? { scale: 0.95 } : {}}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: 'none',
                  background: input.trim() ? '#111' : '#e8e8e8',
                  color: input.trim() ? '#fff' : '#aaa',
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <Icon name="send" size={14} />
              </motion.button>
            </div>
          </div>
        ) : (
          /* ── Compact sidebar / copilot input ── */
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fafafa', borderRadius: 16,
            padding: '11px 12px 11px 16px', border: '1px solid #e0e0e0',
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Message AI..."
              style={{
                flex: 1, background: 'transparent', border: 'none',
                outline: 'none', fontSize: 14, color: '#111',
              }}
            />
            <motion.button
              onClick={() => sendMessage(input)}
              whileHover={input.trim() ? { scale: 1.05 } : {}}
              whileTap={input.trim() ? { scale: 0.95 } : {}}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: input.trim() ? '#111' : '#e8e8e8',
                color: input.trim() ? '#fff' : '#aaa',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <Icon name="send" size={13} />
            </motion.button>
          </div>
        )}

        {/* Footer note */}
        <p style={{
          margin: isFullChat ? '8px 0 0' : '6px 2px 0',
          fontSize: 11,
          color: 'rgba(0,0,0,0.35)',
          lineHeight: '14px',
          textAlign: 'center',
        }}>
          Rippling AI results may be inaccurate. Review before acting.
        </p>
      </div>
      </div>{/* end center column */}

      {/* ── RIGHT: Report panel (fullchat mode only) ── */}
      <AnimatePresence>
        {isFullChat && showReportPanel && (
          <motion.div
            key="report-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '50%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              flexShrink: 0, overflow: 'hidden',
              borderLeft: '1px solid var(--grey-200)',
              background: '#fff',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Report panel header */}
            <div style={{
              height: 44, flexShrink: 0,
              borderBottom: '1px solid var(--grey-200)',
              display: 'flex', alignItems: 'center',
              padding: '0 12px', gap: 4,
            }}>
              {/* Collapse */}
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                onClick={() => setShowReportPanel(false)}
                title="Collapse panel"
                style={headerIconBtn(false)}
              >
                <Icon name="chevron_right" size={18} />
              </motion.button>

              {/* Open in full screen */}
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                onClick={() => onReportFullscreen?.()}
                title="Open in full screen"
                style={headerIconBtn(false)}
              >
                <Icon name="open_in_full" size={16} />
              </motion.button>

              <div style={{ flex: 1, paddingLeft: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>Q1 Payroll Report</span>
              </div>

              <span style={{ fontSize: 11, color: '#bbb', background: 'var(--grey-100)', borderRadius: 4, padding: '2px 7px', fontWeight: 500 }}>
                Generated
              </span>
            </div>

            {/* Report content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ReportPanelContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
