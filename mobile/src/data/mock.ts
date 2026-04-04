// mock data - remove when backend is ready

export interface Request {
  taskId: string
  lat: number
  lng: number
  radius: number
  deadline: string
  amount: string
  description: string
  requestCode: string
}

export interface HistoryEntry {
  requestId: string
  description: string
  lat: number
  lng: number
  ts: string
  photo: string
}

export const MOCK_REQUESTS: Request[] = [
  {
    taskId: 'task_mock001',
    lat: 43.5514,
    lng: 7.0128,
    radius: 100,
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    amount: '0.1 ETH',
    description: 'Take a picture of the Palais des Festivals in Cannes',
    requestCode: 'MOCK-001',
  },
  {
    taskId: 'task_mock002',
    lat: 43.5528,
    lng: 7.0170,
    radius: 50,
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    amount: '0.05 ETH',
    description: 'Deliver a parcel in front of the main entrance',
    requestCode: 'MOCK-002',
  },
  {
    taskId: 'task_mock003',
    lat: 43.5501,
    lng: 7.0150,
    radius: 200,
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    amount: '0.2 ETH',
    description: 'Confirm the ETH Cannes banner is still up on the beach',
    requestCode: 'MOCK-003',
  },
]

export const MOCK_USERS = [
  { userId: 'worker-lina', username: 'lina', display: 'Lina Verified' },
  { userId: 'worker-marcus', username: 'marcus', display: 'Marcus Runner' },
]

export const GRADIENT = 'linear-gradient(135deg, #E040B0 0%, #F97316 60%, #FACC15 100%)'
