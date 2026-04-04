import { useState, useEffect } from 'react'
import { page, card, ghostBtn } from '../data/styles'

// what we store for each completed submission
export interface HistoryEntry {
  id: string
  requestId: string
  description: string
  lat: number
  lng: number
  ts: string
  photo: string
}

// helpers to read/write from localStorage
export const loadHistory = (): HistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem('edgebind_history') ?? '[]')
  } catch {
    return []
  }
}

export const saveToHistory = (entry: Omit<HistoryEntry, 'id'>) => {
  const history = loadHistory()
  const newEntry: HistoryEntry = { ...entry, id: Date.now().toString() }
  localStorage.setItem('edgebind_history', JSON.stringify([newEntry, ...history]))
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
    setEntries(loadHistory())
  }, [])

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem('edgebind_history', JSON.stringify(updated))
  }

  const clearAll = () => {
    localStorage.removeItem('edgebind_history')
    setEntries([])
  }

  return (
    <div style={page}>

      {/* top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
        <div style={{ fontSize: '13px', color: '#555' }}>
          Signed in as <span style={{ color: '#f0f0f0' }}>{user}</span>
        </div>
        <button
          onClick={onSignOut}
          style={{ fontSize: '12px', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '20px 16px 8px' }}>
        <div>
          <button onClick={onBack} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '6px', display: 'block' }}>
            ← back
          </button>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Submission history
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

      {/* list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
        {entries.length === 0 && (
          <div style={{ textAlign: 'center', color: '#444', fontSize: '14px', marginTop: '60px', lineHeight: 1.6 }}>
            No submissions yet.<br />
            <span style={{ fontSize: '12px', color: '#333' }}>Complete a request to see it here.</span>
          </div>
        )}

        {entries.map(e => (
          <div key={e.id} style={card}>

            {/* summary row */}
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === e.id ? null : e.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, flex: 1, paddingRight: '12px', lineHeight: 1.4 }}>
                  {e.description}
                </div>
                <span style={{ fontSize: '12px', color: '#444', flexShrink: 0 }}>
                  {expanded === e.id ? '▲' : '▼'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {new Date(e.ts).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#444', marginTop: '4px', fontFamily: 'monospace' }}>
                {e.lat.toFixed(5)}, {e.lng.toFixed(5)}
              </div>
            </div>

            {/* expanded detail */}
            {expanded === e.id && (
              <div style={{ marginTop: '12px', borderTop: '0.5px solid #1e1e1e', paddingTop: '12px' }}>
                {/* photo thumbnail */}
                <img
                  src={e.photo}
                  alt="proof"
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '12px', display: 'block' }}
                />
                {/* metadata */}
                {[
                  { label: 'Request ID', value: e.requestId, mono: true },
                  { label: 'Latitude', value: e.lat.toFixed(6) },
                  { label: 'Longitude', value: e.lng.toFixed(6) },
                  { label: 'Submitted', value: new Date(e.ts).toLocaleString() },
                ].map(({ label, value, mono }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid #1a1a1a' }}>
                    <span style={{ fontSize: '12px', color: '#555' }}>{label}</span>
                    <span style={{ fontSize: '12px', color: '#f0f0f0', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
                  </div>
                ))}
                {/* delete button */}
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
