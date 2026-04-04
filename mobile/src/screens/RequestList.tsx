import { MOCK_REQUESTS, GRADIENT } from '../data/mock'
import type { Request } from '../data/mock'
import { page, card, gradientBtn } from '../data/styles'

interface Props {
  requests: Request[]
  onSelect: (r: Request) => void
  user: string
  onSignOut: () => void
}

export default function RequestList({ requests, onSelect, user, onSignOut }: Props) {

  // time left until deadline, human readable
  const timeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return 'expired'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h > 0) return `${h}h ${m}m left`
    return `${m}m left`
  }

  const isExpired = (deadline: string) => new Date(deadline).getTime() < Date.now()

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
      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
          Open requests
        </div>
        <div style={{ fontSize: '22px', fontWeight: 500 }}>
          {requests.length} active
        </div>
      </div>

      {/* request cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 100px' }}>
        {requests.length === 0 && (
          <div style={{ textAlign: 'center', color: '#444', fontSize: '14px', marginTop: '60px' }}>
            No open requests right now
          </div>
        )}
        {requests.map(r => {
          const expired = isExpired(r.deadline)
          return (
            <div
              key={r.requestId}
              style={{
                ...card,
                opacity: expired ? 0.4 : 1,
                cursor: expired ? 'not-allowed' : 'pointer',
              }}
              onClick={() => !expired && onSelect(r)}
            >
              {/* description */}
              <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '8px', lineHeight: 1.4 }}>
                {r.description ?? `Verify location within ${r.radius}m`}
              </div>

              {/* metadata row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* radius badge */}
                  <span style={{ fontSize: '11px', background: '#1a1a1a', border: '0.5px solid #333', borderRadius: '4px', padding: '2px 7px', color: '#888' }}>
                    {r.radius}m radius
                  </span>
                  {/* amount badge */}
                  {r.amount && (
                    <span style={{ fontSize: '11px', background: '#1a1a1a', border: '0.5px solid #333', borderRadius: '4px', padding: '2px 7px', color: '#facc15' }}>
                      {r.amount}
                    </span>
                  )}
                </div>
                {/* deadline */}
                <span style={{ fontSize: '12px', color: expired ? '#f87171' : '#E040B0' }}>
                  {timeLeft(r.deadline)}
                </span>
              </div>

              {/* deadline full date */}
              <div style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
                Due: {new Date(r.deadline).toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>

      {/* bottom hint */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(transparent, #0a0a0a)' }}>
        <div style={{ fontSize: '12px', color: '#333', textAlign: 'center' }}>
          Tap a request to start capturing proof
        </div>
      </div>

    </div>
  )
}
