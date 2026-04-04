import { useState } from 'react'
import { MOCK_USERS, GRADIENT } from '../data/mock'
import { page, gradientBtn } from '../data/styles'

interface Props {
  onLogin: (display: string) => void
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    const user = MOCK_USERS.find(
      u => u.username === username.trim().toLowerCase() && u.password === password
    )
    if (!user) { setErr('Wrong username or password'); return }
    onLogin(user.display)
  }

  const input: React.CSSProperties = {
    width: '100%',
    background: '#1a1a1a',
    border: '0.5px solid #2a2a2a',
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '16px',
    color: '#f0f0f0',
    outline: 'none',
    marginBottom: '12px',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

      {/* logo with gradient ring */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '24px', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/icon-512.png" alt="EdgeBind" style={{ width: '80px', height: '80px', borderRadius: '18px' }} />
        </div>
      </div>

      <div style={{ fontSize: '24px', fontWeight: 500, marginBottom: '4px' }}>EdgeBind</div>
      <div style={{ fontSize: '14px', color: '#444', marginBottom: '40px', textAlign: 'center' }}>
        Real-world proof, on-chain
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        <input
          style={input}
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => { setUsername(e.target.value); setErr('') }}
          autoCapitalize="none"
          autoCorrect="off"
        />
        <input
          style={input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => { setPassword(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        {err && (
          <div style={{ fontSize: '13px', color: '#f87171', marginBottom: '12px', textAlign: 'center' }}>
            {err}
          </div>
        )}
        <button style={gradientBtn} onClick={submit}>Sign in</button>

        {/* demo credentials hint */}
        <div style={{ marginTop: '24px', background: '#0f0f0f', border: '0.5px solid #1e1e1e', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Demo credentials
          </div>
          {MOCK_USERS.map(u => (
            <div
              key={u.username}
              onClick={() => { setUsername(u.username); setPassword(u.password); setErr('') }}
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid #1a1a1a', cursor: 'pointer' }}
            >
              <span style={{ color: '#888' }}>{u.username}</span>
              <span style={{ color: '#444', fontFamily: 'monospace' }}>{u.password}</span>
            </div>
          ))}
          <div style={{ fontSize: '11px', color: '#333', marginTop: '8px' }}>tap a row to autofill</div>
        </div>
      </div>
    </div>
  )
}
