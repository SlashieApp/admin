import 'server-only'

import { print, type DocumentNode } from 'graphql'

import { graphqlHttpUri } from '@/lib/env'

type GraphqlPayload<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

export async function serverGraphql<T>(
  document: DocumentNode,
  variables: Record<string, unknown> | undefined,
  token: string | null,
): Promise<T> {
  const response = await fetch(graphqlHttpUri(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query: print(document), variables }),
    cache: 'no-store',
  })
  const payload = (await response.json()) as GraphqlPayload<T>
  if (!response.ok) {
    throw new Error(payload.errors?.[0]?.message || `GraphQL HTTP ${response.status}`)
  }
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || 'GraphQL error')
  }
  if (!payload.data) throw new Error('GraphQL returned no data')
  return payload.data
}
