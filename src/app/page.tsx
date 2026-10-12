import { Suspense } from 'react'

import { TasksTable } from '@/components/TasksTable'

export default function HomePage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <TasksTable />
    </Suspense>
  )
}
