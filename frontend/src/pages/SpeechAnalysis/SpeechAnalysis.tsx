import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

function SpeechAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  useEffect(() => {
    const state = location.state as { analysis?: Record<string, unknown> };
    if (!state?.analysis) {
      navigate('/home', { state: { skipAnimation: true } });
      return;
    }

    // Parse the Gemini API response
    try {
      const analysisData = state.analysis as Record<string, unknown>;
      const candidates = analysisData.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      if (candidates && candidates.length > 0) {
        const content = candidates[0].content;
        if (content && content.parts && content.parts.length > 0) {
          const responseText = content.parts[0].text;
          if (responseText) {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]) as AnalysisData;
              setAnalysis(parsed);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to parse analysis:', err);
      alert('Failed to parse speech analysis. Please try again.');
      navigate('/home', { state: { skipAnimation: true } });
    }
  }, [location, navigate]);

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
          <div className="content-summary-section">
            <h2>📝 Speech Content Summary</h2>
            <p className="content-summary">{analysis.speech_content_summary}</p>
          </div>
        )}

        {(analysis.language_detected || analysis.accent_analysis) && (
          <div className="language-section">
            <h2>🌍 Language & Accent Analysis</h2>
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
          <div className="intonation-section">
            <h2>🎵 Intonation & Vocal Expression</h2>
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

        <div className="strengths-section">
          <h2>💪 Your Strengths</h2>
          <ul className="strengths-list">
            {analysis.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>

        {analysis.specific_statements_feedback && analysis.specific_statements_feedback.length > 0 && (
          <div className="statements-section">
            <h2>💬 Feedback on Your Specific Statements</h2>
            {analysis.specific_statements_feedback.map((statement, index) => (
              <div key={index} className="statement-card">
                <div className="statement-quote">
                  <p className="quote-text">"{statement.quote}"</p>
                  {statement.timestamp && <span className="timestamp">{statement.timestamp}</span>}
                </div>
                <div className="statement-feedback">
                  <p><strong>✅ What Worked:</strong> {statement.effectiveness}</p>
                  <p><strong>🎭 Delivery:</strong> {statement.delivery_notes}</p>
                  <p className="suggestion"><strong>💡 Suggestion:</strong> {statement.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="improvements-section">
          <h2>📈 Areas for Improvement</h2>
          {analysis.areas_for_improvement.map((area, index) => (
            <div key={index} className="improvement-card">
              <h3>{area.category}</h3>
              <div className="improvement-detail">
                <p><strong>Issue:</strong> {area.issue}</p>
                <p><strong>Impact:</strong> {area.impact}</p>
                <p className="suggestion"><strong>💡 Suggestion:</strong> {area.suggestion}</p>
              </div>
            </div>
          ))}
        </div>

        {analysis.detailed_feedback.filler_words && (
          <div className="filler-words-section">
            <h2>🗣️ Filler Words Analysis</h2>
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

        <div className="resources-section">
          <h2>📺 Recommended YouTube Resources</h2>
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

        <div className="action-plan-section">
          <h2>✅ Action Plan</h2>
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
