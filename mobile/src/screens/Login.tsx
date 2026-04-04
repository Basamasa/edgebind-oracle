import { useEffect, useState } from 'react'
import {
  IDKitErrorCodes,
  IDKitRequestWidget,
  orbLegacy,
  type IDKitResult,
  type RpContext,
} from '@worldcoin/idkit'
import { GRADIENT } from '../data/mock'
import { page, gradientBtn } from '../data/styles'
import { prepareWorldWorkerVerification, verifyWorldWorker } from '../data/api'
import { loadSettings } from '../data/settings'
import type { WorkerSession, WorkerSummary, WorldPrepareResponse } from '../data/types'

interface Props {
  onLogin: (session: WorkerSession) => void
}

export default function Login({ onLogin }: Props) {
  const [workers, setWorkers] = useState<WorkerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [err, setErr] = useState('')
  const [worldOpen, setWorldOpen] = useState(false)
  const [worldPrepare, setWorldPrepare] = useState<WorldPrepareResponse | null>(null)
  const settings = loadSettings()

  useEffect(() => {
    if (settings.mode === 'demo') {
      const demoWorkers: WorkerSummary[] = [
        { id: 'worker-demo-alpha', name: 'Demo Worker Alpha', role: 'worker', isHumanVerified: true },
        { id: 'worker-demo-beta', name: 'Demo Worker Beta', role: 'worker', isHumanVerified: true },
      ]
      setWorkers(demoWorkers)
      setLoading(false)
      return
    }

    setWorkers([])
    setLoading(false)
  }, [settings.backendUrl, settings.mode])

  const submit = async () => {
    if (settings.mode === 'demo') {
      const worker = workers[0]

      if (!worker) {
        setErr('Select a verified worker')
        return
      }

      onLogin({ ok: true, token: 'demo-worker-token', user: worker })
      return
    }

    try {
      setSigningIn(true)
      setErr('')
      const prepared = await prepareWorldWorkerVerification(settings.backendUrl)
      setWorldPrepare(prepared)
      setWorldOpen(true)
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'World worker verification failed')
    } finally {
      setSigningIn(false)
    }
  }

  const handleWorldVerify = async (result: IDKitResult) => {
    if (!worldPrepare) {
      throw new Error('Worker verification context is missing')
    }

    const session = await verifyWorldWorker(settings.backendUrl, {
      rp_id: worldPrepare.rp_context.rp_id,
      idkitResponse: result,
    })

    onLogin(session)
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
        {settings.mode === 'demo' ? 'Demo worker console' : 'Verify with World to start working'}
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        {settings.mode === 'demo' ? (
          <>
            <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Verified worker
            </div>
            <select
              style={input}
              value={workers[0]?.id ?? ''}
              onChange={() => setErr('')}
              disabled={loading || signingIn}
            >
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <div style={{ marginBottom: '18px', background: '#0f0f0f', border: '0.5px solid #1e1e1e', borderRadius: '12px', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Worker identity
            </div>
            <div style={{ fontSize: '14px', color: '#f0f0f0', marginBottom: '6px' }}>
              No preset worker profile
            </div>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6 }}>
              World proof creates or restores your verified worker identity automatically.
            </div>
          </div>
        )}
        {err && (
          <div style={{ fontSize: '13px', color: '#f87171', marginBottom: '12px', textAlign: 'center' }}>
            {err}
          </div>
        )}
        <button style={gradientBtn} onClick={submit} disabled={loading || signingIn}>
          {loading ? 'Loading...' : signingIn ? 'Preparing World...' : settings.mode === 'demo' ? 'Continue' : 'Verify with World'}
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

      {settings.mode === 'live' && worldPrepare ? (
        <IDKitRequestWidget
          open={worldOpen}
          onOpenChange={setWorldOpen}
          app_id={worldPrepare.app_id}
          action={worldPrepare.action}
          rp_context={worldPrepare.rp_context as RpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy({ signal: worldPrepare.signal })}
          environment={worldPrepare.environment}
          handleVerify={handleWorldVerify}
          onSuccess={() => {
            setWorldOpen(false)
          }}
          onError={(errorCode) => {
            setErr(
              errorCode === IDKitErrorCodes.UserRejected
                ? 'World verification was canceled.'
                : `World verification failed: ${errorCode}`,
            )
          }}
        />
      ) : null}
    </div>
  )
}
