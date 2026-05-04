import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'motion/react'
import { Icon } from './Icon'
import type { ChatDockPolicy } from '../prototypeDefaults'
import { AIComposerInput } from './AIComposerInput'
import { useContainerWidth } from '../hooks/useContainerWidth'
import type { Mode } from './ModeBar'
import {
  ChartArtifactByPreset,
  CHART_ARTIFACT_PRESETS,
  chartPresetTitle,
  filterChartPresets,
  inferChartPresetIdsFromMessage,
  type ChartArtifactPresetId,
} from './chat-artifacts/chartArtifacts'
import { inferWorkflowIntent, WorkflowPreviewArtifact } from './chat-artifacts/workflowArtifacts'
import { inferScheduleIntent, SchedulePreviewArtifact } from './chat-artifacts/scheduleArtifacts'
import { WorkflowCanvasView, WORKFLOW_CANVAS_DISPLAY_NAME } from './WorkflowCanvasView'
import { ScheduleCanvasView, SCHEDULE_CANVAS_DISPLAY_NAME } from './ScheduleCanvasView'
import { ReportBuilderEditMode, REPORT_BUILDER_DISPLAY_NAME, REPORT_BUILDER_HEADER_HEIGHT_PX } from './ReportBuilderEditMode'
import { RipplingAiPebbleIcon } from './icons/RipplingAiPebbleIcon'

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
  presetId: ChartArtifactPresetId
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

interface WorkflowPreviewMessage {
  id: number
  role: 'assistant'
  type: 'workflow-preview'
}

interface SchedulePreviewMessage {
  id: number
  role: 'assistant'
  type: 'schedule-preview'
}

/** Clickable Figma / resource link row — matches AI-components link attachment pattern (e.g. Figma node 427:103803). */
interface FigmaLinkCardMessage {
  id: number
  role: 'assistant'
  type: 'figma-link-card'
  url: string
  title: string
  subtitle: string
}

type Message =
  | TextMessage
  | ChartMessage
  | ArtifactMessage
  | ReportCreatedMessage
  | WorkflowPreviewMessage
  | SchedulePreviewMessage
  | FigmaLinkCardMessage

const STUB_ASSISTANT_THINKING =
  "I'm looking into that for you. Give me a moment to pull the latest data from your Rippling workspace..."

/** Prototype reply when the user asks for the AI-components / Figma design link. */
const FIGMA_AI_COMPONENTS_URL =
  'https://www.figma.com/design/Dvcv5Yj50PM2WuJhPj1qUH/AI-components?node-id=427-103803&t=fPVemq2P5aA9CFgw-1'

function inferAiComponentsFigmaLinkIntent(userText: string): boolean {
  const raw = userText.trim()
  const t = raw.toLowerCase()
  if (!t) return false
  const asksLink =
    /\b(links?|url|href)\b/.test(t) || /^\s*link\s*[?.!]*\s*$/i.test(raw)
  if (!asksLink) return false
  if (/\bfigma\b/.test(t)) return true
  if (/ai[\s-]?components?/.test(t)) return true
  if (/(show|give|send|share|get).{0,60}\b(links?|url)\b/.test(t)) return true
  if (/^(please\s+)?(the\s+)?(links?|url)\s*[?.!]*$/i.test(raw)) return true
  return false
}

/**
 * Assistant follow-up after user text: chart intro + artifacts when `@chart:` or NLP
 * matches a preset; otherwise the generic “pulling data” stub. Used by `sendMessage`
 * and by the `initialQuery` bootstrap (which previously always sent the stub).
 */
function assistantMessagesAfterUserText(userText: string, idBase: number): Message[] {
  if (inferAiComponentsFigmaLinkIntent(userText)) {
    return [
      {
        id: idBase,
        role: 'assistant',
        type: 'text',
        text: "Here's the AI components file in Figma:",
      } satisfies TextMessage,
      {
        id: idBase + 1,
        role: 'assistant',
        type: 'figma-link-card',
        url: FIGMA_AI_COMPONENTS_URL,
        title: 'AI components',
        subtitle: 'Figma · Design file',
      } satisfies FigmaLinkCardMessage,
    ]
  }
  if (inferScheduleIntent(userText)) {
    const intro: TextMessage = {
      id: idBase,
      role: 'assistant',
      type: 'text',
      text: "Here's your schedule draft. Click the card to open the WIW canvas beside chat.",
    }
    const preview: SchedulePreviewMessage = {
      id: idBase + 1,
      role: 'assistant',
      type: 'schedule-preview',
    }
    return [intro, preview]
  }
  if (inferWorkflowIntent(userText)) {
    const intro: TextMessage = {
      id: idBase,
      role: 'assistant',
      type: 'text',
      text: "Here's a workflow preview. Click the card to open the canvas beside chat in full screen.",
    }
    const preview: WorkflowPreviewMessage = {
      id: idBase + 1,
      role: 'assistant',
      type: 'workflow-preview',
    }
    return [intro, preview]
  }

  const tokenRe = /@chart:([\w-]+)/g
  const fromToken: ChartArtifactPresetId[] = []
  let m: RegExpExecArray | null
  const validIds = new Set(CHART_ARTIFACT_PRESETS.map((p) => p.id))
  while ((m = tokenRe.exec(userText)) !== null) {
    if (validIds.has(m[1] as ChartArtifactPresetId)) fromToken.push(m[1] as ChartArtifactPresetId)
  }
  const fromNlp = inferChartPresetIdsFromMessage(userText)
  const seen = new Set<ChartArtifactPresetId>()
  const ids: ChartArtifactPresetId[] = []
  for (const id of [...fromToken, ...fromNlp]) {
    if (seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    if (ids.length >= 5) break
  }
  if (ids.length === 0) {
    return [{ id: idBase, role: 'assistant', type: 'text', text: STUB_ASSISTANT_THINKING } satisfies TextMessage]
  }
  const nlpOnly = fromToken.length === 0 && fromNlp.length > 0
  const intro: TextMessage = {
    id: idBase,
    role: 'assistant',
    type: 'text',
    text: nlpOnly
      ? ids.length === 1
        ? "Here's an example of that chart type (Rippling AI components style)."
        : "Here are examples of those chart types (Rippling AI components style)."
      : ids.length === 1
        ? "Here's the chart from your workspace."
        : `Here are the ${ids.length} charts you asked for.`,
  }
  const charts: ChartMessage[] = ids.map((presetId, i) => ({
    id: idBase + 1 + i,
    role: 'assistant',
    type: 'chart',
    presetId,
  }))
  return [intro, ...charts]
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
                <th key={h} style={{ padding: wide ? '7px 12px' : '6px 8px', textAlign: 'left', fontWeight: 400, fontFamily: 'var(--font-heading)', color: '#555', borderBottom: '1px solid var(--grey-200)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEAVE_ROWS.map((r, i) => (
              <tr key={r.name} style={{ background: '#ffffff', borderBottom: i < LEAVE_ROWS.length - 1 ? '1px solid var(--grey-200)' : 'none' }}>
                <td style={{ padding: wide ? '8px 12px' : '6px 8px', fontWeight: 400, color: '#111', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: wide ? 24 : 20, height: wide ? 24 : 20, borderRadius: '50%', background: 'var(--grey-200)', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 400, flexShrink: 0 }}>
                      {r.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontSize: wide ? 13 : 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: wide ? 120 : 80 }}>{r.name}</span>
                  </div>
                </td>
                <td style={{ padding: wide ? '8px 12px' : '6px 8px', color: '#555' }}>{r.type}</td>
                <td style={{ padding: wide ? '8px 12px' : '6px 8px', color: '#555', textAlign: 'center' }}>{r.days}d</td>
                {wide && <td style={{ padding: '8px 12px' }}>
                  <span style={{ background: STATUS_COLOR[r.status], color: STATUS_TEXT[r.status], fontSize: 11, fontWeight: 400, borderRadius: 99, padding: '2px 8px' }}>{r.status}</span>
                </td>}
                {!wide && <td style={{ padding: '6px 8px' }}>
                  <span style={{ background: STATUS_COLOR[r.status], color: STATUS_TEXT[r.status], fontSize: 10, fontWeight: 400, borderRadius: 99, padding: '2px 6px' }}>{r.status}</span>
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
                <th key={h} style={{ padding: wide ? '6px 10px' : '5px 8px', textAlign: 'left', fontWeight: 400, fontFamily: 'var(--font-heading)', color: '#555', borderBottom: '1px solid var(--grey-200)', whiteSpace: 'nowrap', fontSize: wide ? 11 : 10 }}>{h}</th>
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
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                      fontSize: wide ? 12 : 11,
                    }}
                  >
                    {j === 6 && typeof cell === 'string' ? (
                      <span style={{ background: cell === 'Processed' ? '#d4edda' : 'var(--grey-200)', color: cell === 'Processed' ? '#2d6a4f' : '#888', fontSize: 10, borderRadius: 99, padding: '2px 7px', fontWeight: 400 }}>{cell}</span>
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
              <div style={{ fontSize: 10, fontWeight: 400, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: wide ? 22 : 18, fontWeight: 400, color: '#111', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: s.bad ? '#c0392b' : '#27ae60', marginTop: 3, fontWeight: 400 }}>{s.delta} this quarter</div>
            </div>
          ))}
        </div>
        {cw > 320 && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 400, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>By Department</div>
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
          fontSize: 13, fontWeight: 400, color: '#555',
        }}>SR</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-heading)', color: '#111' }}>Sofia Rodriguez</div>
          <div style={{ fontSize: 11.5, color: '#888', marginTop: 1 }}>Senior Designer · San Francisco, CA</div>
        </div>
        <span style={{ fontSize: 10.5, color: '#bbb', flexShrink: 0 }}>Applied Apr 8</span>
      </div>

      {/* Work info — grey-100 */}
      <div style={{ background: 'var(--grey-100)', borderTop: '1px solid var(--grey-200)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Match score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 400, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Match Score</div>
            <div style={{ height: 6, background: 'var(--grey-300)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '87%' }} transition={{ duration: 0.9, ease: 'easeOut' }} style={{ height: '100%', background: '#333', borderRadius: 3 }} />
            </div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 400, color: '#111', flexShrink: 0 }}>87%</span>
        </div>

        {/* Skills */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 400, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {SKILLS.map((s) => (
              <span key={s} style={{ fontSize: 11, background: '#ffffff', border: '1px solid var(--grey-200)', color: '#555', borderRadius: 5, padding: '3px 8px', fontWeight: 400 }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 400, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Experience</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(wide ? EXPERIENCE : EXPERIENCE.slice(0, 2)).map((e) => (
              <div key={e.company} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#222' }}>{e.role}</span>
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
            <div style={{ fontSize: 10, color: '#bbb', fontWeight: 400 }}>Total</div>
            <div style={{ fontSize: wide ? 17 : 15, fontWeight: 400, color: '#333' }}>{total}</div>
            <div style={{ fontSize: 10, color: '#ccc', marginTop: 1 }}>USD · Mar 28</div>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {EXPENSE_ITEMS.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < EXPENSE_ITEMS.length - 1 ? '1px solid var(--grey-200)' : 'none', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 400, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                <span style={{ fontSize: 10, background: 'var(--grey-200)', color: '#777', borderRadius: 4, padding: '1px 6px', fontWeight: 400 }}>{item.category}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 400, color: '#333', flexShrink: 0 }}>{item.amt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total + actions — white */}
      <div style={{ background: '#ffffff', borderTop: '1px solid var(--grey-200)', padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#555' }}>Total</span>
          <span style={{ fontSize: 14, fontWeight: 400, color: '#111' }}>{total}</span>
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
    <div style={{ border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden', width: '100%', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.10)' }}>
      {/* Header — grey-100 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-100)' }}>
        {icon && <Icon name={icon} size={14} style={{ color: '#888', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-heading)', color: '#222' }}>{title}</span>
            {badge && (
              <span style={{ fontSize: 10, background: 'var(--grey-300)', color: '#666', borderRadius: 99, padding: '1px 6px', fontWeight: 400 }}>{badge}</span>
            )}
          </div>
          {subtitle && <div style={{ fontSize: 10.5, fontWeight: 400, color: '#aaa', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {/* Content — grey-50 */}
      <div style={{ background: 'var(--grey-50)' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Shared action pill ───────────────────────────────────────────────────────

function ActionPill({ label, primary = false }: { label: string; primary?: boolean }) {
  return (
    <button style={{
      fontSize: 11.5, fontWeight: 400, padding: '5px 11px', borderRadius: 6, cursor: 'pointer',
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

/** Rich link preview for Figma URLs — primary action can open app shell schedule split; optional row opens Figma. */
function FigmaLinkAttachmentCard({
  url,
  title,
  subtitle,
  aiCompDocked,
  onOpenShellSplit,
}: {
  url: string
  title: string
  subtitle: string
  aiCompDocked: boolean
  onOpenShellSplit?: () => void
}) {
  const ink = aiCompDocked ? AI_COMP_DOCKED.ink : '#111'
  const muted = aiCompDocked ? AI_COMP_DOCKED.muted : '#737373'
  const border = aiCompDocked ? '#e8e6e3' : 'var(--grey-200)'
  const borderHover = aiCompDocked ? '#d4d0cc' : 'var(--grey-300)'
  const cardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    maxWidth: 400,
    width: '100%',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    cursor: onOpenShellSplit ? 'pointer' : undefined,
    fontFamily: 'inherit',
    textAlign: 'left',
    boxSizing: 'border-box',
  }
  const rowInner = (trailingIcon: 'chevron_right' | 'open_in_new') => (
    <>
      <div
        aria-hidden
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #f24e1e 0%, #ff7262 38%, #a259ff 72%, #1abcfe 100%)',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            color: ink,
            lineHeight: 1.35,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, fontWeight: 400, color: muted, marginTop: 2, lineHeight: 1.35 }}>{subtitle}</div>
      </div>
      <Icon
        name={trailingIcon}
        size={trailingIcon === 'chevron_right' ? 20 : 18}
        style={{ color: muted, flexShrink: 0 }}
        aria-hidden
      />
    </>
  )
  const hoverCard = (el: HTMLElement, enter: boolean) => {
    el.style.boxShadow = enter ? '0 4px 14px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.06)'
    el.style.borderColor = enter ? borderHover : border
  }

  if (onOpenShellSplit) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, width: '100%' }}>
        <button
          type="button"
          onClick={onOpenShellSplit}
          title="Open schedule beside chat"
          style={{ ...cardStyle, margin: 0 }}
          onMouseEnter={(e) => hoverCard(e.currentTarget, true)}
          onMouseLeave={(e) => hoverCard(e.currentTarget, false)}
        >
          {rowInner('chevron_right')}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: muted,
            alignSelf: 'flex-start',
          }}
        >
          Open in Figma
        </a>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={cardStyle}
      onMouseEnter={(e) => hoverCard(e.currentTarget, true)}
      onMouseLeave={(e) => hoverCard(e.currentTarget, false)}
    >
      {rowInner('open_in_new')}
    </a>
  )
}

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
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-heading)', color: '#111', lineHeight: 1.4 }}>
          Created new report
        </div>
        <div style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onOpen}
            style={{
              padding: '5px 12px', borderRadius: 6,
              border: '1px solid var(--grey-300)',
              background: '#fff', color: '#222',
              fontSize: 12.5, fontWeight: 400,
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
        <div style={{ fontSize: 9, color: '#bbb', fontWeight: 400, textAlign: 'center', lineHeight: 1.3 }}>
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
        <div style={{ fontSize: 11, color: '#bbb', fontWeight: 400, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
          Q1 2026
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-heading)', color: '#111', marginBottom: 4 }}>
          Payroll Summary Report
        </div>
        <div style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>
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
            <div style={{ fontSize: 18, fontWeight: 400, fontFamily: 'var(--font-heading)', color: '#111' }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 400, color: '#aaa', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ padding: '16px 32px', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--grey-200)' }}>
              {['Department', 'Headcount', 'Base Salary', 'Bonuses', 'Total Cost', 'QoQ'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 400, fontFamily: 'var(--font-heading)', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPORT_ROWS.map((row, i) => (
              <tr key={row.name} style={{ borderBottom: '1px solid var(--grey-100)', background: i % 2 === 0 ? 'transparent' : 'var(--grey-50)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 400, color: '#222' }}>{row.name}</td>
                <td style={{ padding: '10px 12px', fontWeight: 400, color: '#555' }}>{row.hc}</td>
                <td style={{ padding: '10px 12px', fontWeight: 400, color: '#555' }}>{row.salary}</td>
                <td style={{ padding: '10px 12px', fontWeight: 400, color: '#555' }}>{row.bonus}</td>
                <td style={{ padding: '10px 12px', fontWeight: 400, color: '#111' }}>{row.total}</td>
                <td style={{ padding: '10px 12px', color: row.change.startsWith('-') ? '#e05' : '#090', fontWeight: 400 }}>{row.change}</td>
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
    text: 'How has headcount changed over the last year?',
  },
  {
    id: 15,
    role: 'assistant',
    type: 'text',
    text: 'Here is headcount across the trailing twelve months (sample artifact from your workspace):',
  },
  {
    id: 16,
    role: 'assistant',
    type: 'chart',
    presetId: 'headcount-trend',
  },
  {
    id: 17,
    role: 'user',
    type: 'text',
    text: 'Create a Q1 payroll summary report',
  },
  {
    id: 18,
    role: 'assistant',
    type: 'text',
    text: "I've compiled the Q1 payroll data across all departments and generated the report.",
  },
  {
    id: 19,
    role: 'assistant',
    type: 'report-created',
    title: 'Q1 Payroll Summary Report',
  },
]

const SUGGESTED = [
  'Show org chart',
  'Run payroll',
  'Show me a workflow',
  'Create a schedule for my team',
  'Open PTO policy',
  'Generate offer letter',
]

const CHAT_HISTORY = [
  { id: 'current', title: 'Headcount Report Q1', preview: 'Q1 headcount by department…', date: 'Today', active: true },
  { id: 'h2', title: 'Payroll summary March', preview: 'Total payroll this month is $2.4M…', date: 'Yesterday', active: false },
  { id: 'h3', title: 'New hire onboarding', preview: 'I can help you set up onboarding…', date: 'Mar 18', active: false },
  { id: 'h4', title: 'PTO policy questions', preview: 'Your current PTO policy allows…', date: 'Mar 15', active: false },
  { id: 'h5', title: 'Benefits enrollment', preview: 'Open enrollment closes April 30…', date: 'Mar 12', active: false },
  { id: 'h6', title: 'Org chart review', preview: 'Here is your current org chart…', date: 'Mar 8', active: false },
]

/** Default thread title shown in copilot chrome — reuse on dashboard surfaces so labels stay aligned. */
export const CHAT_PANEL_DEFAULT_TITLE =
  CHAT_HISTORY.find((c) => c.id === 'current')?.title ?? 'Chat'

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
  /** Chart artifact click — open report builder (edit) full screen. */
  onOpenReportInEditMode?: () => void
  /** Report-created card "Open" — navigate to main app canvas instead of the inline payroll report. */
  onOpenReportCreatedPage?: () => void
  /** Canvas page empty chat: dashboard hero + “Open in edit mode”. */
  canvasDashboardHero?: boolean
  onOpenDashboardEditMode?: () => void
  /** Canvas dashboard edit mode: alternate hero + prompts while editing. */
  canvasDashboardEditHero?: boolean
  /** Workflow/report split beside chat — parent shell widens docked chat so chat + canvas fit. */
  onSplitCanvasOpenChange?: (open: boolean) => void
  /** Dashboard canvas edit + left-docked chat: double chevron hides the chat column without closing chat. */
  onCollapseDashboardSideChat?: () => void
  /** App shell: WIW schedule beside docked chat (same chrome behavior as dashboard edit). */
  scheduleCanvasShellSplit?: boolean
  /** Figma AI-components link card — opens canvas + schedule side-by-side in the shell. */
  onOpenScheduleShellSplit?: () => void
  /** Shell nav — increment nonce + set kind to open fullscreen chat + report/workflow rail. */
  navSplitBootstrapNonce?: number
  navSplitBootstrapKind?: 'reports' | 'workflows' | null
  /**
   * Full-screen / docked split beside report, workflow, or schedule:
   * `always_right` keeps Rippling AI on the **right** (content on the left).
   * `right_and_left` keeps the legacy layout (chat on the **left**, content on the right).
   */
  chatDockPolicy?: ChatDockPolicy
  /** When set with `onSplitChatColumnHiddenChange`, syncs hide/show of the chat column beside report/workflow/schedule (ModeBar AI toggle). */
  splitChatColumnHidden?: boolean
  onSplitChatColumnHiddenChange?: (hidden: boolean) => void
}

// ─── Chat / report split (full-screen chat + docked sidebar chat) ──────────

const SPLIT_GRIP_PX = 10
/** Chat column minimum when beside workflow or report (side-by-side). */
const SIDE_BY_SIDE_CHAT_MIN_PX = 320
/** Default width when opening side-by-side (user can resize down to {@link SIDE_BY_SIDE_CHAT_MIN_PX}). */
const SIDE_BY_SIDE_CHAT_DEFAULT_PX = 474
/** Minimum width of the report / workflow / schedule rail when resizing (pairs with chat min). */
const SIDE_BY_SIDE_CANVAS_MIN_PX = 320
/**
 * `always_right`: rail starts this far **right** (from its settled position) so the canvas clearly sweeps
 * left and takes over the stage — reads as continuation from Rippling AI on the right.
 */
const ALWAYS_RIGHT_RAIL_ENTER_OFFSET_PX = 420
/** Default initial chat width beside workflow / report (export for shell docs). */
export const WORKFLOW_CHAT_PANEL_WIDTH_PX = SIDE_BY_SIDE_CHAT_DEFAULT_PX
const HISTORY_SIDEBAR_W = 260
/** Extra chrome row spanning chat + report when split — close top-right; reconciles duplicate rail actions. */
export const SPLIT_UNIFIED_HEADER_HEIGHT_PX = 44
/** Matches shell split breadcrumbs for canvas dashboard edit beside chat. */
const CANVAS_DASHBOARD_EDIT_CONTEXT = 'People analytics'

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

/** Side-by-side chrome — no focus ring on header icon buttons (full dismiss / hide chat). */
function headerIconBtnSideBySide(active: boolean): React.CSSProperties {
  return {
    ...headerIconBtn(active),
    outline: 'none',
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

/** AI-components docked chat — Figma `Default chart` (267:16230, file AI-components). */
const AI_COMP_DOCKED = {
  surface: '#ffffff',
  divider: '#e0dede',
  ink: '#000000',
  muted: '#716f6c',
  userBubble: '#f2eeeb',
} as const

/** Prompt tiles in empty hero — matches AI-components empty chat density & stroke (file AI-components). */
function emptyHeroPromptStyle(aiCompDocked: boolean): React.CSSProperties {
  return {
    width: '100%',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: 10,
    border: `1px solid ${aiCompDocked ? AI_COMP_DOCKED.divider : 'var(--grey-200)'}`,
    background: '#ffffff',
    color: aiCompDocked ? AI_COMP_DOCKED.ink : '#1a1a1a',
    fontSize: 13,
    fontWeight: 400,
    cursor: 'pointer',
    fontFamily: 'inherit',
    lineHeight: 1.45,
    letterSpacing: '-0.1px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
  }
}

function emptyHeroPromptHoverEnter(aiCompDocked: boolean, el: HTMLElement) {
  el.style.background = aiCompDocked ? '#faf9f8' : 'var(--grey-50)'
  el.style.borderColor = aiCompDocked ? '#d4d0cc' : 'var(--grey-300)'
  el.style.boxShadow = 'var(--shadow-md)'
}

function emptyHeroPromptHoverLeave(aiCompDocked: boolean, el: HTMLElement) {
  el.style.background = '#ffffff'
  el.style.borderColor = aiCompDocked ? AI_COMP_DOCKED.divider : 'var(--grey-200)'
  el.style.boxShadow = 'var(--shadow-sm)'
}

function formatChatMessageText(
  text: string,
  opts: { isUser: boolean; aiCompDocked: boolean },
): React.ReactNode {
  const linkColor = opts.isUser
    ? opts.aiCompDocked
      ? AI_COMP_DOCKED.ink
      : '#0b57d0'
    : 'var(--brand)'
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/g)
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: linkColor,
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
        >
          {part}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

const GREETING: Message = {
  id: 0,
  role: 'assistant',
  type: 'text',
  text: "Hi! I'm your Rippling AI. What can I help you with today?",
}

/** Unified split chrome — breadcrumbs next to close (workflow/report beside chat). */
function UnifiedSplitBreadcrumbs({
  segments,
  aiCompDocked,
}: {
  segments: readonly string[]
  aiCompDocked: boolean
}) {
  const muted = aiCompDocked ? AI_COMP_DOCKED.muted : '#737373'
  const ink = aiCompDocked ? AI_COMP_DOCKED.ink : '#111'
  const sepColor = aiCompDocked ? '#d4d0cc' : '#c4c4c4'
  return (
    <nav
      aria-label="Location"
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        rowGap: 2,
        columnGap: 0,
        fontSize: 13,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '-0.1px',
        lineHeight: 1.35,
      }}
    >
      {segments.map((label, i) => {
        const isLast = i === segments.length - 1
        return (
          <React.Fragment key={`${i}-${label}`}>
            {i > 0 && (
              <span style={{ color: sepColor, userSelect: 'none', padding: '0 5px', flexShrink: 0 }} aria-hidden>
                ›
              </span>
            )}
            <span
              style={{
                color: isLast ? ink : muted,
                fontWeight: isLast ? 500 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                ...(isLast ? { flexShrink: 1 } : { flexShrink: 0 }),
              }}
            >
              {label}
            </span>
          </React.Fragment>
        )
      })}
    </nav>
  )
}

/** Full-width shell row spanning docked chat + main canvas (dashboard edit side-by-side). Matches unified split chrome in {@link ChatPanel}. */
export function ShellSplitUnifiedHeader({
  segments,
  onClose,
  panelBg = 'var(--grey-50)',
  aiCompDocked = true,
  showSideNavButton = false,
  onSideNavClick,
}: {
  segments: readonly string[]
  onClose: () => void
  panelBg?: string
  aiCompDocked?: boolean
  /** When docked chat is collapsed, show nav control (same affordance as top bar `menu`) to the left of breadcrumbs. */
  showSideNavButton?: boolean
  onSideNavClick?: () => void
}) {
  return (
    <div
      style={{
        height: SPLIT_UNIFIED_HEADER_HEIGHT_PX,
        flexShrink: 0,
        borderBottom: '1px solid var(--grey-200)',
        background: aiCompDocked ? AI_COMP_DOCKED.surface : panelBg,
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px 0 14px',
        gap: 8,
      }}
    >
      {showSideNavButton && onSideNavClick && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onSideNavClick}
          title="Open navigation"
          aria-label="Open navigation"
          style={headerIconBtnSideBySide(false)}
        >
          <Icon name="menu" size={20} aria-hidden />
        </motion.button>
      )}
      <UnifiedSplitBreadcrumbs aiCompDocked={aiCompDocked} segments={segments} />
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={onClose}
        title="Close side by side"
        aria-label="Close side by side"
        style={headerIconBtnSideBySide(false)}
      >
        <Icon name="close" size={18} />
      </motion.button>
    </div>
  )
}

const ORIENTATION_OPTIONS: { label: string; value: ChatOrientation; icon: string }[] = [
  { label: 'Full screen', value: 'fullscreen', icon: 'open_in_full' },
  { label: 'Side bar',    value: 'sidebar',    icon: 'dock_to_right' },
  { label: 'Floating',   value: 'floating',   icon: 'picture_in_picture' },
]

export function ChatPanel({ mode, orientation = 'sidebar', onOrientationChange, onClose, initialQuery, elevation = 'base', panelBg = 'var(--grey-50)', chatFill = 'filled', onReportFullscreen, onOpenReportInEditMode, onOpenReportCreatedPage, canvasDashboardHero = false, onOpenDashboardEditMode, canvasDashboardEditHero = false, onSplitCanvasOpenChange, onCollapseDashboardSideChat, scheduleCanvasShellSplit = false, onOpenScheduleShellSplit, navSplitBootstrapNonce = 0, navSplitBootstrapKind = null, chatDockPolicy = 'always_right', splitChatColumnHidden: splitChatColumnHiddenProp, onSplitChatColumnHiddenChange }: ChatPanelProps) {
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
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionAnchor, setMentionAnchor] = useState<{ start: number } | null>(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const composerFieldRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)
  const [showHistory, setShowHistory] = useState(false)
  /** Which mock thread is selected — drives the chat title in chrome + empty hero. */
  const [activeHistoryId, setActiveHistoryId] = useState('current')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showReportPanel, setShowReportPanel] = useState(false)
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false)
  const [showSchedulePanel, setShowSchedulePanel] = useState(false)
  /** When the report rail opens from a chart artifact click, show that preset’s title on the composer chip. */
  const [reportRailArtifactTitle, setReportRailArtifactTitle] = useState<string | null>(null)
  /** Resizable chat column width (px) when workflow/report is open beside chat. */
  const [sideBySideChatWidthPx, setSideBySideChatWidthPx] = useState<number | null>(null)
  const [reportSplitDragging, setReportSplitDragging] = useState(false)
  const splitLayoutRef = useRef<HTMLDivElement>(null)
  const reportSplitDrag = useRef<{ startX: number; startChatW: number } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasSentInitial = useRef(false)
  const moreMenuRef    = useRef<HTMLDivElement>(null)
  const messagesRef    = useRef<HTMLDivElement>(null)
  const isMounted      = useRef(false)
  const lastNavSplitNonceRef = useRef(0)
  /** Swapping report ↔ workflow ↔ schedule: exiting canvas stays under the incoming sweep (see split rail inner AnimatePresence). */
  const splitCanvasReplaceRef = useRef(false)
  const cw = useContainerWidth(messagesRef)
  /** `right_and_left`: slide chat + canvas strip together from the right so the canvas feels tethered to the thread. */
  const splitPairRowControls = useAnimationControls()

  useEffect(() => { isMounted.current = true }, [])

  useEffect(() => {
    if (!mentionOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMentionOpen(false)
        setMentionAnchor(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mentionOpen])

  function handleComposerCaret(detail: { value: string; selectionStart: number }) {
    const { value, selectionStart } = detail
    const before = value.slice(0, selectionStart)
    const at = before.lastIndexOf('@')
    if (at === -1) {
      setMentionOpen(false)
      setMentionAnchor(null)
      return
    }
    const frag = before.slice(at + 1)
    if (frag.includes(' ') || frag.includes('\n') || frag.includes(':')) {
      setMentionOpen(false)
      setMentionAnchor(null)
      return
    }
    setMentionOpen(true)
    setMentionAnchor({ start: at })
    setMentionQuery(frag.toLowerCase())
  }

  function insertChartMention(presetId: ChartArtifactPresetId) {
    if (mentionAnchor == null) return
    const el = composerFieldRef.current
    const pos = el && 'selectionStart' in el && el.selectionStart != null ? el.selectionStart : input.length
    const before = input.slice(0, mentionAnchor.start)
    const after = input.slice(pos)
    const insertion = `@chart:${presetId} `
    const next = before + insertion + after
    setInput(next)
    setMentionOpen(false)
    setMentionAnchor(null)
    requestAnimationFrame(() => {
      if (el && 'focus' in el) {
        ;(el as HTMLTextAreaElement).focus?.()
        const caret = before.length + insertion.length
        el.setSelectionRange?.(caret, caret)
      }
    })
  }

  const isFullChat = mode === 'fullchat'
  const isCopilot = mode === 'copilot'
  const isCanvas = mode === 'canvas'
  /** Sidebar / docked Rippling AI column — match AI-components mock chrome. */
  const aiCompDocked = isCopilot && !isFullChat
  /** Split report beside thread in full-screen chat or docked sidebar (not floating-only canvas without copilot). */
  const splitReportWithChat = isFullChat || aiCompDocked
  const splitCanvasOpen = showWorkflowPanel || showReportPanel || showSchedulePanel
  /**
   * Chat beside report/workflow/canvas edit — hide chat history to avoid stacked side rails.
   * Also when AI is docked beside the beta dashboard / canvas / schedule shell: hide the header
   * `view_sidebar` / chevron (global nav already has the menu on the left).
   */
  const sideBySideActive =
    splitCanvasOpen ||
    Boolean(canvasDashboardEditHero) ||
    (aiCompDocked && (Boolean(canvasDashboardHero) || Boolean(scheduleCanvasShellSplit)))
  const showHistoryUi = showHistory && !sideBySideActive
  /** Full-screen chat + report only: equal halves. Workflow split uses fixed chat width instead. */
  const splitRailHalfHalf = isFullChat && showReportPanel
  /** Workflow or schedule editor beside chat — same chat rail layout as workflow. */
  const workflowLikeSplitBesideChat =
    (showWorkflowPanel || showSchedulePanel) && splitReportWithChat && splitCanvasOpen
  /** Match workflow split rail: 52px header, 13px title — includes canvas dashboard edit beside chat. */
  const copilotSplitRailHeader =
    workflowLikeSplitBesideChat || (Boolean(canvasDashboardEditHero) && aiCompDocked)
  /** Canvas dashboard / WIW schedule shell beside docked chat — match {@link CanvasPage} title bar height (50px). */
  const copilotCanvasShellDocked =
    aiCompDocked && (Boolean(canvasDashboardEditHero) || Boolean(scheduleCanvasShellSplit))
  const copilotChromeHeaderHeightPx =
    splitRailHalfHalf || workflowLikeSplitBesideChat
      ? REPORT_BUILDER_HEADER_HEIGHT_PX
      : copilotCanvasShellDocked
        ? 50
        : aiCompDocked
          ? 40
          : 44
  /** Dashboard canvas edit beside docked chat — match workflow/report split header (double chevron hides chat). */
  const dashboardSideBySideDocked =
    (Boolean(canvasDashboardEditHero) || Boolean(scheduleCanvasShellSplit)) && aiCompDocked
  /** Report / workflow / schedule rail open beside the thread (full-screen or docked copilot). */
  const splitBesideCanvasRails =
    splitReportWithChat &&
    splitCanvasOpen &&
    (showReportPanel || showWorkflowPanel || showSchedulePanel)
  /** Prototype: `always_right` keeps AI on the **right**; legacy `right_and_left` keeps chat on the **left** of the pair. */
  const sideBySideChatVisuallyRight =
    chatDockPolicy === 'always_right' && splitBesideCanvasRails
  /**
   * Subtle strip slide for `right_and_left` only. `always_right` uses a dedicated rail enter (see split rail
   * motion) so the canvas visibly sweeps in from the chat side — double motion looked inert / conflicting.
   */
  useEffect(() => {
    if (splitBesideCanvasRails && chatDockPolicy !== 'always_right') {
      splitPairRowControls.start({
        x: [44, 0],
        transition: {
          x: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
        },
      })
    } else {
      splitPairRowControls.set({ x: 0 })
    }
  }, [splitBesideCanvasRails, chatDockPolicy, splitPairRowControls])
  const chatHeaderHideColumnUi =
    (splitReportWithChat && splitCanvasOpen) || dashboardSideBySideDocked
  const activeChatTitle = CHAT_HISTORY.find((c) => c.id === activeHistoryId)?.title ?? 'Chat'

  const railContextTitle = splitBesideCanvasRails
    ? showSchedulePanel
      ? SCHEDULE_CANVAS_DISPLAY_NAME
      : showWorkflowPanel
        ? WORKFLOW_CANVAS_DISPLAY_NAME
        : reportRailArtifactTitle ?? REPORT_BUILDER_DISPLAY_NAME
    : null
  const shellDockedSplitContextTitle =
    !railContextTitle && scheduleCanvasShellSplit
      ? SCHEDULE_CANVAS_DISPLAY_NAME
      : !railContextTitle && canvasDashboardEditHero
        ? CANVAS_DASHBOARD_EDIT_CONTEXT
        : null
  const chromeChatPrimaryTitle = railContextTitle ?? shellDockedSplitContextTitle ?? activeChatTitle
  const chromeChatShowsContextSuffix = Boolean(railContextTitle ?? shellDockedSplitContextTitle)

  const hideReportSplit = useCallback(() => {
    splitCanvasReplaceRef.current = false
    setShowReportPanel(false)
    setReportRailArtifactTitle(null)
    setSideBySideChatWidthPx(null)
  }, [])

  const hideWorkflowSplit = useCallback(() => {
    splitCanvasReplaceRef.current = false
    setShowWorkflowPanel(false)
    setSideBySideChatWidthPx(null)
  }, [])

  const hideScheduleSplit = useCallback(() => {
    splitCanvasReplaceRef.current = false
    setShowSchedulePanel(false)
    setSideBySideChatWidthPx(null)
  }, [])

  /** While workflow/report is open beside chat, header Close hides only the chat column (canvas stays). */
  const [splitHiddenInternal, setSplitHiddenInternal] = useState(false)
  const splitHiddenControlled =
    splitChatColumnHiddenProp !== undefined && onSplitChatColumnHiddenChange !== undefined
  const chatHiddenBesideSplit = splitHiddenControlled ? Boolean(splitChatColumnHiddenProp) : splitHiddenInternal
  const setChatHiddenBesideSplit = useCallback(
    (next: boolean) => {
      if (splitHiddenControlled) onSplitChatColumnHiddenChange!(next)
      else setSplitHiddenInternal(next)
    },
    [splitHiddenControlled, splitChatColumnHiddenProp, onSplitChatColumnHiddenChange],
  )
  const showChatColumn =
    !splitReportWithChat || !splitCanvasOpen || !chatHiddenBesideSplit

  useEffect(() => {
    if (!showWorkflowPanel && !showReportPanel && !showSchedulePanel) setChatHiddenBesideSplit(false)
  }, [showWorkflowPanel, showReportPanel, showSchedulePanel, setChatHiddenBesideSplit])

  useEffect(() => {
    onSplitCanvasOpenChange?.(Boolean(showWorkflowPanel || showReportPanel || showSchedulePanel))
  }, [showWorkflowPanel, showReportPanel, showSchedulePanel, onSplitCanvasOpenChange])

  useEffect(() => {
    if (!navSplitBootstrapNonce || navSplitBootstrapNonce <= lastNavSplitNonceRef.current) return
    lastNavSplitNonceRef.current = navSplitBootstrapNonce
    /** App navigated Home (or cleared nav split): tear down rails without forcing sidebar — parent keeps fullscreen chat. */
    if (navSplitBootstrapKind !== 'reports' && navSplitBootstrapKind !== 'workflows') {
      hideReportSplit()
      hideWorkflowSplit()
      hideScheduleSplit()
      setChatHiddenBesideSplit(false)
      return
    }
    setChatHiddenBesideSplit(false)
    splitCanvasReplaceRef.current =
      showReportPanel || showWorkflowPanel || showSchedulePanel
    setShowSchedulePanel(false)
    if (navSplitBootstrapKind === 'reports') {
      setShowWorkflowPanel(false)
      setReportRailArtifactTitle(null)
      setShowReportPanel(true)
    } else {
      setShowReportPanel(false)
      setReportRailArtifactTitle(null)
      setShowWorkflowPanel(true)
    }
    onOrientationChange?.('fullscreen')
  }, [
    navSplitBootstrapNonce,
    navSplitBootstrapKind,
    onOrientationChange,
    hideReportSplit,
    hideWorkflowSplit,
    hideScheduleSplit,
    setChatHiddenBesideSplit,
  ])

  useEffect(() => {
    if (sideBySideActive) setShowHistory(false)
  }, [sideBySideActive])

  const handleChatHeaderClose = useCallback(() => {
    if (splitReportWithChat && splitCanvasOpen) {
      setChatHiddenBesideSplit(true)
      return
    }
    if (dashboardSideBySideDocked && onCollapseDashboardSideChat) {
      onCollapseDashboardSideChat()
      return
    }
    onClose?.()
  }, [
    splitReportWithChat,
    splitCanvasOpen,
    dashboardSideBySideDocked,
    onCollapseDashboardSideChat,
    onClose,
    setChatHiddenBesideSplit,
  ])

  const railOnlyWorkflowOrReport =
    splitReportWithChat && splitCanvasOpen && chatHiddenBesideSplit

  const closeSplitCanvas = useCallback(() => {
    hideReportSplit()
    hideWorkflowSplit()
    hideScheduleSplit()
    setChatHiddenBesideSplit(false)
    /** Chart/report flow upgrades docked chat to fullscreen; closing the split should return to the base (sidebar) shell, not leave fullscreen chat open. */
    onOrientationChange?.('sidebar')
  }, [hideReportSplit, hideWorkflowSplit, hideScheduleSplit, onOrientationChange])

  /** Composer chip dismiss — same as closing the artifact rails, without changing chat orientation. */
  const dismissComposerArtifactContext = useCallback(() => {
    hideReportSplit()
    hideWorkflowSplit()
    hideScheduleSplit()
    setChatHiddenBesideSplit(false)
  }, [hideReportSplit, hideWorkflowSplit, hideScheduleSplit, setChatHiddenBesideSplit])

  const showUnifiedSplitChrome =
    splitReportWithChat && (showReportPanel || showWorkflowPanel || showSchedulePanel)

  const artifactSplitBreadcrumbSegments = showSchedulePanel
    ? (['Scheduling', 'WIW', SCHEDULE_CANVAS_DISPLAY_NAME] as const)
    : showWorkflowPanel
      ? (['Workflows', 'Payroll', WORKFLOW_CANVAS_DISPLAY_NAME] as const)
      : ([
          'Dashboards & Reports',
          'Reports',
          reportRailArtifactTitle ?? REPORT_BUILDER_DISPLAY_NAME,
        ] as const)

  const showUnifiedSplitChromeBar = showUnifiedSplitChrome && !sideBySideChatVisuallyRight
  /** Hide embedded rail “back” chevrons when unified chrome owns nav or when always-right embeds breadcrumbs in the rail (no duplicate left controls). */
  const suppressEmbeddedRailNav = Boolean(showUnifiedSplitChrome) || sideBySideChatVisuallyRight

  const alwaysRightSplitCloseFromChat = sideBySideChatVisuallyRight && chatHeaderHideColumnUi
  const dockedSplitHideChatChevron = chatHeaderHideColumnUi && !sideBySideChatVisuallyRight

  /** Clamp chat width: min 320px chat, min 320px canvas rail (minus grip); below ~646px inner width mins relax. */
  const clampSideBySideChatWidth = useCallback((w: number) => {
    const root = splitLayoutRef.current
    const historyW = isFullChat && showHistoryUi ? HISTORY_SIDEBAR_W : 0
    const inner =
      root != null
        ? root.clientWidth - historyW
        : typeof window !== 'undefined'
          ? window.innerWidth - historyW
          : 1200
    const minChatPx = SIDE_BY_SIDE_CHAT_MIN_PX
    const minCanvasPx = SIDE_BY_SIDE_CANVAS_MIN_PX
    const maxChatPx = inner - minCanvasPx - SPLIT_GRIP_PX
    if (maxChatPx <= 0) {
      return Math.max(0, Math.min(w, Math.max(0, inner - SPLIT_GRIP_PX)))
    }
    const low = Math.min(minChatPx, maxChatPx)
    return Math.min(Math.max(w, low), maxChatPx)
  }, [isFullChat, showHistoryUi])

  const effectiveSideBySideChatPx =
    splitReportWithChat && splitCanvasOpen && showChatColumn
      ? clampSideBySideChatWidth(sideBySideChatWidthPx ?? SIDE_BY_SIDE_CHAT_DEFAULT_PX)
      : SIDE_BY_SIDE_CHAT_DEFAULT_PX

  useLayoutEffect(() => {
    if (
      !splitReportWithChat ||
      (!showReportPanel && !showWorkflowPanel && !showSchedulePanel) ||
      !splitLayoutRef.current
    )
      return
    setSideBySideChatWidthPx((prev) =>
      clampSideBySideChatWidth(prev ?? SIDE_BY_SIDE_CHAT_DEFAULT_PX),
    )
  }, [
    splitReportWithChat,
    showReportPanel,
    showWorkflowPanel,
    showSchedulePanel,
    showHistoryUi,
    clampSideBySideChatWidth,
  ])

  useEffect(() => {
    if (
      !splitReportWithChat ||
      (!showReportPanel && !showWorkflowPanel && !showSchedulePanel) ||
      !splitLayoutRef.current
    )
      return
    const el = splitLayoutRef.current
    const ro = new ResizeObserver(() => {
      setSideBySideChatWidthPx((prev) =>
        clampSideBySideChatWidth(prev ?? SIDE_BY_SIDE_CHAT_DEFAULT_PX),
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [
    splitReportWithChat,
    showReportPanel,
    showWorkflowPanel,
    showSchedulePanel,
    showHistoryUi,
    clampSideBySideChatWidth,
  ])

  const splitGripPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (railOnlyWorkflowOrReport) return
      const w = sideBySideChatWidthPx ?? SIDE_BY_SIDE_CHAT_DEFAULT_PX
      e.preventDefault()
      reportSplitDrag.current = { startX: e.clientX, startChatW: clampSideBySideChatWidth(w) }
      setReportSplitDragging(true)
      ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    },
    [railOnlyWorkflowOrReport, sideBySideChatWidthPx, clampSideBySideChatWidth],
  )

  const splitGripPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!reportSplitDrag.current) return
      const raw = e.clientX - reportSplitDrag.current.startX
      /** Split rail inner row-reverse for always-right places the grip on the seam; same +raw mapping as chat-on-left. */
      const delta = raw
      const next = clampSideBySideChatWidth(reportSplitDrag.current.startChatW + delta)
      setSideBySideChatWidthPx(next)
    },
    [clampSideBySideChatWidth],
  )

  const reportSplitPointerUp = useCallback((e: React.PointerEvent) => {
    if (!reportSplitDrag.current) return
    reportSplitDrag.current = null
    setReportSplitDragging(false)
    try {
      ;(e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId)
    } catch {
      /* released */
    }
  }, [])

  /** Inner canvas swap: incoming uses rail enter slide; outgoing stays put until timing completes (layered absolute). */
  const replacingSplitCanvas = splitCanvasReplaceRef.current && !reportSplitDragging
  const splitRailInnerInitial =
    replacingSplitCanvas
      ? {
          x: sideBySideChatVisuallyRight
            ? ALWAYS_RIGHT_RAIL_ENTER_OFFSET_PX
            : -ALWAYS_RIGHT_RAIL_ENTER_OFFSET_PX,
          opacity: 1,
        }
      : false
  const splitRailInnerExit = replacingSplitCanvas
    ? {
        opacity: 1,
        x: 0,
        transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
      }
    : sideBySideChatVisuallyRight
      ? {
          x: Math.round(ALWAYS_RIGHT_RAIL_ENTER_OFFSET_PX * 0.45),
          opacity: 0,
        }
      : {
          opacity: 0,
          x: -20,
        }
  const splitRailInnerTransition = reportSplitDragging
    ? { duration: 0 }
    : sideBySideChatVisuallyRight
      ? {
          x: { type: 'spring' as const, stiffness: 188, damping: 26, mass: 1.05 },
          opacity: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        }
      : {
          opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
          x: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
        }

  /** Drop swap intent after the inner sweep so idle state doesn’t keep “replace” styling stuck on. */
  useEffect(() => {
    if (!splitCanvasReplaceRef.current) return
    const id = window.setTimeout(() => {
      splitCanvasReplaceRef.current = false
    }, 520)
    return () => clearTimeout(id)
  }, [showReportPanel, showWorkflowPanel, showSchedulePanel])

  // Re-seed when chatFill changes, or when `initialQuery` is cleared (stale pending message was hiding empty-state CTAs).
  useEffect(() => {
    if (initialQuery) return
    setMessages(chatFill === 'empty' ? [GREETING] : INITIAL_MESSAGES)
    hasSentInitial.current = false
  }, [chatFill, initialQuery]) // eslint-disable-line

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
      const base = Date.now()
      setMessages((prev) => [...prev, ...assistantMessagesAfterUserText(initialQuery, base)])
    }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function sendMessage(text: string) {
    if (!text.trim()) return
    const tokenRe = /@chart:([\w-]+)/g
    const fromToken: ChartArtifactPresetId[] = []
    let m: RegExpExecArray | null
    const validIds = new Set(CHART_ARTIFACT_PRESETS.map((p) => p.id))
    while ((m = tokenRe.exec(text)) !== null) {
      if (validIds.has(m[1] as ChartArtifactPresetId)) fromToken.push(m[1] as ChartArtifactPresetId)
    }
    const fromNlp = inferChartPresetIdsFromMessage(text)
    const seen = new Set<ChartArtifactPresetId>()
    const ids: ChartArtifactPresetId[] = []
    for (const id of [...fromToken, ...fromNlp]) {
      if (seen.has(id)) continue
      seen.add(id)
      ids.push(id)
      if (ids.length >= 5) break
    }
    const cleaned = text
      .trim()
      .replace(/@chart:[\w-]+\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const userDisplay =
      cleaned.length > 0 ? cleaned : (ids.length ? ids.map(chartPresetTitle).join(' · ') : text.trim())

    const userMsg: Message = { id: Date.now(), role: 'user', type: 'text', text: userDisplay }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setMentionOpen(false)
    setMentionAnchor(null)
    setTimeout(() => {
      const base = Date.now() + 1
      setMessages((prev) => [...prev, ...assistantMessagesAfterUserText(text, base)])
    }, 800)
  }

  const artifactComposerChipText =
    showSchedulePanel
      ? SCHEDULE_CANVAS_DISPLAY_NAME
      : showWorkflowPanel
        ? WORKFLOW_CANVAS_DISPLAY_NAME
        : showReportPanel
          ? reportRailArtifactTitle ?? REPORT_BUILDER_DISPLAY_NAME
          : null

  const chromeTitleEl: React.ReactNode = chromeChatShowsContextSuffix ? (
    <>
      <span style={{ fontWeight: 500 }}>{chromeChatPrimaryTitle}</span>
      <span style={{ color: aiCompDocked ? AI_COMP_DOCKED.muted : '#888', fontWeight: 400 }}> · Rippling AI</span>
    </>
  ) : (
    chromeChatPrimaryTitle
  )

  return (
    <div
      ref={splitLayoutRef}
      style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative', zIndex: 30 }}
    >

      {/* ── LEFT: History sidebar (fullchat mode only) ── */}
      <AnimatePresence>
        {isFullChat && showHistoryUi && (
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
              <span style={{ fontSize: 13, fontWeight: 400, color: '#111', flex: 1 }}>Chat history</span>
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
                  onClick={() => {
                    setActiveHistoryId(chat.id)
                    setShowHistory(false)
                  }}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6,
                    border: 'none', background: chat.id === activeHistoryId ? '#e8e8e8' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 400, color: '#111' }}>{chat.title}</span>
                    <span style={{ fontSize: 10, color: '#bbb' }}>{chat.date}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.preview}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat + split rail share one canvas; unified chrome when report/workflow open ── */}
      <motion.div
        animate={splitPairRowControls}
        initial={false}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}
      >
        {showUnifiedSplitChromeBar && (
          <div
            style={{
              height: SPLIT_UNIFIED_HEADER_HEIGHT_PX,
              flexShrink: 0,
              borderBottom: '1px solid var(--grey-200)',
              background: aiCompDocked ? AI_COMP_DOCKED.surface : panelBg,
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px 0 14px',
              gap: 8,
            }}
          >
            <UnifiedSplitBreadcrumbs
              aiCompDocked={aiCompDocked}
              segments={artifactSplitBreadcrumbSegments}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={closeSplitCanvas}
              title="Close side by side"
              aria-label="Close side by side"
              style={headerIconBtnSideBySide(false)}
            >
              <Icon name="close" size={18} />
            </motion.button>
          </div>
        )}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: sideBySideChatVisuallyRight ? 'row-reverse' : 'row',
            minHeight: 0,
            minWidth: 0,
          }}
        >
      {/* ── CENTER: Main chat column (animated collapse beside workflow/report) ── */}
      <motion.div
        initial={false}
        animate={
          !(splitReportWithChat && splitCanvasOpen)
            ? {
                flexGrow: 1,
                flexShrink: 1,
                flexBasis: 0,
                opacity: 1,
                maxWidth: '100%',
              }
            : workflowLikeSplitBesideChat
              ? showChatColumn
                ? {
                    flex: `0 0 ${effectiveSideBySideChatPx}px`,
                    opacity: 1,
                    maxWidth: effectiveSideBySideChatPx,
                  }
                : {
                    flex: '0 0 0px',
                    opacity: 0,
                    maxWidth: 0,
                  }
              : showChatColumn
                ? {
                    flex: `0 0 ${effectiveSideBySideChatPx}px`,
                    flexGrow: 0,
                    flexShrink: 0,
                    opacity: 1,
                    maxWidth: effectiveSideBySideChatPx,
                  }
                : {
                    flexGrow: 0,
                    flexShrink: 1,
                    flexBasis: 0,
                    opacity: 0,
                    maxWidth: 0,
                  }
        }
        transition={
          splitReportWithChat && splitCanvasOpen
            ? reportSplitDragging
              ? { duration: 0 }
              : { duration: 0.2, ease: 'easeOut' }
            : { duration: 0 }
        }
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: aiCompDocked ? AI_COMP_DOCKED.surface : panelBg,
          overflow: 'hidden',
          minWidth:
            splitReportWithChat && splitCanvasOpen && showChatColumn
              ? effectiveSideBySideChatPx
              : 0,
          boxSizing: 'border-box',
          pointerEvents:
            splitReportWithChat && splitCanvasOpen && !showChatColumn ? 'none' : 'auto',
        }}
      >
      {/* Header */}
      <div
        style={{
          padding: aiCompDocked ? '0 16px' : '0 10px',
          height: copilotChromeHeaderHeightPx,
          borderBottom: aiCompDocked ? `1px solid ${AI_COMP_DOCKED.divider}` : '1px solid #ebebeb',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          background: aiCompDocked ? AI_COMP_DOCKED.surface : panelBg,
          borderRadius: 0,
          gap: 6,
        }}
      >
        {/* Copilot header: branded label left, actions right */}
        {isCopilot && (
          <>
            {/* History toggle — hidden in side-by-side (report/workflow/dashboard edit) */}
            {!sideBySideActive && (
              <motion.button
                onClick={() => setShowHistory((v) => !v)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                title={showHistory ? 'Back to chat' : 'Chat history'}
                style={headerIconBtn(showHistory)}
              >
                <Icon name={showHistory ? 'chevron_left' : 'view_sidebar'} size={18} />
              </motion.button>
            )}

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span
                style={{
                  fontSize: copilotCanvasShellDocked || copilotSplitRailHeader ? 13 : aiCompDocked ? 14 : 13,
                  fontWeight: 400,
                  color: aiCompDocked ? AI_COMP_DOCKED.ink : '#111',
                  letterSpacing: '-0.1px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {chromeTitleEl}
              </span>
            </div>

            {/* New chat */}
            <motion.button
              onClick={() => {
                setMessages([GREETING])
                setActiveHistoryId('current')
                setShowHistory(false)
              }}
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
                              fontWeight: 400,
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

            {/* Side-by-side: legacy dock uses chevron to hide chat column; always-right uses close to dismiss canvas */}
            {onClose && (
              <motion.button
                onClick={alwaysRightSplitCloseFromChat ? closeSplitCanvas : handleChatHeaderClose}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                title={
                  dockedSplitHideChatChevron ? 'Hide chat' : alwaysRightSplitCloseFromChat ? 'Close side by side' : 'Close'
                }
                aria-label={
                  dockedSplitHideChatChevron ? 'Hide chat' : alwaysRightSplitCloseFromChat ? 'Close side by side' : 'Close'
                }
                style={
                  chatHeaderHideColumnUi ? headerIconBtnSideBySide(false) : headerIconBtn(false)
                }
              >
                <Icon
                  name={dockedSplitHideChatChevron ? 'keyboard_double_arrow_right' : 'close'}
                  size={18}
                />
              </motion.button>
            )}
          </>
        )}

        {/* Full screen header — sidebar icon opens chat history (hidden when beside report/workflow/canvas edit) */}
        {!isCopilot && (
          <>
            {!sideBySideActive && (
              <motion.button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                title={showHistory ? 'Hide chat history' : 'Show chat history'}
                style={headerIconBtn(showHistory)}
              >
                <Icon name={showHistory ? 'chevron_left' : 'view_sidebar'} size={18} />
              </motion.button>
            )}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: '#111',
                  letterSpacing: '-0.1px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {chromeTitleEl}
              </span>
            </div>

            {/* New chat */}
            <motion.button
              onClick={() => {
                setMessages([GREETING])
                setActiveHistoryId('current')
                setShowHistory(false)
              }}
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
                              fontWeight: 400,
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

            {/* Side-by-side: legacy chevron hides chat; always-right close dismisses split */}
            {onClose && (
              <motion.button
                type="button"
                onClick={alwaysRightSplitCloseFromChat ? closeSplitCanvas : handleChatHeaderClose}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                title={
                  dockedSplitHideChatChevron ? 'Hide chat' : alwaysRightSplitCloseFromChat ? 'Close side by side' : 'Close'
                }
                aria-label={
                  dockedSplitHideChatChevron ? 'Hide chat' : alwaysRightSplitCloseFromChat ? 'Close side by side' : 'Close'
                }
                style={
                  chatHeaderHideColumnUi ? headerIconBtnSideBySide(false) : headerIconBtn(false)
                }
              >
                <Icon
                  name={dockedSplitHideChatChevron ? 'keyboard_double_arrow_right' : 'close'}
                  size={18}
                />
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* Chat history overlay — copilot (sidebar) mode only; fullchat uses left sidebar */}
      <AnimatePresence>
        {isCopilot && showHistoryUi && (
          <motion.div
            key="history"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            style={{
              position: 'absolute',
              top: copilotChromeHeaderHeightPx, // below header
              left: 0, right: 0, bottom: 0,
              background: aiCompDocked ? AI_COMP_DOCKED.surface : panelBg,
              zIndex: 40,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: aiCompDocked ? '8px 16px' : '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {CHAT_HISTORY.map((chat, i) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    setActiveHistoryId(chat.id)
                    setShowHistory(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 5,
                    border: 'none',
                    background: chat.id === activeHistoryId ? (aiCompDocked ? '#ebe8e4' : '#f0f0f0') : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (chat.id !== activeHistoryId) (e.currentTarget as HTMLElement).style.background = aiCompDocked ? '#f5f3f0' : '#f7f7f7'
                  }}
                  onMouseLeave={(e) => {
                    if (chat.id !== activeHistoryId) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 400, color: aiCompDocked ? AI_COMP_DOCKED.ink : '#111' }}>
                      {chat.title}
                    </span>
                    <span style={{ fontSize: 10, color: aiCompDocked ? AI_COMP_DOCKED.muted : '#bbb' }}>{chat.date}</span>
                  </div>
                  <div style={{ fontSize: 11, color: aiCompDocked ? AI_COMP_DOCKED.muted : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          minHeight: 0,
          overflowY: 'auto',
          background: aiCompDocked ? AI_COMP_DOCKED.surface : panelBg,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Inner column — capped at 730px in fullchat; 16px horizontal inset matches 448px mock (416 content). */}
        <div
          className="chat-message-thread"
          style={{
          maxWidth: isFullChat && !showWorkflowPanel && !showSchedulePanel ? 730 : 'none',
          margin: isFullChat && !showWorkflowPanel && !showSchedulePanel ? '0 auto' : undefined,
          padding: showEmptyHero
            ? isFullChat
              ? '0 16px'
              : aiCompDocked
                ? '0 16px'
                : '0 14px'
            : isFullChat
              ? showWorkflowPanel || showSchedulePanel
                ? '40px 14px'
                : '40px 16px'
              : aiCompDocked
                ? '16px 16px'
                : '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: aiCompDocked ? 16 : 24,
          overflowX: isFullChat ? 'visible' : undefined,
          ...(showEmptyHero
            ? {
                flex: 1,
                minHeight: '100%',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }
            : {}),
        }}
        >
        {/* ── Empty state hero ── */}
        <AnimatePresence>
          {showEmptyHero && (
            <motion.div
              key={canvasDashboardEditHero ? 'empty-hero-edit' : canvasDashboardHero ? 'empty-hero-canvas' : 'empty-hero'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: 24,
                padding: '16px 0',
                width: '100%',
                alignSelf: 'stretch',
                flexShrink: 0,
              }}
            >
              {/* Logo + title — left-aligned stack; header always “Rippling AI” per AI-components empty chat */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 12,
                  width: '100%',
                  maxWidth: 420,
                }}
              >
                <RipplingAiPebbleIcon height={aiCompDocked ? 24 : 28} color="var(--brand)" />
                <span
                  style={{
                    fontSize: aiCompDocked ? 18 : 20,
                    fontWeight: 600,
                    fontFamily: 'var(--font-heading)',
                    color: aiCompDocked ? AI_COMP_DOCKED.ink : '#111',
                    letterSpacing: '-0.25px',
                    textAlign: 'left',
                    maxWidth: '100%',
                    lineHeight: 1.25,
                  }}
                >
                  Rippling AI
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    fontFamily: 'var(--font-heading)',
                    color: aiCompDocked ? AI_COMP_DOCKED.muted : '#737373',
                    textAlign: 'left',
                    lineHeight: 1.45,
                    maxWidth: 360,
                  }}
                >
                  {canvasDashboardEditHero
                    ? "Let's work on your dashboard"
                    : canvasDashboardHero
                      ? 'Ask me anything about this dashboard'
                      : 'Ask me anything about your work'}
                </span>
              </div>

              {/* Sample prompts — canvas view-mode CTA vs edit-mode prompts vs default */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 420 }}>
                {canvasDashboardHero && onOpenDashboardEditMode ? (
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 10, width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => onOpenDashboardEditMode()}
                      style={{
                        ...emptyHeroPromptStyle(aiCompDocked),
                        flex: 1,
                        width: 'auto',
                        minWidth: 0,
                        textAlign: 'center',
                      }}
                      onMouseEnter={(e) => emptyHeroPromptHoverEnter(aiCompDocked, e.currentTarget)}
                      onMouseLeave={(e) => emptyHeroPromptHoverLeave(aiCompDocked, e.currentTarget)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => sendMessage('Summarize this dashboard')}
                      style={{
                        ...emptyHeroPromptStyle(aiCompDocked),
                        flex: 1,
                        width: 'auto',
                        minWidth: 0,
                        textAlign: 'center',
                      }}
                      onMouseEnter={(e) => emptyHeroPromptHoverEnter(aiCompDocked, e.currentTarget)}
                      onMouseLeave={(e) => emptyHeroPromptHoverLeave(aiCompDocked, e.currentTarget)}
                    >
                      Summarize
                    </button>
                  </div>
                ) : canvasDashboardEditHero ? (
                  [
                    'explain the dashboard',
                    'update the last report',
                    'change the visual layout',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      style={emptyHeroPromptStyle(aiCompDocked)}
                      onMouseEnter={(e) => emptyHeroPromptHoverEnter(aiCompDocked, e.currentTarget)}
                      onMouseLeave={(e) => emptyHeroPromptHoverLeave(aiCompDocked, e.currentTarget)}
                    >
                      {prompt}
                    </button>
                  ))
                ) : (
                  [
                    'How do I update my W2',
                    'What will it cost me to visit the doctor',
                    'When does my PTO reset',
                    'Show me my recent pay stubs',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      style={emptyHeroPromptStyle(aiCompDocked)}
                      onMouseEnter={(e) => emptyHeroPromptHoverEnter(aiCompDocked, e.currentTarget)}
                      onMouseLeave={(e) => emptyHeroPromptHoverLeave(aiCompDocked, e.currentTarget)}
                    >
                      {prompt}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.filter((msg) => !(showEmptyHero && msg.id === 0)).map((msg) => {
          // ── Figma / resource link attachment row ──
          if (msg.type === 'figma-link-card') {
            const m = msg as FigmaLinkCardMessage
            return (
              <motion.div
                key={msg.id}
                initial={isMounted.current ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  width: '100%',
                  maxWidth: isFullChat ? (showWorkflowPanel || showSchedulePanel ? '100%' : 680) : '88%',
                }}
              >
                <FigmaLinkAttachmentCard
                  url={m.url}
                  title={m.title}
                  subtitle={m.subtitle}
                  aiCompDocked={aiCompDocked}
                  onOpenShellSplit={onOpenScheduleShellSplit}
                />
              </motion.div>
            )
          }

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
                    hideReportSplit()
                    onOpenReportCreatedPage?.()
                  }}
                />
              </motion.div>
            )
          }

          if (msg.type === 'schedule-preview') {
            const openScheduleSplit = () => {
              splitCanvasReplaceRef.current =
                showReportPanel || showWorkflowPanel || showSchedulePanel
              setReportRailArtifactTitle(null)
              setShowReportPanel(false)
              setShowWorkflowPanel(false)
              setChatHiddenBesideSplit(false)
              if (isFullChat) {
                setShowSchedulePanel(true)
              } else if (aiCompDocked) {
                onOrientationChange?.('fullscreen')
                setShowSchedulePanel(true)
              }
            }
            const clickable = isFullChat || aiCompDocked
            return (
              <motion.div
                key={msg.id}
                initial={isMounted.current ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {clickable ? (
                  <button
                    type="button"
                    onClick={openScheduleSplit}
                    title="Open schedule beside chat"
                    style={{
                      margin: 0,
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderRadius: 12,
                      display: 'block',
                      width: '100%',
                      maxWidth: 360,
                      textAlign: 'left',
                      font: 'inherit',
                      transition: 'box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                        '0 8px 28px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                    }}
                  >
                    <SchedulePreviewArtifact fluid />
                  </button>
                ) : (
                  <SchedulePreviewArtifact fluid />
                )}
              </motion.div>
            )
          }

          if (msg.type === 'workflow-preview') {
            const openWorkflowSplit = () => {
              splitCanvasReplaceRef.current =
                showReportPanel || showWorkflowPanel || showSchedulePanel
              setReportRailArtifactTitle(null)
              setShowReportPanel(false)
              setShowSchedulePanel(false)
              setChatHiddenBesideSplit(false)
              if (isFullChat) {
                setShowWorkflowPanel(true)
              } else if (aiCompDocked) {
                onOrientationChange?.('fullscreen')
                setShowWorkflowPanel(true)
              }
            }
            const clickable = isFullChat || aiCompDocked
            return (
              <motion.div
                key={msg.id}
                initial={isMounted.current ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {clickable ? (
                  <button
                    type="button"
                    onClick={openWorkflowSplit}
                    title="Open workflow canvas beside chat"
                    style={{
                      margin: 0,
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderRadius: 12,
                      display: 'block',
                      width: '100%',
                      maxWidth: 360,
                      textAlign: 'left',
                      font: 'inherit',
                      transition: 'box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                        '0 8px 28px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                    }}
                  >
                    <WorkflowPreviewArtifact fluid />
                  </button>
                ) : (
                  <WorkflowPreviewArtifact fluid />
                )}
              </motion.div>
            )
          }

          // ── Artifact messages ──
          const isArtifact = msg.type === 'table-sm' || msg.type === 'table-lg' || msg.type === 'dashboard' || msg.type === 'candidate' || msg.type === 'expense' || msg.type === 'chart'
          if (isArtifact) {
            // table-lg + column chart break out to viewport width in fullchat (matches Figma 760px chart frame)
            const isComplexTable = msg.type === 'table-lg'
            const isWideColumnChart =
              isFullChat &&
              msg.type === 'chart' &&
              (msg as ChartMessage).presetId === 'bar-vertical'
            const artifactFullBleed = (isFullChat && isComplexTable) || isWideColumnChart
            return (
              <motion.div
                key={msg.id}
                initial={isMounted.current ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={
                  artifactFullBleed
                    ? {
                        marginLeft: 'calc(-1 * max(0px, calc(50vw - 365px - 16px)))',
                        marginRight: 'calc(-1 * max(0px, calc(50vw - 365px - 16px)))',
                        ...(isWideColumnChart
                          ? {
                              width: 'min(100vw - 32px, 1200px)',
                              maxWidth: 'min(100vw - 32px, 1200px)',
                              alignSelf: 'center',
                            }
                          : {}),
                      }
                    : {}
                }
              >
                {msg.type === 'chart' &&
                  (() => {
                    const pid = (msg as ChartMessage).presetId
                    const chart = <ChartArtifactByPreset presetId={pid} fluid />
                    const openReport = () => {
                      splitCanvasReplaceRef.current =
                        showReportPanel || showWorkflowPanel || showSchedulePanel
                      setShowWorkflowPanel(false)
                      setShowSchedulePanel(false)
                      setReportRailArtifactTitle(chartPresetTitle(pid))
                      if (isFullChat) {
                        setShowReportPanel(true)
                      } else if (aiCompDocked) {
                        /** Side-by-side needs full-width stage — enter full-screen chat, then open the report rail. */
                        onOrientationChange?.('fullscreen')
                        setShowReportPanel(true)
                      } else {
                        setReportRailArtifactTitle(null)
                        onOpenReportInEditMode?.()
                      }
                    }
                    const clickable = isFullChat || aiCompDocked || Boolean(onOpenReportInEditMode)
                    if (!clickable) return chart
                    return (
                      <button
                        type="button"
                        onClick={openReport}
                        title="Open report in edit mode"
                        style={{
                          margin: 0,
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          borderRadius: 10,
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          font: 'inherit',
                          transition: 'box-shadow 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 2px rgba(122, 0, 93, 0.22)'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                        }}
                      >
                        {chart}
                      </button>
                    )
                  })()}
                {msg.type === 'table-sm'  && <TableSmallArtifact cw={cw} />}
                {msg.type === 'table-lg'  && <TableLargeArtifact cw={cw} />}
                {msg.type === 'dashboard' && <DashboardArtifact  cw={cw} />}
                {msg.type === 'candidate' && <CandidateProfileArtifact cw={cw} />}
                {msg.type === 'expense'   && <ExpenseArtifact    cw={cw} />}
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
                  maxWidth: isFullChat ? (showWorkflowPanel || showSchedulePanel ? '100%' : 680) : '88%',
                  padding: msg.role === 'user' ? (aiCompDocked ? '10px 14px' : '9px 14px') : '0',
                  borderRadius: msg.role === 'user' ? (aiCompDocked ? 12 : 20) : 0,
                  background: msg.role === 'user' ? (aiCompDocked ? AI_COMP_DOCKED.userBubble : '#f0f0f0') : 'transparent',
                  color:
                    msg.role === 'user' && aiCompDocked
                      ? AI_COMP_DOCKED.ink
                      : '#111',
                  fontSize: 14,
                  fontWeight: 'inherit',
                  fontFamily: 'inherit',
                  fontSynthesis: 'inherit',
                  lineHeight: '20px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {formatChatMessageText((msg as TextMessage).text, {
                  isUser: msg.role === 'user',
                  aiCompDocked,
                })}
              </div>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
        </div>{/* end inner column */}
      </div>

      {/* Sample prompts — full chat only, hidden once the user has sent a message */}
      {isFullChat &&
        messages.every((m) => m.role !== 'user') &&
        !showEmptyHero && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            maxWidth: 730,
            margin: '0 auto',
            padding: '0 16px 14px',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          }}
        >
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendMessage(s)}
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                border: '1px solid var(--grey-200)',
                background: '#ffffff',
                color: '#404040',
                fontSize: 13,
                fontWeight: 400,
                letterSpacing: '-0.1px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                lineHeight: 1.35,
                boxShadow: 'var(--shadow-sm)',
                transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.background = 'var(--grey-50)'
                el.style.borderColor = 'var(--grey-300)'
                el.style.boxShadow = 'var(--shadow-md)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.background = '#ffffff'
                el.style.borderColor = 'var(--grey-200)'
                el.style.boxShadow = 'var(--shadow-sm)'
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
          padding: isFullChat ? '8px 16px 16px' : aiCompDocked ? '12px 16px' : '10px 14px',
          borderTop: isFullChat || aiCompDocked ? 'none' : '1px solid #e8e8e8',
          background: aiCompDocked ? AI_COMP_DOCKED.surface : panelBg,
          flexShrink: 0,
          transition: 'padding 0.3s',
          maxWidth: isFullChat && !showWorkflowPanel && !showSchedulePanel ? 730 : 'none',
          margin: isFullChat && !showWorkflowPanel && !showSchedulePanel ? '0 auto' : undefined,
          width: isFullChat ? '100%' : undefined,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {mentionOpen && (
          <div
            role="listbox"
            aria-label="Chart artifacts"
            style={{
              position: 'absolute',
              left: isFullChat ? 16 : 14,
              right: isFullChat ? 16 : 14,
              bottom: '100%',
              marginBottom: 6,
              maxHeight: 220,
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid var(--grey-200)',
              borderRadius: 8,
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              zIndex: 50,
            }}
          >
            <div style={{ padding: '8px 10px', fontSize: 10, fontWeight: 400, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Charts · type @ in the message
            </div>
            {filterChartPresets(mentionQuery).map((p) => (
              <button
                key={p.id}
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertChartMention(p.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  borderTop: '1px solid var(--grey-100)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 400, color: '#111' }}>{p.title}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{p.description}</div>
              </button>
            ))}
            {filterChartPresets(mentionQuery).length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#999' }}>No charts match “{mentionQuery}”.</div>
            )}
          </div>
        )}
        <AIComposerInput
          ref={composerFieldRef}
          variant={isFullChat ? 'fullscreen' : 'pane'}
          value={input}
          onChange={setInput}
          onCaretActivity={handleComposerCaret}
          onSend={() => sendMessage(input)}
          leadingChip={artifactComposerChipText || undefined}
          onLeadingChipDismiss={
            artifactComposerChipText ? dismissComposerArtifactContext : undefined
          }
          style={
            isFullChat
              ? { maxWidth: 712, width: '100%', margin: '0 auto' }
              : undefined
          }
        />

        {/* Footer note — docked mock uses single 11px disclaimer (Figma 267:16276). */}
        <p style={{
          margin: isFullChat ? '8px 0 0' : '8px 0 0',
          fontSize: 11,
          fontWeight: 'var(--chat-composer-font-weight)',
          fontFamily: 'var(--font-composer)',
          fontSynthesis: 'none',
          color: aiCompDocked ? AI_COMP_DOCKED.ink : 'rgba(0,0,0,0.35)',
          lineHeight: '14px',
          textAlign: 'center',
        }}>
          {aiCompDocked ? (
            'Rippling AI results may be inaccurate. Review before acting.'
          ) : (
            <>
              Type <strong style={{ fontWeight: 300, fontFamily: 'var(--font-heading)', color: 'rgba(0,0,0,0.55)' }}>@</strong> to insert a chart artifact. Rippling AI results may be inaccurate. Review before acting.
            </>
          )}
        </p>
      </div>
      </motion.div>

      {/* Split seam — lives outside the rail’s motion.div so Framer layout/transform + overflow don’t eat drags (always_right). */}
      {splitReportWithChat &&
        (showReportPanel || showWorkflowPanel || showSchedulePanel) &&
        !railOnlyWorkflowOrReport && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize chat and canvas"
            onPointerDown={splitGripPointerDown}
            onPointerMove={splitGripPointerMove}
            onPointerUp={reportSplitPointerUp}
            onPointerCancel={reportSplitPointerUp}
            style={{
              flexShrink: 0,
              width: SPLIT_GRIP_PX,
              cursor: 'col-resize',
              touchAction: 'none',
              borderLeft: sideBySideChatVisuallyRight ? '1px solid var(--grey-200)' : undefined,
              borderRight: sideBySideChatVisuallyRight ? undefined : '1px solid var(--grey-200)',
              alignSelf: 'stretch',
              background: reportSplitDragging ? 'rgba(122, 0, 93, 0.08)' : 'transparent',
              position: 'relative',
              zIndex: 50,
            }}
          />
        )}

      {/* ── Split rail: report / workflow / schedule (direction anim follows dock policy) ── */}
      <AnimatePresence>
        {splitReportWithChat && (showReportPanel || showWorkflowPanel || showSchedulePanel) && (
          <motion.div
            key="split-rail-shell"
            initial={
              sideBySideChatVisuallyRight && !reportSplitDragging
                ? {
                    x: ALWAYS_RIGHT_RAIL_ENTER_OFFSET_PX,
                    opacity: 1,
                  }
                : false
            }
            animate={{ x: 0, opacity: 1 }}
            exit={
              sideBySideChatVisuallyRight
                ? {
                    x: Math.round(ALWAYS_RIGHT_RAIL_ENTER_OFFSET_PX * 0.45),
                    opacity: 0,
                  }
                : {
                    opacity: 0,
                    x: -20,
                  }
            }
            transition={
              reportSplitDragging
                ? { duration: 0 }
                : sideBySideChatVisuallyRight
                  ? {
                      x: { type: 'spring', stiffness: 188, damping: 26, mass: 1.05 },
                      opacity: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                    }
                  : {
                      opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                      x: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                    }
            }
            style={{
              flex: '1 1 0%',
              flexShrink: 1,
              minWidth: SIDE_BY_SIDE_CANVAS_MIN_PX,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: '#fff',
              borderLeft: sideBySideChatVisuallyRight ? 'none' : '1px solid var(--grey-200)',
              borderRight: sideBySideChatVisuallyRight ? '1px solid var(--grey-200)' : 'none',
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                /** Always-right: canvas is left — shadow falls toward chat on the right so depth reads as “added” from AI. */
                boxShadow: sideBySideChatVisuallyRight
                  ? '6px 0 36px rgba(0,0,0,0.07), 2px 0 14px rgba(0,0,0,0.05)'
                  : '-6px 0 28px rgba(0,0,0,0.08), -2px 0 10px rgba(0,0,0,0.04)',
                zIndex: 1,
              }}
            >
              <AnimatePresence initial={false}>
                {showSchedulePanel && (
                  <motion.div
                    key="split-canvas-schedule"
                    initial={splitRailInnerInitial}
                    animate={{ x: 0, opacity: 1 }}
                    exit={splitRailInnerExit}
                    transition={splitRailInnerTransition}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#fff',
                      minHeight: 0,
                    }}
                  >
                    <ScheduleCanvasView
                      embeddedInChatSplit
                      suppressEmbeddedNav={suppressEmbeddedRailNav}
                      embeddedTitleMatchChat
                      embeddedTitleFontSize={aiCompDocked ? 14 : 13}
                      embeddedTitleColor={aiCompDocked ? AI_COMP_DOCKED.ink : '#111'}
                      onClose={hideScheduleSplit}
                      onOpenChat={
                        chatHiddenBesideSplit && !showUnifiedSplitChromeBar
                          ? () => setChatHiddenBesideSplit(false)
                          : undefined
                      }
                      embeddedSplitBreadcrumbs={
                        sideBySideChatVisuallyRight ? (
                          <UnifiedSplitBreadcrumbs
                            aiCompDocked={aiCompDocked}
                            segments={artifactSplitBreadcrumbSegments}
                          />
                        ) : undefined
                      }
                    />
                  </motion.div>
                )}
                {showWorkflowPanel && (
                  <motion.div
                    key="split-canvas-workflow"
                    initial={splitRailInnerInitial}
                    animate={{ x: 0, opacity: 1 }}
                    exit={splitRailInnerExit}
                    transition={splitRailInnerTransition}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#fff',
                      minHeight: 0,
                    }}
                  >
                    <WorkflowCanvasView
                      embeddedInChatSplit
                      suppressEmbeddedNav={suppressEmbeddedRailNav}
                      embeddedTitleMatchChat
                      embeddedTitleFontSize={aiCompDocked ? 14 : 13}
                      embeddedTitleColor={aiCompDocked ? AI_COMP_DOCKED.ink : '#111'}
                      onClose={hideWorkflowSplit}
                      onOpenChat={
                        chatHiddenBesideSplit && !showUnifiedSplitChromeBar
                          ? () => setChatHiddenBesideSplit(false)
                          : undefined
                      }
                      embeddedSplitBreadcrumbs={
                        sideBySideChatVisuallyRight ? (
                          <UnifiedSplitBreadcrumbs
                            aiCompDocked={aiCompDocked}
                            segments={artifactSplitBreadcrumbSegments}
                          />
                        ) : undefined
                      }
                    />
                  </motion.div>
                )}
                {showReportPanel && (
                  <motion.div
                    key="split-canvas-report"
                    initial={splitRailInnerInitial}
                    animate={{ x: 0, opacity: 1 }}
                    exit={splitRailInnerExit}
                    transition={splitRailInnerTransition}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#fff',
                      minHeight: 0,
                    }}
                  >
                    <ReportBuilderEditMode
                      embeddedInChatSplit
                      omitAvailableDataPanel={splitRailHalfHalf}
                      suppressEmbeddedNav={suppressEmbeddedRailNav}
                      embeddedTitleMatchChat
                      embeddedTitleFontSize={aiCompDocked ? 14 : 13}
                      embeddedTitleColor={aiCompDocked ? AI_COMP_DOCKED.ink : '#111'}
                      embeddedReportTitle={reportRailArtifactTitle ?? undefined}
                      onClose={hideReportSplit}
                      onRequestFullscreen={() => {
                        hideReportSplit()
                        onReportFullscreen?.()
                      }}
                      embeddedSplitBreadcrumbs={
                        sideBySideChatVisuallyRight ? (
                          <UnifiedSplitBreadcrumbs
                            aiCompDocked={aiCompDocked}
                            segments={artifactSplitBreadcrumbSegments}
                          />
                        ) : undefined
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>{/* end split inner row */}
      </motion.div>{/* end canvas column wrapper (chat + unified chrome + split row) */}

    </div>
  )
}
