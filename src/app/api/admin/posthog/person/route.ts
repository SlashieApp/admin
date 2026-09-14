import { NextResponse } from 'next/server'

import { getServerAuthToken } from '@/server/auth'
import { fetchPersonAnalytics } from '@/server/posthog'

export async function GET(request: Request) {
  const token = await getServerAuthToken()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')?.trim() ?? ''
  const email = url.searchParams.get('email')?.trim() || null
  if (!userId || userId.length > 200) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const data = await fetchPersonAnalytics({ userId, email })
  return NextResponse.json(data)
}
