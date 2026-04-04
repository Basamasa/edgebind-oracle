import { page, card, gradientBtn } from '../data/styles'
import { GRADIENT, MOCK_USERS } from '../data/mock'
import { loadHistory } from './History'

interface Props {
  user: string
  onSignOut: () => void
}

export default function Profile({ user, onSignOut }: Props) {
  const history = loadHistory(user)
  const mockUser = MOCK_USERS.find(u => u.display === user)
  const initials = user.slice(0, 2).toUpperCase()

  return (
    <div style={{ ...page, paddingBottom: '80px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
        <div style={{ fontSize: '13px', color: '#555' }}>Profile</div>
      </div>

      {/* avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 24px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 500, color: '#fff', marginBottom: '14px' }}>
          {initials}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '4px' }}>{user}</div>
        <div style={{ fontSize: '13px', color: '#555' }}>@{mockUser?.username ?? user.toLowerCase()}</div>
      </div>

      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '0 16px 4px' }}>
        <div style={{ background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 500, color: '#f0f0f0', marginBottom: '4px' }}>
            {history.length}
          </div>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Proofs submitted
          </div>
        </div>
        <div style={{ background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 500, color: '#facc15', marginBottom: '4px' }}>
            {(history.length * 0.01).toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ETH earned
          </div>
        </div>
      </div>

      {/* account info */}
      <div style={card}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Account
        </div>
        {[
          { label: 'Username', value: mockUser?.username ?? user.toLowerCase() },
          { label: 'Display name', value: user },
          { label: 'Role', value: 'Verifier' },
          { label: 'Network', value: 'Arc Testnet' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #1e1e1e' }}>
            <span style={{ fontSize: '13px', color: '#555' }}>{label}</span>
            <span style={{ fontSize: '13px', color: '#f0f0f0' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* last submission */}
      {history.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Last submission
          </div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#f0f0f0', marginBottom: '4px' }}>
            {history[0].description}
          </div>
          <div style={{ fontSize: '12px', color: '#555' }}>
            {new Date(history[0].ts).toLocaleString()}
          </div>
        </div>
      )}

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
