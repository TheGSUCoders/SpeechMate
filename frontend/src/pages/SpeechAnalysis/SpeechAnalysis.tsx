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

interface DetailedFeedback {
  topic_adherence?: string;
  filler_words?: {
    count: number;
    frequency: string;
    most_common: string[];
  };
  body_language_notes?: string;
  vocal_analysis?: string;
  slide_feedback?: string;
}

interface AnalysisData {
  overall_score: number;
  summary: string;
  scores: {
    content_quality: Score;
    delivery: Score;
    vocal_variety: Score;
    body_language: Score;
    visual_aids: Score;
    engagement: Score;
  };
  strengths: string[];
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
