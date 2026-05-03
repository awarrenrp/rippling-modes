import { motion } from 'motion/react'
import { Icon } from './Icon'
import type { PageId } from './PageContent'

export type SideBySideNavId = 'reports' | 'workflows' | 'dashboard'

interface NavPanelProps {
  isOpen: boolean
  onToggle: () => void
  activePage: PageId | null
  onPageChange: (page: PageId | null) => void
  /** Highlights Reports / Workflows / Dashboard when chosen from Side by side. */
  activeSideBySide?: SideBySideNavId | null
  onSideBySideSelect?: (id: SideBySideNavId) => void
  elevation?: 'base' | 'shadow' | 'variable'
  background?: string
}

/** Expanded sidebar — labels + icons (~Figma AI-components rail). */
export const NAV_WIDTH = 264
/** Collapsed rail — icons only (common product pattern). */
export const NAV_WIDTH_COLLAPSED = 56

export function navRailWidthPx(expanded: boolean): number {
  return expanded ? NAV_WIDTH : NAV_WIDTH_COLLAPSED
}

type NavItem = {
  icon: string
  label: string
  page: PageId | null
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'home', label: 'Home', page: null },
  { icon: 'table_chart', label: 'Table', page: 'table' },
  { icon: 'dashboard', label: 'Dashboard', page: 'dashboard' },
  { icon: 'settings', label: 'Settings', page: 'settings' },
  { icon: 'account_tree', label: 'Workflow', page: 'flow' },
  { icon: 'linear_scale', label: 'Flow', page: 'stepper' },
  { icon: 'brush', label: 'Canvas', page: 'canvas' },
]

const SIDE_BY_SIDE_ITEMS: { id: SideBySideNavId; icon: string; label: string }[] = [
  { id: 'reports', icon: 'insert_chart', label: 'Reports' },
  { id: 'workflows', icon: 'schema', label: 'Workflows' },
  { id: 'dashboard', icon: 'widgets', label: 'Dashboard' },
]

const SIDEBAR_STROKE = 'var(--grey-200)'
const TEXT_PRIMARY = '#171717'
const TEXT_SECONDARY = '#737373'
const TEXT_MUTED = '#a3a3a3'
const ROW_RADIUS = 8
const BRAND_FILL_ACTIVE = 'color-mix(in srgb, var(--brand) 12%, transparent)'
const BRAND_FILL_HOVER = 'var(--grey-100)'

function sectionLabel(text: string) {
  return (
    <p
      style={{
        margin: '0 4px 8px',
        padding: 0,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: TEXT_MUTED,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {text}
    </p>
  )
}

export function NavPanel({
  isOpen,
  onToggle: _onToggle,
  activePage,
  onPageChange,
  activeSideBySide = null,
  onSideBySideSelect,
  elevation = 'base',
  background = '#f7f7f7',
}: NavPanelProps) {
  const compact = !isOpen

  return (
    <motion.div
      animate={{
        width: navRailWidthPx(isOpen),
        boxShadow:
          elevation === 'shadow'
            ? '4px 0 24px rgba(0,0,0,0.06), 1px 0 0 rgba(0,0,0,0.04)'
            : 'none',
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      style={{
        flexShrink: 0,
        overflow: 'hidden',
        zIndex: 20,
        height: '100%',
        borderRight: `1px solid ${SIDEBAR_STROKE}`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background,
          transition: 'background 0.18s ease',
          display: 'flex',
          flexDirection: 'column',
          padding: compact ? '12px 8px 10px' : '12px 10px 10px',
          boxSizing: 'border-box',
        }}
      >
        {isOpen && sectionLabel('Views')}

        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 4 : 2 }}>
          {NAV_ITEMS.map(({ icon, label, page }) => {
            const isActive = activePage === page
            return (
              <button
                key={label}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => onPageChange(page)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: compact ? 'center' : 'flex-start',
                  gap: compact ? 0 : 10,
                  padding: compact ? '10px 8px' : '9px 10px',
                  borderRadius: ROW_RADIUS,
                  border: 'none',
                  background: isActive ? BRAND_FILL_ACTIVE : 'transparent',
                  color: isActive ? TEXT_PRIMARY : TEXT_SECONDARY,
                  fontWeight: isActive ? 600 : 450,
                  fontSize: 13,
                  lineHeight: '18px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.14s ease, color 0.14s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = BRAND_FILL_HOVER
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <Icon
                  name={icon}
                  size={20}
                  style={{
                    color: isActive ? 'var(--brand)' : TEXT_SECONDARY,
                    fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 20`,
                  }}
                />
                {!compact && <span style={{ flex: 1 }}>{label}</span>}
              </button>
            )
          })}
        </div>

        <div
          style={{
            marginTop: compact ? 8 : 12,
            marginBottom: 0,
            paddingTop: compact ? 12 : 16,
            borderTop: `1px solid ${SIDEBAR_STROKE}`,
          }}
        >
          {isOpen && sectionLabel('Side by side')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 4 : 2 }}>
            {SIDE_BY_SIDE_ITEMS.map(({ id, icon, label }) => {
              const isActive = activeSideBySide === id
              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={() => onSideBySideSelect?.(id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: compact ? 'center' : 'flex-start',
                    gap: compact ? 0 : 10,
                    padding: compact ? '10px 8px' : '9px 10px',
                    borderRadius: ROW_RADIUS,
                    border: 'none',
                    background: isActive ? BRAND_FILL_ACTIVE : 'transparent',
                    color: isActive ? TEXT_PRIMARY : TEXT_SECONDARY,
                    fontWeight: isActive ? 600 : 450,
                    fontSize: 13,
                    lineHeight: '18px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                    transition: 'background 0.14s ease, color 0.14s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = BRAND_FILL_HOVER
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  <Icon
                    name={icon}
                    size={20}
                    style={{
                      color: isActive ? 'var(--brand)' : TEXT_SECONDARY,
                      fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 20`,
                    }}
                  />
                  {!compact && <span style={{ flex: 1 }}>{label}</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 8 }} />

        {isOpen && (
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 12,
              borderTop: `1px solid ${SIDEBAR_STROKE}`,
            }}
          >
            <span
              style={{
                display: 'block',
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: TEXT_MUTED,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Workspace
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
