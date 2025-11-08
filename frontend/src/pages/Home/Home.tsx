import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import UploadIcon from '../../components/icons/UploadIcon';
import GenerateIcon from '../../components/icons/GenerateIcon';
import './Home.css';

type UserInfo = {
  authenticated: boolean;
  name?: string;
  email?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [animationState, setAnimationState] = useState('initial');
  const [showButtons, setShowButtons] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const skipAnimation = Boolean((location.state as { skipAnimation?: boolean } | null)?.skipAnimation);

  useEffect(() => {
    const alreadyPlayed = typeof window !== 'undefined' && sessionStorage.getItem('homeAnimationPlayed') === 'true';
    setShouldAnimate(!skipAnimation && !alreadyPlayed);

    if (skipAnimation && typeof window !== 'undefined') {
      sessionStorage.setItem('homeAnimationPlayed', 'true');
    }
  }, [skipAnimation]);

  useEffect(() => {
    if (skipAnimation) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [skipAnimation, navigate, location.pathname]);

  useEffect(() => {
    axios
      .get<UserInfo>(`${API_BASE_URL}/api/user`, { withCredentials: true })
      .then(({ data }) => {
        if (data?.authenticated) {
          setUser(data);
          if (shouldAnimate) {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('homeAnimationPlayed', 'true');
            }
            const animationTimer = setTimeout(() => {
              setAnimationState('final');
            }, 1000);
            return () => {
              clearTimeout(animationTimer);
            };
          }

          setAnimationState('final');
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch(() => navigate('/', { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate, shouldAnimate]);

  useEffect(() => {
    if (animationState !== 'final' || showButtons) {
      return;
    }

  const delay = shouldAnimate ? 3000 : 0;
    const timer = setTimeout(() => setShowButtons(true), delay);
    return () => clearTimeout(timer);
  }, [animationState, showButtons, shouldAnimate]);

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
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('homeAnimationPlayed');
      }
      navigate('/', { replace: true });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File uploaded:', file.name);
      // Placeholder for file handling logic
      alert(`You've selected ${file.name}. File handling coming soon!`);
    }
  };

  const handleGenerateSpeech = () => {
    navigate('/generate-speech');
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
          <img 
            src="/SpeechMateFull.png" 
            alt="Speech Mate" 
            className="brand-image brand-full" 
            style={{ height: '60px' }}
          />
          <img 
            src="/SpeechMateIcon.png" 
            alt="Speech Mate" 
            className="brand-image brand-icon" 
            style={{ height: '40px' }}
          />
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
        <AnimatePresence>
          <motion.div
            key="welcome"
            className="welcome-section"
            variants={{
              initial: { y: 0, scale: 1, opacity: 1 },
              final: { 
                y: -window.innerHeight / 2 + 60, // Move to top
                scale: 0.6, // Shrink
                opacity: 1, // Remain visible
                transition: { duration: 2, ease: "circOut", delay: 1 }
              }
            }}
            initial="initial"
            animate={animationState}
          >
            <h1 className="user-name">Welcome, {user?.name?.split(' ')[0] || 'User'}</h1>
          </motion.div>
        </AnimatePresence>

        <div className="action-container">
          <AnimatePresence>
            {showButtons && (
              <motion.div
                className="action-buttons"
                key="action-buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, position: 'absolute' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <label htmlFor="file-upload" className="action-button">
                  <UploadIcon className="button-icon" />
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.png"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  Upload Speech Material
                </label>
                <button className="action-button" onClick={handleGenerateSpeech}>
                  <GenerateIcon className="button-icon" />
                  Generate Speech from Scratch
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

export default Home;
