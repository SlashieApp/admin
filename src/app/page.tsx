import { Suspense } from 'react'

import { SearchHome } from '@/components/SearchHome'

export default function HomePage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <SearchHome />
    </Suspense>
  )
}
