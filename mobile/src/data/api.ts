import type {
  TaskRecord,
  WorkerSession,
  WorkerSummary,
  WorldPrepareResponse,
  WorldVerifyPayload,
} from './types'

function authHeaders(token?: string) {
  const headers = new Headers()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

export async function fetchWorkers(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/users?role=worker`)
  const payload = (await response.json()) as WorkerSummary[] | { error?: string }

  if (!response.ok || !Array.isArray(payload)) {
    throw new Error((payload as { error?: string }).error ?? 'Failed to load worker accounts')
  }

  return payload.filter((worker) => worker.isHumanVerified)
}

export async function signInWorker(baseUrl: string, userId: string) {
  const response = await fetch(`${baseUrl}/api/auth/mobile/worker`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })
  const payload = (await response.json()) as WorkerSession | { error?: string }

  if (!response.ok || !('token' in payload)) {
    throw new Error((payload as { error?: string }).error ?? 'Worker sign-in failed')
  }

  return payload
}

export async function prepareWorldWorkerVerification(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/auth/mobile/worker/world/prepare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  const payload = (await response.json()) as WorldPrepareResponse | { error?: string }

  if (!response.ok || !('rp_context' in payload)) {
    throw new Error((payload as { error?: string }).error ?? 'Failed to prepare World verification')
  }

  return payload
}

export async function verifyWorldWorker(baseUrl: string, body: WorldVerifyPayload) {
  const response = await fetch(`${baseUrl}/api/auth/mobile/worker/world/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as WorkerSession | { error?: string }

  if (!response.ok || !('token' in payload)) {
    throw new Error((payload as { error?: string }).error ?? 'World worker verification failed')
  }

  return payload
}

export async function fetchWorkerProfile(baseUrl: string, token: string) {
  const response = await fetch(`${baseUrl}/api/auth/mobile/worker/profile`, {
    headers: authHeaders(token),
  })
  const payload = (await response.json()) as WorkerSummary | { error?: string }

  if (!response.ok || !('id' in payload)) {
    throw new Error((payload as { error?: string }).error ?? 'Failed to load worker profile')
  }

  return payload
}

export async function updateWorkerPayoutAccount(
  baseUrl: string,
  token: string,
  payoutAccountId: string,
) {
  const response = await fetch(`${baseUrl}/api/auth/mobile/worker/profile`, {
    method: 'POST',
    headers: (() => {
      const headers = authHeaders(token)
      headers.set('Content-Type', 'application/json')
      return headers
    })(),
    body: JSON.stringify({ payoutAccountId }),
  })
  const payload = (await response.json()) as WorkerSummary | { error?: string }

  if (!response.ok || !('id' in payload)) {
    throw new Error((payload as { error?: string }).error ?? 'Failed to update worker payout account')
  }

  return payload
}

export async function fetchOpenTasks(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/tasks?status=open`)
  const payload = (await response.json()) as TaskRecord[] | { error?: string }

  if (!response.ok || !Array.isArray(payload)) {
    throw new Error((payload as { error?: string }).error ?? 'Failed to load tasks')
  }

  return payload
}

export async function acceptTask(baseUrl: string, token: string, taskId: string) {
  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/accept`, {
    method: 'POST',
    headers: (() => {
      const headers = authHeaders(token)
      headers.set('Content-Type', 'application/json')
      return headers
    })(),
    body: JSON.stringify({}),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? 'Failed to accept task')
  }

  return payload as TaskRecord
}

export async function submitTaskProof(
  baseUrl: string,
  token: string,
  taskId: string,
  body: {
    requestCode: string
    imageDataUrl?: string
    latitude?: number
    longitude?: number
    accuracyMeters?: number
  },
) {
  const response = await fetch(`${baseUrl}/api/tasks/${taskId}/submissions`, {
    method: 'POST',
    headers: (() => {
      const headers = authHeaders(token)
      headers.set('Content-Type', 'application/json')
      return headers
    })(),
    body: JSON.stringify({
      requestCode: body.requestCode,
      imageDataUrl: body.imageDataUrl,
      location:
        typeof body.latitude === 'number' && typeof body.longitude === 'number'
          ? {
              latitude: body.latitude,
              longitude: body.longitude,
              accuracyMeters: body.accuracyMeters,
            }
          : undefined,
    }),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? 'Failed to submit proof')
  }

  return payload as TaskRecord
}
