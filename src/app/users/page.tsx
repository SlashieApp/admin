import { Suspense } from 'react'

import { UsersTable } from '@/components/UsersTable'

export default function UsersPage() {
  return (
    <Suspense fallback={<p className="muted">Loading users…</p>}>
      <UsersTable />
    </Suspense>
  )
}
