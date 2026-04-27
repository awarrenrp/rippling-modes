import { useState, useRef, useEffect, useMemo, memo, type Dispatch, type SetStateAction, type CSSProperties, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { Icon } from '@/components/Icon'
import type { ChatOrientation } from '@/components/ChatPanel'
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
  Sparkles, ChevronRight, Maximize2,
} from 'lucide-react'
import { AIComposerInput } from '@/components/AIComposerInput'
import { AIButton } from './AskAIChip'

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

type MiniChatMsg = { role: 'user' | 'ai'; text: string }

const COLLAPSE_HEADER_MIN_H = 60
const collapseHeaderBase: CSSProperties = {
  flexShrink: 0,
  minHeight: COLLAPSE_HEADER_MIN_H,
  padding: '0 20px',
  boxSizing: 'border-box',
  borderBottom: '1px solid #ebebeb',
  display: 'flex',
  alignItems: 'center',
}
const collapseHeaderExpandedLeft: CSSProperties = {
  ...collapseHeaderBase,
  paddingLeft: 12,
  paddingRight: 16,
  gap: 10,
  justifyContent: 'flex-start',
}
/** Collapse chat header: room for title + context line. */
const CHAT_COPILOT_HEADER_H = 52

const COLLAPSE_DRAWER_HISTORY: {
  id: string
  title: string
  preview: string
  date: string
  /** Seeds the app `ChatPanel` when opening this thread in fullscreen. */
  initialQuery: string
}[] = [
  { id: 'current', title: 'Headcount Report Q1', preview: 'Q1 headcount by department…', date: 'Today', initialQuery: 'Q1 headcount by department' },
  { id: 'h2', title: 'Payroll summary March', preview: 'Total payroll this month is $2.4M…', date: 'Yesterday', initialQuery: 'Summarize total payroll for March' },
  { id: 'h3', title: 'New hire onboarding', preview: 'I can help you set up onboarding…', date: 'Mar 18', initialQuery: 'Set up a new hire onboarding workflow' },
  { id: 'h4', title: 'PTO policy questions', preview: 'Your current PTO policy allows…', date: 'Mar 15', initialQuery: 'Explain our PTO accrual policy' },
]

const DRAWER_VIEW_OPTIONS: { label: string; value: ChatOrientation; icon: string }[] = [
  { label: 'Full screen', value: 'fullscreen', icon: 'open_in_full' },
  { label: 'Side bar',    value: 'sidebar',    icon: 'dock_to_right' },
  { label: 'Floating',   value: 'floating',   icon: 'picture_in_picture' },
]

function drawerHeaderIconBtn(active: boolean): CSSProperties {
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

/** Copilot-style chat chrome for collapse drawer (matches main `ChatPanel` header). */
function CollapseDrawerChatHeader({
  showHistory,
  setShowHistory,
  onNewChat,
  onPickView,
  moreOpen,
  setMoreOpen,
  moreRef,
  personName,
}: {
  showHistory: boolean
  setShowHistory: Dispatch<SetStateAction<boolean>>
  onNewChat: () => void
  onPickView: (o: ChatOrientation) => void
  moreOpen: boolean
  setMoreOpen: (v: boolean) => void
  moreRef: RefObject<HTMLDivElement | null>
  personName: string
}) {
  return (
    <div
      style={{
        padding: '0 10px',
        minHeight: CHAT_COPILOT_HEADER_H,
        borderBottom: '1px solid #ebebeb',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        background: '#fff',
        gap: 6,
      }}
    >
      <motion.button
        type="button"
        onClick={() => setShowHistory((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        title={showHistory ? 'Back to chat' : 'Chat history'}
        style={drawerHeaderIconBtn(showHistory)}
      >
        <Icon name={showHistory ? 'chevron_left' : 'menu'} size={18} />
      </motion.button>

      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <img src="/rippling-ai.png" width={10} height={10} alt="" style={{ display: 'block', filter: 'brightness(0) invert(1)' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, minWidth: 0, padding: '4px 0' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: '-0.1px' }}>Rippling AI</span>
        <span
          style={{
            fontSize: 11, color: '#888', lineHeight: 1.25,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
          title={`Ask anything about ${personName}`}
        >
          Ask anything about {personName}
        </span>
      </div>

      <motion.button
        type="button"
        onClick={onNewChat}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        title="New chat"
        style={drawerHeaderIconBtn(false)}
      >
        <Icon name="add" size={18} />
      </motion.button>

      <div ref={moreRef} style={{ position: 'relative' }}>
        <motion.button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          title="More options"
          style={drawerHeaderIconBtn(moreOpen)}
        >
          <Icon name="more_horiz" size={18} />
        </motion.button>
        <AnimatePresence>
          {moreOpen && (
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
                padding: 3,
              }}
            >
              {DRAWER_VIEW_OPTIONS.map(({ label, value, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { onPickView(value); setMoreOpen(false) }}
                  style={{
                    width: '100%', padding: '7px 10px',
                    border: 'none', borderRadius: 5,
                    background: 'transparent',
                    color: '#333',
                    fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 9,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  <Icon name={icon} size={15} style={{ color: '#999' }} />
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TablePageProps {
  onAskAI?: (msg: string) => void
  drawerMode?: 'floating' | 'embedded' | 'collapse'
  onOpenFloating?: (msg: string) => void
  onOpenFullscreen?: (options?: { initialQuery?: string }) => void
  /** Dismiss the app’s sidebar/floating chat when the record drawer is used in embedded or collapse. */
  onCloseMainChat?: () => void
}

export const TablePage = memo(function TablePage({
  onAskAI, drawerMode = 'collapse', onOpenFloating, onOpenFullscreen, onCloseMainChat,
}: TablePageProps) {
  const [activeTab, setActiveTab]       = useState('Users')
  const [chips, setChips]               = useState<FilterChip[]>(INITIAL_CHIPS)
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [sortCol, setSortCol]           = useState<string | null>('name')
  const [hoveredRow, setHoveredRow]     = useState<string | null>(null)
  const [openRow, setOpenRow]           = useState<Person | null>(null)
  const [aiOpen, setAiOpen]             = useState(false) // Collapse mode toggle
  const [collapseDrawerExpanded, setCollapseDrawerExpanded] = useState(false)
  const [collapseChatMessages, setCollapseChatMessages]   = useState<MiniChatMsg[]>([])
  const [collapseChatInput, setCollapseChatInput]         = useState('')
  const [collapseChatShowHistory, setCollapseChatShowHistory] = useState(false)
  const [collapseActiveHistoryId, setCollapseActiveHistoryId]   = useState('current')
  const [collapseChatMoreOpen, setCollapseChatMoreOpen]   = useState(false)
  const collapseChatMoreRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cw = useContainerWidth(containerRef)

  // Floating mode: auto-open floating chat when drawer opens
  useEffect(() => {
    if (openRow && drawerMode === 'floating') {
      onOpenFloating?.(`Tell me about ${openRow.name}'s AI usage and activity`)
    }
  }, [openRow, drawerMode, onOpenFloating])

  // Embedded / collapse: never show the global floating chat over this flow
  useEffect(() => {
    if (openRow && (drawerMode === 'embedded' || drawerMode === 'collapse')) {
      onCloseMainChat?.()
    }
  }, [openRow, drawerMode, onCloseMainChat])

  useEffect(() => {
    if (!openRow) {
      setCollapseDrawerExpanded(false)
      setCollapseChatMessages([])
      setCollapseChatInput('')
      setCollapseChatShowHistory(false)
      setCollapseChatMoreOpen(false)
    }
  }, [openRow])

  useEffect(() => {
    if (!collapseChatMoreOpen) return
    function handler(e: MouseEvent) {
      if (collapseChatMoreRef.current && !collapseChatMoreRef.current.contains(e.target as Node)) {
        setCollapseChatMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [collapseChatMoreOpen])

  useEffect(() => {
    if (openRow?.id == null) return
    setCollapseChatMessages([])
    setCollapseChatInput('')
    setCollapseDrawerExpanded(false)
    setCollapseActiveHistoryId('current')
  }, [openRow?.id])

  useEffect(() => {
    if (drawerMode !== 'collapse') setCollapseDrawerExpanded(false)
  }, [drawerMode])

  useEffect(() => {
    if (!openRow || !collapseDrawerExpanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCollapseDrawerExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openRow, collapseDrawerExpanded])

  // Responsive helpers
  const px    = cw < 540 ? 16 : cw < 760 ? 28 : 56   // side padding
  const cols  = cw < 540 ? 1  : cw < 760 ? 2  : 3    // stat card columns

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const removeChip = (label: string) =>
    setChips((prev) => prev.filter((c) => c.label !== label))

  const allSelected = selected.size === PEOPLE.length
  const toggleAll   = () =>
    setSelected(allSelected ? new Set() : new Set(PEOPLE.map((p) => p.id)))

  const displayPeople = useMemo(() => {
    if (!sortCol) return PEOPLE
    const col = sortCol as keyof Person
    return [...PEOPLE].sort((a, b) =>
      String(a[col]).localeCompare(String(b[col]), undefined, { numeric: true, sensitivity: 'base' }),
    )
  }, [sortCol])

  return (
    <>
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
              <ColumnHead label="Name" subtitle="Department" active={sortCol === 'name'} sortable onClick={() => setSortCol('name')} />
              <ColumnHead label="Role"       active={sortCol === 'role'}   sortable onClick={() => setSortCol('role')} />
              <ColumnHead label="Plan"       active={sortCol === 'plan'}   sortable onClick={() => setSortCol('plan')} />
              <ColumnHead label="AI Usage"   active={sortCol === 'usage'}  sortable onClick={() => setSortCol('usage')} />
              <ColumnHead label="Status"     active={sortCol === 'status'} sortable onClick={() => setSortCol('status')} />
              {/* Actions */}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
              {displayPeople.map((person) => (
              <TableRow
                key={person.id}
                className={['cursor-pointer transition-colors', selected.has(person.id) || openRow?.id === person.id ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'].join(' ')}
                style={{ borderBottom: '1px solid #ebebeb' }}
                onMouseEnter={() => setHoveredRow(person.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => setOpenRow(person)}
              >
                {/* Checkbox */}
                <TableCell className="pl-4 py-0 w-10" onClick={e => e.stopPropagation()}>
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
                    {hoveredRow === person.id && (onOpenFloating || onAskAI) && (
                      <AskAIChip
                        onClick={() => {
                          const msg = `Tell me about ${person.name}'s AI usage and activity`
                          // Table row: always use floating chat when available (independent of drawer mode).
                          if (onOpenFloating) onOpenFloating(msg)
                          else onAskAI?.(msg)
                        }}
                      />
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

    {/* Drawer — rendered via portal so it escapes overflow clipping */}
    {createPortal(
      <AnimatePresence>
        {openRow && drawerMode === 'collapse' && (
          <>
            <motion.div
              key="scrim-collapse"
              initial={{ opacity: 0 }}
              animate={{ opacity: collapseDrawerExpanded ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={collapseDrawerExpanded ? undefined : () => { setOpenRow(null); setAiOpen(false) }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)',
                zIndex: 50, pointerEvents: collapseDrawerExpanded ? 'none' : 'auto',
              }}
            />
            {/*
              Single shell: width animates 66vw → 100vw, anchored to the right edge, so the panel
              “expands” left into fullscreen. Same mount as when toggling expand — no close/reopen.
            */}
            <motion.div
              key="collapse-drawer"
              initial={{ x: '100%' }}
              animate={{
                x: 0,
                width: collapseDrawerExpanded ? '100vw' : '66vw',
              }}
              exit={{ x: '100%' }}
              transition={{
                x:   { type: 'spring', stiffness: 380, damping: 34 },
                width: { type: 'spring', stiffness: 300, damping: 32, mass: 0.7 },
              }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, maxWidth: '100%',
                display: 'flex', flexDirection: 'row', overflow: 'hidden',
                background: '#fff',
                boxShadow: !collapseDrawerExpanded
                  ? '-8px 0 40px rgba(0,0,0,0.12), -2px 0 8px rgba(0,0,0,0.06)' : 'none',
                zIndex: 51,
              }}
            >
              {collapseDrawerExpanded && (
                <button
                  type="button"
                  onClick={() => { setOpenRow(null); setAiOpen(false); setCollapseDrawerExpanded(false) }}
                  title="Close"
                  style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 3,
                    width: 36, height: 36, borderRadius: 6, border: '1px solid #e8e8e8', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  <X size={16} />
                </button>
              )}

              {/* Left: profile + detail (header differs when full split) */}
              <div
                style={{
                  flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {collapseDrawerExpanded ? (
                  <div
                    style={{
                      ...collapseHeaderExpandedLeft,
                      minHeight: CHAT_COPILOT_HEADER_H,
                      padding: '0 16px 0 20px',
                      justifyContent: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600, color: '#555', flexShrink: 0,
                    }}
                    >{openRow.initials}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{openRow.name}</p>
                      <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{openRow.role} · {openRow.dept}</p>
                    </div>
                  </div>
                ) : (
                  <div style={collapseHeaderBase} className="flex justify-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#e8e8e8', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#555',
                      }}>
                        {openRow.initials}
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{openRow.name}</p>
                        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{openRow.role} · {openRow.dept}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AIButton
                        active={aiOpen}
                        title={aiOpen ? 'Close AI' : 'Open AI in full screen'}
                        onClick={() => {
                          if (!aiOpen) {
                            setCollapseDrawerExpanded(true)
                            setAiOpen(true)
                          } else {
                            setAiOpen(false)
                            setCollapseDrawerExpanded(false)
                          }
                        }}
                        stopPropagation={false}
                      />
                      <button
                        type="button"
                        onClick={() => { setOpenRow(null); setAiOpen(false) }}
                        style={{
                          width: 30, height: 30, borderRadius: 6, border: '1px solid #e8e8e8',
                          background: '#f7f7f7', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer', color: '#666',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <DrawerPersonDetail person={openRow} />
                </div>
              </div>

              {/* Right: record-scoped chat under drawer header; ease in when panel opens */}
              <AnimatePresence initial={false}>
                {aiOpen && (
                  <motion.div
                    key="collapse-chat-col"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={
                      collapseDrawerExpanded
                        ? {
                            flex: '1 1 0', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column',
                            borderLeft: '1px solid #ebebeb', background: '#fff',
                            paddingRight: 40, // room for record-drawer close (X) on the shell
                          }
                        : {
                            flex: '0 0 340px', width: 340, minHeight: 0, display: 'flex', flexDirection: 'column',
                            borderLeft: '1px solid #ebebeb', background: '#fff', overflow: 'hidden',
                          }
                    }
                  >
                    <CollapseDrawerChatHeader
                      showHistory={collapseChatShowHistory}
                      setShowHistory={setCollapseChatShowHistory}
                      onNewChat={() => {
                        setCollapseChatMessages([])
                        setCollapseChatInput('')
                        setCollapseActiveHistoryId('current')
                        setCollapseChatShowHistory(false)
                      }}
                      onPickView={(o) => {
                        if (o === 'fullscreen') onOpenFullscreen?.()
                        if (o === 'sidebar') setCollapseDrawerExpanded(false)
                        if (o === 'floating' && openRow) onOpenFloating?.(`Ask about ${openRow.name}'s AI usage and activity`)
                      }}
                      moreOpen={collapseChatMoreOpen}
                      setMoreOpen={setCollapseChatMoreOpen}
                      moreRef={collapseChatMoreRef}
                      personName={openRow.name}
                    />
                    <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <AnimatePresence>
                        {collapseChatShowHistory && (
                          <motion.div
                            key="collapse-drw-hist"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                            style={{
                              position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%',
                              background: '#fff', zIndex: 25, overflowY: 'auto',
                              display: 'flex', flexDirection: 'column', padding: '8px 10px',
                              boxShadow: '2px 0 12px rgba(0,0,0,0.06)',
                            }}
                          >
                            {COLLAPSE_DRAWER_HISTORY.map((chat) => {
                              const isActive = chat.id === collapseActiveHistoryId
                              return (
                              <button
                                key={chat.id}
                                type="button"
                                onClick={() => {
                                  setCollapseActiveHistoryId(chat.id)
                                  setCollapseChatShowHistory(false)
                                  onOpenFullscreen?.({ initialQuery: chat.initialQuery })
                                  // Close the record drawer so the z-50 panel does not sit above main fullscreen chat.
                                  setOpenRow(null)
                                  setAiOpen(false)
                                  setCollapseDrawerExpanded(false)
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px', borderRadius: 6, border: 'none',
                                  background: isActive ? '#f0f0f0' : 'transparent',
                                  cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                  <span style={{ fontSize: 12.5, fontWeight: isActive ? 500 : 400, color: '#111' }}>{chat.title}</span>
                                  <span style={{ fontSize: 10, color: '#bbb' }}>{chat.date}</span>
                                </div>
                                <div style={{ fontSize: 11, color: '#999' }}>{chat.preview}</div>
                              </button>
                            )})}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <EmbeddedMiniChat
                        person={openRow}
                        showHeader={false}
                        layout="fill"
                        showExpand={false}
                        onExpand={() => setCollapseDrawerExpanded(true)}
                        inputPlaceholder={`Ask anything about ${openRow.name}…`}
                        messages={collapseChatMessages}
                        setMessages={setCollapseChatMessages}
                        inputValue={collapseChatInput}
                        setInputValue={setCollapseChatInput}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {openRow && drawerMode !== 'collapse' && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setOpenRow(null); setAiOpen(false) }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 50,
              }}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '66vw', maxWidth: '100%',
                background: '#ffffff',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.12), -2px 0 8px rgba(0,0,0,0.06)',
                zIndex: 51, display: 'flex', flexDirection: 'row', overflow: 'hidden',
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', borderBottom: '1px solid #ebebeb', flexShrink: 0,
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: '#e8e8e8', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#555',
                    }}>
                      {openRow.initials}
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{openRow.name}</p>
                      <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{openRow.role} · {openRow.dept}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOpenRow(null); setAiOpen(false) }}
                    style={{
                      width: 30, height: 30, borderRadius: 6, border: '1px solid #e8e8e8',
                      background: '#f7f7f7', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', color: '#666',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <DrawerPersonDetail person={openRow} />
                </div>
                {drawerMode === 'embedded' && (
                  <EmbeddedMiniChat
                    person={openRow}
                    onOpenFullscreen={onOpenFullscreen}
                    layout="compact"
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body,
    )}
    </>
  )
})

// ── Drawer sub-components ─────────────────────────────────────────────────────

function DrawerPersonDetail({ person }: { person: Person }) {
  const details = [
    { label: 'Department', value: person.dept },
    { label: 'Role', value: person.role },
    { label: 'Plan', value: person.plan },
    { label: 'Status', value: person.status },
    { label: 'AI Credits Used', value: person.usage },
    { label: 'Last active', value: '2 days ago' },
    { label: 'Joined', value: 'March 14, 2023' },
  ]

  const activity = [
    { date: 'Apr 18', event: 'Generated payroll summary report', credits: 140 },
    { date: 'Apr 16', event: 'Asked about headcount planning', credits: 82 },
    { date: 'Apr 14', event: 'Drafted job description for senior designer', credits: 210 },
    { date: 'Apr 10', event: 'Queried benefits enrollment data', credits: 64 },
  ]

  return (
    <>
      {/* Profile details grid */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          Details
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
          {details.map(({ label, value }) => (
            <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI activity log */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          Recent AI Activity
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activity.map((a) => (
            <div
              key={a.date}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 8, background: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: '#aaa', minWidth: 40 }}>{a.date}</span>
                <span style={{ fontSize: 13, color: '#333' }}>{a.event}</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#666',
                background: '#ebebeb', padding: '2px 8px', borderRadius: 20,
              }}>
                {a.credits} cr
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Credit usage bar */}
      <div style={{ background: '#fafafa', borderRadius: 10, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Credit usage this month</span>
          <span style={{ fontSize: 13, color: '#666' }}>{person.usage}</span>
        </div>
        <div style={{ height: 6, borderRadius: 4, background: '#e8e8e8', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '62%', background: '#374151', borderRadius: 4 }} />
        </div>
        <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>62% of plan allocation</p>
      </div>
    </>
  )
}

function EmbeddedMiniChat({
  person,
  onOpenFullscreen,
  onExpand,
  showExpand = true,
  showHeader = true,
  layout = 'compact',
  inputPlaceholder: inputPlaceholderProp,
  messages: messagesProp,
  setMessages: setMessagesProp,
  inputValue: inputValueProp,
  setInputValue: setInputValueProp,
}: {
  person: Person
  onOpenFullscreen?: (options?: { initialQuery?: string }) => void
  /** Collapse drawer: expand to left/right full-screen split (not app chat). */
  onExpand?: () => void
  showExpand?: boolean
  /** When false, the parent draws the title row; only thread + composer render (e.g. collapse drawer). */
  showHeader?: boolean
  layout?: 'compact' | 'fill'
  /** Override composer placeholder (e.g. full name context in collapse drawer). */
  inputPlaceholder?: string
  messages?: MiniChatMsg[]
  setMessages?: Dispatch<SetStateAction<MiniChatMsg[]>>
  inputValue?: string
  setInputValue?: Dispatch<SetStateAction<string>>
}) {
  const [intM, setIntM] = useState<MiniChatMsg[]>([])
  const [intI, setIntI] = useState('')
  const controlled = setMessagesProp != null
  const messages = controlled ? (messagesProp ?? []) : intM
  const setMessages = controlled ? setMessagesProp! : setIntM
  const input = controlled ? (inputValueProp ?? '') : intI
  const setInput = controlled ? setInputValueProp! : setIntI

  const suggestions = [
    `Summarize ${person.name.split(' ')[0]}'s AI activity`,
    `Compare to team average`,
    'Show top prompts',
  ]

  function send(text: string) {
    if (!text.trim()) return
    setMessages((m) => [
      ...m,
      { role: 'user', text },
      { role: 'ai', text: `Here's what I found about ${person.name}: their usage is ${person.usage} this month, which puts them in the top 30% of ${person.dept} users.` },
    ])
    setInput('')
  }

  const expandVisible = showHeader && showExpand && (onExpand != null || onOpenFullscreen != null)
  const handleExpand = () => (onExpand ?? onOpenFullscreen)?.()
  const fill = layout === 'fill'
  const ph = inputPlaceholderProp ?? `Ask about ${person.name.split(' ')[0]}…`
  const baseOuter: CSSProperties = fill
    ? {
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        height: '100%',
      }
    : showHeader
      ? {
          borderTop: '1px solid #ebebeb', background: '#fff',
          display: 'flex', flexDirection: 'column',
          maxHeight: 280, flexShrink: 0, minHeight: 0,
        }
      : {
          background: '#fff', display: 'flex', flexDirection: 'column',
          flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden',
        }

  return (
    <div style={baseOuter}>
      {showHeader && (
      <div
        style={{
          padding: '8px 16px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}
      >
        <Sparkles size={12} style={{ color: '#555' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>Rippling AI</span>
        <span style={{ fontSize: 12, color: '#aaa', flex: 1 }}>· Ask about this record</span>
        {expandVisible && (
          <button
            type="button"
            onClick={handleExpand}
            title={onExpand != null ? 'Expand to full screen' : 'Open in full screen chat'}
            style={{
              width: 30, height: 30, borderRadius: 6, flexShrink: 0,
              border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#555', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            <Maximize2 size={14} strokeWidth={1.8} />
          </button>
        )}
      </div>
      )}

      <div
        style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {messages.length > 0 && (
          <div
            style={{
              padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '6px 10px', borderRadius: 8,
                  background: m.role === 'user' ? '#111' : '#f4f4f4',
                  color: m.role === 'user' ? '#fff' : '#222',
                  fontSize: 12, lineHeight: 1.5,
                }}
              >
                {m.text}
              </div>
            ))}
          </div>
        )}

        {messages.length === 0 && (
          <div
            style={{
              padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap',
              alignContent: 'flex-start',
            }}
          >
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                type="button"
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 20,
                  border: '1px solid #e0e0e0', background: '#f9f9f9',
                  cursor: 'pointer', color: '#444',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <ChevronRight size={10} />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px 12px', borderTop: '1px solid #f0f0f0', flexShrink: 0, background: '#fff' }}>
        <AIComposerInput
          value={input}
          onChange={setInput}
          onSend={() => { send(input) }}
          placeholder={ph}
        />
      </div>
    </div>
  )
}

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
