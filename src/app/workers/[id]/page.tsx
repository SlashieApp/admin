import { WorkerSummary } from '@/components/WorkerSummary'

export default async function WorkerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WorkerSummary workerId={id} />
}
