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
  { icon: 'account_tree', label: 'Flow',      page: 'flow'      },
  { icon: 'brush',        label: 'Canvas',    page: 'canvas'    },
]

export function NavPanel({ isOpen, onToggle, activePage, onPageChange, elevation = 'base', background = 'var(--grey-50)' }: NavPanelProps) {
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
                  background: isActive ? '#e8e8e8' : 'transparent',
                  color: isActive ? '#111' : '#777',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.12s, color 0.12s',
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
