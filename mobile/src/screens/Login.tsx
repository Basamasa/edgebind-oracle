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

  const panel: React.CSSProperties = {
    width: '100%',
    maxWidth: '388px',
    borderRadius: '28px',
    padding: '28px 22px 20px',
    background:
      'linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.98) 100%)',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.42)',
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={panel}>
        <div
          style={{
            position: 'absolute',
            inset: '-20% auto auto 55%',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(249,115,22,0.16) 0%, rgba(249,115,22,0) 72%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 'auto 55% -24% auto',
            width: '210px',
            height: '210px',
            background: 'radial-gradient(circle, rgba(224,64,176,0.14) 0%, rgba(224,64,176,0) 72%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                padding: '7px 11px',
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#8d877d',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '999px',
                  background: settings.mode === 'demo' ? '#facc15' : '#1D9E75',
                  boxShadow:
                    settings.mode === 'demo'
                      ? '0 0 0 4px rgba(250,204,21,0.12)'
                      : '0 0 0 4px rgba(29,158,117,0.12)',
                }}
              />
              {settings.mode === 'demo' ? 'demo' : 'world live'}
            </div>

            <div style={{ fontSize: '11px', color: '#5f5a52', fontFamily: 'monospace' }}>
              EdgeBind
            </div>
          </div>

          <div style={{ marginTop: '22px', marginBottom: '22px' }}>
            <div
              style={{
                width: '82px',
                height: '82px',
                borderRadius: '22px',
                background: GRADIENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 18px 50px rgba(0,0,0,0.28)',
              }}
            >
              <img src="/icon-512.png" alt="EdgeBind" style={{ width: '68px', height: '68px', borderRadius: '16px' }} />
            </div>
          </div>

          <div style={{ fontSize: '30px', lineHeight: 1, fontWeight: 500, color: '#f5f1ea', marginBottom: '12px' }}>
            Worker access
          </div>
          <div style={{ fontSize: '14px', color: '#8e857a', lineHeight: 1.6, maxWidth: '290px', marginBottom: '22px' }}>
            {settings.mode === 'demo'
              ? 'Use a local worker profile.'
              : 'Verify with World. Start working.'}
          </div>

          {settings.mode === 'demo' ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: '#5d574f', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '10px' }}>
                Demo worker
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
            </div>
          ) : (
            <div
              style={{
                marginBottom: '16px',
                borderRadius: '18px',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)',
                padding: '14px 15px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#5d574f', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '8px' }}>
                Identity
              </div>
              <div style={{ fontSize: '14px', color: '#f2ede5', marginBottom: '4px' }}>Verified human</div>
              <div style={{ fontSize: '12px', color: '#7e756a', lineHeight: 1.5 }}>
                Worker ID is restored after proof.
              </div>
            </div>
          )}

          {err ? (
            <div
              style={{
                fontSize: '12px',
                color: '#ff9d9d',
                marginBottom: '12px',
                borderRadius: '14px',
                border: '1px solid rgba(248,113,113,0.18)',
                background: 'rgba(248,113,113,0.08)',
                padding: '11px 12px',
              }}
            >
              {err}
            </div>
          ) : null}

          <button
            style={{
              ...gradientBtn,
              height: '58px',
              borderRadius: '18px',
              fontSize: '15px',
              letterSpacing: '0.01em',
              boxShadow: '0 20px 40px rgba(249,115,22,0.22)',
            }}
            onClick={submit}
            disabled={loading || signingIn}
          >
            {loading ? 'Loading...' : signingIn ? 'Preparing World...' : settings.mode === 'demo' ? 'Enter demo' : 'Verify with World'}
          </button>

          <div
            style={{
              marginTop: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '11px',
              color: '#5f5a52',
              fontFamily: 'monospace',
            }}
          >
            <span>{settings.mode}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px', textAlign: 'right' }}>
              {settings.backendUrl.replace(/^https?:\/\//, '')}
            </span>
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
