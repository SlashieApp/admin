import { Suspense } from 'react'

import { SearchHome } from '@/components/SearchHome'

export default function UsersPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <SearchHome forcedMode="users" />
    </Suspense>
  )
}
