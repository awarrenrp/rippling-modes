import { useState, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Paperclip, Zap, ArrowLeft, MoreHorizontal,
  SlidersHorizontal, ArrowUpDown,
  Bot, CircleUserRound, CheckCircle2,
} from 'lucide-react'
import { AskAIChip } from './AskAIChip'

// ─── Data ────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string
  title: string
  ticketId: string
  status: 'Open' | 'Pending' | 'Closed'
  requesterInitials: string
  assigneeInitials: string
  date: string
  unread: boolean
}

const TICKETS: Ticket[] = [
  { id: '1', title: 'Lost google sheets history', ticketId: 'IT-1234', status: 'Open',    requesterInitials: 'MS', assigneeInitials: 'TH', date: 'Apr 4',  unread: true  },
  { id: '2', title: 'Need access to Teams',        ticketId: 'IT-1235', status: 'Pending', requesterInitials: 'JG', assigneeInitials: 'TH', date: 'Apr 4',  unread: false },
  { id: '3', title: 'Support needed immediately',  ticketId: 'IT-1236', status: 'Open',    requesterInitials: 'ST', assigneeInitials: 'TH', date: 'Apr 4',  unread: false },
  { id: '4', title: 'No internet on new device',   ticketId: 'IT-1237', status: 'Pending', requesterInitials: 'JG', assigneeInitials: 'TH', date: 'Mar 28', unread: false },
  { id: '5', title: 'Lost access to GitHub',       ticketId: 'IT-1238', status: 'Closed',  requesterInitials: 'JG', assigneeInitials: 'TH', date: 'Mar 22', unread: false },
]

const TIMELINE = [
  { icon: Bot,             label: 'AI triage',          actor: 'Auto-classified as Access · high priority',      timestamp: 'Jan 23, 2024 · 4:30 PM' },
  { icon: CircleUserRound, label: 'Ticket submitted',    actor: 'Maria Scrivner submitted via online form',       timestamp: 'Jan 23, 2024 · 4:31 PM' },
  { icon: CheckCircle2,    label: 'Manager approval',    actor: 'Jenny Jones approved via Rippling Approvals',    timestamp: 'Jan 23, 2024 · 4:45 PM' },
  { icon: CircleUserRound, label: 'Compensation review', actor: 'Sarah Monday via Rippling Meetings\nReview completed, adjustment approved', timestamp: 'Jan 23, 2024 · 5:10 PM' },
  { icon: CircleUserRound, label: 'Agent comment',       actor: 'Sarah Monday left a comment\n"Hi Maria, your request has been reviewed and approved."', timestamp: 'Jan 23, 2024 · 5:22 PM' },
  { icon: CheckCircle2,    label: 'Ticket closed',       actor: 'Closed automatically via workflow',              timestamp: 'Jan 23, 2024 · 5:22 PM' },
]

const METADATA = [
  { label: 'Reporter',     value: 'Annie Ferrero', type: 'avatar'          },
  { label: 'Assignee',     value: 'Jerry Rice',    type: 'avatar-dropdown' },
  { label: 'Status',       value: 'Closed',        type: 'badge'           },
  { label: 'Priority',     value: 'Urgent',        type: 'badge-strong'    },
  { label: 'Origin',       value: 'Email',         type: 'text'            },
  { label: 'Type',         value: 'Devices',       type: 'text-bold'       },
]

const LIST_TABS = ['All items', 'Pending', 'Resolved']

// ─── Component ───────────────────────────────────────────────────────────────

interface DetailPageProps { onAskAI?: (msg: string) => void }

export function DetailPage({ onAskAI }: DetailPageProps) {
  const [selected, setSelected]   = useState('1')
  const [activeTab, setActiveTab] = useState('All items')
  const [draft, setDraft]         = useState('')
  const [listVisible, setListVisible] = useState(true)
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cw = useContainerWidth(containerRef)

  const ticket = TICKETS.find((t) => t.id === selected)!

  // Responsive column visibility
  const showSidebar = cw >= 900
  const showList    = cw >= 560 || listVisible
  const isMobile    = cw < 560 && cw > 0

  function selectTicket(id: string) {
    setSelected(id)
    if (isMobile) setListVisible(false)
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ══ Column 1: List ══════════════════════════════════════════════════ */}
      {showList && (
      <div style={{
        width: isMobile ? '100%' : 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#fafafa', borderRight: isMobile ? 'none' : '1px solid #e8e8e8',
      }}>

        {/* Top section — view title + overflow */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 14px 8px 14px', flexShrink: 0,
        }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 30, padding: '0 10px', borderRadius: 6,
            border: '1px solid #e0e0e0', background: '#fff',
            fontSize: 13, fontWeight: 500, color: '#111', cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            IT Help Desk
            <ChevronDown size={13} style={{ color: '#999' }} />
          </button>
          <button style={{ ...iconBtnBase, color: '#aaa' }}>
            <MoreHorizontal size={15} />
          </button>
        </div>

        {/* Bottom section — item count + utility actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '2px 14px 10px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>
            {TICKETS.length} items
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            <button style={{ ...iconBtnBase, color: '#aaa' }}><ArrowUpDown size={13} /></button>
            <button style={{ ...iconBtnBase, color: '#aaa' }}><SlidersHorizontal size={13} /></button>
            <button style={{ ...iconBtnBase, color: '#aaa' }}><MoreHorizontal size={13} /></button>
          </div>
        </div>

        {/* Pill tabs — segment style like Figma */}
        <div style={{ padding: '0 8px 8px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', background: '#f0f0f0',
            borderRadius: 8, padding: 3, gap: 2,
          }}>
            {LIST_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  flex: 1, padding: '4px 0', borderRadius: 6,
                  border: 'none', cursor: 'pointer',
                  fontSize: 11.5, fontWeight: activeTab === t ? 600 : 400,
                  background: activeTab === t ? '#ffffff' : 'transparent',
                  color: activeTab === t ? '#111' : '#888',
                  boxShadow: activeTab === t ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                  transition: 'background 0.12s, color 0.12s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#ebebeb', margin: '0 8px', flexShrink: 0 }} />

        {/* Item list */}
        <ScrollArea style={{ flex: 1 }}>
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TICKETS.map((t) => {
              const isSelected = selected === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => selectTicket(t.id)}
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    borderRadius: 8,
                    background: isSelected ? '#e8e8e8' : hoveredTicket === t.id ? '#f0f0f0' : 'transparent',
                    padding: '6px 8px 6px 8px',
                    display: 'flex', flexDirection: 'column', gap: 6,
                    transition: 'background 0.1s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={() => setHoveredTicket(t.id)}
                  onMouseLeave={() => setHoveredTicket(null)}
                >
                  {/* Row 1: title + status badge + assignee */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 13, fontWeight: t.unread ? 600 : 500,
                          color: '#111', lineHeight: 1.3,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          flex: 1,
                        }}>
                          {t.title}
                        </span>
                        {t.unread && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#555', flexShrink: 0, marginTop: 2 }} />
                        )}
                      </div>
                      {/* Status pill */}
                      <span style={{
                        display: 'inline-block',
                        fontSize: 10.5, fontWeight: 500, padding: '1px 7px', borderRadius: 9999,
                        background: t.status === 'Closed' ? '#e8e8e8' : t.status === 'Pending' ? '#e8e8e8' : '#e0e0e0',
                        color: t.status === 'Closed' ? '#888' : '#555',
                      }}>
                        {t.status}
                      </span>
                    </div>
                    {/* Assignee avatar */}
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: isSelected ? '#999' : '#d4d4d4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: isSelected ? '#fff' : '#666',
                    }}>
                      {t.assigneeInitials}
                    </div>
                  </div>

                  {/* Row 2: requester avatar + date + AI chip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      background: '#ddd',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 700, color: '#666',
                    }}>
                      {t.requesterInitials}
                    </div>
                    <span style={{ fontSize: 11, color: '#bbb' }}>{t.ticketId}</span>
                    {hoveredTicket === t.id && onAskAI ? (
                      <div style={{ marginLeft: 'auto' }}>
                        <AskAIChip onClick={() => onAskAI(`Summarize the "${t.title}" ticket and suggest next steps`)} />
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#ccc', marginLeft: 'auto' }}>{t.date}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>
      )}

      {/* ══ Column 2: Detail ════════════════════════════════════════════════ */}
      {(!isMobile || !listVisible) && (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: showSidebar ? '1px solid #e8e8e8' : 'none', background: '#fff' }}>

        {/* Header */}
        <div style={{
          height: 48, padding: '0 16px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #ebebeb',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Back button on mobile */}
            {isMobile && (
              <button
                onClick={() => setListVisible(true)}
                style={{ ...iconBtnBase, color: '#555', marginRight: 4 }}
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <button style={{ ...iconBtnBase, color: '#bbb' }}><ChevronLeft size={15} /></button>
            <button style={{ ...iconBtnBase, color: '#bbb' }}><ChevronRight size={15} /></button>
            <span style={{ fontSize: 11.5, color: '#ccc', marginLeft: 2 }}>1 of {TICKETS.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={{ ...iconBtnBase, color: '#bbb' }}><MoreHorizontal size={15} /></button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4, height: 30, padding: '0 11px',
              borderRadius: 6, border: '1px solid #d8d8d8', background: '#fff',
              fontSize: 12, fontWeight: 500, color: '#333', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Actions <ChevronDown size={11} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>
            {ticket.title}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#bbb' }}>
            {ticket.ticketId}
          </p>

          {/* Detail tabs */}
          <div style={{
            display: 'flex', marginTop: 12,
            borderBottom: '1px solid #ebebeb',
            marginLeft: -20, marginRight: -20, paddingLeft: 20,
          }}>
            {['Activity', 'Details', 'Relations', 'SLA', 'Approvals'].map((t, i) => (
              <button key={t} style={{
                padding: '5px 10px', fontSize: 12, border: 'none', background: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
                color: i === 0 ? '#111' : '#aaa',
                fontWeight: i === 0 ? 600 : 400,
                borderBottom: i === 0 ? '2px solid #111' : '2px solid transparent',
                marginBottom: -1, flexShrink: 0,
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <ScrollArea style={{ flex: 1 }}>
          <div style={{ padding: '18px 16px 16px' }}>

            {/* Steps taken container */}
            <div style={{
              border: '1px solid #e4e4e4',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 16px 8px',
                borderBottom: '1px solid #efefef',
              }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                  Steps taken
                </p>
              </div>
              <div style={{ padding: '14px 16px 6px' }}>
                {TIMELINE.map((step, i) => {
                  const StepIcon = step.icon
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          background: '#f4f4f4', border: '1px solid #e8e8e8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <StepIcon size={11} style={{ color: '#888' }} />
                        </div>
                        {i < TIMELINE.length - 1 && (
                          <div style={{ width: 1, flex: 1, minHeight: 16, background: '#ebebeb', margin: '3px 0' }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: 18, flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: '#111' }}>{step.label}</p>
                        {step.actor.split('\n').map((line, j) => (
                          <p key={j} style={{ margin: '2px 0 0', fontSize: 11.5, color: '#999', lineHeight: 1.5 }}>{line}</p>
                        ))}
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#ccc' }}>{step.timestamp}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Reply bar */}
        <div style={{ borderTop: '1px solid #ebebeb', padding: '10px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button style={replyChipStyle}>
              <ArrowLeft size={10} />
              Replying to requestor
              <ChevronDown size={10} />
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
              <button style={{ ...iconBtnBase, color: '#bbb' }}><Paperclip size={12} /></button>
              <button style={{ ...iconBtnBase, color: '#bbb' }}><Zap size={12} /></button>
            </div>
          </div>
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Reply or use / for shortcuts…"
            style={{
              width: '100%', resize: 'none', border: 'none', outline: 'none',
              fontSize: 12.5, color: '#333', background: 'transparent', fontFamily: 'inherit',
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
            borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 4,
          }}>
            <button style={{ ...outlineBtnBase }}>Clear</button>
            <button style={{ ...primaryBtnBase }}>Submit</button>
          </div>
        </div>
      </div>
      )}

      {/* ══ Column 3: Sidebar — hidden on narrow containers ══════════════════ */}
      {showSidebar && (
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'auto', borderLeft: '1px solid #e8e8e8' }}>

        {/* Details */}
        <div style={{ borderBottom: '1px solid #ebebeb', paddingBottom: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px 8px',
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Details</span>
            <button style={{ ...iconBtnBase, color: '#ccc' }}><ChevronDown size={13} /></button>
          </div>

          {METADATA.map(({ label, value, type }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '4px 14px', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#bbb', width: 64, flexShrink: 0 }}>{label}</span>
              {(type === 'avatar' || type === 'avatar-dropdown') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#ddd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7.5, fontWeight: 700, color: '#666',
                  }}>
                    {value.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span style={{ fontSize: 11.5, color: '#333' }}>{value}</span>
                  {type === 'avatar-dropdown' && <ChevronDown size={9} style={{ color: '#ccc' }} />}
                </div>
              )}
              {type === 'badge' && (
                <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 9999, background: '#efefef', color: '#777', fontWeight: 500 }}>
                  {value}
                </span>
              )}
              {type === 'badge-strong' && (
                <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 9999, background: '#e0e0e0', color: '#333', fontWeight: 600 }}>
                  {value}
                </span>
              )}
              {type === 'text' && <span style={{ fontSize: 11.5, color: '#555' }}>{value}</span>}
              {type === 'text-bold' && <span style={{ fontSize: 11.5, fontWeight: 600, color: '#333' }}>{value}</span>}
            </div>
          ))}
        </div>

      </div>
      )}
    </div>
  )
}

// ─── Shared style objects ─────────────────────────────────────────────────────

const iconBtnBase: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 5, border: 'none',
  background: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const replyChipStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5, height: 24, padding: '0 8px',
  borderRadius: 5, border: '1px solid #e0e0e0', background: '#fafafa',
  fontSize: 11.5, color: '#777', cursor: 'pointer', fontFamily: 'inherit',
}

const outlineBtnBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', height: 28, padding: '0 10px',
  borderRadius: 5, border: '1px solid #d8d8d8', background: '#fff',
  fontSize: 12, fontWeight: 500, color: '#555', cursor: 'pointer', fontFamily: 'inherit',
}

const primaryBtnBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', height: 28, padding: '0 12px',
  borderRadius: 5, border: 'none', background: '#111', color: '#fff',
  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
}
