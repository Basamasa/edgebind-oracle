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
          Signed in as <span style={{ color: '#f0f0f0' }}>{user}</span>
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
          Decentralized physical oracle
        </div>
      </div>

      {section(
        'What is EdgeBind?',
        'EdgeBind connects smart contracts and AI agents to the real world. When a contract needs to verify that something happened physically (for example in a delivery, a location visit, an event), EdgeBind provides cryptographic proof through nearby human devices.'
      )}

      {section(
        'How does it work?',
        '1. A requester locks funds in a smart contract with a location, radius, and deadline.\n2. A verifier opens this app, goes to the location, and captures a photo.\n3. The photo, GPS coordinates, and timestamp are sent on-chain as immutable proof.\n4. If the conditions are met, the funds are released automatically.'
      )}

      {section(
        'Why on-chain?',
        'Once proof is submitted, nobody can change or delete it. The smart contract verifies the conditions and executes automatically: no human in the loop, no possibility of fraud.'
      )}

      {section(
        'Built at ETHGlobal Cannes 2026',
        'EdgeBind was built with love and coffee by a 4-person team at ETHGlobal Cannes 2026. It uses World ID for human verification, 0G for decentralized photo storage, and Arc for smart contract deployment.'
      )}

      <div style={{ textAlign: 'center', padding: '24px 16px', fontSize: '11px', color: '#333' }}>
        ETHGlobal Cannes 2026 - v0.1.0
      </div>

    </div>
  )
}
