import { Suspense } from 'react'

import { FeedbackInbox } from '@/components/FeedbackInbox'

export default function FeedbackPage() {
  return (
    <Suspense fallback={<p className="muted">Loading feedback…</p>}>
      <FeedbackInbox />
    </Suspense>
  )
}
