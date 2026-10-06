import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Pause,
  Play,
  Square,
  X,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { Brand } from '../components/Brand';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { useApp } from '../context/AppContext';

export const LiveSpeakingMode: React.FC = () => {
  const navigate = useNavigate();
  const {
    isListening,
    isPaused,
    recordingSeconds,
    speechPhase,
    liveTranscript,
    startSpeaking,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    cancelSpeaking
  } = useApp();

  // Automatically start recording when entering live speaking mode (suppressing duplicate toast)
  useEffect(() => {
    if (!isListening) {
      startSpeaking(true);
    }
  }, []);

  const handleStop = () => {
    stopSpeaking();
    navigate('/session/demo');
  };

  const handleCancel = () => {
    cancelSpeaking();
    navigate('/app');
  };

  const timeFormatted = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`;

  return (
    <main className="speaking-screen-viewport">
      {/* MINIMAL TOP NAV */}
      <header className="speaking-top-header">
        <button className="speaking-exit-btn" onClick={handleCancel} title="Exit to Workspace">
          <ArrowLeft size={16} />
          <span>Workspace</span>
        </button>

        <Brand dark onClick={() => navigate('/')} />

        <div className="speaking-timer-badge">
          <span>{timeFormatted}</span>
        </div>
      </header>

      {/* CENTERED IMMERSIVE RECORDING CONTAINER */}
      <div className="speaking-stage-container">
        {/* TOP STATUS */}
        <div className="speaking-status-pill">
          <span className="speaking-pulse-dot" />
          <span className="speaking-phase-label">
            {isPaused ? 'PAUSED' : speechPhase}
          </span>
        </div>

        {/* EDITORIAL HEADING */}
        <h1 className="speaking-editorial-title">
          {speechPhase === 'LISTENING' && "Speak naturally. I'll organize it for you."}
          {speechPhase === 'UNDERSTANDING' && "Extracting concepts & biological entities..."}
          {speechPhase === 'STRUCTURING' && "Structuring Markdown tables and [[wikilinks]]..."}
          {speechPhase === 'SAVING' && "Syncing with your personal knowledge vault..."}
        </h1>

        {/* CENTRAL ANIMATED WAVEFORM */}
        <div className="speaking-waveform-box">
          <WaveformVisualizer mode="bars" height={130} />
        </div>

        {/* ONE LIVE TRANSCRIPT PANEL */}
        <div className="speaking-transcript-card">
          <div className="speaking-transcript-text">
            “{liveTranscript}
            <span className="speaking-caret" />”
          </div>
        </div>

        {/* CENTERED HORIZONTAL CONTROLS */}
        <div className="speaking-controls-row">
          {isPaused ? (
            <button
              className="speaking-secondary-btn"
              onClick={resumeSpeaking}
              title="Resume Recording"
            >
              <Play size={16} />
              <span>Resume</span>
            </button>
          ) : (
            <button
              className="speaking-secondary-btn"
              onClick={pauseSpeaking}
              title="Pause Recording"
            >
              <Pause size={16} />
              <span>Pause</span>
            </button>
          )}

          {/* STOP (PRIMARY ACTION) */}
          <button
            className="speaking-stop-primary-btn"
            onClick={handleStop}
            title="Stop & Save Session"
          >
            <Square size={16} />
            <span>Stop Recording</span>
          </button>

          <button
            className="speaking-secondary-btn"
            onClick={handleCancel}
            title="Cancel Session"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
        </div>

        {/* SINGLE INTEGRATED MICROPHONE STATUS */}
        <div className="speaking-mic-status-footer">
          <span className="mic-live-dot" />
          <div className="mic-status-copy">
            <strong>Microphone Active</strong>
            <span>SpeechLekha is transcribing and organizing your thoughts.</span>
          </div>
        </div>
      </div>
    </main>
  );
};
