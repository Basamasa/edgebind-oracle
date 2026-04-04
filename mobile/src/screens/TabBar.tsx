import React from "react"
import { GRADIENT } from '../data/mock'

type Tab = 'list' | 'history' | 'create' | 'about' | 'profile'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
  historyCount: number
}

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'list',
    label: 'Requests',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="5" width="18" height="4" rx="1"/><rect x="3" y="11" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
      </svg>
    ),
  },
  {
    id: 'create',
    label: 'New',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'about',
    label: 'About',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

export default function TabBar({ active, onChange, historyCount }: Props) {
  return (
    <div style={{
      position: 'fixed' as const,
      bottom: 0, left: 0, right: 0,
      background: '#0d0d0d',
      borderTop: '0.5px solid #1e1e1e',
      display: 'flex',
      padding: '8px 0 20px',
      zIndex: 100,
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'transparent' : '#444',
              position: 'relative' as const,
              padding: '4px 0',
            }}
          >
            {/* gradient icon when active */}
            <span style={{
              background: isActive ? GRADIENT : 'none',
              WebkitBackgroundClip: isActive ? 'text' : 'unset',
              WebkitTextFillColor: isActive ? 'transparent' : 'unset',
              color: isActive ? 'transparent' : '#444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: isActive ? '#E040B0' : '#444' }}>
                {tab.icon}
              </span>
            </span>
            <span style={{
              fontSize: '10px',
              color: isActive ? '#f0f0f0' : '#444',
              fontWeight: isActive ? 500 : 400,
            }}>
              {tab.label}
            </span>
            {/* badge on history */}
            {tab.id === 'history' && historyCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0px',
                right: 'calc(50% - 18px)',
                background: '#E040B0',
                color: '#fff',
                borderRadius: '10px',
                fontSize: '9px',
                padding: '1px 5px',
                fontWeight: 500,
                minWidth: '16px',
                textAlign: 'center',
              }}>
                {historyCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
