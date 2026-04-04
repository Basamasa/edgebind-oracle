import { useState, useRef, useEffect, useCallback } from 'react'
import Login from './screens/Login'
import RequestList from './screens/RequestList'
import History, { saveToHistory, loadHistory } from './screens/History'
import CreateRequest from './screens/CreateRequest'
import type { HistoryEntry } from './screens/History'
import { MOCK_REQUESTS, GRADIENT } from './data/mock'
import type { Request } from './data/mock'
import { page, card, gradientBtn, ghostBtn } from './data/styles'

type Screen = 'ready' | 'preview' | 'submitting' | 'success' | 'error'
type View = 'list' | 'capture' | 'history' | 'create'

interface Coords {
  lat: number
  lng: number
  accuracy: number
}

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000'

export default function App() {
  const [user, setUser] = useState<string | null>(null)
  const [view, setView] = useState<View>('list')
  const [screen, setScreen] = useState<Screen>('ready')
  const [requests, setRequests] = useState<Request[]>([])
  const [request, setRequest] = useState<Request | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [ts, setTs] = useState('')
  const [clock, setClock] = useState(new Date().toLocaleTimeString())
  const [err, setErr] = useState('')
  const [usingMock, setUsingMock] = useState(false)
  const [historyCount, setHistoryCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(t)
  }, [])

  // load history count for badge
  useEffect(() => {
    setHistoryCount(loadHistory(user ?? '').length)
  }, [view])

  // load requests on login
  useEffect(() => {
    if (!user) return
    fetch(`${BACKEND}/api/requests`)
      .then(r => r.json())
      .then(data => { setRequests(data); setUsingMock(false) })
      .catch(() => { setRequests(MOCK_REQUESTS); setUsingMock(true) })
  }, [user])

  const startCam = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = s
      if (videoRef.current) videoRef.current.srcObject = s
    } catch {
      setErr('Camera unavailable — check browser permissions')
    }
  }, [])

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const getGps = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      p => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      e => setErr('GPS error: ' + e.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [])

  useEffect(() => {
    if (view === 'capture' && screen === 'ready') { startCam(); getGps() }
    return () => { if (view !== 'capture') stopCam() }
  }, [view, screen])

  const selectRequest = (r: Request) => {
    setRequest(r); setScreen('ready'); setPhoto(null); setErr(''); setView('capture')
  }

  const backToList = () => {
    stopCam(); setView('list'); setScreen('ready'); setPhoto(null); setErr('')
  }

  const capture = () => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    setPhoto(c.toDataURL('image/jpeg', 0.85))
    setTs(new Date().toISOString())
    stopCam(); setScreen('preview')
  }

  const retake = () => { setPhoto(null); setErr(''); setScreen('ready'); startCam(); getGps() }

  const submit = async () => {
    if (!photo || !coords || !request) { setErr('Missing photo, GPS or request'); return }
    setScreen('submitting')
    if (usingMock) {
      setTimeout(() => {
        // save to history even in mock mode
        saveToHistory(user ?? "", {
          requestId: request.requestId,
          description: request.description ?? 'Verify location',
          lat: coords.lat,
          lng: coords.lng,
          ts,
          photo: photo!,
        })
        setScreen('success')
      }, 1500)
      return
    }
    try {
      const res = await fetch(`${BACKEND}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.requestId, photo, latitude: coords.lat, longitude: coords.lng, timestamp: ts }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      // save to history on real success too
      saveToHistory(user ?? "", {
        requestId: request.requestId,
        description: request.description ?? 'Verify location',
        lat: coords.lat,
        lng: coords.lng,
        ts,
        photo: photo!,
      })
      setScreen('success')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Submission failed')
      setScreen('error')
    }
  }

  const signOut = () => { setUser(null); stopCam(); setView('list') }

  const topBar = (showHistory = true) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
      <div style={{ fontSize: '13px', color: '#555' }}>
        Signed in as <span style={{ color: '#f0f0f0' }}>{user}</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {showHistory && (
          <button
            onClick={() => { stopCam(); setView('history') }}
            style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
          >
            History
            {historyCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-10px', background: '#E040B0', color: '#fff', borderRadius: '10px', fontSize: '10px', padding: '1px 5px', fontWeight: 500 }}>
                {historyCount}
              </span>
            )}
          </button>
        )}
        <button onClick={signOut} style={{ fontSize: '12px', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )

  if (!user) return <Login onLogin={setUser} />

  if (view === 'create') return (
    <CreateRequest onBack={() => setView('list')} onCreated={(r) => { setRequests(prev => [r, ...prev]); setView('list') }} user={user} onSignOut={signOut} />
  )

  if (view === 'history') return (
    <History onBack={() => setView('list')} user={user!} onSignOut={signOut} />
  )

  if (view === 'list') return (
    <RequestList requests={requests} onSelect={selectRequest} user={user!} onSignOut={signOut} onHistory={() => { stopCam(); setView('history') }} historyCount={historyCount} onCreate={() => setView('create')} />
  )

  if (screen === 'ready') return (
    <div style={page}>
      {topBar()}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <button onClick={backToList} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← back</button>
          {usingMock && <div style={{ fontSize: '10px', color: '#854F0B', background: '#FAEEDA', padding: '2px 6px', borderRadius: '4px' }}>demo mode</div>}
        </div>
        {request && (
          <>
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '3px' }}>{request.description}</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Deadline: {new Date(request.deadline).toLocaleString()}</div>
            {request.amount && <div style={{ fontSize: '12px', color: '#facc15', marginBottom: '6px' }}>Locked: {request.amount}</div>}
          </>
        )}
        <div style={{ fontSize: '12px', color: coords ? '#E040B0' : '#facc15' }}>
          {coords ? `GPS ready — ${Math.round(coords.accuracy)}m accuracy` : 'Acquiring GPS...'}
        </div>
        {err && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>{err}</div>}
      </div>
      <div style={{ flex: 1, margin: '12px 16px', borderRadius: '12px', overflow: 'hidden', background: '#111', position: 'relative', minHeight: '300px' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{clock}</div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ padding: '12px 16px 40px' }}>
        <button style={coords && request ? gradientBtn : { ...ghostBtn, color: '#555' }} onClick={capture} disabled={!coords || !request}>
          {!coords ? 'Waiting for GPS...' : 'Capture proof'}
        </button>
      </div>
    </div>
  )

  if (screen === 'preview') return (
    <div style={page}>
      {topBar(false)}
      <div style={{ margin: '12px 16px 0', borderRadius: '12px', overflow: 'hidden', background: '#111' }}>
        {photo && <img src={photo} alt="proof" style={{ width: '100%', display: 'block' }} />}
      </div>
      <div style={card}>
        {([
          { label: 'Time', value: new Date(ts).toLocaleString() },
          { label: 'Latitude', value: coords?.lat.toFixed(6) ?? '—' },
          { label: 'Longitude', value: coords?.lng.toFixed(6) ?? '—' },
          { label: 'Accuracy', value: coords ? `${Math.round(coords.accuracy)}m` : '—' },
          { label: 'Request ID', value: request?.requestId ?? '—', mono: true },
        ] as const).map(({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0', borderBottom: '0.5px solid #1e1e1e' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>{label}</span>
            <span style={{ fontSize: '13px', color: '#f0f0f0', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px 40px', display: 'flex', gap: '10px' }}>
        <button style={{ ...ghostBtn, flex: 1 }} onClick={retake}>Retake</button>
        <button style={{ ...gradientBtn, flex: 2 }} onClick={submit}>Submit proof</button>
      </div>
    </div>
  )

  if (screen === 'submitting') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '2.5px solid #E040B0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: '15px', color: '#888' }}>{usingMock ? 'Simulating submission...' : 'Submitting proof on-chain...'}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (screen === 'success') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Proof submitted</div>
      <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '32px', lineHeight: 1.6 }}>
        {usingMock ? 'Demo mode — no real transaction.' : 'Attestation sent. Dashboard will update shortly.'}
      </div>
      <div style={{ width: '100%', ...card, margin: 0 }}>
        {[
          { label: 'Time', value: new Date(ts).toLocaleString() },
          { label: 'Latitude', value: coords?.lat.toFixed(6) ?? '—' },
          { label: 'Longitude', value: coords?.lng.toFixed(6) ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #1e1e1e' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>{label}</span>
            <span style={{ fontSize: '13px', color: '#f0f0f0' }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '20px' }}>
        <button style={{ ...ghostBtn, flex: 1 }} onClick={() => { setView('history') }}>View history</button>
        <button style={{ ...ghostBtn, flex: 1 }} onClick={backToList}>Back to list</button>
      </div>
    </div>
  )

  if (screen === 'error') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: '18px', fontWeight: 500, color: '#f87171', marginBottom: '10px' }}>Something went wrong</div>
      <div style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginBottom: '32px', fontFamily: 'monospace', lineHeight: 1.6 }}>{err}</div>
      <button style={ghostBtn} onClick={retake}>Try again</button>
    </div>
  )

  return null
}
// CreateRequest is imported at the top — add this line manually at the top of App.tsx:
// import CreateRequest from './screens/CreateRequest'
