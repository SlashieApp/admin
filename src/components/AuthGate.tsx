'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Header } from '@/components/Header'
import { useAuth } from '@/lib/auth'

const PUBLIC_PATHS = new Set(['/login', '/forbidden'])

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isPublic = PUBLIC_PATHS.has(pathname)

  useEffect(() => {
    if (loading) return
    if (!user && !isPublic) {
      router.replace('/login')
    }
    if (user && pathname === '/login') {
      router.replace('/')
    }
  }, [isPublic, loading, pathname, router, user])

  if (isPublic) return <>{children}</>

  if (loading) {
    return (
      <div className="shell">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="main" tabIndex={-1}>
          <p className="muted">Checking admin session…</p>
          <div className="kpi-grid" aria-hidden>
            <div className="metric skeleton-card" />
            <div className="metric skeleton-card" />
            <div className="metric skeleton-card" />
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="shell">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="main" tabIndex={-1}>
          <p className="muted">Redirecting to sign in…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
