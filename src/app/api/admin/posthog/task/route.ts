import { NextResponse } from 'next/server'

import { getServerAuthToken } from '@/server/auth'
import { fetchTaskAnalytics } from '@/server/posthog'

export async function GET(request: Request) {
  const token = await getServerAuthToken()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const taskId = url.searchParams.get('taskId')?.trim() ?? ''
  if (!taskId || taskId.length > 200) {
    return NextResponse.json({ error: 'taskId required' }, { status: 400 })
  }

  const data = await fetchTaskAnalytics(taskId)
  return NextResponse.json(data)
}
