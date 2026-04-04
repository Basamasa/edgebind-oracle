import { useState } from 'react'
import { page, card, gradientBtn, ghostBtn } from '../data/styles'
import type { Request } from '../data/mock'

interface Props {
  onBack: () => void
  onCreated: (r: Request) => void
  user: string
  onSignOut: () => void
}

export default function CreateRequest({ onBack, onCreated, user, onSignOut }: Props) {
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [radius, setRadius] = useState('100')
  const [amount, setAmount] = useState('0.1')
  const [hours, setHours] = useState('2')
  const [err, setErr] = useState('')
  const [locating, setLocating] = useState(false)

  // fill lat/lng from current GPS position
  const useMyLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      p => {
        setLat(p.coords.latitude.toFixed(6))
        setLng(p.coords.longitude.toFixed(6))
        setLocating(false)
      },
      e => { setErr('GPS error: ' + e.message); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const submit = () => {
    // basic validation
    if (!description.trim()) { setErr('Description is required'); return }
    if (!lat || !lng) { setErr('Location is required — use GPS or enter manually'); return }
    if (isNaN(Number(lat)) || isNaN(Number(lng))) { setErr('Invalid coordinates'); return }
    if (isNaN(Number(radius)) || Number(radius) <= 0) { setErr('Radius must be a positive number'); return }
    if (isNaN(Number(hours)) || Number(hours) <= 0) { setErr('Deadline must be at least 1 hour'); return }

    const newRequest: Request = {
      requestId: '0xlocal_' + Date.now(),
      description: description.trim(),
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius),
      deadline: new Date(Date.now() + Number(hours) * 3600000).toISOString(),
      amount: amount ? `${amount} ETH` : undefined,
    }

    // in real flow this would POST to backend/contract
    // for now just pass it back to the list
    onCreated(newRequest)
  }

  const input: React.CSSProperties = {
    width: '100%',
    background: '#1a1a1a',
    border: '0.5px solid #333',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '15px',
    color: '#f0f0f0',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const label: React.CSSProperties = {
    fontSize: '11px',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '6px',
    display: 'block',
  }

  const fieldWrap: React.CSSProperties = {
    marginBottom: '16px',
  }

  return (
    <div style={page}>

      {/* top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
        <div style={{ fontSize: '13px', color: '#555' }}>
          Signed in as <span style={{ color: '#f0f0f0' }}>{user}</span>
        </div>
        <button onClick={onSignOut} style={{ fontSize: '12px', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      {/* header */}
      <div style={{ padding: '20px 16px 8px' }}>
        <button onClick={onBack} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '6px', display: 'block' }}>
          ← back
        </button>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
          New request
        </div>
        <div style={{ fontSize: '22px', fontWeight: 500 }}>Create a task</div>
      </div>

      {/* form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 100px' }}>

        <div style={fieldWrap}>
          <span style={label}>Description</span>
          <input
            style={input}
            type="text"
            placeholder="e.g. Take a photo of the Palais des Festivals"
            value={description}
            onChange={e => { setDescription(e.target.value); setErr('') }}
          />
        </div>

        {/* location row */}
        <div style={fieldWrap}>
          <span style={label}>Location</span>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              style={{ ...input, flex: 1 }}
              type="number"
              placeholder="Latitude"
              value={lat}
              onChange={e => { setLat(e.target.value); setErr('') }}
            />
            <input
              style={{ ...input, flex: 1 }}
              type="number"
              placeholder="Longitude"
              value={lng}
              onChange={e => { setLng(e.target.value); setErr('') }}
            />
          </div>
          <button
            onClick={useMyLocation}
            style={{ ...ghostBtn, padding: '10px', fontSize: '13px' }}
            disabled={locating}
          >
            {locating ? 'Getting location...' : 'Use my current location'}
          </button>
        </div>

        <div style={fieldWrap}>
          <span style={label}>Radius (meters)</span>
          <input
            style={input}
            type="number"
            placeholder="100"
            value={radius}
            onChange={e => { setRadius(e.target.value); setErr('') }}
          />
          <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>
            How close the verifier needs to be
          </div>
        </div>

        <div style={fieldWrap}>
          <span style={label}>Deadline (hours from now)</span>
          <input
            style={input}
            type="number"
            placeholder="2"
            value={hours}
            onChange={e => { setHours(e.target.value); setErr('') }}
          />
        </div>

        <div style={fieldWrap}>
          <span style={label}>Amount to lock (ETH)</span>
          <input
            style={input}
            type="number"
            placeholder="0.1"
            value={amount}
            onChange={e => { setAmount(e.target.value); setErr('') }}
          />
          <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>
            Released when proof is verified
          </div>
        </div>

        {/* local only warning */}
        <div style={{ ...card, margin: '0 0 16px', borderLeft: '2px solid #854F0B', borderRadius: '0 10px 10px 0' }}>
          <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.6 }}>
            This request is created locally for testing. When the backend is ready, it will be posted to the smart contract instead.
          </div>
        </div>

        {err && (
          <div style={{ fontSize: '13px', color: '#f87171', marginBottom: '16px', textAlign: 'center' }}>
            {err}
          </div>
        )}

        <button style={gradientBtn} onClick={submit}>
          Create request
        </button>

      </div>
    </div>
  )
}
