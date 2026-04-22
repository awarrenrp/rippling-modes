import { useState, useRef, memo } from 'react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { AskAIChip } from './AskAIChip'
import { Button }   from '@/components/ui/button'
import { Badge }    from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Download, CalendarDays, ChevronDown, Search, Filter,
  SlidersHorizontal, Layers, Plus, ArrowUpDown, X, MoreHorizontal,
} from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────────────────────

interface Person {
  id: string
  name: string
  dept: string
  role: string
  plan: 'Core' | 'Pro' | 'Enterprise'
  usage: string
  status: 'Active' | 'Inactive' | 'Pending'
  initials: string
}

const PEOPLE: Person[] = [
  { id:'1',  name:'Richard Satherland', dept:'Engineering',  role:'Staff Eng',       plan:'Enterprise', usage:'1,240 credits', status:'Active',   initials:'RS' },
  { id:'2',  name:'Peter Mayfield',     dept:'Design',       role:'Sr. Designer',     plan:'Pro',        usage:'860 credits',   status:'Active',   initials:'PM' },
  { id:'3',  name:'John List',          dept:'Marketing',    role:'Director',         plan:'Pro',        usage:'440 credits',   status:'Active',   initials:'JL' },
  { id:'4',  name:'Sahill Mahood',      dept:'Design',       role:'Designer',         plan:'Core',       usage:'220 credits',   status:'Pending',  initials:'SM' },
  { id:'5',  name:'Anita Orfino',       dept:'Design',       role:'UX Lead',          plan:'Pro',        usage:'980 credits',   status:'Active',   initials:'AO' },
  { id:'6',  name:'Wes Smith',          dept:'Sales',        role:'AE',               plan:'Core',       usage:'120 credits',   status:'Active',   initials:'WS' },
  { id:'7',  name:'Junhee Choi',        dept:'Design',       role:'Motion Designer',  plan:'Pro',        usage:'700 credits',   status:'Inactive', initials:'JC' },
  { id:'8',  name:'Wanda Woodz',        dept:'Engineering',  role:'Eng Manager',      plan:'Enterprise', usage:'1,100 credits', status:'Active',   initials:'WW' },
  { id:'9',  name:'Alex Torres',        dept:'Finance',      role:'Controller',       plan:'Core',       usage:'310 credits',   status:'Active',   initials:'AT' },
]

const TABS = ['Users', 'Groups', 'Contractors', 'All']
const TAB_COUNTS: Record<string, number> = { Users: 1000, Groups: 24, Contractors: 88, All: 1112 }

type FilterChip = { label: string; value: string }
const INITIAL_CHIPS: FilterChip[] = [
  { label: 'Name', value: 'Alphabetical' },
  { label: 'Status', value: 'Active' },
]

const STATUS_STYLE: Record<Person['status'], string> = {
  Active:   'bg-neutral-100 text-neutral-600 border-transparent',
  Inactive: 'bg-neutral-50  text-neutral-400 border-transparent',
  Pending:  'bg-amber-50    text-amber-700   border-transparent',
}

const PLAN_STYLE: Record<Person['plan'], string> = {
  Core:       'bg-neutral-100 text-neutral-600 border-transparent',
  Pro:        'bg-neutral-200 text-neutral-700 border-transparent',
  Enterprise: 'bg-neutral-800 text-white       border-transparent',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TablePageProps { onAskAI?: (msg: string) => void }

export const TablePage = memo(function TablePage({ onAskAI }: TablePageProps) {
  const [activeTab, setActiveTab]       = useState('Users')
  const [chips, setChips]               = useState<FilterChip[]>(INITIAL_CHIPS)
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [sortCol, setSortCol]           = useState<string | null>('name')
  const [hoveredRow, setHoveredRow]     = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cw = useContainerWidth(containerRef)

  // Responsive helpers
  const px    = cw < 540 ? 16 : cw < 760 ? 28 : 56   // side padding
  const cols  = cw < 540 ? 1  : cw < 760 ? 2  : 3    // stat card columns

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const removeChip = (label: string) =>
    setChips((prev) => prev.filter((c) => c.label !== label))

  const allSelected = selected.size === PEOPLE.length
  const toggleAll   = () =>
    setSelected(allSelected ? new Set() : new Set(PEOPLE.map((p) => p.id)))

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-auto" style={{ background: 'var(--grey-100)' }}>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 16, paddingLeft: px, paddingRight: px,
          paddingTop: 32,
        }}
      >
        <StatCard
          label="Seats"
          used={12} total={24} pct={50}
          sub="Active until July 1, 2027"
          action="Manage"
        />
        <StatCard
          label="AI Credits"
          used={7800} total={10000} pct={78}
          sub="Refreshes May 1, 2026"
          action="Buy more"
        />
        <StatCard
          label="Budget"
          used={2800} total={5000} pct={56}
          sub="Renews quarterly"
        />
      </div>

      {/* ── Month + download toolbar ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 flex-wrap pt-5 pb-4"
        style={{ paddingLeft: px, paddingRight: px }}
      >
        {/* Month picker split button */}
        <div className="flex items-center" style={{ border: '1px solid #e0e0e0', borderRadius: 6, overflow: 'hidden' }}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white hover:bg-neutral-50 transition-colors" style={{ borderRight: '1px solid #e0e0e0' }}>
            <CalendarDays size={14} className="text-muted-foreground" />
            March 2026
          </button>
          <button className="px-2 py-1.5 bg-white hover:bg-neutral-50 transition-colors">
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
        </div>

        {/* Download CSV */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white hover:bg-neutral-50 transition-colors"
          style={{ border: '1px solid #e0e0e0', borderRadius: 6 }}
        >
          <Download size={14} className="text-muted-foreground" />
          Download CSV
          <Badge className="ml-1 h-4 px-1.5 text-[9px] font-semibold bg-neutral-800 text-white hover:bg-neutral-800">1</Badge>
        </button>
      </div>

      {/* ── Report table ─────────────────────────────────────────────────── */}
      <div
        className="mb-8 bg-white"
        style={{
          marginLeft: px, marginRight: px,
          border: '1px solid #e8e8e8', borderRadius: 16, overflow: 'hidden',
        }}
      >

        {/* Report header */}
        <div className="px-4 pt-4 pb-0">
          {/* Tabs */}
          <div className="flex gap-0 border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors',
                  activeTab === tab
                    ? 'border-neutral-900 font-semibold text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700',
                ].join(' ')}
              >
                {tab}
                {TAB_COUNTS[tab] && (
                  <span className={['text-[10px] font-semibold px-1.5 py-0.5 rounded-full', activeTab === tab ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'].join(' ')}>
                    {TAB_COUNTS[tab] >= 1000 ? '1k' : TAB_COUNTS[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Record count + actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-500">
                {PEOPLE.length.toLocaleString()} records
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Rippling AI Workforce</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toolbar buttons */}
              {[
                { icon: Filter,           label: 'Filter',    badge: 1 },
                { icon: SlidersHorizontal, label: 'Group by',  badge: 0 },
                { icon: Layers,           label: 'My views',  badge: 0 },
              ].map(({ icon: Icon, label, badge }) => (
                <button
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white hover:bg-neutral-50 transition-colors"
                  style={{ border: '1px solid #e0e0e0', borderRadius: 6 }}
                >
                  <Icon size={13} className="text-muted-foreground" />
                  {label}
                  {badge > 0 && (
                    <Badge className="h-4 px-1 text-[9px] font-bold bg-neutral-800 text-white hover:bg-neutral-800 ml-0.5">{badge}</Badge>
                  )}
                </button>
              ))}

              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search"
                  className="pl-8 pr-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  style={{ border: '1px solid #e0e0e0', borderRadius: 6, width: 180 }}
                />
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* New button */}
              <Button size="sm" className="h-8 px-3 bg-neutral-900 hover:bg-neutral-700 text-white gap-1.5">
                <Plus size={13} />
                New
              </Button>
            </div>
          </div>

          {/* Filter chips */}
          {chips.length > 0 && (
            <div className="flex items-center gap-2 pb-3">
              <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={11} /> Add filter
              </button>
              <Separator orientation="vertical" className="h-4" />
              {chips.map((chip) => (
                <div
                  key={chip.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
                  style={{ border: '1px solid #e0e0e0', background: '#fafafa' }}
                >
                  <span className="text-neutral-500">{chip.label}:</span>
                  <span className="text-foreground">{chip.value}</span>
                  <button onClick={() => removeChip(chip.label)} className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors">
                    <X size={11} />
                  </button>
                </div>
              ))}
              {chips.length > 0 && (
                <button onClick={() => setChips([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1">
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bulk action bar — visible when rows selected */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-900 text-white">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Separator orientation="vertical" className="h-4 bg-neutral-600" />
            {['Edit', 'Update', 'Remove'].map((a) => (
              <button key={a} className="text-sm font-medium hover:text-neutral-300 transition-colors">{a}</button>
            ))}
          </div>
        )}

        {/* Table — horizontally scrollable on narrow containers */}
        <div style={{ overflowX: 'auto' }}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent" style={{ background: '#f5f5f5', borderBottom: '1px solid #e8e8e8' }}>
              {/* Checkbox */}
              <TableHead className="w-10 pl-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-neutral-300 cursor-pointer"
                />
              </TableHead>

              {/* Name column */}
              <ColumnHead label="Name" subtitle="Department" active sortable onClick={() => setSortCol('name')} />
              <ColumnHead label="Role"       sortable onClick={() => setSortCol('role')} />
              <ColumnHead label="Plan"       sortable onClick={() => setSortCol('plan')} />
              <ColumnHead label="AI Usage"   sortable onClick={() => setSortCol('usage')} />
              <ColumnHead label="Status"     sortable onClick={() => setSortCol('status')} />
              {/* Actions */}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
              {PEOPLE.map((person) => (
              <TableRow
                key={person.id}
                className={['cursor-pointer transition-colors', selected.has(person.id) ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'].join(' ')}
                style={{ borderBottom: '1px solid #ebebeb' }}
                onMouseEnter={() => setHoveredRow(person.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Checkbox */}
                <TableCell className="pl-4 py-0 w-10">
                  <input
                    type="checkbox"
                    checked={selected.has(person.id)}
                    onChange={() => toggleRow(person.id)}
                    className="h-3.5 w-3.5 rounded border-neutral-300 cursor-pointer"
                  />
                </TableCell>

                {/* Name + dept */}
                <TableCell className="py-0" style={{ height: 48 }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                      style={{ background: '#e8e8e8', color: '#555' }}
                    >
                      {person.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{person.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{person.dept}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-0 text-sm text-muted-foreground">{person.role}</TableCell>

                <TableCell className="py-0">
                  <Badge variant="outline" className={['text-[11px] font-medium', PLAN_STYLE[person.plan]].join(' ')}>
                    {person.plan}
                  </Badge>
                </TableCell>

                <TableCell className="py-0 text-sm text-muted-foreground">{person.usage}</TableCell>

                <TableCell className="py-0">
                  <div className="flex items-center gap-1.5">
                    <span className={[
                      'h-1.5 w-1.5 rounded-full',
                      person.status === 'Active'   ? 'bg-neutral-500' :
                      person.status === 'Pending'  ? 'bg-amber-400' :
                      'bg-neutral-300',
                    ].join(' ')} />
                    <Badge variant="outline" className={['text-[11px] font-medium', STATUS_STYLE[person.status]].join(' ')}>
                      {person.status}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="py-0 w-28">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {hoveredRow === person.id && onAskAI && (
                      <AskAIChip onClick={() => onAskAI(`Tell me about ${person.name}'s AI usage and activity`)} />
                    )}
                    <button className="text-muted-foreground hover:text-foreground transition-all p-1 rounded hover:bg-neutral-100" style={{ opacity: hoveredRow === person.id ? 1 : 0 }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>

        {/* Mini pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing {PEOPLE.length} of 1,000 records</p>
          <div className="flex items-center gap-1">
            {[1,2,3,'...',42].map((p, i) => (
              <button
                key={i}
                className={[
                  'h-7 min-w-7 px-2 text-xs rounded transition-colors',
                  p === 1 ? 'bg-neutral-900 text-white font-medium' : 'text-muted-foreground hover:bg-neutral-100',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, used, total, pct, sub, action,
}: {
  label: string; used: number; total: number; pct: number; sub?: string; action?: string
}) {
  const isSeats = label === 'Seats'
  const usedLabel = isSeats
    ? `${used} of ${total} seats`
    : `${used.toLocaleString()} of ${total.toLocaleString()} credits used`

  return (
    <div className="bg-white p-4 flex flex-col gap-3" style={{ borderRadius: 12, border: '1px solid #e8e8e8' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        {action && (
          <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            {action}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct > 75 ? '#374151' : '#9ca3af' }}
        />
      </div>

      {/* Usage text */}
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-foreground">{usedLabel}</span>
        <span className="text-sm text-muted-foreground">{pct}%</span>
      </div>

      {sub && <p className="text-xs text-muted-foreground -mt-1">{sub}</p>}
    </div>
  )
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColumnHead({
  label, subtitle, sortable, active, onClick,
}: {
  label: string; subtitle?: string; sortable?: boolean; active?: boolean; onClick?: () => void
}) {
  return (
    <TableHead
      className="py-0 cursor-pointer select-none"
      style={{ height: 40 }}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        <div>
          <p className={['text-xs font-semibold', active ? 'text-neutral-600' : 'text-neutral-500'].join(' ')}>
            {label}
          </p>
          {subtitle && <p className="text-[10px] text-neutral-400 font-medium">{subtitle}</p>}
        </div>
        {sortable && (
          <ArrowUpDown size={11} className={active ? 'text-neutral-500' : 'text-neutral-300'} />
        )}
      </div>
    </TableHead>
  )
}
