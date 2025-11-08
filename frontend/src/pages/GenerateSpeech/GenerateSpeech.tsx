import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import './GenerateSpeech.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

function GenerateSpeech() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadedFile = (location.state as { uploadedFile?: UploadedFile })?.uploadedFile;
  
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [speechStyle, setSpeechStyle] = useState('');
  const [audience, setAudience] = useState('');
  const [keyMessage, setKeyMessage] = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uploadedFile) {
      // Pre-fill topic with file name (without extension)
      const fileName = uploadedFile.name.replace(/\.[^/.]+$/, '');
      setTopic(fileName);
    }
  }, [uploadedFile]);

  const handleCancel = () => {
    navigate('/home', { state: { skipAnimation: true } });
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const requestBody: Record<string, string | number | object | undefined> = {
        topic,
        tone,
        style: speechStyle,
        audience,
        keyMessage,
        seconds: duration,
      };

      // Add file context if available
      if (uploadedFile) {
        requestBody.fileContext = {
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          note: `Generate speech based on the uploaded file: ${uploadedFile.name}`
        };
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/gemini/generate-outline`,
        requestBody,
        { withCredentials: true }
      );

      // Navigate to results page with the generated outline
      navigate('/speech-result', { 
        state: { 
          outline: response.data,
          originalParams: { 
            topic, 
            tone, 
            style: speechStyle, 
            audience, 
            keyMessage, 
            seconds: duration,
            uploadedFile: uploadedFile || undefined
          }
        } 
      });
    } catch (err) {
      console.error('Failed to generate speech:', err);
      setError('Failed to generate speech outline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoadingSpinner />}
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
          {uploadedFile && (
            <div className="uploaded-file-info">
              <p>Using uploaded file: <strong>{uploadedFile.name}</strong></p>
            </div>
          )}
          {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
        <form className="generate-form" onSubmit={handleGenerateSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="topic">Topic *</label>
              <input id="topic" type="text" placeholder="e.g., The future of AI" value={topic} onChange={(e) => setTopic(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="tone">Tone (Optional)</label>
              <input id="tone" type="text" placeholder="e.g., Inspirational, humorous" value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="style">Style (Optional)</label>
              <input id="style" type="text" placeholder="e.g., Formal, conversational" value={speechStyle} onChange={(e) => setSpeechStyle(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="audience">Audience (Optional)</label>
              <input id="audience" type="text" placeholder="e.g., Tech executives, students" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label htmlFor="key-message">Key Message (Optional)</label>
              <textarea id="key-message" placeholder="What is the single most important takeaway?" value={keyMessage} onChange={(e) => setKeyMessage(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="duration">Duration (seconds)</label>
              <input id="duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min="30" />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="cancel-button" disabled={loading}>Cancel</button>
            <button type="submit" className="generate-button" disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </motion.div>
    </main>
    </>
  );
}

export default GenerateSpeech;
