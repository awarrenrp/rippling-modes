import { useState, useRef, memo } from 'react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { AskAIChip } from './AskAIChip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Monitor, ShoppingCart, Globe, ShieldCheck,
  AlertCircle, CheckCircle2, ChevronRight, Sparkles,
} from 'lucide-react'

const STAT_CARDS = [
  { icon: Monitor,      label: 'DEVICES',           stat: '399', sub: 'Assigned devices',    detail: '29 errors detected', detailBad: true,  link: 'Status breakdown' },
  { icon: ShoppingCart, label: 'ORDERS',             stat: '32',  sub: 'Active orders',       detail: 'No order issues',    detailBad: false, link: 'Status breakdown' },
  { icon: Globe,        label: 'THIRD PARTY ACCESS', stat: '40',  sub: 'Integrations',        detail: 'No integration issues', detailBad: false, link: 'Status breakdown' },
  { icon: ShieldCheck,  label: 'SECURITY',           stat: '199', sub: 'Active users',        detail: 'No security issues', detailBad: false, link: 'Status breakdown (Last 14 days)' },
]

const EMPLOYEES = [
  { name: 'Paul Gonzalez',    role: 'Software Engineer, Engineering',      status: 'Device not assigned', date: 'May 04',  phase: 'Onboarding' },
  { name: 'Jessica Gomez',    role: 'Account Executive, SMB',              status: 'Device not assigned', date: 'May 02',  phase: 'Onboarding' },
  { name: 'Stephen Tran',     role: 'Customer Support Associate, Custo...', status: 'Device not assigned', date: 'May 02',  phase: 'Onboarding' },
  { name: 'Jessica Gomez',    role: 'Account Executive, SMB',              status: 'Device not assigned', date: 'April 08', phase: 'Started'    },
]

const TABS = ['All', 'Issues', 'Pending', 'Ready', 'Completed']

interface DashboardPageProps { onAskAI?: (msg: string) => void }

export const DashboardPage = memo(function DashboardPage({ onAskAI }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState('All')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoveredEmployee, setHoveredEmployee] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cw = useContainerWidth(containerRef)

  const statCols = cw < 480 ? 1 : cw < 720 ? 2 : 4
  const px       = cw < 540 ? 16 : 32

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="pt-7 pb-5" style={{ paddingLeft: px, paddingRight: px }}>
        <h1 className="text-xl font-semibold text-foreground">IT Overview</h1>
      </div>

      <div className="pb-8 flex flex-col gap-5" style={{ paddingLeft: px, paddingRight: px }}>
        {/* AI insight banner */}
        <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-neutral-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-0.5">Rippling AI Insight</p>
            <p className="text-sm font-medium text-neutral-800">New hires waiting on access</p>
            <p className="text-xs text-neutral-500">1 employees started in the last 2 weeks missing assigned apps</p>
          </div>
          <Button size="sm" variant="default" className="shrink-0 h-7 text-xs bg-neutral-900 hover:bg-neutral-700 text-white">
            Discover
          </Button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statCols}, minmax(0, 1fr))`, gap: 16 }}>
          {STAT_CARDS.map(({ icon: Icon, label, stat, sub, detail, detailBad, link }) => (
            <Card
              key={label}
              className="rounded-lg shadow-none border border-border"
              onMouseEnter={() => setHoveredCard(label)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ position: 'relative' }}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className="text-muted-foreground" />
                  <CardTitle className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {label}
                  </CardTitle>
                  <ChevronRight size={12} className="text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold text-foreground leading-none mb-1">{stat}</p>
                <p className="text-xs text-muted-foreground mb-3">{sub}</p>
                <div className="flex items-center gap-1.5 mb-1">
                  {detailBad
                    ? <AlertCircle size={14} className="text-neutral-500 shrink-0" />
                    : <CheckCircle2 size={14} className="text-neutral-400 shrink-0" />
                  }
                  <span className={['text-xs font-medium', detailBad ? 'text-neutral-700' : 'text-neutral-500'].join(' ')}>
                    {detail}
                  </span>
                  {detailBad && (
                    <span className="text-xs text-neutral-600 underline cursor-pointer ml-auto">Resolve</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
                    {link} <ChevronRight size={11} />
                  </p>
                  {hoveredCard === label && onAskAI && (
                    <AskAIChip onClick={() => onAskAI(`Give me insights on ${label.toLowerCase()}`)} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Onboarding section */}
        <Card className="rounded-lg shadow-none border border-border">
          <CardContent className="p-0">
            {/* Sub-header */}
            <div className="flex items-start gap-6 px-5 py-4 border-b border-border">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1 cursor-pointer hover:text-foreground">
                  Onboarding <ChevronRight size={12} />
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">4</p>
                <p className="text-xs text-muted-foreground">people onboarding</p>
                <p className="text-xs text-muted-foreground">±2 weeks from today</p>
                {/* Mini progress bar */}
                  <div className="mt-3 w-28 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-700 rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {[
                    { label: 'Issues onboarding', val: 4, dot: 'bg-neutral-700' },
                    { label: 'Pending onboarding', val: 0, dot: 'bg-neutral-500' },
                    { label: 'Ready for onboarding', val: 0, dot: 'bg-neutral-400' },
                    { label: 'Completed onboarding', val: 0, dot: 'bg-neutral-300' },
                  ].map(({ label, val, dot }) => (
                    <p key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={['h-2 w-2 rounded-full shrink-0', dot].join(' ')} />
                      {label}
                      <span className="ml-auto font-medium text-foreground">{val}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Tabs + list */}
              <div className="flex-1 min-w-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-8 bg-transparent p-0 gap-0 border-b border-border rounded-none w-full justify-start">
                    {TABS.map((t) => (
                      <TabsTrigger
                        key={t}
                        value={t}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 h-8 data-[state=active]:text-foreground data-[state=active]:shadow-none"
                      >
                        {t}
                      </TabsTrigger>
                    ))}
                    <div className="ml-auto">
                      <input
                        type="text"
                        placeholder="Search"
                        className="h-7 text-xs px-2.5 border border-border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-0">
                    <div className="divide-y divide-border">
                      {EMPLOYEES.map((emp, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 py-3 hover:bg-muted/30 px-1 rounded cursor-pointer transition-colors"
                          onMouseEnter={() => setHoveredEmployee(emp.name)}
                          onMouseLeave={() => setHoveredEmployee(null)}
                        >
                          <div className="h-8 w-8 rounded-full bg-neutral-200 shrink-0 flex items-center justify-center text-xs font-medium text-neutral-600">
                            {emp.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{emp.role}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {hoveredEmployee === emp.name && onAskAI ? (
                              <AskAIChip onClick={() => onAskAI(`Show me ${emp.name}'s onboarding status and what's blocking them`)} />
                            ) : (
                              <>
                                <div className="flex gap-1">
                                  {['□', '□', '⊞'].map((icon, j) => (
                                    <span key={j} className="text-xs text-neutral-400">{icon}</span>
                                  ))}
                                  <span className="text-xs text-neutral-400">30</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] border-neutral-200 text-neutral-600 bg-neutral-100">
                                  {emp.status}
                                </Badge>
                              </>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">{emp.phase}</p>
                            <p className="text-xs text-muted-foreground">{emp.date}</p>
                          </div>
                          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
