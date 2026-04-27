import { memo } from 'react'
import { MoreHorizontal, ChevronRight, ChevronLeft } from 'lucide-react'

// ── Palette — greyscale shades for stacked charts ────────────────────────────
const GREY = ['#1a1a1a', '#404040', '#6b6b6b', '#9a9a9a', '#c2c2c2', '#e0e0e0']

// ── Chart helpers ─────────────────────────────────────────────────────────────

function BarChart({ data, yLabels, xLabels, yAxisLabel }: {
  data: number[][]        // [series][xIndex]
  yLabels: string[]
  xLabels: string[]
  yAxisLabel?: string
}) {
  const h = 180; const w = 400; const padL = 36; const padB = 28; const padT = 10; const padR = 10
  const chartH = h - padT - padB
  const chartW = w - padL - padR
  const maxVal = Math.max(...yLabels.map(Number))
  const barW = Math.floor(chartW / xLabels.length * 0.55)
  const groupW = chartW / xLabels.length

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {/* Y gridlines + labels */}
      {yLabels.map((label) => {
        const y = padT + chartH - (Number(label) / maxVal) * chartH
        return (
          <g key={label}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#f0f0f0" strokeWidth={1} />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={10} fill="#aaa">{label}</text>
          </g>
        )
      })}
      {/* Y axis label */}
      {yAxisLabel && (
        <text x={8} y={padT + chartH / 2} textAnchor="middle" fontSize={10} fill="#bbb"
          transform={`rotate(-90 8 ${padT + chartH / 2})`}>{yAxisLabel}</text>
      )}
      {/* Bars (stacked) */}
      {xLabels.map((xLabel, xi) => {
        const cx = padL + xi * groupW + groupW / 2
        let stackY = padT + chartH
        return (
          <g key={xLabel}>
            {data.map((series, si) => {
              const val = series[xi] ?? 0
              const bh = (val / maxVal) * chartH
              const by = stackY - bh
              stackY = by
              return (
                <rect key={si} x={cx - barW / 2} y={by} width={barW} height={bh}
                  fill={GREY[si % GREY.length]} rx={2} />
              )
            })}
            <text x={cx} y={h - 4} textAnchor="middle" fontSize={9} fill="#aaa">{xLabel}</text>
          </g>
        )
      })}
      {/* X baseline */}
      <line x1={padL} y1={padT + chartH} x2={w - padR} y2={padT + chartH} stroke="#e8e8e8" strokeWidth={1} />
    </svg>
  )
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', padding: '8px 16px', borderTop: '1px solid #f5f5f5' }}>
      {items.map(({ label, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Card shell ────────────────────────────────────────────────────────────────

function Card({ title, children, legend, minH }: {
  title: string
  children: React.ReactNode
  legend?: { label: string; color: string }[]
  minH?: number
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid #ebebeb',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      minHeight: minH, flex: 1, minWidth: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 10px',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{title}</span>
        <button style={{
          width: 24, height: 24, borderRadius: 5, border: '1px solid #f0f0f0',
          background: 'transparent', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: '#bbb',
        }}>
          <MoreHorizontal size={13} />
        </button>
      </div>
      <div style={{ flex: 1, padding: '0 16px 14px' }}>
        {children}
      </div>
      {legend && <Legend items={legend} />}
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({ title, value, sub, sparkData }: {
  title: string; value: string; sub: string; sparkData: number[]
}) {
  const max = Math.max(...sparkData, 1)
  const w = 80; const h = 28
  const pts = sparkData.map((v, i) =>
    `${(i / (sparkData.length - 1)) * w},${h - (v / max) * h}`
  ).join(' ')

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #ebebeb',
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
      flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{title}</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
          <MoreHorizontal size={13} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1, color: '#111', letterSpacing: '-0.5px' }}>{value}</p>
          <p style={{ fontSize: 11, color: '#aaa', margin: '4px 0 0' }}>{sub}</p>
        </div>
        {/* Sparkline */}
        <svg width={w} height={h} style={{ flexShrink: 0 }}>
          <polyline points={pts} fill="none" stroke="#374151" strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// ── Chart data ────────────────────────────────────────────────────────────────

// Team time off — avg days per day of week
const TIME_OFF_DATA = [[6, 4, 5, 7, 8]] // single series
const TIME_OFF_X = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const TIME_OFF_Y = ['0', '2', '4', '6', '8', '10']

// Open headcount by department — stacked monthly
const HEADCOUNT_DATA = [
  [12, 15, 14, 18, 20, 22, 24, 25],  // Eng
  [8,  9,  10, 11, 12, 13, 14, 15],  // Design
  [5,  6,  6,  7,  8,  9,  9,  10],  // Marketing
]
const HEADCOUNT_X = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Dec']
const HEADCOUNT_Y = ['0', '20', '40', '60', '80']
const HEADCOUNT_LEGEND = [
  { label: 'Engineering', color: GREY[0] },
  { label: 'Design', color: GREY[1] },
  { label: 'Marketing', color: GREY[2] },
]

// Expenses by type — stacked monthly
const EXPENSES_DATA = [
  [30, 32, 31, 33, 35, 34, 36, 35, 37, 38, 36, 40], // Payroll
  [8,  9,  7,  10, 11, 9,  10, 12, 11, 10, 13, 14],  // Corporate
]
const EXPENSES_X = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const EXPENSES_Y = ['0', '20', '40', '60']
const EXPENSES_LEGEND = [
  { label: 'Payroll', color: GREY[0] },
  { label: 'Corporate expenses', color: GREY[1] },
]

// Payroll cost by entity — stacked
const PAYROLL_DATA = [
  [18, 19, 20, 22, 22, 23],  // Acme
  [10, 11, 11, 12, 13, 13],  // Acme Canada
  [8,  8,  9,  9,  10, 10],  // Acme India
  [4,  4,  5,  5,  5,  6],   // GB EOR
  [3,  3,  3,  4,  4,  5],   // Acme Japan
]
const PAYROLL_X = ['Apr', 'May', 'Jun', 'Sep', 'Oct', 'Dec']
const PAYROLL_Y = ['0', '20', '40', '60', '80']
const PAYROLL_LEGEND = [
  { label: 'Acme', color: GREY[0] },
  { label: 'Acme Canada', color: GREY[1] },
  { label: 'Acme India', color: GREY[2] },
  { label: 'GB EOR', color: GREY[3] },
  { label: 'Acme Japan', color: GREY[4] },
]

// ── Main component ────────────────────────────────────────────────────────────

interface CanvasPageProps {
  /** When canvas uses chat-left and the dock is collapsed, show expand next to the title. */
  canvasLeftChatCollapsed?: boolean
  onExpandCanvasLeftChat?: () => void
}

export const CanvasPage = memo(function CanvasPage({
  canvasLeftChatCollapsed,
  onExpandCanvasLeftChat,
}: CanvasPageProps) {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--grey-100)' }}>

      {/* Dashboard — app shell provides the Rippling AI panel (right or left). */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F9F7F6', minWidth: 0 }}>

        {/* Toolbar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #ebebeb',
          padding: '0 20px', height: 50, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {canvasLeftChatCollapsed && onExpandCanvasLeftChat && (
              <button
                type="button"
                onClick={onExpandCanvasLeftChat}
                title="Expand AI chat"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                  border: '1px solid #e8e8e8', background: '#fafafa', cursor: 'pointer', color: '#555',
                }}
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Executive Overview</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f0f0f0', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Live</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['This month', 'Q1 2026', 'YTD'].map((label, i) => (
              <button key={label} style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid #e0e0e0',
                background: i === 0 ? '#111' : '#fff',
                color: i === 0 ? '#fff' : '#555',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Row 1: 4 metric cards */}
          <div style={{ display: 'flex', gap: 16 }}>
            <MetricCard title="Executive summary" value="1"      sub="Active user"          sparkData={[1, 1, 1, 1, 1]} />
            <MetricCard title="Payroll"           value="4"      sub="Tasks due Nov 23"     sparkData={[2, 3, 4, 3, 4]} />
            <MetricCard title="Device inventory"  value="0"      sub="Devices enrolled"     sparkData={[2, 1, 0, 0, 0]} />
            <MetricCard title="Approvals"         value="0"      sub="Pending requests"     sparkData={[3, 2, 1, 0, 0]} />
          </div>

          {/* Row 2: 2 chart cards */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Card title="Team time off" minH={260}>
              <p style={{ fontSize: 11, color: '#bbb', margin: '0 0 8px' }}>Average days · This week</p>
              <BarChart
                data={TIME_OFF_DATA}
                yLabels={TIME_OFF_Y}
                xLabels={TIME_OFF_X}
                yAxisLabel="Days"
              />
            </Card>

            <Card title="Open headcount by department" legend={HEADCOUNT_LEGEND} minH={260}>
              <p style={{ fontSize: 11, color: '#bbb', margin: '0 0 8px' }}>Headcount · Apr – Dec 2025</p>
              <BarChart
                data={HEADCOUNT_DATA}
                yLabels={HEADCOUNT_Y}
                xLabels={HEADCOUNT_X}
                yAxisLabel="Headcount"
              />
            </Card>
          </div>

          {/* Row 3: 2 chart cards */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Card title="Expenses by type" legend={EXPENSES_LEGEND} minH={260}>
              <p style={{ fontSize: 11, color: '#bbb', margin: '0 0 8px' }}>Cost · Jan – Dec 2025</p>
              <BarChart
                data={EXPENSES_DATA}
                yLabels={EXPENSES_Y}
                xLabels={EXPENSES_X}
                yAxisLabel="Cost ($k)"
              />
            </Card>

            <Card title="Payroll cost by entity" legend={PAYROLL_LEGEND} minH={260}>
              <p style={{ fontSize: 11, color: '#bbb', margin: '0 0 8px' }}>Headcount · Apr – Dec 2025</p>
              <BarChart
                data={PAYROLL_DATA}
                yLabels={PAYROLL_Y}
                xLabels={PAYROLL_X}
                yAxisLabel="Headcount"
              />
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
})
