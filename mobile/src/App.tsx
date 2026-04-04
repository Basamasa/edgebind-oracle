import { useState, useRef, useEffect, useCallback } from 'react'

type Screen = 'ready' | 'preview' | 'submitting' | 'success' | 'error'

interface Coords {
  lat: number
  lng: number
  accuracy: number
}

interface Request {
  requestId: string
  lat: number
  lng: number
  radius: number
  deadline: string
  amount?: string
  description?: string
}

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000'

// brand gradient from the logo
const GRADIENT = 'linear-gradient(135deg, #E040B0 0%, #F97316 60%, #FACC15 100%)'

// mock requests - remove when backend is ready
const MOCK_REQUESTS: Request[] = [
  {
    requestId: '0xmock001',
    lat: 43.5514,
    lng: 7.0128,
    radius: 100,
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    amount: '0.1 ETH',
    description: 'Take a picture of the Palais des Festivals in Cannes',
  },
  {
    requestId: '0xmock002',
    lat: 43.5528,
    lng: 7.0170,
    radius: 50,
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    amount: '0.05 ETH',
    description: 'Deliver a parcel in front of the main entrance',
  },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('ready')
  const [request, setRequest] = useState<Request | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [ts, setTs] = useState('')
  const [clock, setClock] = useState(new Date().toLocaleTimeString())
  const [err, setErr] = useState('')
  const [usingMock, setUsingMock] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(t)
  }, [])

  // try backend, fallback to mock if it fails
  useEffect(() => {
    fetch(`${BACKEND}/api/request/active`)
      .then(r => r.json())
      .then(data => {
        setRequest(data)
        setUsingMock(false)
      })
      .catch(() => {
        // backend not ready yet, use mock so we can still demo
        setRequest(MOCK_REQUESTS[0])
        setUsingMock(true)
      })
  }, [])

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
    startCam()
    getGps()
    return () => stopCam()
  }, [startCam, stopCam, getGps])

  const capture = () => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    setPhoto(c.toDataURL('image/jpeg', 0.85))
    setTs(new Date().toISOString())
    stopCam()
    setScreen('preview')
  }

  const retake = () => {
    setPhoto(null)
    setErr('')
    setScreen('ready')
    startCam()
    getGps()
  }

  const submit = async () => {
    if (!photo || !coords || !request) {
      setErr('Missing photo, GPS or request')
      return
    }
    setScreen('submitting')

    // mock mode — fake a successful submission
    if (usingMock) {
      setTimeout(() => setScreen('success'), 1500)
      return
    }

    try {
      const res = await fetch(`${BACKEND}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.requestId,
          photo,
          latitude: coords.lat,
          longitude: coords.lng,
          timestamp: ts,
        }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setScreen('success')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Submission failed')
      setScreen('error')
    }
  }

  // shared styles
  const page: React.CSSProperties = {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a0a',
    color: '#f0f0f0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  }
  const card: React.CSSProperties = {
    background: '#141414',
    border: '0.5px solid #2a2a2a',
    borderRadius: '12px',
    padding: '12px 16px',
    margin: '12px 16px 0',
  }

  // gradient button - used for main actions
  const gradientBtn: React.CSSProperties = {
    background: GRADIENT,
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
  }

  // secondary button - used for retake, back, etc
  const ghostBtn: React.CSSProperties = {
    background: '#141414',
    color: '#f0f0f0',
    border: '0.5px solid #333',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
  }

  // --- screen: ready ---
  if (screen === 'ready') return (
    <div style={page}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Active request
          </div>
          {usingMock && (
            <div style={{ fontSize: '10px', color: '#854F0B', background: '#FAEEDA', padding: '2px 6px', borderRadius: '4px' }}>
              demo mode
            </div>
          )}
        </div>
        {request ? (
          <>
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '3px' }}>
              {request.description ?? `Prove location within ${request.radius}m`}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
              Deadline: {new Date(request.deadline).toLocaleString()}
            </div>
            {request.amount && (
              <div style={{ fontSize: '12px', color: '#facc15', marginBottom: '6px' }}>
                Locked: {request.amount}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '14px', color: '#555', marginBottom: '6px' }}>
            Loading request...
          </div>
        )}
        <div style={{ fontSize: '12px', color: coords ? '#E040B0' : '#facc15' }}>
          {coords ? `GPS ready — ${Math.round(coords.accuracy)}m accuracy` : 'Acquiring GPS...'}
        </div>
        {err && request && (
          <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>{err}</div>
        )}
      </div>

      <div style={{ flex: 1, margin: '12px 16px', borderRadius: '12px', overflow: 'hidden', background: '#111', position: 'relative', minHeight: '300px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {clock}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ padding: '12px 16px 40px' }}>
        <button
          style={coords && request ? gradientBtn : { ...ghostBtn, color: '#555' }}
          onClick={capture}
          disabled={!coords || !request}
        >
          {!request ? 'Loading request...' : !coords ? 'Waiting for GPS...' : 'Capture proof'}
        </button>
      </div>
    </div>
  )

  // --- screen: preview ---
  if (screen === 'preview') return (
    <div style={page}>
      <div style={{ margin: '12px 16px 0', borderRadius: '12px', overflow: 'hidden', background: '#111' }}>
        {photo && <img src={photo} alt="captured proof" style={{ width: '100%', display: 'block' }} />}
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

  // --- screen: submitting ---
  if (screen === 'submitting') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '2.5px solid #E040B0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: '15px', color: '#888' }}>
        {usingMock ? 'Simulating submission...' : 'Submitting proof on-chain...'}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // --- screen: success ---
  if (screen === 'success') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
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
      <button style={{ ...ghostBtn, marginTop: '20px' }} onClick={retake}>
        Back to requests
      </button>
    </div>
  )

  // --- screen: error ---
  if (screen === 'error') return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: '18px', fontWeight: 500, color: '#f87171', marginBottom: '10px' }}>Something went wrong</div>
      <div style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginBottom: '32px', fontFamily: 'monospace', lineHeight: 1.6 }}>{err}</div>
      <button style={ghostBtn} onClick={retake}>Try again</button>
    </div>
  )

  return null
}
