import { page, card } from '../data/styles'
import { GRADIENT } from '../data/mock'

interface Props {
  user: string
  onSignOut: () => void
}

export default function About({ user, onSignOut }: Props) {

  const section = (title: string, body: string) => (
    <div style={card}>
      <div style={{ fontSize: '13px', fontWeight: 500, color: '#f0f0f0', marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.7 }}>{body}</div>
    </div>
  )

  return (
    <div style={{ ...page, paddingBottom: '80px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
        <div style={{ fontSize: '13px', color: '#555' }}>
          worker_id = <span style={{ color: '#f0f0f0', fontFamily: 'monospace' }}>{user}</span>
        </div>
        <button onClick={onSignOut} style={{ fontSize: '12px', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      {/* hero */}
      <div style={{ padding: '28px 16px 20px', textAlign: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: GRADIENT, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/icon-512.png" alt="EdgeBind" style={{ width: '60px', height: '60px', borderRadius: '14px' }} />
        </div>
        <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '6px' }}>EdgeBind</div>
        <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>
          Verified worker app
        </div>
      </div>

      {section(
        'What is EdgeBind?',
        'EdgeBind connects AI agents to verified human execution. This app is the worker surface: accept a task, capture proof, and submit evidence back to the runtime.'
      )}

      {section(
        'How does it work?',
        '1. A verified owner or agent creates a task in the runtime.\n2. A verified human worker accepts it here.\n3. The worker submits photo and location proof.\n4. The backend validates proof and routes payout automatically or to manual approval.'
      )}

      {section(
        'What does this app do?',
        'It is not a marketplace. It is a worker console for execution: see open tasks, accept one, capture proof, and send it to the shared runtime.'
      )}

      {section(
        'Trust model',
        'Workers are verified humans. Owners are moving to World-backed identity. Low-risk payouts auto-release after validation. High-risk payouts escalate to Ledger for approval.'
      )}

      <div style={{ textAlign: 'center', padding: '24px 16px', fontSize: '11px', color: '#333' }}>
        EdgeBind worker runtime - v0.1.0
      </div>

    </div>
  )
}
