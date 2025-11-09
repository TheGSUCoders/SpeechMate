import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import './SpeechAnalysis.css';

interface Score {
  score: number;
  label: string;
}

interface ImprovementArea {
  category: string;
  issue: string;
  impact: string;
  suggestion: string;
}

interface YouTubeResource {
  area: string;
  search_query: string;
  recommended_channels: string[];
  why: string;
}

interface AccentAnalysis {
  accent_type: string;
  clarity: string;
  notes: string;
}

interface IntonationAnalysis {
  pattern: string;
  pitch_variation: string;
  emotional_inflection: string;
  specific_examples: string;
}

interface SpecificStatementFeedback {
  quote: string;
  timestamp?: string;
  effectiveness: string;
  delivery_notes: string;
  suggestion: string;
}

interface DetailedFeedback {
  content_summary?: string;
  topic_adherence?: string;
  filler_words?: {
    count: number;
    frequency: string;
    most_common: string[];
    context?: string;
  };
  body_language_notes?: string;
  vocal_analysis?: string;
  intonation_details?: string;
  slide_feedback?: string;
  language_notes?: string;
}

interface AnalysisData {
  overall_score: number;
  summary: string;
  speech_content_summary?: string;
  language_detected?: string;
  accent_analysis?: AccentAnalysis;
  intonation_analysis?: IntonationAnalysis;
  scores: {
    content_quality: Score;
    delivery: Score;
    vocal_variety: Score;
    intonation?: Score;
    body_language: Score;
    visual_aids: Score;
    engagement: Score;
  };
  strengths: string[];
  specific_statements_feedback?: SpecificStatementFeedback[];
  areas_for_improvement: ImprovementArea[];
  detailed_feedback: DetailedFeedback;
  youtube_resources: YouTubeResource[];
  action_plan: string[];
}

const SectionTitle = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="section-heading">
    <span className="section-heading__icon">{icon}</span>
    <h2>{title}</h2>
  </div>
);

const SummaryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h8l5 5v13H7z" />
    <path d="M15 3v5h5" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);

const LanguageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.7 3 2.7 15 0 18" />
    <path d="M12 3c-2.7 3-2.7 15 0 18" />
  </svg>
);

const IntonationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 16c1.5-4 3.5-4 5 0s3.5 4 5 0 3.5-4 5 0 3.5 4 5 0" />
  </svg>
);

const StrengthIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.5-4.8-2.5-4.8 2.5.9-5.5L4.2 8.7l5.4-.8z" />
  </svg>
);

const StatementIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7H4v6h4v4H2V9a2 2 0 0 1 2-2h3z" />
    <path d="M20 7h-3v6h4v4h-6V9a2 2 0 0 1 2-2h3z" />
  </svg>
);

const ImprovementIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="7" x2="12" y2="9" />
    <line x1="12" y1="15" x2="12" y2="17" />
    <line x1="7" y1="12" x2="9" y2="12" />
    <line x1="15" y1="12" x2="17" y2="12" />
  </svg>
);

const FillerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="20" x2="6" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="18" y1="20" x2="18" y2="14" />
  </svg>
);

const ResourceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <polygon points="10 9 15 12 10 15 10 9" />
  </svg>
);

const ActionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l2 2 4-5" />
    <path d="M5 5h14" />
    <path d="M5 19h14" />
    <path d="M5 12h3" />
    <path d="M5 16h3" />
  </svg>
);

function SpeechAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Update page title
  useEffect(() => {
    document.title = 'Speech Mate - Analysis Results';
  }, []);

  useEffect(() => {
    const state = location.state as { analysis?: Record<string, unknown> };
    console.log('SpeechAnalysis - Full state:', state);
    console.log('SpeechAnalysis - Analysis data:', state?.analysis);
    
    if (!state?.analysis) {
      console.error('No analysis data found in location state');
      navigate('/home', { state: { skipAnimation: true } });
      return;
    }

    // Parse the Gemini API response
    try {
      const analysisData = state.analysis as Record<string, unknown>;
      console.log('Analysis data keys:', Object.keys(analysisData));
      
      const candidates = analysisData.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      console.log('Candidates:', candidates);
      
      if (candidates && candidates.length > 0) {
        const content = candidates[0].content;
        console.log('Content:', content);
        
        if (content && content.parts && content.parts.length > 0) {
          const responseText = content.parts[0].text;
          console.log('Response text:', responseText);
          
          if (responseText) {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            console.log('JSON match found:', !!jsonMatch);
            
            if (jsonMatch) {
              console.log('Parsing JSON:', jsonMatch[0].substring(0, 200) + '...');
              const parsed = JSON.parse(jsonMatch[0]) as AnalysisData;
              console.log('Parsed analysis:', parsed);
              setAnalysis(parsed);
              
              // Play the feedback summary using ElevenLabs
              playFeedbackAudio(parsed.summary);
            } else {
              console.error('No JSON found in response text');
              alert('Invalid response format. Please try again.');
              navigate('/home', { state: { skipAnimation: true } });
            }
          }
        }
      } else {
        console.error('No candidates found in analysis data');
        alert('Invalid analysis response. Please try again.');
        navigate('/home', { state: { skipAnimation: true } });
      }
    } catch (err) {
      console.error('Failed to parse analysis:', err);
      console.error('Error details:', err instanceof Error ? err.message : String(err));
      alert('Failed to parse speech analysis. Please try again.');
      navigate('/home', { state: { skipAnimation: true } });
    }
  }, [location, navigate]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const playFeedbackAudio = async (text: string) => {
    if (isMuted) return;
    
    setIsPlayingAudio(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
      const response = await axios.post(`${API_BASE_URL}/api/elevenlabs/text-to-speech`, {
        text: text
      }, {
        withCredentials: true,
        responseType: 'blob',
        timeout: 10000 // 10 second timeout
      });
      
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (err) {
      console.error('Failed to play feedback audio:', err);
      setIsPlayingAudio(false);
      // Silently fail - don't interrupt the user experience
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (currentAudio && !isMuted) {
      currentAudio.pause();
      setIsPlayingAudio(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#FF5252';
  };

  if (!analysis) {
    return <div className="speech-analysis-wrapper">Loading...</div>;
  }

  return (
    <main className="speech-analysis-wrapper">
      <motion.div
        className="speech-analysis-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="analysis-header">
          <button 
            className={`mute-button ${isPlayingAudio ? 'playing' : ''}`}
            onClick={toggleMute}
            title={isMuted ? "Unmute feedback" : "Mute feedback"}
          >
            {isMuted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            )}
          </button>
          <h1>Speech Performance Analysis</h1>
          <div className="overall-score" style={{ borderColor: getScoreColor(analysis.overall_score) }}>
            <div className="score-circle" style={{ background: `conic-gradient(${getScoreColor(analysis.overall_score)} ${analysis.overall_score * 3.6}deg, rgba(255,255,255,0.1) 0deg)` }}>
              <span className="score-number">{analysis.overall_score}</span>
              <span className="score-label">Overall Score</span>
            </div>
          </div>
          <p className="summary">{analysis.summary}</p>
        </div>

        {analysis.speech_content_summary && (
          <div className="content-summary-section analysis-card">
            <SectionTitle icon={<SummaryIcon />} title="Speech Content Summary" />
            <p className="content-summary">{analysis.speech_content_summary}</p>
          </div>
        )}

        {(analysis.language_detected || analysis.accent_analysis) && (
          <div className="language-section analysis-card">
            <SectionTitle icon={<LanguageIcon />} title="Language & Accent Analysis" />
            {analysis.language_detected && (
              <div className="language-info">
                <p><strong>Language(s) Detected:</strong> {analysis.language_detected}</p>
              </div>
            )}
            {analysis.accent_analysis && (
              <div className="accent-info">
                <p><strong>Accent Type:</strong> {analysis.accent_analysis.accent_type}</p>
                <p><strong>Pronunciation Clarity:</strong> {analysis.accent_analysis.clarity}</p>
                <p className="accent-notes">{analysis.accent_analysis.notes}</p>
              </div>
            )}
          </div>
        )}

        {analysis.intonation_analysis && (
          <div className="intonation-section analysis-card">
            <SectionTitle icon={<IntonationIcon />} title="Intonation & Vocal Expression" />
            <div className="intonation-grid">
              <div className="intonation-item">
                <strong>Pattern:</strong> {analysis.intonation_analysis.pattern}
              </div>
              <div className="intonation-item">
                <strong>Pitch Variation:</strong> {analysis.intonation_analysis.pitch_variation}
              </div>
              <div className="intonation-item">
                <strong>Emotional Inflection:</strong> {analysis.intonation_analysis.emotional_inflection}
              </div>
            </div>
            {analysis.intonation_analysis.specific_examples && (
              <p className="intonation-examples"><strong>Examples:</strong> {analysis.intonation_analysis.specific_examples}</p>
            )}
          </div>
        )}

        <div className="scores-grid">
          {Object.entries(analysis.scores).map(([key, value]) => (
            <div key={key} className="score-card">
              <h3>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ 
                    width: `${value.score}%`,
                    backgroundColor: getScoreColor(value.score)
                  }}
                />
              </div>
              <div className="score-info">
                <span className="score-value">{value.score}/100</span>
                <span className="score-label">{value.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="strengths-section analysis-card">
          <SectionTitle icon={<StrengthIcon />} title="Your Strengths" />
          <ul className="strengths-list">
            {analysis.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>

        {analysis.specific_statements_feedback && analysis.specific_statements_feedback.length > 0 && (
          <div className="statements-section analysis-card">
            <SectionTitle icon={<StatementIcon />} title="Feedback on Your Specific Statements" />
            {analysis.specific_statements_feedback.map((statement, index) => (
              <div key={index} className="statement-card">
                <div className="statement-quote">
                  <p className="quote-text">"{statement.quote}"</p>
                  {statement.timestamp && <span className="timestamp">{statement.timestamp}</span>}
                </div>
                <div className="statement-feedback">
                  <p><strong>What Worked:</strong> {statement.effectiveness}</p>
                  <p><strong>Delivery:</strong> {statement.delivery_notes}</p>
                  <p className="suggestion"><strong>Recommendation:</strong> {statement.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="improvements-section analysis-card">
          <SectionTitle icon={<ImprovementIcon />} title="Areas for Improvement" />
          {analysis.areas_for_improvement.map((area, index) => (
            <div key={index} className="improvement-card">
              <h3>{area.category}</h3>
              <div className="improvement-detail">
                <p><strong>Issue:</strong> {area.issue}</p>
                <p><strong>Impact:</strong> {area.impact}</p>
                <p className="suggestion"><strong>Recommendation:</strong> {area.suggestion}</p>
              </div>
            </div>
          ))}
        </div>

        {analysis.detailed_feedback.filler_words && (
          <div className="filler-words-section analysis-card">
            <SectionTitle icon={<FillerIcon />} title="Filler Words Analysis" />
            <div className="filler-stats">
              <div className="stat">
                <span className="stat-number">{analysis.detailed_feedback.filler_words.count}</span>
                <span className="stat-label">Total Count</span>
              </div>
              <div className="stat">
                <span className="stat-number">{analysis.detailed_feedback.filler_words.frequency}</span>
                <span className="stat-label">Frequency</span>
              </div>
              <div className="stat">
                <span className="stat-label">Most Common:</span>
                <span className="stat-value">{analysis.detailed_feedback.filler_words.most_common.join(', ')}</span>
              </div>
            </div>
            {analysis.detailed_feedback.filler_words.context && (
              <p className="filler-context"><strong>Context:</strong> {analysis.detailed_feedback.filler_words.context}</p>
            )}
          </div>
        )}

        <div className="resources-section analysis-card">
          <SectionTitle icon={<ResourceIcon />} title="Recommended YouTube Resources" />
          {analysis.youtube_resources.map((resource, index) => (
            <div key={index} className="resource-card">
              <h3>{resource.area}</h3>
              <p className="resource-why">{resource.why}</p>
              <div className="resource-details">
                <p><strong>Search:</strong> <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(resource.search_query)}`} target="_blank" rel="noopener noreferrer">{resource.search_query}</a></p>
                <p><strong>Recommended Channels:</strong> {resource.recommended_channels.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="action-plan-section analysis-card">
          <SectionTitle icon={<ActionIcon />} title="Action Plan" />
          <ol className="action-plan-list">
            {analysis.action_plan.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ol>
        </div>

        <div className="analysis-actions">
          <button className="back-button" onClick={() => navigate('/home', { state: { skipAnimation: true }})}>
            <ArrowLeftIcon className="button-icon" />
            <span>Back to Home</span>
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default SpeechAnalysis;
