import { TaskDossier } from '@/components/TaskDossier'

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TaskDossier taskId={id} />
}
