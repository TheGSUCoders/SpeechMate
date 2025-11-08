import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import CloudUploadIcon from '../../components/icons/CloudUploadIcon';
import './FileUpload.css';

interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  file: File;
}

function FileUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const generatedSpeechPdf = (location.state as { generatedSpeechPdf?: File })?.generatedSpeechPdf;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>(
    generatedSpeechPdf ? [{
      name: generatedSpeechPdf.name,
      size: generatedSpeechPdf.size,
      type: generatedSpeechPdf.type,
      file: generatedSpeechPdf
    }] : []
  );
  const [error, setError] = useState<string | null>(null);

  const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.png', '.jpg', '.jpeg'];

  const validateFile = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Please upload: ${allowedExtensions.join(', ')}`);
      return false;
    }

    if (file.size > 200 * 1024 * 1024) { // 200MB limit
      setError('File size must be less than 200MB');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: UploadedFileInfo[] = [];

    fileArray.forEach(file => {
      if (validateFile(file)) {
        // Check if file already exists
        const exists = uploadedFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
          validFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
          });
        }
      }
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    // Allow continuing even without files
    // Navigate to video recording page
    navigate('/record-video', {
      state: {
        uploadedFiles: uploadedFiles
      }
    });
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    navigate('/home', { state: { skipAnimation: true } });
  };

  return (
    <main className="file-upload-wrapper">
      <motion.div
        className="file-upload-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="upload-header">
          <h1>Upload Speech Material</h1>
          <p>Upload your presentation, document, or image files</p>
          {generatedSpeechPdf && (
            <p className="auto-uploaded">Your generated speech has been automatically added</p>
          )}
        </div>

        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <CloudUploadIcon className="upload-icon" />
          <h3>Drag and drop your file here</h3>
          <p className="or-text">or</p>
          <button type="button" className="browse-button">
            Browse Files
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileInputChange}
            multiple
            style={{ display: 'none' }}
          />

          <div className="file-info">
            <p>Supported formats: PDF, PowerPoint, Word, PNG, JPG</p>
            <p>Maximum file size: 200MB per file</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="uploaded-files-list">
            <h3>Uploaded Files ({uploadedFiles.length})</h3>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="uploaded-file-item">
                <div className="file-details">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button 
                  className="remove-file-button"
                  onClick={() => handleRemoveFile(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="upload-actions">
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className="continue-button" 
            onClick={handleContinue}
          >
            Continue to Record Video
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default FileUpload;
