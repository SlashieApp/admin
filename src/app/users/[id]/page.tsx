import { UserDetail } from '@/components/UserDetail'

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <UserDetail userId={id} />
}
