'use client'

import Link from 'next/link'

import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/lib/auth'

export default function ForbiddenPage() {
  const { logout } = useAuth()

  return (
    <main className="auth-main">
      <div className="auth-card">
        <BrandLogo surface="light" />
        <h1>Not an admin</h1>
        <p>
          This panel is restricted to Slashie staff. Your Google account is not
          an <code>@slashie.app</code> email, so it cannot use admin APIs.
        </p>
        <p className="muted">
          Ask for access on an <code>admin@slashie.app</code> (or other{' '}
          <code>@slashie.app</code>) account. Apollo also requires an active
          Admin row from BE-42.
        </p>
        <div className="search-row" style={{ marginTop: 16 }}>
          <Link href="/login" className="btn btn-primary" onClick={logout}>
            Use another account
          </Link>
        </div>
      </div>
    </main>
  )
}
