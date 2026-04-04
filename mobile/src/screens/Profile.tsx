import { useState, useEffect } from 'react'
import { page, card, gradientBtn, ghostBtn } from '../data/styles'
import { GRADIENT, MOCK_USERS } from '../data/mock'
import { loadHistory } from './History'
import { loadSettings, saveSettings, pingBackend } from '../data/settings'
import type { AppMode } from '../data/settings'

interface Props {
  user: string
  onSignOut: () => void
  onModeChange: (mode: AppMode, url: string) => void
}

export default function Profile({ user, onSignOut, onModeChange }: Props) {
  const history = loadHistory(user)
  const mockUser = MOCK_USERS.find(u => u.display === user)
  const initials = user.slice(0, 2).toUpperCase()

  const settings = loadSettings()
  const [mode, setMode] = useState<AppMode>(settings.mode)
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl)
  const [pinging, setPinging] = useState(false)
  const [pingResult, setPingResult] = useState<'ok' | 'fail' | null>(null)

  const testConnection = async () => {
    setPinging(true)
    setPingResult(null)
    const ok = await pingBackend(backendUrl)
    setPingResult(ok ? 'ok' : 'fail')
    setPinging(false)
  }

  const applySettings = () => {
    saveSettings({ mode, backendUrl })
    onModeChange(mode, backendUrl)
  }

  const input: React.CSSProperties = {
    width: '100%',
    background: '#1a1a1a',
    border: '0.5px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#f0f0f0',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
  }

  return (
    <div style={{ ...page, paddingBottom: '80px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
        <div style={{ fontSize: '13px', color: '#555' }}>Profile</div>
      </div>

      {/* avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 20px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 500, color: '#fff', marginBottom: '12px' }}>
          {initials}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '4px' }}>{user}</div>
        <div style={{ fontSize: '13px', color: '#555' }}>@{mockUser?.username ?? user.toLowerCase()}</div>
      </div>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '0 16px 4px' }}>
        <div style={{ background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 500, color: '#f0f0f0', marginBottom: '4px' }}>{history.length}</div>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Proofs submitted</div>
        </div>
        <div style={{ background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 500, color: '#facc15', marginBottom: '4px' }}>{history.length}</div>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tasks completed</div>
        </div>
      </div>

      {/* mode toggle */}
      <div style={card}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
          Connection mode
        </div>

        {/* toggle */}
        <div style={{ display: 'flex', background: '#0f0f0f', borderRadius: '10px', padding: '3px', marginBottom: '14px', border: '0.5px solid #1e1e1e' }}>
          {(['demo', 'live'] as AppMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: mode === m ? 500 : 400,
                background: mode === m ? (m === 'live' ? '#1D9E75' : '#333') : 'transparent',
                color: mode === m ? '#fff' : '#444',
                transition: 'all 0.15s',
              }}
            >
              {m === 'demo' ? 'Demo' : 'Live'}
            </button>
          ))}
        </div>

        {/* description */}
        <div style={{ fontSize: '12px', color: '#444', marginBottom: '14px', lineHeight: 1.6 }}>
          {mode === 'demo'
            ? 'Uses mock requests and simulates submissions. No backend needed — safe for testing and presentations.'
            : 'Connects to the live task runtime, signs in as a verified worker, accepts open tasks, submits proof, and reflects payout state.'}
        </div>

        {/* backend URL — only shown in live mode */}
        {mode === 'live' && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>Backend URL</div>
            <input
              style={input}
              type="text"
              value={backendUrl}
              onChange={e => { setBackendUrl(e.target.value); setPingResult(null) }}
              placeholder="https://edgebind-web.vercel.app"
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={testConnection}
                style={{ ...ghostBtn, padding: '8px', fontSize: '12px', flex: 1 }}
                disabled={pinging}
              >
                {pinging ? 'Testing...' : 'Test connection'}
              </button>
              {pingResult === 'ok' && (
                <div style={{ fontSize: '12px', color: '#1D9E75', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  Connected
                </div>
              )}
              {pingResult === 'fail' && (
                <div style={{ fontSize: '12px', color: '#f87171', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  Unreachable
                </div>
              )}
            </div>
          </div>
        )}

        <button style={gradientBtn} onClick={applySettings}>
          Save settings
        </button>
      </div>

      {/* account info */}
      <div style={card}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Account</div>
        {[
          { label: 'Username', value: mockUser?.username ?? user.toLowerCase() },
          { label: 'Display name', value: user },
          { label: 'Role', value: 'Verified worker' },
          { label: 'Runtime', value: mode === 'demo' ? 'Mock' : 'Live task API' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #1e1e1e' }}>
            <span style={{ fontSize: '13px', color: '#555' }}>{label}</span>
            <span style={{ fontSize: '13px', color: '#f0f0f0' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* sign out */}
      <div style={{ padding: '16px' }}>
        <button
          onClick={onSignOut}
          style={{ width: '100%', background: 'none', border: '0.5px solid #333', borderRadius: '12px', padding: '14px', fontSize: '14px', color: '#f87171', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>

    </div>
  )
}
