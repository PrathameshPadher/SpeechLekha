import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, FileText, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { AgentPanel } from '../components/agent/AgentPanel';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { useApp } from '../context/AppContext';

export const AppDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    isListening,
    recordingSeconds,
    liveTranscript,
    startSpeaking,
    stopSpeaking,
    setCurrentDocId,
    addToast
  } = useApp();

  const [selectedFile, setSelectedFile] = useState('01-photosynthesis.md');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleRecording = async () => {
    if (!isListening) {
      await startSpeaking();
    } else {
      const session = stopSpeaking();
      // Optional prompt or quick jump to session result
      addToast('Session Finished', 'View full analysis and concept graph in Session Result.', 'info');
    }
  };

  const handleWikiLinkClick = (term: string) => {
    addToast('Concept Linked', `Viewing connections for [[${term}]]`, 'info');
    navigate('/graph');
  };

  const timeFormatted = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`;

  return (
    <div className="workspace">
      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="main">
        <TopHeader
          breadcrumbs={['KNOWLEDGE VAULT', 'BIOLOGY']}
          title="Photosynthesis"
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="content">
          <section className="main-feed-column">
            {/* VOICE SESSION TOOLBAR */}
            <div className="toolbar">
              <div>
                <label>VOICE SESSION</label>
                <strong>{timeFormatted}</strong>
              </div>

              <div className="toolbar-actions">
                {isListening && (
                  <button
                    className="ghost-btn"
                    onClick={() => navigate('/speak')}
                    title="Switch to full-screen distraction-free speaking mode"
                  >
                    <Sparkles size={14} />
                    <span>Focus View</span>
                  </button>
                )}

                <button
                  className={`listen ${isListening ? 'active' : ''}`}
                  onClick={toggleRecording}
                >
                  {isListening ? <Square size={14} /> : <Mic size={16} />}
                  <span>{isListening ? 'Stop listening' : 'Start speaking'}</span>
                </button>
              </div>
            </div>

            {/* LIVE AUDIO WAVEFORM WHEN RECORDING */}
            {isListening && (
              <div className="live-waveform-card">
                <div className="waveform-header">
                  <span className="live-pill"><i /> LIVE INPUT STREAM</span>
                  <small>48kHz 24-bit Float PCM</small>
                </div>
                <WaveformVisualizer mode="bars" height={52} />
              </div>
            )}

            {/* LIVE TRANSCRIPT PANEL */}
            <div className="panel transcript">
              <div className="panelhead">
                <span>
                  <Mic size={14} /> LIVE TRANSCRIPT
                </span>
                <small>Whisper ASR · 99.4% confidence</small>
              </div>
              <div className="transcript-body">
                <p>
                  {liveTranscript}
                  {isListening && <span className="streaming-cursor" />}
                </p>
              </div>
            </div>

            {/* KNOWLEDGE OUTPUT PANEL */}
            <div className="panel editor">
              <div className="panelhead">
                <span>
                  <FileText size={14} /> KNOWLEDGE OUTPUT
                </span>
                <div className="panelhead-actions">
                  <span className="save-status">Saved</span>
                  <button
                    className="mini-link-btn"
                    onClick={() => {
                      setCurrentDocId('01-photosynthesis');
                      navigate('/document/01-photosynthesis');
                    }}
                    title="Open in Document Editor"
                  >
                    <span>Open Editor</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              <article>
                <h3># Photosynthesis</h3>
                <h4>Key Concepts</h4>
                <ul>
                  <li>Converts light energy into chemical energy</li>
                  <li>Uses chlorophyll to absorb light</li>
                  <li>Light-dependent reactions</li>
                  <li>Calvin cycle</li>
                </ul>

                <h4>C3 vs C4 Plants</h4>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>C3</th>
                        <th>C4</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>First product</td>
                        <td>3-carbon</td>
                        <td>4-carbon</td>
                      </tr>
                      <tr>
                        <td>Environment</td>
                        <td>Moderate</td>
                        <td>Hot / dry</td>
                      </tr>
                      <tr>
                        <td>Efficiency</td>
                        <td>Lower</td>
                        <td>Higher</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="wiki">
                  <span className="wiki-label">Connected links:</span>
                  <button
                    type="button"
                    className="wikilink-pill"
                    onClick={() => handleWikiLinkClick('Chlorophyll')}
                  >
                    [[Chlorophyll]]
                  </button>
                  <button
                    type="button"
                    className="wikilink-pill"
                    onClick={() => handleWikiLinkClick('Calvin Cycle')}
                  >
                    [[Calvin Cycle]]
                  </button>
                  <button
                    type="button"
                    className="wikilink-pill"
                    onClick={() => handleWikiLinkClick('C3 Plants')}
                  >
                    [[C3 Plants]]
                  </button>
                </div>
              </article>
            </div>
          </section>

          {/* RIGHT AGENT PANEL */}
          <AgentPanel
            selectedFile={selectedFile}
            onSelectFile={(filename) => setSelectedFile(filename)}
          />
        </div>
      </main>
    </div>
  );
};
