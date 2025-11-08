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
        <section className="home-card">
          <p>Loading…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="home-wrapper">
      <section className="home-card" role="region" aria-live="polite">
        <div className="home-header">
          <h1>Welcome back{user?.name ? `, ${user.name}` : ''}!</h1>
          <p>{user?.email}</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Log out
        </button>
      </section>
    </main>
  );
}

export default Home;
