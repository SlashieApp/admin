'use client'

import { ApolloProvider } from '@apollo/client/react'

import { apolloClient } from '@/lib/apollo'
import { AuthProvider } from '@/lib/auth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  )
}
