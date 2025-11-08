import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import GenerateSpeech from './pages/GenerateSpeech/GenerateSpeech';
import SpeechResult from './pages/SpeechResult/SpeechResult';
import FileUpload from './pages/FileUpload/FileUpload';
import VideoRecording from './pages/VideoRecording/VideoRecording';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/generate-speech" element={<GenerateSpeech />} />
        <Route path="/speech-result" element={<SpeechResult />} />
        <Route path="/file-upload" element={<FileUpload />} />
        <Route path="/record-video" element={<VideoRecording />} />
      </Routes>
    </Router>
  );
}

export default App;
