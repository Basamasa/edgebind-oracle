import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Edgebind Oracle',
  description: 'A pure Next.js control plane for human-backed AI agent microtasks.',
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
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
