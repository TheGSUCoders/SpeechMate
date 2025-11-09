import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import './VideoRecording.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_RECORDING_TIME = 5 * 60; // 5 minutes in seconds

  // Update page title
  useEffect(() => {
    document.title = 'Speech Mate • Record Video';
  }, []);

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

  const handleSubmit = async () => {
    if (!recordedVideoBlob) {
      alert('No video recorded. Please record a video first.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create FormData to send video and files
      const formData = new FormData();
      
      // Add video file first
      const videoFile = new File([recordedVideoBlob], 'recorded-speech.webm', {
        type: 'video/webm'
      });
      formData.append('files', videoFile);
      
      // Add uploaded files
      uploadedFiles.forEach(fileInfo => {
        formData.append('files', fileInfo.file);
      });
      
      // Add optional metadata as separate parameters (not in files array)
      if (recordedTime) {
        formData.append('duration', Math.floor(recordedTime).toString());
      }
      
      console.log('Submitting speech analysis with:', {
        videoFile: videoFile.name,
        videoSize: videoFile.size,
        uploadedFilesCount: uploadedFiles.length,
        duration: recordedTime
      });
      
      // Call analyze-speech endpoint
      const response = await axios.post(
        `${API_BASE_URL}/api/gemini/analyze-speech`,
        formData,
        {
          withCredentials: true,
          timeout: 120000, // 2 minute timeout for analysis
        }
      );
      
      console.log('Analysis response:', response.data);
      
      // Store video in sessionStorage for future use
      sessionStorage.setItem('recordedVideoAvailable', 'true');
      sessionStorage.setItem('recordedVideoDuration', recordedTime.toString());
      sessionStorage.setItem('recordedVideoFilesCount', uploadedFiles.length.toString());
      
      // Navigate to analysis results page
      navigate('/speech-analysis', {
        state: {
          analysis: response.data,
          videoDuration: recordedTime,
          filesCount: uploadedFiles.length
        }
      });
    } catch (error) {
      console.error('Failed to analyze speech:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          alert('Request timed out. The video analysis is taking longer than expected. Please try again.');
        } else if (error.response) {
          alert(`Failed to analyze speech: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.request) {
          alert('No response from server. Please check if the backend is running.');
        } else {
          alert('Failed to analyze speech. Please try again.');
        }
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {isSubmitting && <LoadingSpinner message="Analyzing your speech performance..." />}
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
    </>
  );
}

export default VideoRecording;
