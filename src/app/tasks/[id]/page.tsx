import { Suspense } from 'react'

import { TaskDossier } from '@/components/TaskDossier'

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <Suspense fallback={<p className="muted">Loading task dossier…</p>}>
      <TaskDossier taskId={id} />
    </Suspense>
  )
}
