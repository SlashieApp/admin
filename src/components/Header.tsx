'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useId, useState } from 'react'

import { BrandLogo } from '@/components/BrandLogo'
import { useAuth } from '@/lib/auth'
import { parseAdminHomeMode } from '@/lib/search'

export function Header() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <header className="header">
      <div className="header-bar">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <BrandLogo surface="dark" />
          <span className="brand-product">Admin</span>
        </Link>
        {user ? (
          <>
            <div className="header-desktop">
              <Suspense fallback={<HeaderNavFallback />}>
                <HeaderNav onNavigate={() => setOpen(false)} />
              </Suspense>
            </div>
            <div className="header-meta">
              <span className="header-email">{user.email}</span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Log out
              </button>
            </div>
            <button
              type="button"
              className="header-menu-btn"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((current) => !current)}
            >
              {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            </button>
          </>
        ) : null}
      </div>
      {user && open ? (
        <div id={menuId} className="header-drawer">
          <Suspense fallback={<HeaderNavFallback stacked />}>
            <HeaderNav stacked onNavigate={() => setOpen(false)} />
          </Suspense>
          <p className="header-email header-email-mobile">{user.email}</p>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      ) : null}
    </header>
  )
}

function HeaderNavFallback({ stacked = false }: { stacked?: boolean }) {
  return (
    <nav
      className={stacked ? 'header-nav is-stacked' : 'header-nav'}
      aria-label="Admin sections"
    >
      <Link href="/dashboard" className="tab">
        Dashboard
      </Link>
      <Link href="/" className="tab">
        Tasks
      </Link>
      <Link href="/?mode=users" className="tab">
        Users
      </Link>
    </nav>
  )
}

function HeaderNav({
  stacked = false,
  onNavigate,
}: {
  stacked?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const params = useSearchParams()
  const homeMode = parseAdminHomeMode(params.get('mode'))
  const dashboardActive = pathname.startsWith('/dashboard')
  const usersActive =
    pathname.startsWith('/users') || (pathname === '/' && homeMode === 'users')
  const tasksActive = !dashboardActive && !usersActive

  return (
    <nav
      className={stacked ? 'header-nav is-stacked' : 'header-nav'}
      aria-label="Admin sections"
    >
      <Link
        href="/dashboard"
        className={dashboardActive ? 'tab is-active' : 'tab'}
        aria-current={dashboardActive ? 'page' : undefined}
        onClick={onNavigate}
      >
        Dashboard
      </Link>
      <Link
        href="/"
        className={tasksActive ? 'tab is-active' : 'tab'}
        aria-current={tasksActive ? 'page' : undefined}
        onClick={onNavigate}
      >
        Tasks
      </Link>
      <Link
        href="/?mode=users"
        className={usersActive ? 'tab is-active' : 'tab'}
        aria-current={usersActive ? 'page' : undefined}
        onClick={onNavigate}
      >
        Users
      </Link>
    </nav>
  )
}
