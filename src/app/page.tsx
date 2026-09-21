import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { SearchHome } from '@/components/SearchHome'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  if (params.mode === 'users') {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (key === 'mode' || value == null) continue
      const values = Array.isArray(value) ? value : [value]
      for (const item of values) next.append(key, item)
    }
    const qs = next.toString()
    redirect(qs ? `/users?${qs}` : '/users')
  }

  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <SearchHome mode="tasks" />
    </Suspense>
  )
}
