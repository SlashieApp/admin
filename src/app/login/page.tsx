import { BrandLogo } from '@/components/BrandLogo'
import { GoogleSignIn } from '@/components/GoogleSignIn'

export default function LoginPage() {
  return (
    <main className="auth-main">
      <div className="auth-card">
        <BrandLogo surface="light" />
        <h1>Admin sign in</h1>
        <p className="muted">
          Sign in with Google. Only <code>@slashie.app</code> accounts are
          allowed (primary: <code>admin@slashie.app</code>).
        </p>
        <GoogleSignIn />
      </div>
    </main>
  )
}
