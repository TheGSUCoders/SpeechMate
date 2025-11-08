import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import GenerateSpeech from './pages/GenerateSpeech/GenerateSpeech';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/generate-speech" element={<GenerateSpeech />} />
      </Routes>
    </Router>
  );
}

export default App;
