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

  // Check if animation should play on mount
  const shouldAnimate = (() => {
    const skipAnimation = Boolean((location.state as { skipAnimation?: boolean } | null)?.skipAnimation);
    const alreadyPlayed = typeof window !== 'undefined' && sessionStorage.getItem('homeAnimationPlayed') === 'true';
    return !skipAnimation && !alreadyPlayed;
  })();

  const [animationState, setAnimationState] = useState(shouldAnimate ? 'initial' : 'final');
  const [showButtons, setShowButtons] = useState(!shouldAnimate);

  useEffect(() => {
    // Clear navigation state after reading it
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    axios
      .get<UserInfo>(`${API_BASE_URL}/api/user`, { withCredentials: true })
      .then(({ data }) => {
        if (data?.authenticated) {
          setUser(data);
          
          // Preload speech tips in the background
          axios.get(`${API_BASE_URL}/api/gemini/speech-tips`, { withCredentials: true })
            .then(response => {
              // Cache the tips in sessionStorage
              sessionStorage.setItem('speechTips', JSON.stringify(response.data));
              console.log('Speech tips preloaded and cached');
            })
            .catch(err => console.error('Failed to preload speech tips:', err));
          
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

  const handleUploadClick = () => {
    navigate('/file-upload');
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
            initial={shouldAnimate ? 'initial' : 'final'}
            animate={shouldAnimate ? animationState : 'final'}
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
                <button className="action-button" onClick={handleUploadClick}>
                  <div className="button-icon-wrapper">
                    <UploadIcon className="button-icon" />
                  </div>
                  <div className="button-content">
                    <h3 className="button-title">Upload Speech Material</h3>
                    <p className="button-description">Upload your slides, notes, and documents to practice with existing content.</p>
                  </div>
                </button>
                <button className="action-button" onClick={handleGenerateSpeech}>
                  <div className="button-icon-wrapper">
                    <GenerateIcon className="button-icon" />
                  </div>
                  <div className="button-content">
                    <h3 className="button-title">Generate Speech from Scratch</h3>
                    <p className="button-description">Create a custom speech outline with AI assistance tailored to your topic and audience.</p>
                  </div>
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
