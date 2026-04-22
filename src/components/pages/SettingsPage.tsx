import { useState, useRef, memo } from 'react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { AskAIChip } from './AskAIChip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Pencil } from 'lucide-react'

const SUB_NAV = [
  'Access time',
  'Notifications',
  'App Shop requests',
  'Course bundles',
  'Permissions',
]

const MANAGE_SUB_NAV = [
  'Courses',
  'Assignments',
  'Completion rules',
  'Tags',
]

interface SettingRow {
  label: string
  value: string
}

const ACCESS_TIME_ROWS: SettingRow[] = [
  { label: 'New hire access time', value: "As soon as they've signed their offer letter or agreement." },
]

const NOTIFICATION_ROWS: SettingRow[] = [
  { label: 'Course assigned', value: 'Email + Push notification' },
  { label: 'Course completed', value: 'Email to manager' },
  { label: 'Overdue reminder', value: 'Every 3 days' },
]

interface SettingsPageProps { onAskAI?: (msg: string) => void }

export const SettingsPage = memo(function SettingsPage({ onAskAI }: SettingsPageProps) {
  const [activeTab, setActiveTab]       = useState('Settings')
  const [activeSubNav, setActiveSubNav] = useState('Access time')
  const [hoveredRow, setHoveredRow]     = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cw = useContainerWidth(containerRef)

  const subNavItems  = activeTab === 'Manage learning' ? MANAGE_SUB_NAV : SUB_NAV
  const stackSubNav  = cw < 560  // sub-nav becomes horizontal scroller

  const rows =
    activeSubNav === 'Access time'    ? ACCESS_TIME_ROWS :
    activeSubNav === 'Notifications'  ? NOTIFICATION_ROWS :
    []

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-8 pt-7 pb-0">
        <h1 className="text-xl font-semibold text-foreground">Learning Management</h1>

        {/* Top tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="h-9 bg-transparent p-0 gap-0 border-b border-border rounded-none w-full justify-start">
            {['My learning', 'Manage learning', 'Settings'].map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm px-4 h-9 data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0 flex-1">
            {/* Two-panel layout — sub-nav collapses to horizontal strip when narrow */}
            <div className={stackSubNav ? 'flex flex-col h-full' : 'flex h-full'} style={{ minHeight: 0 }}>
              {/* Sub-nav */}
              {stackSubNav ? (
                /* Horizontal scrolling pill strip */
                <div
                  className="shrink-0 border-b border-border"
                  style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
                >
                  <nav className="flex gap-1 px-4 py-2" style={{ whiteSpace: 'nowrap' }}>
                    {subNavItems.map((item) => (
                      <button
                        key={item}
                        onClick={() => setActiveSubNav(item)}
                        className={[
                          'text-sm px-3 py-1.5 rounded-md transition-colors shrink-0',
                          activeSubNav === item
                            ? 'bg-accent text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        ].join(' ')}
                      >
                        {item}
                      </button>
                    ))}
                  </nav>
                </div>
              ) : (
                /* Vertical left sub-nav */
                <div className="w-44 shrink-0 border-r border-border pt-4 pb-4">
                  <nav className="flex flex-col gap-0.5 px-2">
                    {subNavItems.map((item) => (
                      <button
                        key={item}
                        onClick={() => setActiveSubNav(item)}
                        className={[
                          'w-full text-left text-sm px-3 py-2 rounded-md transition-colors',
                          activeSubNav === item
                            ? 'bg-accent text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        ].join(' ')}
                      >
                        {item}
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              {/* Right / bottom content */}
              <div className="flex-1 overflow-auto px-8 py-6">
                <div className="max-w-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-foreground">{activeSubNav}</h2>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                      <Pencil size={12} />
                      Edit
                    </Button>
                  </div>

                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    {rows.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No settings configured for this section.
                      </div>
                    ) : (
                      rows.map((row, i) => (
                        <div key={row.label}
                          onMouseEnter={() => setHoveredRow(row.label)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          {i > 0 && <Separator />}
                          <div className="flex items-center justify-between px-5 py-4 gap-3">
                            <span className="text-sm text-muted-foreground w-44 shrink-0">{row.label}</span>
                            <span className="text-sm text-foreground flex-1">{row.value}</span>
                            {hoveredRow === row.label && onAskAI && (
                              <AskAIChip onClick={() => onAskAI(`Explain the "${row.label}" setting and suggest best practices`)} />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {activeSubNav === 'Access time' && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Controls when new employees gain access to assigned learning courses in Rippling.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
})
