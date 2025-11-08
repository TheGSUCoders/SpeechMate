import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './VideoRecording.css';

interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  file: File;
}

function VideoRecording() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadedFiles = (location.state as { uploadedFiles?: UploadedFileInfo[] })?.uploadedFiles || [];

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const MAX_RECORDING_TIME = 5 * 60; // 5 minutes in seconds

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    let interval: number | null = null;
    if (isRecording && !isPaused) {
      interval = window.setInterval(() => {
        setRecordedTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
              setIsRecording(false);
              setIsPaused(false);
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
            }
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, stream, MAX_RECORDING_TIME]);

  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      setStream(mediaStream);
      setHasPermission(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera and microphone permissions are required to record your speech. Please allow access and try again.');
      setHasPermission(false);
      console.error('Permission error:', err);
    }
  };

  const handleStartRecording = () => {
    if (!stream) return;

    try {
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedVideoBlob(blob);
        setShowPreview(true);
        
        // Store in localStorage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          localStorage.setItem('recordedSpeechVideo', base64data);
          localStorage.setItem('recordedSpeechVideoMetadata', JSON.stringify({
            timestamp: new Date().toISOString(),
            duration: recordedTime,
            filesCount: uploadedFiles.length
          }));
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordedTime(0);
    } catch (err) {
      setError('Failed to start recording. Please try again.');
      console.error('Recording error:', err);
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleRetake = () => {
    setRecordedVideoBlob(null);
    setShowPreview(false);
    setRecordedTime(0);
    localStorage.removeItem('recordedSpeechVideo');
    localStorage.removeItem('recordedSpeechVideoMetadata');
    requestPermissions();
  };

  const handleSubmit = () => {
    // For now, just navigate to home with success message
    // In future, this will send video + files to backend
    navigate('/home', {
      state: {
        message: 'Speech recording saved successfully! Backend integration pending.',
        skipAnimation: true
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-recording-wrapper">
      <motion.div
        className="video-recording-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="recording-header">
          <h1>Record Your Speech</h1>
          <p>Maximum recording time: 5 minutes</p>
          {uploadedFiles.length > 0 && (
            <p className="files-info">{uploadedFiles.length} file(s) uploaded</p>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="video-container">
          {!showPreview ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="video-preview"
            />
          ) : (
            <video
              src={recordedVideoBlob ? URL.createObjectURL(recordedVideoBlob) : ''}
              controls
              className="video-preview"
            />
          )}
        </div>

        {!hasPermission && !showPreview && (
          <button className="permission-button" onClick={requestPermissions}>
            Allow Camera & Microphone
          </button>
        )}

        {hasPermission && !showPreview && (
          <div className="recording-controls">
            {!isRecording ? (
              <button className="record-button start" onClick={handleStartRecording}>
                <span className="record-icon"></span>
                Start Recording
              </button>
            ) : (
              <div className="recording-active-controls">
                <div className="timer">
                  <span className="recording-indicator"></span>
                  {formatTime(recordedTime)} / {formatTime(MAX_RECORDING_TIME)}
                </div>
                <button className="control-button pause" onClick={handlePauseRecording}>
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button className="control-button stop" onClick={handleStopRecording}>
                  Stop Recording
                </button>
              </div>
            )}
          </div>
        )}

        {showPreview && (
          <div className="preview-controls">
            <div className="recording-info">
              <p>Recording Duration: {formatTime(recordedTime)}</p>
              <p className="saved-info">✓ Video saved to local storage</p>
            </div>
            <div className="action-buttons">
              <button className="retake-button" onClick={handleRetake}>
                Retake Video
              </button>
              <button className="submit-button" onClick={handleSubmit}>
                Submit Recording
              </button>
            </div>
          </div>
        )}

        <div className="cancel-section">
          <button className="cancel-link" onClick={() => navigate('/home', { state: { skipAnimation: true }})}>
            Cancel and Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default VideoRecording;
