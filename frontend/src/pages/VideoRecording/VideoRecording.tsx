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
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const MAX_RECORDING_TIME = 5 * 60; // 5 minutes in seconds

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Clean up video URL
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [stream, recordedVideoUrl]);

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
        
        // Create object URL for video preview
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);
        setShowPreview(true);
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
    // Clean up previous video URL
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    
    setRecordedVideoBlob(null);
    setRecordedVideoUrl(null);
    setShowPreview(false);
    setRecordedTime(0);
    requestPermissions();
  };

  const handleSubmit = () => {
    // Store video blob in sessionStorage for use in Generate Speech
    if (recordedVideoUrl && recordedVideoBlob) {
      // Store video metadata
      sessionStorage.setItem('recordedVideoAvailable', 'true');
      sessionStorage.setItem('recordedVideoDuration', recordedTime.toString());
      sessionStorage.setItem('recordedVideoFilesCount', uploadedFiles.length.toString());
      
      // Store blob for later use
      const reader = new FileReader();
      reader.onloadend = () => {
        sessionStorage.setItem('recordedVideoBlob', reader.result as string);
      };
      reader.readAsDataURL(recordedVideoBlob);
    }
    
    // Navigate to home with success message
    navigate('/home', {
      state: {
        message: 'Speech recording completed successfully!',
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
          ) : recordedVideoUrl ? (
            <video
              key={recordedVideoUrl}
              src={recordedVideoUrl}
              controls
              playsInline
              className="video-preview"
            />
          ) : null}
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
