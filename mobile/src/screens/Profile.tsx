import { useState, useEffect } from 'react'
import { page, card, gradientBtn } from '../data/styles'
import { GRADIENT } from '../data/mock'
import { loadHistory } from './History'
import { loadSettings } from '../data/settings'
import type { WorkerSummary } from '../data/types'
import { fetchWorkerProfile, updateWorkerPayoutAccount } from '../data/api'

interface Props {
  user: WorkerSummary
  token: string
  onSignOut: () => void
  onProfileUpdate: (user: WorkerSummary) => void
}

export default function Profile({ user, token, onSignOut, onProfileUpdate }: Props) {
  const history = loadHistory(user.id)
  const initials = 'WH'

  const settings = loadSettings()
  const mode = settings.mode
  const [payoutAccountId, setPayoutAccountId] = useState(user.payoutAccountId ?? '')
  const [savingPayout, setSavingPayout] = useState(false)
  const [payoutNotice, setPayoutNotice] = useState('')
  const [payoutError, setPayoutError] = useState('')

  useEffect(() => {
    if (mode === 'demo') {
      setPayoutAccountId(user.payoutAccountId ?? '')
      return
    }

    fetchWorkerProfile(settings.backendUrl, token)
      .then((profile) => {
        setPayoutAccountId(profile.payoutAccountId ?? '')
        onProfileUpdate(profile)
      })
      .catch(() => {})
  }, [mode, onProfileUpdate, settings.backendUrl, token, user.payoutAccountId])

  const savePayout = async () => {
    if (mode === 'demo') {
      setPayoutNotice('Demo mode does not use live Hedera payouts.')
      setPayoutError('')
      return
    }

    try {
      setSavingPayout(true)
      setPayoutError('')
      setPayoutNotice('')
      const updated = await updateWorkerPayoutAccount(settings.backendUrl, token, payoutAccountId)
      onProfileUpdate(updated)
      setPayoutAccountId(updated.payoutAccountId ?? '')
      setPayoutNotice('Hedera payout account saved.')
    } catch (error) {
      setPayoutError(error instanceof Error ? error.message : 'Failed to save payout account')
    } finally {
      setSavingPayout(false)
    }
  }

  const input: React.CSSProperties = {
    width: '100%',
    background: '#1a1a1a',
    border: '0.5px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#f0f0f0',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
  }

  return (
    <div style={{ ...page, paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
        <div style={{ fontSize: '13px', color: '#555' }}>Worker profile</div>
      </div>

      <div
        style={{
          margin: '18px 16px 10px',
          borderRadius: '24px',
          padding: '22px 18px',
          background:
            'linear-gradient(145deg, rgba(20,20,20,1) 0%, rgba(10,10,10,1) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-55px',
            right: '-20px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 72%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 500, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: '22px', color: '#f5f1ea', marginBottom: '6px' }}>Verified human</div>
              <div style={{ fontSize: '12px', color: '#8e857a', fontFamily: 'monospace', marginBottom: '10px' }}>{user.id}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ borderRadius: '999px', padding: '5px 10px', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(29,158,117,0.12)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)' }}>
                  world verified
                </span>
                <span style={{ borderRadius: '999px', padding: '5px 10px', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', color: '#8e857a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {mode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '0 16px 4px' }}>
        <div style={{ background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 500, color: '#f0f0f0', marginBottom: '4px' }}>{history.length}</div>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Proofs submitted</div>
        </div>
        <div style={{ background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 500, color: '#facc15', marginBottom: '4px' }}>{history.length}</div>
          <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tasks completed</div>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Runtime
        </div>
        <div style={{ fontSize: '13px', color: '#f0f0f0', marginBottom: '6px' }}>Live task runtime</div>
        <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6, marginBottom: '12px' }}>
          This worker app is connected to the shared Edgebind runtime.
        </div>
        <div style={{ borderRadius: '12px', border: '0.5px solid #1e1e1e', background: '#0f0f0f', padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#777' }}>
          {settings.backendUrl}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Account</div>
        {[
          { label: 'worker_id', value: user.id, mono: true },
          { label: 'human_verified', value: 'true', mono: true },
          { label: 'identity_source', value: mode === 'demo' ? 'demo_seed' : 'world_id', mono: true },
          { label: 'runtime', value: mode === 'demo' ? 'demo' : 'live', mono: true },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #1e1e1e' }}>
            <span style={{ fontSize: '13px', color: '#555' }}>{label}</span>
            <span style={{ fontSize: '13px', color: '#f0f0f0', fontFamily: 'monospace' }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Hedera payout
        </div>
        <div style={{ fontSize: '12px', color: '#444', lineHeight: 1.6, marginBottom: '14px' }}>
          Payouts release to this Hedera account. Format: <span style={{ fontFamily: 'monospace' }}>0.0.12345</span>
        </div>
        <input
          style={input}
          type="text"
          value={payoutAccountId}
          onChange={(event) => {
            setPayoutAccountId(event.target.value)
            setPayoutError('')
            setPayoutNotice('')
          }}
          placeholder="0.0.12345"
          readOnly={mode === 'demo'}
        />
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666', lineHeight: 1.6 }}>
          {user.payoutAccountId
            ? 'Current payout account is saved.'
            : 'No payout account saved yet.'}
        </div>
        {payoutNotice ? (
          <div style={{ fontSize: '12px', color: '#1D9E75', marginTop: '10px' }}>{payoutNotice}</div>
        ) : null}
        {payoutError ? (
          <div style={{ fontSize: '12px', color: '#f87171', marginTop: '10px' }}>{payoutError}</div>
        ) : null}
        <div style={{ marginTop: '12px' }}>
          <button
            style={gradientBtn}
            onClick={savePayout}
            disabled={savingPayout}
          >
            {savingPayout ? 'Saving Hedera account...' : 'Save Hedera account'}
          </button>
        </div>
      </div>

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
