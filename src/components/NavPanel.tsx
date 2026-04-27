import { motion } from 'motion/react'
import { Icon } from './Icon'
import type { PageId } from './PageContent'

interface NavPanelProps {
  isOpen: boolean
  onToggle: () => void
  activePage: PageId | null
  onPageChange: (page: PageId | null) => void
  elevation?: 'base' | 'shadow' | 'variable'
  background?: string
  /** Canvas page: where the prototype chat panel docks. */
  canvasChatPlacement?: 'left' | 'right'
  onCanvasChatPlacementChange?: (p: 'left' | 'right') => void
}

export const NAV_WIDTH = 240

type NavItem = {
  icon: string
  label: string
  page: PageId | null
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'home',         label: 'Home',      page: null        },
  { icon: 'table_chart',  label: 'Table',     page: 'table'     },
  { icon: 'dashboard',    label: 'Dashboard', page: 'dashboard' },
  { icon: 'settings',     label: 'Settings',  page: 'settings'  },
  { icon: 'account_tree', label: 'Workflow',   page: 'flow'      },
  { icon: 'linear_scale', label: 'Flow',      page: 'stepper'   },
  { icon: 'brush',        label: 'Canvas',    page: 'canvas'    },
]

export function NavPanel({
  isOpen, onToggle, activePage, onPageChange, elevation = 'base', background = 'var(--grey-50)',
  canvasChatPlacement = 'right', onCanvasChatPlacementChange,
}: NavPanelProps) {
  return (
    <motion.div
      animate={{
        width: isOpen ? NAV_WIDTH : 0,
        boxShadow: elevation === 'shadow' && isOpen
          ? '4px 0 20px rgba(0,0,0,0.09), 8px 0 40px rgba(0,0,0,0.05)'
          : '0 0 0 rgba(0,0,0,0)',
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 38 }}
      style={{
        flexShrink: 0, overflow: 'hidden', zIndex: 20, height: '100%',
        borderRight: isOpen ? '1px solid var(--grey-300)' : 'none',
      }}
    >
      <div
        style={{
          width: NAV_WIDTH, height: '100%',
          background,
          transition: 'background 0.18s ease',
          display: 'flex', flexDirection: 'column',
          paddingTop: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 6px' }}>
          {NAV_ITEMS.map(({ icon, label, page }) => {
            const isActive = activePage === page
            return (
              <button
                key={label}
                onClick={() => { onPageChange(page); if (!isOpen) onToggle() }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 12px', borderRadius: 5, border: 'none',
                  borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                  background: isActive ? 'color-mix(in srgb, var(--brand) 4%, #e8e8e8)' : 'transparent',
                  color: isActive ? '#111' : '#777',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.12s, color 0.12s, border-color 0.12s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = '#ededed'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <Icon name={icon} size={20} style={{ color: isActive ? '#333' : '#aaa' }} />
                <span style={{ flex: 1 }}>{label}</span>
              </button>
            )
          })}
        </div>

        {activePage === 'canvas' && onCanvasChatPlacementChange && (
          <div
            style={{
              marginTop: 6,
              padding: '0 6px 8px',
              borderTop: '1px solid color-mix(in srgb, var(--grey-300) 70%, transparent)',
            }}
          >
            <p
              style={{
                fontSize: 10, fontWeight: 600, color: '#b0b0b0', textTransform: 'uppercase',
                letterSpacing: '0.4px', margin: '8px 8px 6px', padding: 0,
              }}
            >
              Canvas chat
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(
                [
                  { id: 'right' as const, label: 'Chat right', sub: 'Uses prototype options' },
                  { id: 'left' as const, label: 'Chat left', sub: 'Expand / collapse' },
                ]
              ).map(({ id, label, sub }) => {
                const active = canvasChatPlacement === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onCanvasChatPlacementChange(id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 1,
                      padding: '7px 10px',
                      borderRadius: 5,
                      border: 'none',
                      background: active ? 'color-mix(in srgb, var(--brand) 8%, #e8e8e8)' : 'transparent',
                      color: active ? '#111' : '#777',
                      fontWeight: active ? 500 : 400,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderLeft: active ? '3px solid var(--brand)' : '3px solid transparent',
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ fontSize: 10, color: '#aaa', fontWeight: 400 }}>{sub}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />
        <div style={{
          padding: '12px 16px', fontSize: 10, color: '#ccc', fontWeight: 500,
          letterSpacing: '0.6px', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          Workspace
        </div>
      </div>
    </motion.div>
  )
}
