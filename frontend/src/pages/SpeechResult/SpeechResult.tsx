import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import SaveIcon from '../../components/icons/SaveIcon';
import DownloadIcon from '../../components/icons/DownloadIcon';
import EditIcon from '../../components/icons/EditIcon';
import EyeIcon from '../../components/icons/EyeIcon';
import './SpeechResult.css';

interface SpeechOutline {
  title: string;
  goal_minutes: number;
  thesis: string;
  sections: Array<{
    heading: string;
    purpose: string;
    talking_points: string[];
    evidence: string[];
    time_hint_sec: number;
  }>;
  closing: {
    call_to_action: string;
    takeaway: string;
  };
}

interface LocationState {
  outline: {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };
  originalParams: {
    topic: string;
    tone: string;
    style: string;
    audience: string;
    keyMessage: string;
    seconds: number;
  };
}

function SpeechResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const [speechText, setSpeechText] = useState('');
  const [speechOutline, setSpeechOutline] = useState<SpeechOutline | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Update page title
  useEffect(() => {
    document.title = 'Speech Mate • Speech Outline';
  }, []);

  useEffect(() => {
    if (!state?.outline) {
      navigate('/home', { state: { skipAnimation: true } });
      return;
    }

    // Extract text from Gemini API response
    try {
      const candidates = state.outline.candidates;
      if (candidates && candidates.length > 0) {
        const content = candidates[0].content;
        if (content && content.parts && content.parts.length > 0) {
          const generatedText = content.parts[0].text;
          if (generatedText) {
            // Try to parse as JSON
            try {
              const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as SpeechOutline;
                setSpeechOutline(parsed);
                setSpeechText(formatOutlineToText(parsed));
              } else {
                setSpeechText(generatedText);
              }
            } catch {
              setSpeechText(generatedText);
            }
          } else {
            setSpeechText('No content generated');
          }
        }
      }
    } catch (err) {
      console.error('Error parsing outline:', err);
      setSpeechText(JSON.stringify(state.outline, null, 2));
    }
  }, [state, navigate]);

  const formatOutlineToText = (outline: SpeechOutline): string => {
    let text = `${outline.title}\n\n`;
    text += `Duration: ${outline.goal_minutes} minute(s)\n\n`;
    text += `Thesis: ${outline.thesis}\n\n`;
    
    outline.sections.forEach((section, index) => {
      text += `${index + 1}. ${section.heading}\n`;
      text += `Purpose: ${section.purpose}\n\n`;
      text += `Talking Points:\n`;
      section.talking_points.forEach(point => {
        text += `  - ${point}\n`;
      });
      text += `\nEvidence:\n`;
      section.evidence.forEach(ev => {
        text += `  - ${ev}\n`;
      });
      text += `\nTime: ~${section.time_hint_sec} seconds\n\n`;
    });
    
    text += `\nClosing:\n`;
    text += `Call to Action: ${outline.closing.call_to_action}\n`;
    text += `Takeaway: ${outline.closing.takeaway}\n`;
    
    return text;
  };

  const handleSave = () => {
    // TODO: Implement save functionality (e.g., save to backend)
    console.log('Saving speech:', speechText);
    alert('Speech saved! (Feature coming soon)');
  };

  const handleDownload = async () => {
    // Generate and download the PDF
    const pdfFile = await convertToPdf();
    const url = URL.createObjectURL(pdfFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToPdf = async (): Promise<File> => {
    // Create a proper PDF using jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add text with automatic page breaks
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPosition + 10 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
    };

    // Add content to PDF
    if (speechOutline) {
      // Title
      addText(speechOutline.title, 18, true);
      yPosition += 10;

      // Duration
      addText(`Duration: ${speechOutline.goal_minutes} minute(s)`, 12, false);
      yPosition += 5;

      // Thesis
      addText('Thesis:', 14, true);
      yPosition += 2;
      addText(speechOutline.thesis, 12, false);
      yPosition += 10;

      // Sections
      speechOutline.sections.forEach((section, index) => {
        addText(`${index + 1}. ${section.heading}`, 14, true);
        yPosition += 2;
        
        addText(`Purpose: ${section.purpose}`, 11, false);
        yPosition += 5;
        
        addText('Talking Points:', 12, true);
        yPosition += 2;
        section.talking_points.forEach(point => {
          addText(`  • ${point}`, 11, false);
          yPosition += 2;
        });
        yPosition += 3;
        
        addText('Evidence:', 12, true);
        yPosition += 2;
        section.evidence.forEach(ev => {
          addText(`  • ${ev}`, 11, false);
          yPosition += 2;
        });
        yPosition += 3;
        
        addText(`Time: ~${section.time_hint_sec} seconds`, 10, false);
        yPosition += 10;
      });

      // Closing
      addText('Closing', 14, true);
      yPosition += 2;
      addText(`Call to Action: ${speechOutline.closing.call_to_action}`, 12, false);
      yPosition += 5;
      addText(`Takeaway: ${speechOutline.closing.takeaway}`, 12, false);
    } else {
      // Fallback to plain text
      addText(`Speech Topic: ${state.originalParams.topic}`, 16, true);
      yPosition += 10;
      addText(speechText, 12, false);
    }

    // Convert to blob and create File
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `speech-${state.originalParams.topic.replace(/\s+/g, '-')}.pdf`, {
      type: 'application/pdf'
    });
    
    return file;
  };

  const handleContinue = async () => {
    // Convert speech to PDF and navigate to upload page
    const pdfFile = await convertToPdf();
    navigate('/file-upload', {
      state: {
        generatedSpeechPdf: pdfFile
      }
    });
  };

  const handleBack = () => {
    navigate('/home', { state: { skipAnimation: true } });
  };

  return (
    <main className="speech-result-wrapper">
      <motion.div
        className="speech-result-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="result-header">
          <h1>Your Generated Speech</h1>
          <p>Topic: <strong>{state?.originalParams.topic}</strong></p>
        </div>

        <div className="editor-container">
          <div className="editor-toolbar">
            <button 
              className="toolbar-button"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <EyeIcon className="button-icon" />
                  <span>Preview</span>
                </>
              ) : (
                <>
                  <EditIcon className="button-icon" />
                  <span>Edit</span>
                </>
              )}
            </button>
            <button className="toolbar-button" onClick={handleDownload}>
              <DownloadIcon className="button-icon" />
              <span>Download</span>
            </button>
            <button className="toolbar-button primary" onClick={handleSave}>
              <SaveIcon className="button-icon" />
              <span>Save</span>
            </button>
          </div>

          {isEditing ? (
            <textarea
              className="speech-editor"
              value={speechText}
              onChange={(e) => setSpeechText(e.target.value)}
              placeholder="Your generated speech will appear here..."
            />
          ) : speechOutline ? (
            <div className="speech-preview structured">
              <h2>{speechOutline.title}</h2>
              <p className="duration">Duration: {speechOutline.goal_minutes} minute(s)</p>
              <div className="thesis">
                <strong>Thesis:</strong> {speechOutline.thesis}
              </div>
              
              {speechOutline.sections.map((section, index) => (
                <div key={index} className="section">
                  <h3>{index + 1}. {section.heading}</h3>
                  <p className="purpose"><em>{section.purpose}</em></p>
                  
                  <div className="talking-points">
                    <strong>Talking Points:</strong>
                    <ul>
                      {section.talking_points.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="evidence">
                    <strong>Evidence:</strong>
                    <ul>
                      {section.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <p className="time-hint">Time: ~{section.time_hint_sec} seconds</p>
                </div>
              ))}
              
              <div className="closing">
                <h3>Closing</h3>
                <p><strong>Call to Action:</strong> {speechOutline.closing.call_to_action}</p>
                <p><strong>Takeaway:</strong> {speechOutline.closing.takeaway}</p>
              </div>
            </div>
          ) : (
            <div className="speech-preview">
              <pre>{speechText}</pre>
            </div>
          )}
        </div>

        <div className="result-actions">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeftIcon className="button-icon" />
            <span>Back to Home</span>
          </button>
          <button className="continue-button" onClick={handleContinue}>
            <span>Continue to Upload</span>
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default SpeechResult;
