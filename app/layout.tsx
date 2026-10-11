// @ts-nocheck
export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Covenant Formation | Marriage Formation',
    template: '%s | Covenant Formation',
  },
  description: 'A marriage formation platform for couples preparing for or growing in covenant marriage — a dyadic assessment, a shared Formation Guide, and a report built around eight pillars of covenant life.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://covenant-formation.example.com'),
  openGraph: {
    title: 'Covenant Formation | Marriage Formation',
    description: 'Two become one. Genesis 2:24.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://covenant-formation.example.com',
    siteName: 'Covenant Formation',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
