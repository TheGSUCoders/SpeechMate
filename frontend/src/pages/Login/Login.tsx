import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleIcon } from '../../components/icons/GoogleIcon';
import './Login.css';

type UserInfo = {
  authenticated: boolean;
  name?: string;
  email?: string;
  picture?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

function Login() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Update page title
  useEffect(() => {
    document.title = 'Speech Mate • Sign In';
  }, []);

  useEffect(() => {
    axios
      .get<UserInfo>(`${API_BASE_URL}/api/user`, { withCredentials: true })
      .then(({ data }) => {
        if (data?.authenticated) {
          navigate('/home', { replace: true });
        }
      })
      .catch(() => {
        /* ignore unauthenticated */
      })
      .finally(() => setCheckingAuth(false));
  }, [navigate]);

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google?prompt=select_account`;
  };

  return (
    <main className="auth-wrapper">
      <section className="auth-card" role="region" aria-label="Sign in">
        <div className="brand">
          <img 
            src="/SpeechMateFull.png" 
            alt="Speech Mate" 
            className="brand-logo"
            style={{ height: '80px' }}
          />
        </div>

        <header className="auth-header">
          <h1 className="title">Welcome</h1>
          <p className="subtitle">Use your Google account to continue.</p>
        </header>

        <button
          className="google-button"
          onClick={handleGoogleSignIn}
          aria-label="Sign in with Google"
          disabled={checkingAuth}
        >
          <GoogleIcon />
          <span>{checkingAuth ? 'Checking...' : 'Sign in with Google'}</span>
        </button>

      </section>
    </main>
  );
}

export default Login;
