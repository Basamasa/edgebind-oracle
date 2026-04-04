import { useEffect, useState } from 'react'
import { GRADIENT } from '../data/mock'
import { page, gradientBtn } from '../data/styles'
import { fetchWorkers, signInWorker } from '../data/api'
import { loadSettings } from '../data/settings'
import type { WorkerSession, WorkerSummary } from '../data/types'

interface Props {
  onLogin: (session: WorkerSession) => void
}

export default function Login({ onLogin }: Props) {
  const [workers, setWorkers] = useState<WorkerSummary[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [err, setErr] = useState('')
  const settings = loadSettings()

  useEffect(() => {
    if (settings.mode === 'demo') {
      const demoWorkers: WorkerSummary[] = [
        { id: 'worker-lina', name: 'Lina Verified', role: 'worker', isHumanVerified: true },
        { id: 'worker-marcus', name: 'Marcus Runner', role: 'worker', isHumanVerified: true },
      ]
      setWorkers(demoWorkers)
      setSelectedId(demoWorkers[0]?.id ?? '')
      setLoading(false)
      return
    }

    fetchWorkers(settings.backendUrl)
      .then((result) => {
        setWorkers(result)
        setSelectedId(result[0]?.id ?? '')
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'Failed to load workers'))
      .finally(() => setLoading(false))
  }, [settings.backendUrl, settings.mode])

  const submit = async () => {
    const worker = workers.find((entry) => entry.id === selectedId)

    if (!worker) {
      setErr('Select a verified worker')
      return
    }

    if (settings.mode === 'demo') {
      onLogin({ ok: true, token: 'demo-worker-token', user: worker })
      return
    }

    try {
      setSigningIn(true)
      setErr('')
      onLogin(await signInWorker(settings.backendUrl, worker.id))
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Worker sign-in failed')
    } finally {
      setSigningIn(false)
    }
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
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '24px', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/icon-512.png" alt="EdgeBind" style={{ width: '80px', height: '80px', borderRadius: '18px' }} />
        </div>
      </div>

      <div style={{ fontSize: '24px', fontWeight: 500, marginBottom: '4px' }}>EdgeBind</div>
      <div style={{ fontSize: '14px', color: '#444', marginBottom: '40px', textAlign: 'center' }}>
        Verified worker console
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Verified worker
        </div>
        <select
          style={input}
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setErr('') }}
          disabled={loading || signingIn}
        >
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name}
            </option>
          ))}
        </select>
        {err && (
          <div style={{ fontSize: '13px', color: '#f87171', marginBottom: '12px', textAlign: 'center' }}>
            {err}
          </div>
        )}
        <button style={gradientBtn} onClick={submit} disabled={loading || signingIn}>
          {loading ? 'Loading workers...' : signingIn ? 'Signing in...' : 'Continue'}
        </button>

        <div style={{ marginTop: '24px', background: '#0f0f0f', border: '0.5px solid #1e1e1e', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Runtime
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>
            mode = {settings.mode}
          </div>
          <div style={{ fontSize: '12px', color: '#444', fontFamily: 'monospace', lineHeight: 1.6 }}>
            {settings.backendUrl}
          </div>
        </div>
      </div>
    </div>
  )
}
