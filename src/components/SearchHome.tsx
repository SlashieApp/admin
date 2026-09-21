'use client'

import { usePathname } from 'next/navigation'

import { TasksTable } from '@/components/TasksTable'
import { UsersTable } from '@/components/UsersTable'

export function SearchHome({ mode }: { mode?: 'tasks' | 'users' }) {
  const pathname = usePathname()
  const resolved =
    mode ?? (pathname.startsWith('/users') ? 'users' : 'tasks')
  return resolved === 'users' ? <UsersTable /> : <TasksTable />
}
