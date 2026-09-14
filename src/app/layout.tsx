import type { Metadata } from 'next'

import { AuthGate } from '@/components/AuthGate'
import { Providers } from '@/app/providers'

import './globals.css'

export const metadata: Metadata = {
  title: 'Slashie Admin',
  description: 'Private Slashie ops admin — tasks, workers, god-mode edits.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthGate>{children}</AuthGate>
        </Providers>
      </body>
    </html>
  )
}
