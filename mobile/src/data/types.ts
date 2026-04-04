import type { IDKitResult, RpContext } from '@worldcoin/idkit'

export interface WorkerSummary {
  id: string
  name: string
  role: 'worker'
  isHumanVerified: boolean
}

export interface WorkerSession {
  ok: true
  token: string
  user: WorkerSummary
}

export interface WorldPrepareResponse {
  app_id: `app_${string}`
  action: string
  environment: 'production' | 'staging'
  user: WorkerSummary
  rp_context: RpContext
}

export interface WorldVerifyPayload {
  userId: string
  rp_id: string
  idkitResponse: IDKitResult
}

export interface TaskRecord {
  id: string
  title: string
  description: string
  rewardAmount: number
  rewardCurrency: string
  deadline: string
  proofType: 'photo' | 'location' | 'photo_location'
  locationRequirement: {
    label?: string | null
    latitude: number
    longitude: number
    radiusMeters: number
  } | null
  status: string
  requestCode: string
  latestSubmission: {
    submittedAt: string
    imageUrl: string | null
    location:
      | {
          latitude: number
          longitude: number
          accuracyMeters: number | null
        }
      | null
  } | null
  payout: {
    status: string
    amount: number
    currency: string
    releasedAt: string | null
  } | null
}
