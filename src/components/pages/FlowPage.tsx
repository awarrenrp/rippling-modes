import { useState, memo } from 'react'
import { AskAIChip } from './AskAIChip'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Mail, ClipboardList, FileBarChart, Globe, MessageSquare, Users,
  Timer, ChevronDown, ZoomIn, ZoomOut, Maximize2, AlignCenter,
  BarChart3,
} from 'lucide-react'

// ── Step palette items ─────────────────────────────────────────────────────

const PALETTE_SECTIONS = [
  {
    label: 'NOTIFICATIONS',
    items: [
      { icon: Mail,         label: 'Send an email' },
      { icon: Mail,         label: 'Send a digest email' },
      { icon: Timer,        label: 'Send an SMS' },
      { icon: Timer,        label: 'Send a push notification' },
      { icon: ClipboardList,label: 'Assign a task' },
      { icon: Globe,        label: 'Call a public API' },
      { icon: MessageSquare, label: 'Send a Slack message' },
      { icon: Users,        label: 'Send a Teams message' },
    ],
  },
  {
    label: 'RIPPLING ACTIONS',
    items: [
      { icon: ClipboardList, label: 'Send a survey' },
      { icon: BarChart3,     label: 'Send a report' },
      { icon: FileBarChart,  label: 'Send a report via SFTP' },
      { icon: Timer,         label: 'Adjust time off balance' },
      { icon: Timer,         label: 'Make a payment' },
      { icon: ClipboardList, label: 'Assign a review' },
    ],
  },
]

// ── Flow nodes ─────────────────────────────────────────────────────────────

interface FlowNode {
  id: string
  type: 'trigger' | 'action' | 'end'
  title: string
  subtitle?: string
  badge?: number
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

const INITIAL_NODES: FlowNode[] = [
  { id: 'trigger', type: 'trigger', title: 'Workflow trigger',  subtitle: 'Weekly on Monday at 11:00 AM EDT' },
  { id: 'step1',   type: 'action',  title: 'Assign a task',      subtitle: 'Task: ADP New Hires', badge: 1, icon: ClipboardList },
  { id: 'step2',   type: 'action',  title: 'Send a report',      subtitle: 'Send Report: ADP New Hires - Weekly', badge: 2, icon: BarChart3 },
  { id: 'end',     type: 'end',     title: 'End' },
]

// ── Component ──────────────────────────────────────────────────────────────

interface FlowPageProps { onAskAI?: (msg: string) => void }

export const FlowPage = memo(function FlowPage({ onAskAI }: FlowPageProps) {
  const [zoom, setZoom]             = useState(100)
  const [nodes]                     = useState(INITIAL_NODES)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  return (
    <div className="flex h-full overflow-hidden bg-neutral-50">

      {/* ── Left palette ── */}
      <div className="w-48 shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Add a step</p>
        </div>

        <div className="overflow-auto flex-1">
          {PALETTE_SECTIONS.map((section) => (
            <div key={section.label} className="py-2">
              <p className="px-4 py-1 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                {section.label}
              </p>
              {section.items.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  draggable
                  className="flex items-center justify-between px-4 py-1.5 hover:bg-muted/40 cursor-grab active:cursor-grabbing transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={13} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-foreground">{label}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">⠿</span>
                </div>
              ))}
              <Separator className="mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 relative overflow-hidden" style={{ background: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        {/* Canvas toolbar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white border border-border rounded-lg px-2 py-1.5 shadow-sm">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-xs font-medium text-foreground w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
          >
            <ZoomIn size={13} />
          </button>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50">
            <Maximize2 size={13} />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50">
            <AlignCenter size={13} />
          </button>
        </div>

        {/* View toggle */}
        <div className="absolute bottom-4 right-4 z-10 flex bg-white border border-border rounded-lg overflow-hidden shadow-sm">
          <button className="px-3 py-1.5 text-xs font-medium text-foreground bg-muted/40 border-r border-border">Editor</button>
          <button className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors">Executions</button>
        </div>

        {/* Workflow header */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-border rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-sm font-semibold text-foreground">ADP: Weekly New Hire Report</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white border border-border rounded-lg px-3 py-1.5 shadow-sm">
            <span>Edited by</span>
            <div className="h-5 w-5 rounded-full bg-neutral-300 flex items-center justify-center text-[9px] text-neutral-700 font-bold">A</div>
            <span className="text-neutral-400">▲ 0</span>
          </div>
          <button className="bg-neutral-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-neutral-700 transition-colors">
            Save <ChevronDown size={11} />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors bg-white border border-border rounded-lg p-1.5">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>

        {/* Flow nodes centered */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
        >
          <div className="flex flex-col items-center gap-0" style={{ width: 220 }}>
            {nodes.map((node, i) => (
              <div
                key={node.id}
                className="flex flex-col items-center"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ position: 'relative' }}
              >
                {hoveredNode === node.id && onAskAI && node.type !== 'end' && (
                  <div style={{ position: 'absolute', top: 6, right: -100, zIndex: 20 }}>
                    <AskAIChip onClick={() => onAskAI(`Explain the "${node.title}" step and suggest optimizations`)} />
                  </div>
                )}
                <FlowNode node={node} />
                {i < nodes.length - 1 && (
                  <div className="flex flex-col items-center">
                    <div className="w-px h-5 border-l-2 border-dashed border-neutral-300" />
                    <div className="w-2 h-2 border-l-2 border-b-2 border-neutral-300" style={{ transform: 'rotate(-45deg)', marginTop: -4 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

function FlowNode({ node }: { node: FlowNode }) {
  if (node.type === 'end') {
    return (
      <div className="flex items-center justify-center">
        <span className="text-xs text-muted-foreground font-medium px-3 py-1 border border-dashed border-neutral-300 rounded-full bg-white">
          End
        </span>
      </div>
    )
  }

  const Icon = node.icon

  return (
    <Card className="w-52 shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="px-4 py-3">
        <div className="flex items-start gap-3">
          {node.type === 'trigger' ? (
            <div className="h-7 w-7 rounded-full border-2 border-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
              <Timer size={13} className="text-neutral-500" />
            </div>
          ) : Icon ? (
            <div className="h-7 w-7 rounded bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={13} className="text-neutral-500" />
            </div>
          ) : null}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground leading-snug">{node.title}</p>
            {node.subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{node.subtitle}</p>
            )}
          </div>

          {node.badge !== undefined && (
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
              {node.badge}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
