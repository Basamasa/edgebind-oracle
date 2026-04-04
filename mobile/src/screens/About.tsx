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

  const step = (index: string, title: string, body: string) => (
    <div
      style={{
        ...card,
        display: 'grid',
        gridTemplateColumns: '42px 1fr',
        gap: '14px',
        alignItems: 'start',
      }}
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid #252525',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          color: '#8a8278',
          fontFamily: 'monospace',
        }}
      >
        {index}
      </div>
      <div>
        <div style={{ fontSize: '14px', color: '#f0f0f0', marginBottom: '6px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.65 }}>{body}</div>
      </div>
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

      <div
        style={{
          margin: '18px 16px 14px',
          borderRadius: '26px',
          padding: '22px 18px',
          background: 'linear-gradient(145deg, rgba(20,20,20,1) 0%, rgba(10,10,10,1) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/icon-512.png" alt="EdgeBind" style={{ width: '60px', height: '60px', borderRadius: '14px' }} />
          </div>
          <div>
            <div style={{ fontSize: '24px', color: '#f4efe8', marginBottom: '6px' }}>How it works</div>
            <div style={{ fontSize: '13px', color: '#8d867a', lineHeight: 1.6 }}>
              Accept one task. Submit one proof. Get paid when the runtime clears it.
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 0 4px' }}>
        {step('01', 'Accept the task', 'Open tasks come from a verified owner or agent. One task can only be taken by one worker.')}
        {step('02', 'Capture proof', 'Follow the instructions, then submit the required photo or location proof from the app.')}
        {step('03', 'Runtime decides', 'The backend validates proof and routes payout automatically or to approval.')}
      </div>

      {section(
        'What this app is',
        'This is a worker console, not a marketplace. You do not browse applicants or bids. You execute assigned work and submit proof.'
      )}

      {section(
        'Trust model',
        'Workers are verified humans. Owners create tasks, the runtime validates proof, Hedera handles payout rail, and Ledger is used only for high-risk approvals.'
      )}

      {section(
        'Need to get paid?',
        'Open Profile and save your Hedera account before taking live payout work.'
      )}

      <div style={{ textAlign: 'center', padding: '24px 16px', fontSize: '11px', color: '#333' }}>
        EdgeBind worker runtime - v0.1.0
      </div>

    </div>
  )
}
