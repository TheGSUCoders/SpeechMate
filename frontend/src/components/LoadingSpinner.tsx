import { useState, useEffect } from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const [currentTip, setCurrentTip] = useState('Generating your speech...');
  const [tips, setTips] = useState<string[]>([]);
  const [lastTipIndex, setLastTipIndex] = useState(-1);

  useEffect(() => {
    // Load tips from cache
    const cachedTips = sessionStorage.getItem('speechTips');
    if (cachedTips) {
      try {
        const parsedData = JSON.parse(cachedTips);
        // Extract tips array from the Gemini API response
        if (parsedData.candidates?.[0]?.content?.parts?.[0]?.text) {
          const tipsText = parsedData.candidates[0].content.parts[0].text;
          const tipsMatch = tipsText.match(/\{[\s\S]*\}/);
          if (tipsMatch) {
            const tipsJson = JSON.parse(tipsMatch[0]);
            if (tipsJson.tips && Array.isArray(tipsJson.tips)) {
              setTips(tipsJson.tips);
              // Pick a random starting tip
              const randomStart = Math.floor(Math.random() * tipsJson.tips.length);
              setCurrentTip(tipsJson.tips[randomStart]);
              setLastTipIndex(randomStart);
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse cached tips:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (tips.length === 0) return;

    const interval = setInterval(() => {
      // Pick a random tip that's different from the last one
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * tips.length);
      } while (randomIndex === lastTipIndex && tips.length > 1);
      
      setCurrentTip(tips[randomIndex]);
      setLastTipIndex(randomIndex);
    }, 4000); // Change tip every 4 seconds

    return () => clearInterval(interval);
  }, [tips, lastTipIndex]);

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <img 
          src="/SpeechMateIcon.png" 
          alt="SpeechMate" 
          className="loading-logo pulse" 
        />
        <div className="loading-tip-container">
          <p className="loading-tip-label">Speech Tip</p>
          <p className="loading-tip-text">{message || currentTip}</p>
        </div>
      </div>
    </div>
  );
}
