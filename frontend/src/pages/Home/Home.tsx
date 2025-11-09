import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import UploadIcon from '../../components/icons/UploadIcon';
import GenerateIcon from '../../components/icons/GenerateIcon';
import { clearEncouragementCache } from '../../utils/audioCache';
import './Home.css';

type UserInfo = {
  authenticated: boolean;
  name?: string;
  email?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
type OverlayStage = 'logo' | 'welcome' | 'hidden';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldAnimate] = useState(() => {
    const skipAnimation = Boolean((location.state as { skipAnimation?: boolean } | null)?.skipAnimation);
    const alreadyPlayed = typeof window !== 'undefined' && sessionStorage.getItem('homeAnimationPlayed') === 'true';
    return !skipAnimation && !alreadyPlayed;
  });
  const [overlayStage, setOverlayStage] = useState<OverlayStage>(shouldAnimate ? 'logo' : 'hidden');
  const [showButtons, setShowButtons] = useState(!shouldAnimate);
  const overlayTimersRef = useRef<number[]>([]);
  const overlayNameRef = useRef('Speaker');

  const clearOverlayTimers = useCallback(() => {
    overlayTimersRef.current.forEach(id => clearTimeout(id));
    overlayTimersRef.current = [];
  }, []);

  const beginOverlaySequence = useCallback((userName: string) => {
    if (!shouldAnimate) {
      setOverlayStage('hidden');
      setShowButtons(true);
      return;
    }
    overlayNameRef.current = userName;
    setOverlayStage('logo');
    setShowButtons(false);
    clearOverlayTimers();
    
    // Show logo for 2 seconds
    const logoTimer = window.setTimeout(() => {
      setOverlayStage('welcome');
    }, 2000);
    overlayTimersRef.current.push(logoTimer);
    
    // Hide overlay after total 5 seconds (logo + welcome)
    const hideTimer = window.setTimeout(() => {
      setOverlayStage('hidden');
      setShowButtons(true);
    }, 5000);
    overlayTimersRef.current.push(hideTimer);
  }, [clearOverlayTimers, shouldAnimate]);

  // Update page title
  useEffect(() => {
    document.title = 'Speech Mate - Home';
  }, []);

  useEffect(() => {
    // Clear navigation state after reading it
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let isMounted = true;

    axios
      .get<UserInfo>(`${API_BASE_URL}/api/user`, { withCredentials: true })
      .then(({ data }) => {
        if (!isMounted) return;
        if (!data?.authenticated) {
          navigate('/', { replace: true });
          return;
        }

        setUser(data);

        axios
          .get(`${API_BASE_URL}/api/gemini/speech-tips`, { withCredentials: true })
          .then(response => {
            sessionStorage.setItem('speechTips', JSON.stringify(response.data));
            console.log('Speech tips preloaded and cached');
          })
          .catch(err => console.error('Failed to preload speech tips:', err));

        const firstName = data.name?.split(' ')[0] || 'Speaker';
        overlayNameRef.current = firstName;

        if (shouldAnimate) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('homeAnimationPlayed', 'true');
          }
          beginOverlaySequence(firstName);
        } else {
          setOverlayStage('hidden');
          setShowButtons(true);
        }
      })
      .catch(() => navigate('/', { replace: true }))
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, shouldAnimate, beginOverlaySequence]);

  // Remove the audio playing effect since we're not using autoplay anymore

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
      clearEncouragementCache();
      navigate('/', { replace: true });
    }
  };

  const handleUploadClick = () => {
    navigate('/file-upload');
  };

  const handleGenerateSpeech = () => {
    navigate('/generate-speech');
  };

  useEffect(() => {
    return () => {
      clearOverlayTimers();
    };
  }, [clearOverlayTimers]);

  if (loading) {
    return (
      <main className="home-wrapper">
        <div className="spinner" />
        <p className="loading-text">Loading...</p>
      </main>
    );
  }

  const wrapperClassName = overlayStage !== 'hidden' ? 'home-wrapper overlay-active' : 'home-wrapper';

  return (
    <main className={wrapperClassName}>
      <AnimatePresence>
        {overlayStage !== 'hidden' && (
          <motion.div
            key="home-overlay"
            className={`home-overlay stage-${overlayStage}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {overlayStage === 'logo' && (
              <motion.div
                className="overlay-logo"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.4 }}
              >
                <img
                  src="/SpeechMateIcon.png"
                  alt="Speech Mate"
                />
              </motion.div>
            )}
            {overlayStage === 'welcome' && (
              <motion.div
                className="overlay-welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="user-name">Welcome, {overlayNameRef.current}</h1>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
        
        <div className="user-greeting">
          Hello, {user?.name?.split(' ')[0] || 'User'}
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
