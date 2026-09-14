import { TaskEditForm } from '@/components/TaskEditForm'

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TaskEditForm taskId={id} />
}
