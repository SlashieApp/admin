'use client'

import Link from 'next/link'

import { useAuth } from '@/lib/auth'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden>
          S
        </span>
        Slashie Admin
      </Link>
      <div className="header-meta">
        {user ? (
          <>
            <span className="header-email">{user.email}</span>
            <button type="button" className="btn btn-ghost" onClick={logout}>
              Log out
            </button>
          </>
        ) : null}
      </div>
    </header>
  )
}
