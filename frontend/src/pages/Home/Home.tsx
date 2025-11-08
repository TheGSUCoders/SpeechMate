import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

type UserInfo = {
  authenticated: boolean;
  name?: string;
  email?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<UserInfo>(`${API_BASE_URL}/api/user`, { withCredentials: true })
      .then(({ data }) => {
        if (data?.authenticated) {
          setUser(data);
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch(() => navigate('/', { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error('Failed to logout', err);
    } finally {
      navigate('/', { replace: true });
    }
  };

  if (loading) {
    return (
      <main className="home-wrapper">
        <div className="spinner" />
        <p className="loading-text">Loading...</p>
      </main>
    );
  }

  return (
    <main className="home-wrapper">
      <nav className="nav-bar">
        <div className="brand-logo">
          <span className="brand-icon">SM</span>
          <span className="brand-name">SpeechMate</span>
        </div>
        
        <button className="logout-button" onClick={handleLogout}>
          <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </nav>

      <div className="content-wrapper">
        <div className="welcome-section">
          <h1 className="user-name">Welcome, {user?.name || 'User'}</h1>
          <p className="user-email">{user?.email}</p>
        </div>
      </div>
    </main>
  );
}

export default Home;
