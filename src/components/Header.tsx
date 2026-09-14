'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { useAuth } from '@/lib/auth'
import { parseAdminHomeMode } from '@/lib/search'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="header-left">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden>
            S
          </span>
          Slashie Admin
        </Link>
        {user ? (
          <Suspense fallback={<HeaderNavFallback />}>
            <HeaderNav />
          </Suspense>
        ) : null}
      </div>
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

function HeaderNavFallback() {
  return (
    <nav className="header-nav" aria-label="Admin sections">
      <Link href="/dashboard" className="tab">
        Dashboard
      </Link>
      <Link href="/" className="tab">
        Tasks
      </Link>
      <Link href="/?mode=users" className="tab">
        Users
      </Link>
      <Link href="/reports" className="tab">
        Reports
      </Link>
    </nav>
  )
}

function HeaderNav() {
  const pathname = usePathname()
  const params = useSearchParams()
  const homeMode = parseAdminHomeMode(params.get('mode'))
  const dashboardActive = pathname.startsWith('/dashboard')
  const reportsActive = pathname.startsWith('/reports')
  const usersActive =
    pathname.startsWith('/users') ||
    (pathname === '/' && homeMode === 'users')
  const tasksActive =
    !dashboardActive &&
    !reportsActive &&
    (pathname.startsWith('/tasks') ||
      (pathname === '/' && homeMode !== 'users'))

  return (
    <nav className="header-nav" aria-label="Admin sections">
      <Link
        href="/dashboard"
        className={dashboardActive ? 'tab is-active' : 'tab'}
      >
        Dashboard
      </Link>
      <Link href="/" className={tasksActive ? 'tab is-active' : 'tab'}>
        Tasks
      </Link>
      <Link
        href="/?mode=users"
        className={usersActive ? 'tab is-active' : 'tab'}
      >
        Users
      </Link>
      <Link
        href="/reports"
        className={reportsActive ? 'tab is-active' : 'tab'}
      >
        Reports
      </Link>
    </nav>
  )
}
