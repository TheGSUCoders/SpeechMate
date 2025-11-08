import { useState, useEffect } from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const [currentTip, setCurrentTip] = useState('Generating your speech...');
  const [tips, setTips] = useState<string[]>([]);

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
              setCurrentTip(tipsJson.tips[0]);
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

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % tips.length;
      setCurrentTip(tips[index]);
    }, 4000); // Change tip every 4 seconds

    return () => clearInterval(interval);
  }, [tips]);

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
