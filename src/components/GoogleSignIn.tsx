'use client'

import type { CredentialResponse } from '@react-oauth/google'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import { LoginWithGoogle } from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { useAuth } from '@/lib/auth'
import {
  emailFromGoogleIdToken,
  isSlashieAdminEmail,
} from '@/lib/adminEmail'
import { googleClientId, isGoogleAuthConfigured } from '@/lib/env'
import { graphqlErrorMessage } from '@/lib/graphqlErrors'
import type { LoginWithGoogleMutation } from '@codegen/schema'

export function GoogleSignIn() {
  const router = useRouter()
  const { loginWithApolloToken } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const clientId = googleClientId()

  const onSuccess = useCallback(
    async (response: CredentialResponse) => {
      const idToken = response.credential
      if (!idToken) return
      setError(null)

      const email = emailFromGoogleIdToken(idToken)
      if (!isSlashieAdminEmail(email)) {
        router.push('/forbidden')
        return
      }

      setBusy(true)
      try {
        const result = await apolloClient.mutate<LoginWithGoogleMutation>({
          mutation: LoginWithGoogle,
          variables: { token: idToken },
        })
        const token = result.data?.loginWithMethod?.token?.trim()
        if (!token) {
          throw new Error('Google sign-in succeeded but no session token was returned.')
        }
        await loginWithApolloToken(token)
        router.push('/')
      } catch (err) {
        if (err instanceof Error && err.message === 'NOT_ADMIN') {
          router.push('/forbidden')
          return
        }
        setError(graphqlErrorMessage(err))
      } finally {
        setBusy(false)
      }
    },
    [loginWithApolloToken, router],
  )

  if (!isGoogleAuthConfigured()) {
    return (
      <p className="banner banner-warn">
        Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable Google sign-in.
      </p>
    )
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className={busy ? 'oauth-wrap is-busy' : 'oauth-wrap'} aria-busy={busy}>
        <GoogleLogin
          onSuccess={(credentialResponse) => void onSuccess(credentialResponse)}
          onError={() =>
            setError(
              'Google sign-in failed. Allow popups and confirm this origin is listed on the OAuth client.',
            )
          }
          useOneTap={false}
          text="signin_with"
          shape="rectangular"
          size="large"
          width="320"
        />
        {error ? <p className="banner banner-error">{error}</p> : null}
      </div>
    </GoogleOAuthProvider>
  )
}
