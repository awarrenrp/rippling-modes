import React, { cloneElement, isValidElement, useId, useRef } from 'react'
import { useContainerWidth } from '../../hooks/useContainerWidth'
import { Icon } from '../Icon'

/**
 * Monthly headcount values used across line + column chart artifacts
 * (matches the AI-components chart frame series; Figma frame width 760px).
 */
export const FIGMA_MONTHLY_HEADCOUNT = [72, 74, 76, 78, 80, 82, 84, 85, 86, 88, 90, 92] as const

/** Figma “Chart” instance artboard width for proportional layout. */
export const FIGMA_CHART_FRAME_WIDTH = 760

/** Total height for every chart artifact card (header + plot + legend + footer). */
export const CHART_ARTIFACT_HEIGHT = 363

/**
 * AI-components chart palette — sampled from Figma stacked bar `267:16512`
 * (stack frames, axis “value” text, guides, legend, icon buttons, categorical bases).
 */
const CHART = {
  brand: '#7A005D',
  /** Berry stack ramp (Figma bar segment fills, bottom → top in hue order) */
  stackPale: '#fce9ff',
  stackLight: '#eab8f2',
  stackMid: '#ce71bb',
  stackDeep: '#9f1e7a',
  stackDarkest: '#4a0039',
  /** Categorical legend bases from same Figma file */
  catSun: '#ffa81d',
  catOrange: '#d74518',
  catNavy: '#47669f',
  catTeal: '#2db9b0',
  catPeach: '#ffd694',
  catSalmon: '#e88668',
  catSky: '#5aa5e7',
  catMint: '#85d3bd',
  teal: '#2db9b0',
  amber: '#d74518',
  indigo: '#47669f',
  rose: '#e11d48',
  violet: '#7c3aed',
  emerald: '#059669',
  slate: '#94a3b8',
  slateMuted: '#cbd5e1',
  axis: '#595555',
  axisMuted: '#716f6c',
  legendLabel: '#595555',
  grid: '#e0dede',
  gridLight: 'color-mix(in srgb, #e0dede 52%, transparent)',
  reportInk: '#000000',
  chartSurface: '#ffffff',
  iconBlueTint: '#b9dbf3',
  iconBlueInk: '#05142e',
} as const

/**
 * Fills remaining vertical space inside `ReportChartShell`.
 * Uses `meet` so the full plot scales into the slot without cropping — narrow sidebar chat
 * stays readable instead of looking like a zoomed crop of the wide layout (`slice` did that).
 */
function ChartPlotSlot({ children }: { children: React.ReactNode }) {
  if (isValidElement(children) && children.type === 'svg') {
    const prevStyle = (children.props as { style?: React.CSSProperties }).style
    return (
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, width: '100%', position: 'relative', overflow: 'hidden' }}>
        {cloneElement(children as React.ReactElement<React.SVGProps<SVGSVGElement>>, {
          width: '100%',
          height: '100%',
          preserveAspectRatio: 'xMidYMid meet',
          style: { ...prevStyle, position: 'absolute', inset: 0, display: 'block', maxWidth: 'none', height: '100%' },
        })}
      </div>
    )
  }
  return <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'auto' }}>{children}</div>
}

/** Matches AI-components chart frames (report title, grid, legend, source). */
function ReportChartShell({
  title,
  subtitle,
  children,
  legend,
  source = 'Source: Rippling HRIS · Updated Apr 28, 2026',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  legend: React.ReactNode
  source?: string
}) {
  return (
    <div
      style={{
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        borderRadius: 10,
        overflow: 'hidden',
        width: '100%',
        height: CHART_ARTIFACT_HEIGHT,
        minHeight: CHART_ARTIFACT_HEIGHT,
        maxHeight: CHART_ARTIFACT_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: CHART.chartSurface,
          flexShrink: 0,
        }}
      >
        <Icon name="monitoring" size={14} style={{ color: CHART.brand, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-heading)', color: CHART.reportInk }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 10.5, fontWeight: 400, color: CHART.axisMuted, marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: CHART.chartSurface,
          padding: '8px 14px 4px',
        }}
      >
        <ChartPlotSlot>{children}</ChartPlotSlot>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 14px',
            marginTop: 8,
            paddingTop: 8,
            flexShrink: 0,
          }}
        >
          {legend}
        </div>
      </div>
      <div
        style={{
          background: CHART.chartSurface,
          padding: '6px 14px 8px',
          fontSize: 10,
          fontWeight: 400,
          color: CHART.axisMuted,
          flexShrink: 0,
        }}
      >
        {source}
      </div>
    </div>
  )
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 12,
          height: 8,
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 10, color: CHART.legendLabel, fontWeight: 400 }}>{label}</span>
    </div>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function HeadcountTrendChartArtifact() {
  const w = 320
  const h = 124
  const padL = 32
  const padR = 10
  const padT = 10
  const padB = 24
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxY = 100
  const pts = FIGMA_MONTHLY_HEADCOUNT.map((v, i) => {
    const x = padL + (i / (FIGMA_MONTHLY_HEADCOUNT.length - 1)) * innerW
    const y = padT + innerH - (v / maxY) * innerH
    return { x, y, v }
  })
  const lineD = `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')}`
  const areaD = `${lineD} L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`

  return (
    <ReportChartShell
      title="Headcount trend"
      subtitle="Total active employees · trailing 12 months"
      legend={<LegendSwatch color={CHART.brand} label="Headcount" />}
    >
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="ripplingHeadcountArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.22} />
            <stop offset="100%" stopColor={CHART.brand} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="ripplingHeadcountLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5c0047" />
            <stop offset="100%" stopColor={CHART.brand} />
          </linearGradient>
        </defs>
        {/* Y spine */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
        {[0, 20, 40, 60, 80, 100].map((tick) => {
          const y = padT + innerH - (tick / maxY) * innerH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke={tick === 0 ? CHART.grid : CHART.gridLight} strokeWidth={1} />
              <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
                {tick}
              </text>
            </g>
          )
        })}
        {MONTHS.map((_, i) => {
          const x = padL + (i / (MONTHS.length - 1)) * innerW
          return <line key={i} x1={x} y1={padT} x2={x} y2={padT + innerH} stroke={CHART.gridLight} strokeWidth={1} />
        })}
        <path d={areaD} fill="url(#ripplingHeadcountArea)" stroke="none" />
        <path d={lineD} fill="none" stroke="url(#ripplingHeadcountLine)" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#fff" stroke={CHART.brand} strokeWidth={1.75} />
        ))}
        {MONTHS.map((m, i) => {
          const x = padL + (i / (MONTHS.length - 1)) * innerW
          return (
            <text key={m} x={x} y={h - 5} textAnchor="middle" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
              {m}
            </text>
          )
        })}
      </svg>
    </ReportChartShell>
  )
}

const DEPT_Q = [
  { q: 'Q1', eng: 42, sales: 28, ops: 18 },
  { q: 'Q2', eng: 44, sales: 29, ops: 19 },
  { q: 'Q3', eng: 46, sales: 30, ops: 20 },
  { q: 'Q4', eng: 48, sales: 32, ops: 21 },
]

/** Stacked series — Figma berry ramp bottom → top (ops → sales → eng). */
const STACK_COLORS = [
  { key: 'ops', c: CHART.stackLight, label: 'Operations' },
  { key: 'sales', c: CHART.stackMid, label: 'Sales' },
  { key: 'eng', c: CHART.stackDarkest, label: 'Engineering' },
] as const

/**
 * Stacked vertical bars — AI-components `Chart type=Stacked bar chart, Size=Full` (Figma 267:16512):
 * ~712×380 artboard: report header row, chart + Y axis, legends, instruction copy.
 */
export function DepartmentPayrollMixChartArtifact() {
  const w = 712
  const chartH = 258
  const padL = 40
  const padR = 20
  const padT = 12
  const padB = 36
  const innerW = w - padL - padR
  const innerH = chartH - padT - padB
  const groupW = innerW / DEPT_Q.length

  return (
    <div
      style={{
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        borderRadius: 10,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 712,
        height: CHART_ARTIFACT_HEIGHT,
        minHeight: CHART_ARTIFACT_HEIGHT,
        maxHeight: CHART_ARTIFACT_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 44,
          padding: '0 14px',
          background: CHART.chartSurface,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-heading)', color: CHART.reportInk }}>
          Payroll mix by department
        </span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: CHART.chartSurface,
          padding: '8px 14px 0',
        }}
      >
        <ChartPlotSlot>
          <svg width="100%" height={chartH} viewBox={`0 0 ${w} ${chartH}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
          <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = padT + innerH - (tick / 100) * innerH
            return (
              <g key={tick}>
                <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke={tick === 0 ? CHART.grid : CHART.gridLight} strokeWidth={1} />
                <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={11} fill={CHART.axisMuted} fontFamily="inherit">
                  {tick}%
                </text>
              </g>
            )
          })}
          {DEPT_Q.map((row, gi) => {
            const cx = padL + gi * groupW + groupW * 0.5
            const barWide = groupW * 0.5
            const total = row.eng + row.sales + row.ops
            const segs = STACK_COLORS.map((sc) => ({ v: row[sc.key as keyof typeof row] as number, c: sc.c }))
            let yBottom = padT + innerH
            return (
              <g key={row.q}>
                {segs.map((s, idx) => {
                  const frac = s.v / total
                  const hBar = frac * innerH
                  yBottom -= hBar
                  return (
                    <rect
                      key={idx}
                      x={cx - barWide / 2}
                      y={yBottom}
                      width={barWide}
                      height={Math.max(hBar, 0.5)}
                      fill={s.c}
                      rx={3}
                    />
                  )
                })}
                <text x={cx} y={chartH - 10} textAnchor="middle" fontSize={11} fill={CHART.reportInk} fontWeight={400} fontFamily="inherit">
                  {row.q}
                </text>
              </g>
            )
          })}
        </svg>
        </ChartPlotSlot>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 16px',
            padding: '8px 0 6px',
            flexShrink: 0,
          }}
        >
          {STACK_COLORS.map((s) => (
            <LegendSwatch key={s.key} color={s.c} label={s.label} />
          ))}
        </div>
      </div>

      <div
        style={{
          background: CHART.chartSurface,
          padding: '8px 14px 10px',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 10,
            lineHeight: 1.4,
            color: CHART.axisMuted,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          Share of gross payroll by department for each quarter. Operations, Sales, and Engineering segments stack to 100% per bar.
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 9, lineHeight: 1.35, color: CHART.axisMuted, opacity: 0.85 }}>
          This is an AI-generated summary for preview. Source: Rippling HRIS · Updated Apr 28, 2026
        </p>
      </div>
    </div>
  )
}

const FUNNEL = [
  { label: 'Applicants', v: 100, c: CHART.brand },
  { label: 'Phone screen', v: 62, c: CHART.indigo },
  { label: 'On-site', v: 34, c: CHART.teal },
  { label: 'Offer', v: 12, c: CHART.amber },
  { label: 'Hired', v: 7, c: CHART.emerald },
]

export function HiringFunnelChartArtifact() {
  const w = 320
  const rowH = 24
  const padL = 100
  const padR = 14
  const maxV = FUNNEL[0].v
  const plotW = w - padL - padR

  return (
    <ReportChartShell
      title="Hiring funnel"
      subtitle="Open roles · last 90 days"
      legend={FUNNEL.map((row) => (
        <LegendSwatch key={row.label} color={row.c} label={row.label} />
      ))}
    >
      <svg width="100%" height={FUNNEL.length * rowH + 10} viewBox={`0 0 ${w} ${FUNNEL.length * rowH + 10}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          {FUNNEL.map((row) => (
            <linearGradient key={row.label} id={`funnel-${row.label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={row.c} stopOpacity={0.92} />
              <stop offset="100%" stopColor={row.c} stopOpacity={0.55} />
            </linearGradient>
          ))}
        </defs>
        {FUNNEL.map((row, i) => {
          const y = 8 + i * rowH
          const bw = (plotW * row.v) / maxV
          const gid = `funnel-${row.label.replace(/\s+/g, '')}`
          return (
            <g key={row.label}>
              <text x={padL - 10} y={y + 14} textAnchor="end" fontSize={9} fill={CHART.axis} fontWeight={400} fontFamily="inherit">
                {row.label}
              </text>
              <rect x={padL} y={y + 5} width={bw} height={rowH - 12} fill={`url(#${gid})`} rx={4} />
              <text x={padL + bw + 8} y={y + 14} fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
                {row.v}%
              </text>
            </g>
          )
        })}
      </svg>
    </ReportChartShell>
  )
}

const TEAMS = ['Eng', 'Sales', 'Ops', 'Mktg', 'HR', 'Fin']
const T2025 = [4.2, 6.1, 5.8, 7.2, 3.1, 2.4]
const T2026 = [3.8, 5.4, 5.2, 6.0, 2.9, 2.1]

export function TurnoverByTeamChartArtifact() {
  const w = 320
  const h = 130
  const padL = 28
  const padR = 10
  const padT = 8
  const padB = 24
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const slot = innerW / TEAMS.length
  const bw = slot * 0.26
  const maxY = 8
  const c2025 = CHART.slate
  const c2026 = CHART.brand

  return (
    <ReportChartShell
      title="Voluntary turnover by team"
      subtitle="Rolling 12 months · % of avg headcount"
      legend={(
        <>
          <LegendSwatch color={c2025} label="2025" />
          <LegendSwatch color={c2026} label="2026" />
        </>
      )}
    >
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="turnover2026" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8f0a6d" />
            <stop offset="100%" stopColor={CHART.brand} />
          </linearGradient>
        </defs>
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
        {[0, 2, 4, 6, 8].map((tick) => {
          const y = padT + innerH - (tick / maxY) * innerH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke={tick === 0 ? CHART.grid : CHART.gridLight} strokeWidth={1} />
              <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
                {tick}%
              </text>
            </g>
          )
        })}
        {TEAMS.map((t, i) => {
          const cx = padL + i * slot + slot / 2
          const h25 = (T2025[i] / maxY) * innerH
          const h26 = (T2026[i] / maxY) * innerH
          return (
            <g key={t}>
              <rect
                x={cx - bw - 3}
                y={padT + innerH - h25}
                width={bw}
                height={h25}
                fill={CHART.slateMuted}
                stroke={c2025}
                strokeWidth={1}
                rx={2}
              />
              <rect x={cx + 3} y={padT + innerH - h26} width={bw} height={h26} fill="url(#turnover2026)" rx={2} />
              <text x={cx} y={h - 5} textAnchor="middle" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
                {t}
              </text>
            </g>
          )
        })}
      </svg>
    </ReportChartShell>
  )
}

// ─── Generic / “chart type” examples (Basel-style) ───────────────────────────

export function VerticalBarChartArtifact({ fluid }: { fluid?: boolean } = {}) {
  const gid = useId().replace(/:/g, '')
  const wrapRef = useRef<HTMLDivElement>(null)
  const measured = useContainerWidth(wrapRef)

  const w = FIGMA_CHART_FRAME_WIDTH
  const h = 148
  const padL = 56
  const padR = 24
  const padT = 14
  const padB = 40
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxY = 100
  const n = MONTHS.length
  const slot = innerW / n
  const bw = slot * 0.48
  const vals = FIGMA_MONTHLY_HEADCOUNT

  /** Wide canvas rail (fluid): plot labels use 12px spec, scaling down only when the host is narrow. */
  const designPlotPx = 12
  const scale =
    fluid && measured > 48 ? Math.min(1.35, Math.max(0.72, measured / w)) : 1
  const fsTick = fluid
    ? Math.min(designPlotPx, Math.max(8, Math.round(designPlotPx * Math.min(1, scale))))
    : Math.max(8, Math.round(11 * scale))
  const fsMonth = fluid
    ? Math.min(designPlotPx, Math.max(7.5, Math.round(designPlotPx * Math.min(1, scale))))
    : Math.max(7.5, Math.round(11 * scale))

  const chart = (
    <ReportChartShell
      title="Headcount by month"
      subtitle="Column chart · same monthly series as Figma AI-components chart (0–100 axis)"
      legend={<LegendSwatch color={CHART.brand} label="Active employees" />}
    >
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', height: 'auto', maxWidth: '100%' }}
      >
        <defs>
          <linearGradient id={`barColGrad-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8f0a6d" />
            <stop offset="100%" stopColor={CHART.brand} />
          </linearGradient>
        </defs>
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
        {[0, 20, 40, 60, 80, 100].map((tick) => {
          const y = padT + innerH - (tick / maxY) * innerH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke={tick === 0 ? CHART.grid : CHART.gridLight} strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={fsTick} fill={CHART.axisMuted} fontFamily="inherit">
                {tick}
              </text>
            </g>
          )
        })}
        {MONTHS.map((lab, i) => {
          const cx = padL + i * slot + slot / 2
          const bh = (vals[i] / maxY) * innerH
          return (
            <g key={lab}>
              <rect
                x={cx - bw / 2}
                y={padT + innerH - bh}
                width={bw}
                height={Math.max(bh, 1)}
                fill={`url(#barColGrad-${gid})`}
                rx={4}
              />
              <text x={cx} y={h - 10} textAnchor="middle" fontSize={fsMonth} fill={CHART.axisMuted} fontFamily="inherit">
                {lab}
              </text>
            </g>
          )
        })}
      </svg>
    </ReportChartShell>
  )

  if (!fluid) return chart
  return (
    <div ref={wrapRef} style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {chart}
    </div>
  )
}

const HBAR_ROWS = [
  { label: 'Benefits', v: 88 },
  { label: 'Payroll', v: 72 },
  { label: 'IT', v: 64 },
  { label: 'HR Ops', v: 54 },
  { label: 'Finance', v: 41 },
]

export function HorizontalBarChartArtifact() {
  const w = 320
  const rowH = 26
  const padL = 72
  const padR = 12
  const maxV = 100
  const plotW = w - padL - padR

  return (
    <ReportChartShell
      title="Ticket volume by queue"
      subtitle="Horizontal bar chart · sample artifact"
      legend={<LegendSwatch color={CHART.teal} label="Open tickets" />}
    >
      <svg width="100%" height={HBAR_ROWS.length * rowH + 10} viewBox={`0 0 ${w} ${HBAR_ROWS.length * rowH + 10}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="hbarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={CHART.teal} stopOpacity={0.55} />
            <stop offset="100%" stopColor={CHART.teal} stopOpacity={0.95} />
          </linearGradient>
        </defs>
        {HBAR_ROWS.map((row, i) => {
          const y = 8 + i * rowH
          const bw = (plotW * row.v) / maxV
          return (
            <g key={row.label}>
              <text x={padL - 8} y={y + 15} textAnchor="end" fontSize={9} fill={CHART.axis} fontWeight={400} fontFamily="inherit">
                {row.label}
              </text>
              <rect x={padL} y={y + 6} width={bw} height={rowH - 14} fill="url(#hbarGrad)" rx={4} />
              <text x={padL + bw + 6} y={y + 15} fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
                {row.v}
              </text>
            </g>
          )
        })}
      </svg>
    </ReportChartShell>
  )
}

const LINE_A = [38, 42, 40, 48, 52, 50, 58, 62, 60, 66, 70, 74]
const LINE_B = [28, 30, 34, 32, 36, 40, 38, 44, 48, 46, 52, 56]

export function LineComparisonChartArtifact() {
  const w = 320
  const h = 124
  const padL = 32
  const padR = 10
  const padT = 10
  const padB = 24
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxY = 80
  const toPts = (arr: number[]) =>
    arr.map((v, i) => {
      const x = padL + (i / (arr.length - 1)) * innerW
      const y = padT + innerH - (v / maxY) * innerH
      return `${x},${y}`
    })
  const dA = `M ${toPts(LINE_A).join(' L ')}`
  const dB = `M ${toPts(LINE_B).join(' L ')}`

  return (
    <ReportChartShell
      title="Benefits vs payroll spend"
      subtitle="Multi-line chart · sample artifact"
      legend={(
        <>
          <LegendSwatch color={CHART.brand} label="Benefits" />
          <LegendSwatch color={CHART.teal} label="Payroll" />
        </>
      )}
    >
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
        {[0, 20, 40, 60, 80].map((tick) => {
          const y = padT + innerH - (tick / maxY) * innerH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke={tick === 0 ? CHART.grid : CHART.gridLight} strokeWidth={1} />
              <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
                {tick}
              </text>
            </g>
          )
        })}
        <path d={dB} fill="none" stroke={CHART.teal} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
        <path d={dA} fill="none" stroke={CHART.brand} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
        {MONTHS.map((m, i) => {
          const x = padL + (i / (MONTHS.length - 1)) * innerW
          return (
            <text key={m} x={x} y={h - 5} textAnchor="middle" fontSize={8} fill={CHART.axisMuted} fontFamily="inherit">
              {m}
            </text>
          )
        })}
      </svg>
    </ReportChartShell>
  )
}

const AREA_U = [22, 28, 26, 32, 38, 36, 40, 44, 42, 48, 52, 50]
const AREA_V = [18, 20, 24, 22, 26, 30, 28, 32, 36, 34, 38, 40]

export function AreaStackedChartArtifact() {
  const w = 320
  const h = 124
  const padL = 32
  const padR = 10
  const padT = 10
  const padB = 24
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxY = 80
  const baseY = padT + innerH
  const xs = AREA_U.map((_, i) => padL + (i / (AREA_U.length - 1)) * innerW)
  const yu = (v: number) => padT + innerH - (v / maxY) * innerH
  const sumUV = AREA_U.map((u, i) => u + AREA_V[i])

  return (
    <ReportChartShell
      title="Loaded cost vs base salary"
      subtitle="Stacked area chart · sample artifact"
      legend={(
        <>
          <LegendSwatch color={CHART.indigo} label="Loaded cost" />
          <LegendSwatch color={CHART.amber} label="Base salary" />
        </>
      )}
    >
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="areaLower" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.amber} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART.amber} stopOpacity={0.08} />
          </linearGradient>
          <linearGradient id="areaUpper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.indigo} stopOpacity={0.4} />
            <stop offset="100%" stopColor={CHART.indigo} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
        {[0, 20, 40, 60, 80].map((tick) => {
          const y = padT + innerH - (tick / maxY) * innerH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke={tick === 0 ? CHART.grid : CHART.gridLight} strokeWidth={1} />
              <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
                {tick}
              </text>
            </g>
          )
        })}
        <path
          d={`M ${xs[0]},${baseY} ${AREA_V.map((v, i) => `L ${xs[i]},${yu(v)}`).join(' ')} L ${xs[xs.length - 1]},${baseY} Z`}
          fill="url(#areaLower)"
          stroke="none"
        />
        <path
          d={`M ${xs[0]},${yu(sumUV[0])} ${sumUV.map((s, i) => `L ${xs[i]},${yu(s)}`).join(' ')} L ${xs[xs.length - 1]},${yu(AREA_V[AREA_V.length - 1])} ${AREA_V.map((_, i) => {
            const j = AREA_V.length - 1 - i
            return `L ${xs[j]},${yu(AREA_V[j])}`
          }).join(' ')} Z`}
          fill="url(#areaUpper)"
          stroke="none"
        />
        <path d={`M ${xs.map((x, i) => `${x},${yu(sumUV[i])}`).join(' L ')}`} fill="none" stroke={CHART.indigo} strokeWidth={2} strokeLinecap="round" />
        {MONTHS.map((m, i) => (
          <text key={m} x={xs[i]} y={h - 5} textAnchor="middle" fontSize={8} fill={CHART.axisMuted} fontFamily="inherit">
            {m}
          </text>
        ))}
      </svg>
    </ReportChartShell>
  )
}

const DONUT = [
  { label: 'Medical', pct: 38, c: CHART.brand },
  { label: 'Dental', pct: 22, c: CHART.teal },
  { label: 'Vision', pct: 16, c: CHART.amber },
  { label: 'HSA', pct: 14, c: CHART.indigo },
  { label: 'Other', pct: 10, c: CHART.slate },
]

export function DonutChartArtifact() {
  const cx = 120
  const cy = 62
  const rOut = 48
  const rIn = 30
  let ang = -Math.PI / 2
  const arcs: { d: string; c: string }[] = []
  for (const s of DONUT) {
    const a = (s.pct / 100) * Math.PI * 2 * 0.999
    const x1 = cx + rOut * Math.cos(ang)
    const y1 = cy + rOut * Math.sin(ang)
    ang += a
    const x2 = cx + rOut * Math.cos(ang)
    const y2 = cy + rOut * Math.sin(ang)
    const large = a > Math.PI ? 1 : 0
    const x3 = cx + rIn * Math.cos(ang)
    const y3 = cy + rIn * Math.sin(ang)
    const x4 = cx + rIn * Math.cos(ang - a)
    const y4 = cy + rIn * Math.sin(ang - a)
    const d = `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`
    arcs.push({ d, c: s.c })
  }

  return (
    <ReportChartShell
      title="Benefits enrollment mix"
      subtitle="Donut / pie chart · sample artifact"
      legend={DONUT.map((s) => (
        <LegendSwatch key={s.label} color={s.c} label={`${s.label} (${s.pct}%)`} />
      ))}
    >
      <svg width="100%" height={124} viewBox="0 0 320 124" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <g transform="translate(40, 0)">
          {arcs.map((slice, i) => (
            <path key={i} d={slice.d} fill={slice.c} stroke="#fff" strokeWidth={1.5} />
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={11} fontWeight={400} fill={CHART.axis} fontFamily="inherit">
            100%
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
            enrolled
          </text>
        </g>
      </svg>
    </ReportChartShell>
  )
}

const COMBO_BAR = [44, 52, 48, 60, 55, 50, 58, 62, 56, 64, 68, 70]
const COMBO_LINE = [32, 36, 34, 40, 42, 41, 45, 48, 46, 52, 54, 58]

export function ComboBarLineChartArtifact() {
  const w = 320
  const h = 128
  const padL = 32
  const padR = 10
  const padT = 8
  const padB = 26
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxY = 80
  const slot = innerW / COMBO_BAR.length
  const bw = slot * 0.4
  const lineD = `M ${COMBO_LINE.map((v, i) => {
    const x = padL + i * (innerW / (COMBO_LINE.length - 1))
    const y = padT + innerH - (v / maxY) * innerH
    return `${x},${y}`
  }).join(' L ')}`

  return (
    <ReportChartShell
      title="Hires vs time-to-fill"
      subtitle="Combo · columns + line overlay"
      legend={(
        <>
          <LegendSwatch color={CHART.slateMuted} label="Hires" />
          <LegendSwatch color={CHART.violet} label="Days to fill" />
        </>
      )}
    >
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
        {[0, 20, 40, 60, 80].map((tick) => {
          const y = padT + innerH - (tick / maxY) * innerH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke={tick === 0 ? CHART.grid : CHART.gridLight} strokeWidth={1} />
              <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
                {tick}
              </text>
            </g>
          )
        })}
        {COMBO_BAR.map((v, i) => {
          const cx = padL + i * (innerW / (COMBO_BAR.length - 1))
          const bh = (v / maxY) * innerH
          return <rect key={i} x={cx - bw / 2} y={padT + innerH - bh} width={bw} height={Math.max(bh, 1)} fill={CHART.slateMuted} stroke={CHART.slate} strokeWidth={1} rx={2} />
        })}
        <path d={lineD} fill="none" stroke={CHART.violet} strokeWidth={2.5} strokeLinecap="round" />
        {COMBO_LINE.map((v, i) => {
          const x = padL + i * (innerW / (COMBO_LINE.length - 1))
          const y = padT + innerH - (v / maxY) * innerH
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#fff" stroke={CHART.violet} strokeWidth={1.75} />
        })}
        {MONTHS.map((m, i) => {
          const x = padL + (i / (MONTHS.length - 1)) * innerW
          return (
            <text key={m} x={x} y={h - 5} textAnchor="middle" fontSize={8} fill={CHART.axisMuted} fontFamily="inherit">
              {m}
            </text>
          )
        })}
      </svg>
    </ReportChartShell>
  )
}

const SCATTER = [
  { x: 12, y: 58 }, { x: 22, y: 48 }, { x: 28, y: 62 }, { x: 38, y: 44 }, { x: 48, y: 52 },
  { x: 58, y: 38 }, { x: 68, y: 46 }, { x: 78, y: 34 }, { x: 88, y: 42 }, { x: 98, y: 30 },
  { x: 108, y: 36 }, { x: 118, y: 28 }, { x: 132, y: 22 }, { x: 148, y: 26 },
]

export function ScatterPlotChartArtifact() {
  const w = 320
  const h = 120
  const padL = 36
  const padR = 12
  const padT = 10
  const padB = 28
  const innerW = w - padL - padR
  const innerH = h - padT - padB

  return (
    <ReportChartShell
      title="Tenure vs engagement score"
      subtitle="Scatter plot · sample artifact"
      legend={(
        <>
          <LegendSwatch color={CHART.brand} label="Employees (sample)" />
        </>
      )}
    >
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke={CHART.grid} strokeWidth={1} />
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = padT + innerH - (tick / 100) * innerH
          return <line key={tick} x1={padL} y1={y} x2={padL + innerW} y2={y} stroke={CHART.gridLight} strokeWidth={1} />
        })}
        {SCATTER.map((p, i) => {
          const px = padL + (p.x / 160) * innerW
          const py = padT + innerH - (p.y / 80) * innerH
          return <circle key={i} cx={px} cy={py} r={4} fill={CHART.brand} fillOpacity={0.75} stroke="#fff" strokeWidth={1} />
        })}
        <text x={padL + innerW / 2} y={h - 8} textAnchor="middle" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit">
          Tenure (months)
        </text>
        <text x={14} y={padT + innerH / 2} textAnchor="middle" fontSize={9} fill={CHART.axisMuted} fontFamily="inherit" transform={`rotate(-90 14 ${padT + innerH / 2})`}>
          Score
        </text>
      </svg>
    </ReportChartShell>
  )
}

export type ChartArtifactPresetId =
  | 'headcount-trend'
  | 'department-payroll-mix'
  | 'hiring-funnel'
  | 'turnover-by-team'
  | 'bar-vertical'
  | 'bar-horizontal'
  | 'line-comparison'
  | 'area-stacked'
  | 'donut-chart'
  | 'combo-bar-line'
  | 'scatter-plot'

export interface ChartArtifactPresetMeta {
  id: ChartArtifactPresetId
  /** Shown in @ picker */
  title: string
  description: string
  /** Match when typing after @ */
  keywords: string[]
}

export const CHART_ARTIFACT_PRESETS: ChartArtifactPresetMeta[] = [
  {
    id: 'headcount-trend',
    title: 'Headcount trend',
    description: 'Line · trailing 12 months',
    keywords: ['headcount trend', 'headcount over', 'employee growth', 'headcount', 'fte', 'employees'],
  },
  {
    id: 'department-payroll-mix',
    title: 'Payroll mix by department',
    description: 'Stacked bars · quarterly (AI-components stacked bar)',
    keywords: [
      'stacked column chart',
      'stacked bar chart',
      'stacked vertical bar',
      'stacked column',
      'stacked bars',
      'stacked bar',
      'payroll mix',
      'payroll by department',
      'department payroll',
      'stacked payroll',
    ],
  },
  {
    id: 'hiring-funnel',
    title: 'Hiring funnel',
    description: 'Horizontal funnel · 90 days',
    keywords: ['hiring funnel', 'recruiting funnel', 'applicant funnel', 'funnel', 'recruiting', 'pipeline'],
  },
  {
    id: 'turnover-by-team',
    title: 'Turnover by team',
    description: 'Grouped bars · YoY',
    keywords: ['turnover by team', 'voluntary turnover', 'attrition by team', 'turnover', 'attrition', 'retention'],
  },
  {
    id: 'bar-vertical',
    title: 'Column chart',
    description: 'Vertical bars · Figma 760px frame + monthly headcount series',
    keywords: [
      'pull up a chart',
      'show me a chart',
      'give me a chart',
      'get me a chart',
      'display a chart',
      'create a chart',
      'generate a chart',
      'need a chart',
      'want a chart',
      'open a chart',
      'view a chart',
      'with a chart',
      'add a chart',
      'include a chart',
      'pull up chart',
      'show a chart',
      'bar chart',
      'column chart',
      'vertical bar',
      'clustered bar',
      'histogram',
      'column graph',
    ],
  },
  {
    id: 'bar-horizontal',
    title: 'Horizontal bar chart',
    description: 'Bars left-to-right',
    keywords: ['horizontal bar', 'horizontal chart', 'sideways bar', 'bar horizontal'],
  },
  {
    id: 'line-comparison',
    title: 'Multi-line chart',
    description: 'Two series over time',
    keywords: ['line chart', 'line graph', 'multi-line', 'multi line', 'two lines', 'compare trends'],
  },
  {
    id: 'area-stacked',
    title: 'Stacked area chart',
    description: 'Filled layers over time',
    keywords: ['stacked area', 'area chart', 'filled area', 'stacked area chart'],
  },
  {
    id: 'donut-chart',
    title: 'Donut / pie chart',
    description: 'Part-to-whole',
    keywords: ['pie chart', 'donut chart', 'donut', 'ring chart', 'part to whole'],
  },
  {
    id: 'combo-bar-line',
    title: 'Combo chart',
    description: 'Bars + line overlay',
    keywords: ['combo chart', 'bar and line', 'column and line', 'combination chart', 'combo'],
  },
  {
    id: 'scatter-plot',
    title: 'Scatter plot',
    description: 'X vs Y markers',
    keywords: ['scatter plot', 'scatter chart', 'scatter', 'correlation plot', 'bubble chart'],
  },
]

const MAX_INFERRED_CHARTS = 4

function inferHits(
  lower: string,
  /** If true, only keywords containing “stacked” count (avoids “bar chart” matching inside “stacked bar chart”). */
  stackedKeywordsOnly: boolean,
): { id: ChartArtifactPresetId; len: number }[] {
  const hits: { id: ChartArtifactPresetId; len: number }[] = []
  for (const p of CHART_ARTIFACT_PRESETS) {
    let best = 0
    for (const kw of p.keywords) {
      const k = kw.toLowerCase()
      if (stackedKeywordsOnly && !k.includes('stacked')) continue
      if (lower.includes(k)) best = Math.max(best, kw.length)
    }
    if (best > 0) hits.push({ id: p.id, len: best })
  }
  return hits
}

function hitsToSortedIds(hits: { id: ChartArtifactPresetId; len: number }[]): ChartArtifactPresetId[] {
  hits.sort((a, b) => b.len - a.len)
  const out: ChartArtifactPresetId[] = []
  const seen = new Set<ChartArtifactPresetId>()
  for (const h of hits) {
    if (seen.has(h.id)) continue
    seen.add(h.id)
    out.push(h.id)
    if (out.length >= MAX_INFERRED_CHARTS) break
  }
  return out
}

/**
 * Map natural language (e.g. “show me a bar chart”) to chart preset ids.
 * Longer keyword matches win so “stacked area chart” prefers area over generic “stacked”.
 * When the user says “stacked …”, only stacked-specific keywords apply so “bar chart”
 * does not also match the plain column preset inside “stacked bar chart”.
 */
export function inferChartPresetIdsFromMessage(text: string): ChartArtifactPresetId[] {
  const lower = text.toLowerCase().replace(/@chart:[\w-]+/g, ' ')
  if (/\bstacked\b/.test(lower)) {
    const stackedHits = inferHits(lower, true)
    if (stackedHits.length > 0) return hitsToSortedIds(stackedHits)
  }
  return hitsToSortedIds(inferHits(lower, false))
}

export function filterChartPresets(query: string): ChartArtifactPresetMeta[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...CHART_ARTIFACT_PRESETS]
  return CHART_ARTIFACT_PRESETS.filter((p) => {
    const hay = [p.title, p.description, ...p.keywords].join(' ').toLowerCase()
    return hay.includes(q) || p.keywords.some((k) => k.startsWith(q))
  })
}

export function chartPresetTitle(id: string): string {
  return CHART_ARTIFACT_PRESETS.find((p) => p.id === id)?.title ?? id
}

export function ChartArtifactByPreset({ presetId, fluid }: { presetId: string; fluid?: boolean }) {
  switch (presetId as ChartArtifactPresetId) {
    case 'headcount-trend':
      return <HeadcountTrendChartArtifact />
    case 'department-payroll-mix':
      return <DepartmentPayrollMixChartArtifact />
    case 'hiring-funnel':
      return <HiringFunnelChartArtifact />
    case 'turnover-by-team':
      return <TurnoverByTeamChartArtifact />
    case 'bar-vertical':
      return <VerticalBarChartArtifact fluid={fluid} />
    case 'bar-horizontal':
      return <HorizontalBarChartArtifact />
    case 'line-comparison':
      return <LineComparisonChartArtifact />
    case 'area-stacked':
      return <AreaStackedChartArtifact />
    case 'donut-chart':
      return <DonutChartArtifact />
    case 'combo-bar-line':
      return <ComboBarLineChartArtifact />
    case 'scatter-plot':
      return <ScatterPlotChartArtifact />
    default:
      return <HeadcountTrendChartArtifact />
  }
}
