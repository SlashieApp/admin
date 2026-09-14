import { Suspense } from 'react'

import { ReportsInbox } from '@/components/ReportsInbox'

export default function ReportsPage() {
  return (
    <Suspense fallback={<p className="muted">Loading reports…</p>}>
      <ReportsInbox />
    </Suspense>
  )
}
