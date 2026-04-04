# EdgeBind Mobile — Backend Integration Guide

**Mobile app (live):** https://edgebind-mobile.vercel.app  
**Repo:** https://github.com/Basamasa/edgebind-oracle  
**Mobile folder:** `mobile/`

---

## What the mobile app does

The app is a PWA (runs in Chrome on any phone, no install needed). It has two modes:

- **Demo mode** — uses hardcoded mock requests, simulates submission. No backend needed.
- **Live mode** — connects to your backend URL, fetches real requests, POSTs real proof.

The user switches between modes in the **Profile tab → Connection mode toggle**.

---

## Endpoints to implement

### 1. GET /api/requests

Returns the list of open verification requests.
```json
[
  {
    "requestId": "0xabc123",
    "lat": 43.5514,
    "lng": 7.0128,
    "radius": 100,
    "deadline": "2026-04-05T14:00:00.000Z",
    "amount": "0.1 ETH",
    "description": "Take a picture of the Palais des Festivals"
  }
]
```

### 2. POST /api/verify

Called when the verifier taps "Submit proof".

Request body:
```json
{
  "requestId": "0xabc123",
  "photo": "data:image/jpeg;base64,/9j/4AAQ...",
  "latitude": 43.549688,
  "longitude": 7.016729,
  "timestamp": "2026-04-05T08:01:32.000Z"
}
```

Response on success:
```json
{ "success": true, "txHash": "0xdef456..." }
```

Response on failure:
```json
{ "success": false, "error": "GPS coordinates outside allowed radius" }
```

Validation pipeline:
1. Look up request by requestId
2. Check timestamp is before deadline
3. Check GPS distance is within radius meters
4. SHA-256 hash the photo (strip base64 prefix first)
5. Submit hash on-chain
6. If contract confirms, release escrow

### 3. GET /api/health

Returns HTTP 200. Used by the app to test connectivity.
```json
{ "ok": true }
```

---

## CORS

Add to Express:
```javascript
app.use(cors({
  origin: [
    'https://edgebind-mobile.vercel.app',
    'http://localhost:5173',
  ]
}))
```

---

## GPS distance (Haversine)
```javascript
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
```

---

## Photo hashing
```javascript
const crypto = require('crypto')
const base64Data = photo.replace(/^data:image\/\w+;base64,/, '')
const buffer = Buffer.from(base64Data, 'base64')
const hash = crypto.createHash('sha256').update(buffer).digest('hex')
```

---

## End-to-end test

1. Deploy backend on HTTPS
2. Open https://edgebind-mobile.vercel.app on any phone
3. Login as verifier / demo123
4. Profile tab → Live mode → paste backend URL → Test connection
5. Save settings
6. Requests tab should show your real requests
7. Tap a request, go to location, capture proof, submit
8. Check backend logs for the POST
9. Confirm contract executes and funds release

---

## Checklist before asking why it does not work

- [ ] CORS allows https://edgebind-mobile.vercel.app
- [ ] GET /api/health returns HTTP 200
- [ ] GET /api/requests returns a valid array
- [ ] POST /api/verify accepts all four fields
- [ ] Backend is on HTTPS not HTTP
- [ ] deadline is a valid ISO 8601 string
