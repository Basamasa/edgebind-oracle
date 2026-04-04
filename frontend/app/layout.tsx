import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EdgeBind — Proof Unlocks Payment',
  description: 'Lock a payment that only releases when someone physically proves they were at the right place, at the right time. No trust required — just proof.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.ico',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-light-32x32.ico',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
