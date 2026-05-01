import type { CSSProperties } from 'react'
import { MoreHorizontal, Share2 } from 'lucide-react'

/**
 * Dashboards Beta — chrome neutrals from the People analytics mock; **chart fills** use the
 * six-stop pink → maroon ramp from the design reference (swatches, light → dark).
 */
export const DASHBOARD_BETA = {
  canvas: '#f9f7f6',
  surface: '#ffffff',
  stroke: '#e0dede',
  text: '#000000',
  textSecondary: '#595555',
  textMuted: '#716f6c',
  brand: '#7a005d',
  railAccent: '#b9dbf3',
  /**
   * Stacked / multi-series bars — inverted from the swatch strip: index 0 = deepest (bottom of stack), 5 = palest.
   */
  chartSeries: ['#4a0e26', '#7a005d', '#b91d5f', '#e34a94', '#f19cc5', '#f9d5e5'] as const,
  sparkStroke: '#4a0e26',
} as const

/** Framed tiles on dashboard / canvas — distinct from borderless chat chart artifacts. */
const DASHBOARD_CARD_OUTLINE: CSSProperties = {
  border: `1px solid ${DASHBOARD_BETA.stroke}`,
  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.10)',
}

/** @deprecated Use `DASHBOARD_BETA.chartSeries`. */
export const DASHBOARD_CHART_GREY = [...DASHBOARD_BETA.chartSeries] as string[]

export function BarChart({ data, yLabels, xLabels, yAxisLabel }: {
  data: number[][]
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
      {yLabels.map((label) => {
        const y = padT + chartH - (Number(label) / maxVal) * chartH
        return (
          <g key={label}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke={DASHBOARD_BETA.stroke} strokeOpacity={0.65} strokeWidth={1} />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={10} fill={DASHBOARD_BETA.textMuted}>{label}</text>
          </g>
        )
      })}
      {yAxisLabel && (
        <text x={8} y={padT + chartH / 2} textAnchor="middle" fontSize={10} fill={DASHBOARD_BETA.textMuted}
          transform={`rotate(-90 8 ${padT + chartH / 2})`}>{yAxisLabel}</text>
      )}
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
                <rect
                  key={si}
                  x={cx - barW / 2}
                  y={by}
                  width={barW}
                  height={bh}
                  fill={DASHBOARD_BETA.chartSeries[si % DASHBOARD_BETA.chartSeries.length]}
                  rx={2}
                />
              )
            })}
            <text x={cx} y={h - 4} textAnchor="middle" fontSize={9} fill={DASHBOARD_BETA.textSecondary}>{xLabel}</text>
          </g>
        )
      })}
      <line x1={padL} y1={padT + chartH} x2={w - padR} y2={padT + chartH} stroke={DASHBOARD_BETA.stroke} strokeWidth={1} />
    </svg>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', padding: '8px 16px 0' }}>
      {items.map(({ label, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 400, color: DASHBOARD_BETA.textSecondary }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export function ChartCard({ title, children, legend, minH }: {
  title: string
  children: React.ReactNode
  legend?: { label: string; color: string }[]
  minH?: number
}) {
  return (
    <div style={{
      background: DASHBOARD_BETA.surface,
      borderRadius: 16,
      ...DASHBOARD_CARD_OUTLINE,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: minH,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 10px',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-heading)', color: DASHBOARD_BETA.text }}>{title}</span>
        <button type="button" style={{
          width: 24, height: 24, borderRadius: 5, border: 'none', outline: 'none', boxShadow: 'none',
          background: 'transparent', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: DASHBOARD_BETA.textMuted,
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

/** Figma `embedded report` — header with Rippling mark + share (People analytics row). */
export function EmbeddedAiMetricCard({ title, value, sub, sparkData }: {
  title: string; value: string; sub: string; sparkData: number[]
}) {
  const max = Math.max(...sparkData, 1)
  const w = 80; const h = 28
  const pts = sparkData.map((v, i) =>
    `${(i / (sparkData.length - 1)) * w},${h - (v / max) * h}`
  ).join(' ')

  return (
    <div style={{
      background: DASHBOARD_BETA.surface,
      borderRadius: 16,
      ...DASHBOARD_CARD_OUTLINE,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        height: 44, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <img src="/rippling-ai.png" width={16} height={16} alt="" style={{ display: 'block', flexShrink: 0 }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              color: DASHBOARD_BETA.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        </div>
        <button type="button" title="Share" style={{
          width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DASHBOARD_BETA.textMuted,
        }}>
          <Share2 size={16} strokeWidth={1.8} />
        </button>
      </div>
      <div style={{ padding: '12px 16px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontSize: 28, fontWeight: 400, margin: 0, lineHeight: 1, color: DASHBOARD_BETA.text, letterSpacing: '-0.5px' }}>{value}</p>
          <p style={{ fontSize: 11, fontWeight: 400, color: DASHBOARD_BETA.textMuted, margin: '6px 0 0' }}>{sub}</p>
        </div>
        <svg width={w} height={h} style={{ flexShrink: 0 }}>
          <polyline points={pts} fill="none" stroke={DASHBOARD_BETA.sparkStroke} strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export function MetricCard({ title, value, sub, sparkData }: {
  title: string; value: string; sub: string; sparkData: number[]
}) {
  const max = Math.max(...sparkData, 1)
  const w = 80; const h = 28
  const pts = sparkData.map((v, i) =>
    `${(i / (sparkData.length - 1)) * w},${h - (v / max) * h}`
  ).join(' ')

  return (
    <div style={{
      background: DASHBOARD_BETA.surface,
      borderRadius: 16,
      ...DASHBOARD_CARD_OUTLINE,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-heading)', color: DASHBOARD_BETA.textSecondary }}>
          {title}
        </span>
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: DASHBOARD_BETA.textMuted }}>
          <MoreHorizontal size={13} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontSize: 28, fontWeight: 400, margin: 0, lineHeight: 1, color: DASHBOARD_BETA.text, letterSpacing: '-0.5px' }}>{value}</p>
          <p style={{ fontSize: 11, fontWeight: 400, color: DASHBOARD_BETA.textMuted, margin: '4px 0 0' }}>{sub}</p>
        </div>
        <svg width={w} height={h} style={{ flexShrink: 0 }}>
          <polyline points={pts} fill="none" stroke={DASHBOARD_BETA.sparkStroke} strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

const TIME_OFF_DATA = [[6, 4, 5, 7, 8]]
const TIME_OFF_X = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const TIME_OFF_Y = ['0', '2', '4', '6', '8', '10']

const HEADCOUNT_DATA = [
  [12, 15, 14, 18, 20, 22, 24, 25],
  [8,  9,  10, 11, 12, 13, 14, 15],
  [5,  6,  6,  7,  8,  9,  9,  10],
]
const HEADCOUNT_X = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Dec']
const HEADCOUNT_Y = ['0', '20', '40', '60', '80']
const HEADCOUNT_LEGEND = [
  { label: 'Engineering', color: DASHBOARD_BETA.chartSeries[0] },
  { label: 'Design', color: DASHBOARD_BETA.chartSeries[1] },
  { label: 'Marketing', color: DASHBOARD_BETA.chartSeries[2] },
]

const EXPENSES_DATA = [
  [30, 32, 31, 33, 35, 34, 36, 35, 37, 38, 36, 40],
  [8,  9,  7,  10, 11, 9,  10, 12, 11, 10, 13, 14],
]
const EXPENSES_X = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const EXPENSES_Y = ['0', '20', '40', '60']
const EXPENSES_LEGEND = [
  { label: 'Payroll', color: DASHBOARD_BETA.chartSeries[3] },
  { label: 'Corporate expenses', color: DASHBOARD_BETA.chartSeries[4] },
]

const PAYROLL_DATA = [
  [18, 19, 20, 22, 22, 23],
  [10, 11, 11, 12, 13, 13],
  [8,  8,  9,  9,  10, 10],
  [4,  4,  5,  5,  5,  6],
  [3,  3,  3,  4,  4,  5],
]
const PAYROLL_X = ['Apr', 'May', 'Jun', 'Sep', 'Oct', 'Dec']
const PAYROLL_Y = ['0', '20', '40', '60', '80']
const PAYROLL_LEGEND = [
  { label: 'Acme', color: DASHBOARD_BETA.chartSeries[0] },
  { label: 'Acme Canada', color: DASHBOARD_BETA.chartSeries[1] },
  { label: 'Acme India', color: DASHBOARD_BETA.chartSeries[2] },
  { label: 'GB EOR', color: DASHBOARD_BETA.chartSeries[3] },
  { label: 'Acme Japan', color: DASHBOARD_BETA.chartSeries[4] },
]

/** Chart + KPI grid used by Canvas and Dashboard (Beta) pages. */
export function DashboardChartsGrid() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <EmbeddedAiMetricCard title="Executive summary" value="1" sub="User" sparkData={[1, 1, 1, 1, 1]} />
        <MetricCard title="Payroll" value="4" sub="Tasks due Nov 23" sparkData={[2, 3, 4, 3, 4]} />
        <MetricCard title="Device inventory" value="0" sub="Devices enrolled" sparkData={[2, 1, 0, 0, 0]} />
        <MetricCard title="Approvals" value="0" sub="Pending requests" sparkData={[3, 2, 1, 0, 0]} />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <ChartCard title="Team time off" minH={260}>
          <p style={{ fontSize: 11, fontWeight: 400, color: DASHBOARD_BETA.textMuted, margin: '0 0 8px' }}>Average days · This week</p>
          <BarChart data={TIME_OFF_DATA} yLabels={TIME_OFF_Y} xLabels={TIME_OFF_X} yAxisLabel="Days" />
        </ChartCard>
        <ChartCard title="Open headcount by department" legend={HEADCOUNT_LEGEND} minH={260}>
          <p style={{ fontSize: 11, fontWeight: 400, color: DASHBOARD_BETA.textMuted, margin: '0 0 8px' }}>Headcount · Apr – Dec 2025</p>
          <BarChart data={HEADCOUNT_DATA} yLabels={HEADCOUNT_Y} xLabels={HEADCOUNT_X} yAxisLabel="Headcount" />
        </ChartCard>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <ChartCard title="Expenses by type" legend={EXPENSES_LEGEND} minH={260}>
          <p style={{ fontSize: 11, fontWeight: 400, color: DASHBOARD_BETA.textMuted, margin: '0 0 8px' }}>Cost · Jan – Dec 2025</p>
          <BarChart data={EXPENSES_DATA} yLabels={EXPENSES_Y} xLabels={EXPENSES_X} yAxisLabel="Cost ($k)" />
        </ChartCard>
        <ChartCard title="Payroll cost by entity" legend={PAYROLL_LEGEND} minH={260}>
          <p style={{ fontSize: 11, fontWeight: 400, color: DASHBOARD_BETA.textMuted, margin: '0 0 8px' }}>Headcount · Apr – Dec 2025</p>
          <BarChart data={PAYROLL_DATA} yLabels={PAYROLL_Y} xLabels={PAYROLL_X} yAxisLabel="Headcount" />
        </ChartCard>
      </div>
    </div>
  )
}
