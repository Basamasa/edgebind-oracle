import type React from 'react'
import { GRADIENT } from './mock'

export const page: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  background: '#0a0a0a',
  color: '#f0f0f0',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

export const card: React.CSSProperties = {
  background: '#141414',
  border: '0.5px solid #2a2a2a',
  borderRadius: '12px',
  padding: '12px 16px',
  margin: '12px 16px 0',
}

export const gradientBtn: React.CSSProperties = {
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

export const ghostBtn: React.CSSProperties = {
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
