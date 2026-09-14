'use client'

import { ApolloClient, InMemoryCache, from } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { createHttpLink } from '@apollo/client/link/http'

import { getAuthToken } from '@/lib/authCookie'
import { graphqlHttpUri } from '@/lib/env'

const httpLink = createHttpLink({
  uri: graphqlHttpUri(),
})

const authLink = setContext((_, { headers }) => {
  const token = getAuthToken()
  if (!token) return { headers }
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${token}`,
    },
  }
})

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
})
