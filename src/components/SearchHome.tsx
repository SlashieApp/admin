'use client'

import { useSearchParams } from 'next/navigation'

import { TaskList } from '@/components/TaskList'
import { UserList } from '@/components/UserList'
import { parseAdminHomeMode, type AdminHomeMode } from '@/lib/search'

export function SearchHome({ forcedMode }: { forcedMode?: AdminHomeMode }) {
  const searchParams = useSearchParams()
  const mode = forcedMode ?? parseAdminHomeMode(searchParams.get('mode'))
  return mode === 'users' ? <UserList /> : <TaskList />
}
