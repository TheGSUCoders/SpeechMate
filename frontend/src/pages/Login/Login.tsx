import { GoogleIcon } from '../../components/icons/GoogleIcon';
import './Login.css'

function Login() {
  const handleGoogleSignIn = () => {
    alert('Google sign-in coming soon.');
  }

  return (
    <main className="auth-wrapper">
      <section className="auth-card" role="region" aria-label="Sign in">
        <div className="brand">
          <div className="brand-mark">SM</div>
          <div className="brand-text">SpeechMate</div>
        </div>

        <header className="auth-header">
          <h1 className="title">Welcome</h1>
          <p className="subtitle">Use your Google account to continue.</p>
        </header>

        <button className="google-button" onClick={handleGoogleSignIn} aria-label="Sign in with Google">
          <GoogleIcon />
          <span>Sign in with Google</span>
        </button>

      </section>
    </main>
  )
}

export default Login;
