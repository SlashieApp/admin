import { GoogleSignIn } from '@/components/GoogleSignIn'

export default function LoginPage() {
  return (
    <main className="auth-main">
      <div className="auth-card">
        <h1>Slashie Admin</h1>
        <p className="muted">
          Sign in with Google. Only <code>@slashie.app</code> accounts are
          allowed (primary: <code>admin@slashie.app</code>).
        </p>
        <GoogleSignIn />
      </div>
    </main>
  )
}
