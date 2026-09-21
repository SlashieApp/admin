const DEFAULT_PUBLIC_APP_URL = 'https://slashie.app'

export function publicAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  return (raw && raw.length > 0 ? raw : DEFAULT_PUBLIC_APP_URL).replace(
    /\/$/,
    '',
  )
}

/** Live marketplace task page. Public web uses `/tasks/[slug]` with the task id. */
export function publicTaskUrl(taskId: string): string {
  return `${publicAppOrigin()}/tasks/${encodeURIComponent(taskId)}`
}
