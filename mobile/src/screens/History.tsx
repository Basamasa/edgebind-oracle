import { useState, useEffect } from 'react'
import { page, card, ghostBtn } from '../data/styles'

export interface HistoryEntry {
  id: string
  requestId: string
  description: string
  lat: number
  lng: number
  ts: string
  photo: string
  outcome?: string
  reason?: string
}

// key by stable worker id so each verified human keeps separate local history
const historyKey = (user: string) => `edgebind_history_${user.toLowerCase()}`

export const loadHistory = (user: string): HistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(historyKey(user)) ?? '[]')
  } catch {
    return []
  }
}

export const saveToHistory = (user: string, entry: Omit<HistoryEntry, 'id'>) => {
  const history = loadHistory(user)
  const newEntry: HistoryEntry = { ...entry, id: Date.now().toString() }
  localStorage.setItem(historyKey(user), JSON.stringify([newEntry, ...history]))
}

interface Props {
  onBack: () => void
  user: string
  onSignOut: () => void
}

export default function History({ onBack, user, onSignOut }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setEntries(loadHistory(user))
  }, [user])

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem(historyKey(user), JSON.stringify(updated))
  }

  const clearAll = () => {
    localStorage.removeItem(historyKey(user))
    setEntries([])
  }

  return (
    <div style={page}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
        <div style={{ fontSize: '13px', color: '#555' }}>
          worker_id = <span style={{ color: '#f0f0f0', fontFamily: 'monospace' }}>{user}</span>
        </div>
        <button onClick={onSignOut} style={{ fontSize: '12px', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '20px 16px 8px' }}>
          <div>
            <button onClick={onBack} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '6px', display: 'block' }}>
            ← back
          </button>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', fontFamily: 'monospace' }}>
            history for {user}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 500 }}>
            {entries.length} {entries.length === 1 ? 'proof' : 'proofs'}
          </div>
        </div>
        {entries.length > 0 && (
          <button
            onClick={clearAll}
            style={{ fontSize: '12px', color: '#f87171', background: 'none', border: '0.5px solid #f87171', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}
          >
            Clear all
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
        {entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#141414', border: '0.5px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#444"/>
              </svg>
            </div>
            <div style={{ color: '#444', fontSize: '14px', marginBottom: '6px' }}>No submissions yet</div>
            <div style={{ fontSize: '12px', color: '#333' }}>Complete a request to see it here.</div>
          </div>
        )}

        {entries.map(e => (
          <div key={e.id} style={card}>
            <div style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, flex: 1, paddingRight: '12px', lineHeight: 1.4 }}>
                  {e.description}
                </div>
                <span style={{ fontSize: '12px', color: '#444', flexShrink: 0 }}>
                  {expanded === e.id ? '▲' : '▼'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>{new Date(e.ts).toLocaleString()}</div>
              <div style={{ fontSize: '11px', color: '#444', marginTop: '4px', fontFamily: 'monospace' }}>
                {e.lat.toFixed(5)}, {e.lng.toFixed(5)}
              </div>
            </div>

            {expanded === e.id && (
              <div style={{ marginTop: '12px', borderTop: '0.5px solid #1e1e1e', paddingTop: '12px' }}>
                <img src={e.photo} alt="proof" style={{ width: '100%', borderRadius: '8px', marginBottom: '12px', display: 'block' }} />
                {[
                  { label: 'Request ID', value: e.requestId, mono: true },
                  { label: 'Outcome', value: e.outcome ?? 'submitted' },
                  { label: 'Reason', value: e.reason ?? 'No runtime note' },
                  { label: 'Latitude', value: e.lat.toFixed(6) },
                  { label: 'Longitude', value: e.lng.toFixed(6) },
                  { label: 'Submitted', value: new Date(e.ts).toLocaleString() },
                ].map(({ label, value, mono }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid #1a1a1a' }}>
                    <span style={{ fontSize: '12px', color: '#555' }}>{label}</span>
                    <span style={{ fontSize: '12px', color: '#f0f0f0', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
                  </div>
                ))}
                <button
                  onClick={() => deleteEntry(e.id)}
                  style={{ marginTop: '12px', width: '100%', background: 'none', border: '0.5px solid #f87171', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#f87171', cursor: 'pointer' }}
                >
                  Delete this entry
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
