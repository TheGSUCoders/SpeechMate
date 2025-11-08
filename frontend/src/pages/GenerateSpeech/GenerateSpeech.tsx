import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './GenerateSpeech.css';

function GenerateSpeech() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [speechStyle, setSpeechStyle] = useState('');
  const [audience, setAudience] = useState('');
  const [keyMessage, setKeyMessage] = useState('');
  const [duration, setDuration] = useState(60);

  const handleCancel = () => {
    navigate('/home', { state: { skipAnimation: true } });
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for actual API call
    alert(`Generating speech with: Topic - ${topic}, Tone - ${tone}, Style - ${speechStyle}, Audience - ${audience}, Key Message - ${keyMessage}, Duration - ${duration}s`);
    console.log({ topic, tone, speechStyle, audience, keyMessage, duration });
    // Navigate back home or to a results page
    navigate('/home');
  };

  return (
    <main className="generate-speech-wrapper">
      <motion.div
        className="generate-speech-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="header-section">
          <h1>Generate Speech from Scratch</h1>
          <p>Fill in the details below to craft your speech.</p>
        </div>
        <form className="generate-form" onSubmit={handleGenerateSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="topic">Topic</label>
              <input id="topic" type="text" placeholder="e.g., The future of AI" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="tone">Tone</label>
              <input id="tone" type="text" placeholder="e.g., Inspirational, humorous" value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="style">Style</label>
              <input id="style" type="text" placeholder="e.g., Formal, conversational" value={speechStyle} onChange={(e) => setSpeechStyle(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="audience">Audience</label>
              <input id="audience" type="text" placeholder="e.g., Tech executives, students" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label htmlFor="key-message">Key Message</label>
              <textarea id="key-message" placeholder="What is the single most important takeaway?" value={keyMessage} onChange={(e) => setKeyMessage(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="duration">Duration (seconds)</label>
              <input id="duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-button">Cancel</button>
            <button type="submit" className="generate-button">Generate</button>
          </div>
        </form>
      </motion.div>
    </main>
  );
}

export default GenerateSpeech;
