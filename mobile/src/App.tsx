import { useState, useRef, useEffect, useCallback } from 'react'
import Login from './screens/Login'
import RequestList from './screens/RequestList'
import History, { saveToHistory, loadHistory } from './screens/History'
import About from './screens/About'
import Profile from './screens/Profile'
import TabBar from './screens/TabBar'
import { MOCK_REQUESTS, GRADIENT } from './data/mock'
import type { Request } from './data/mock'
import { page, card, gradientBtn, ghostBtn } from './data/styles'
import { loadSettings } from './data/settings'
import type { AppMode } from './data/settings'
import { acceptTask as acceptLiveTask, fetchOpenTasks, submitTaskProof } from './data/api'
import type { TaskRecord, WorkerSession } from './data/types'

type Screen = 'ready' | 'preview' | 'submitting' | 'success' | 'error'
type View = 'list' | 'capture' | 'history' | 'about' | 'profile'

interface Coords { lat: number; lng: number; accuracy: number }

function mapTask(task: TaskRecord): Request | null {
  if (!task.locationRequirement) {
    return null
  }

  return {
    taskId: task.id,
    lat: task.locationRequirement.latitude,
    lng: task.locationRequirement.longitude,
    radius: task.locationRequirement.radiusMeters,
    deadline: task.deadline,
    amount: `${task.rewardAmount} ${task.rewardCurrency}`,
    description: task.title,
    requestCode: task.requestCode,
  }
}

export default function App() {
  const [session, setSession] = useState<WorkerSession | null>(null)
  const [view, setView] = useState<View>('list')
  const [screen, setScreen] = useState<Screen>('ready')
  const [requests, setRequests] = useState<Request[]>([])
  const [request, setRequest] = useState<Request | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [ts, setTs] = useState('')
  const [clock, setClock] = useState(new Date().toLocaleTimeString())
  const [err, setErr] = useState('')
  const [historyCount, setHistoryCount] = useState(0)

  const [appMode, setAppMode] = useState<AppMode>(loadSettings().mode)
  const [backendUrl, setBackendUrl] = useState(loadSettings().backendUrl)
  const isDemo = appMode === 'demo'
  const workerId = session?.user.id ?? null

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setHistoryCount(loadHistory(workerId ?? '').length)
  }, [view, workerId])

  useEffect(() => {
    if (!workerId) return

    if (isDemo) {
      setRequests(MOCK_REQUESTS)
      return
    }

    fetchOpenTasks(backendUrl)
      .then((tasks) => setRequests(tasks.map(mapTask).filter(Boolean) as Request[]))
      .catch((error) => {
        setRequests([])
        setErr(error instanceof Error ? error.message : 'Failed to load live tasks')
      })
  }, [backendUrl, isDemo, workerId])

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
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const getGps = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => setErr('GPS error: ' + e.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [])

  useEffect(() => {
    if (view === 'capture' && screen === 'ready') { startCam(); getGps() }
    return () => { if (view !== 'capture') stopCam() }
  }, [view, screen, startCam, getGps, stopCam])

  const selectRequest = async (r: Request) => {
    setRequest(r)
    setScreen('ready')
    setPhoto(null)
    setErr('')
    setView('capture')

    if (isDemo || !session) {
      return
    }

    try {
      await acceptLiveTask(backendUrl, session.token, r.taskId)
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Failed to accept task')
    }
  }

  const backToList = () => {
    stopCam()
    setView('list')
    setScreen('ready')
    setPhoto(null)
    setErr('')
  }

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
      setErr('Missing photo, GPS or task')
      return
    }

    setScreen('submitting')

    const saveEntry = () => saveToHistory(workerId ?? '', {
      requestId: request.taskId,
      description: request.description,
      lat: coords.lat,
      lng: coords.lng,
      ts,
      photo,
    })

    if (isDemo) {
      setTimeout(() => {
        saveEntry()
        setScreen('success')
      }, 1500)
      return
    }

    if (!session) {
      setErr('Worker session missing')
      setScreen('error')
      return
    }

    try {
      await submitTaskProof(backendUrl, session.token, request.taskId, {
        requestCode: request.requestCode,
        imageDataUrl: photo,
        latitude: coords.lat,
        longitude: coords.lng,
        accuracyMeters: coords.accuracy,
      })

      saveEntry()
      setRequests((current) => current.filter((entry) => entry.taskId !== request.taskId))
      setScreen('success')
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Submission failed')
      setScreen('error')
    }
  }

  const signOut = () => {
    setSession(null)
    stopCam()
    setView('list')
  }

  const handleModeChange = (mode: AppMode, url: string) => {
    setAppMode(mode)
    setBackendUrl(url)
  }

  const modeBadge = (
    <div style={{
      fontSize: '10px', fontWeight: 500,
      padding: '2px 8px', borderRadius: '4px',
      background: isDemo ? '#1a1a1a' : 'rgba(29,158,117,0.15)',
      color: isDemo ? '#555' : '#1D9E75',
      border: `0.5px solid ${isDemo ? '#2a2a2a' : 'rgba(29,158,117,0.3)'}`,
    }}>
      {isDemo ? 'demo' : 'live'}
    </div>
  )

  const topBar = (showBack?: () => void) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showBack && (
          <button onClick={showBack} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← back</button>
        )}
        {!showBack && <div style={{ fontSize: '13px', color: '#555' }}>worker_id = <span style={{ color: '#f0f0f0', fontFamily: 'monospace' }}>{workerId}</span></div>}
      </div>
      {modeBadge}
    </div>
  )

  const showTabs = view !== 'capture'
  const tabBar = showTabs
    ? <TabBar active={view} onChange={(tab) => { stopCam(); setView(tab) }} historyCount={historyCount} />
    : null

  if (!session) {
    return <Login onLogin={setSession} />
  }

  if (view === 'history') return (<><History onBack={() => setView('list')} user={workerId ?? ''} onSignOut={signOut} />{tabBar}</>)
  if (view === 'about') return (<><About user={workerId ?? ''} onSignOut={signOut} />{tabBar}</>)
  if (view === 'profile') return (<><Profile user={workerId ?? ''} onSignOut={signOut} onModeChange={handleModeChange} />{tabBar}</>)

  if (view === 'list') {
    return (
      <>
        <RequestList requests={requests} onSelect={selectRequest} user={workerId ?? ''} onSignOut={signOut} onHistory={() => setView('history')} historyCount={historyCount} />
        {tabBar}
      </>
    )
  }

  if (screen === 'ready') {
    return (
      <div style={page}>
        {topBar(backToList)}
        <div style={card}>
          {request && (
            <>
              <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '3px' }}>{request.description}</div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Deadline: {new Date(request.deadline).toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#facc15', marginBottom: '6px' }}>Locked: {request.amount}</div>
              <div style={{ fontSize: '11px', color: '#444', marginBottom: '6px', fontFamily: 'monospace' }}>request_code = {request.requestCode}</div>
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
  }

  if (screen === 'preview') {
    return (
      <div style={page}>
        {topBar()}
        <div style={{ margin: '12px 16px 0', borderRadius: '12px', overflow: 'hidden', background: '#111' }}>
          {photo && <img src={photo} alt="proof" style={{ width: '100%', display: 'block' }} />}
        </div>
        <div style={card}>
          {([
            { label: 'Time', value: new Date(ts).toLocaleString() },
            { label: 'Latitude', value: coords?.lat.toFixed(6) ?? '—' },
            { label: 'Longitude', value: coords?.lng.toFixed(6) ?? '—' },
            { label: 'Accuracy', value: coords ? `${Math.round(coords.accuracy)}m` : '—' },
            { label: 'Task ID', value: request?.taskId ?? '—', mono: true },
            { label: 'Request Code', value: request?.requestCode ?? '—', mono: true },
          ] as Array<{ label: string; value: string; mono?: boolean }>).map(({ label, value, mono }) => (
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
  }

  if (screen === 'submitting') {
    return (
      <div style={{ ...page, alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '2.5px solid #E040B0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: '15px', color: '#888' }}>{isDemo ? 'Simulating submission...' : 'Submitting worker proof...'}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (screen === 'success') {
    return (
      <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Proof submitted</div>
        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '32px', lineHeight: 1.6 }}>
          The runtime received your evidence and updated validation and payout state.
        </div>
        <button style={gradientBtn} onClick={() => { setView('list'); setScreen('ready'); setPhoto(null); setErr('') }}>
          Back to tasks
        </button>
      </div>
    )
  }

  return (
    <div style={{ ...page, alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px', color: '#f87171' }}>Submission failed</div>
      <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '24px', lineHeight: 1.6 }}>
        {err || 'Unable to submit proof.'}
      </div>
      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <button style={{ ...ghostBtn, flex: 1 }} onClick={retake}>Retake</button>
        <button style={{ ...gradientBtn, flex: 1 }} onClick={backToList}>Back to tasks</button>
      </div>
    </div>
  )
}
