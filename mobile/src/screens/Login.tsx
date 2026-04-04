import { useState } from 'react'
import { MOCK_USERS, GRADIENT } from '../data/mock'
import { page, card, gradientBtn } from '../data/styles'

interface Props {
  onLogin: (display: string) => void
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    // check against mock users - replace with real auth when ready
    const user = MOCK_USERS.find(
      u => u.username === username.trim().toLowerCase() && u.password === password
    )
    if (!user) {
      setErr('Wrong username or password')
      return
    }
    onLogin(user.display)
  }

  const input: React.CSSProperties = {
    width: '100%',
    background: '#1a1a1a',
    border: '0.5px solid #333',
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

      {/* logo */}
      <img
        src="/icon-512.png"
        alt="EdgeBind"
        style={{ width: '80px', height: '80px', borderRadius: '20px', marginBottom: '16px' }}
      />
      <div style={{ fontSize: '22px', fontWeight: 500, marginBottom: '4px' }}>EdgeBind</div>
      <div style={{ fontSize: '14px', color: '#555', marginBottom: '40px' }}>
        Real-world proof, on-chain
      </div>

      {/* form */}
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
        <button style={gradientBtn} onClick={submit}>
          Sign in
        </button>

        {/* hint for demo judges */}
        <div style={{ marginTop: '24px', background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '10px', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Demo credentials
          </div>
          {MOCK_USERS.map(u => (
            <div
              key={u.username}
              style={{ fontSize: '12px', color: '#888', padding: '3px 0', cursor: 'pointer' }}
              onClick={() => { setUsername(u.username); setPassword(u.password); setErr('') }}
            >
              {u.username} / {u.password}
            </div>
          ))}
          <div style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
            tap a row to autofill
          </div>
        </div>
      </div>

    </div>
  )
}
