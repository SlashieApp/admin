'use client'

import type { MeQuery } from '@codegen/schema'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { Me } from '@/graphql/operations'
import { isSlashieAdminEmail } from '@/lib/adminEmail'
import { apolloClient } from '@/lib/apollo'
import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/authCookie'

export type AdminUser = {
  id: string
  email: string
  name?: string | null
}

type AuthContextValue = {
  user: AdminUser | null
  loading: boolean
  loginWithApolloToken: (token: string) => Promise<AdminUser>
  logout: () => void
  refresh: () => Promise<AdminUser | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAdminUser(me: MeQuery['me'] | null | undefined): AdminUser | null {
  if (!me?.id || !me.email) return null
  if (!isSlashieAdminEmail(me.email)) return null
  return {
    id: me.id,
    email: me.email,
    name: me.profile?.name ?? null,
  }
}

async function fetchMe(): Promise<AdminUser | null> {
  const result = await apolloClient.query<MeQuery>({
    query: Me,
    fetchPolicy: 'network-only',
  })
  return toAdminUser(result.data?.me)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    await Promise.resolve()
    if (!getAuthToken()) {
      setUser(null)
      setLoading(false)
      return null
    }
    setLoading(true)
    try {
      const next = await fetchMe()
      if (!next) {
        clearAuthToken()
        await apolloClient.clearStore()
      }
      setUser(next)
      return next
    } catch {
      clearAuthToken()
      await apolloClient.clearStore()
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const next = await refresh()
      if (cancelled) return
      void next
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const loginWithApolloToken = useCallback(async (token: string) => {
    setAuthToken(token)
    const next = await fetchMe()
    if (!next) {
      clearAuthToken()
      await apolloClient.clearStore()
      throw new Error('NOT_ADMIN')
    }
    setUser(next)
    setLoading(false)
    return next
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
    void apolloClient.clearStore()
  }, [])

  const value = useMemo(
    () => ({ user, loading, loginWithApolloToken, logout, refresh }),
    [user, loading, loginWithApolloToken, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
