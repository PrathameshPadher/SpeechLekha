import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Folder,
  FileText,
  Mic,
  Share2,
  ArrowRight,
  Edit3,
  Bookmark,
  Sparkles,
  ArrowUpRight,
  Layers,
  Network,
  Image,
  HelpCircle,
  FileCode,
  BookOpen
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';
import { DEMO_SESSION } from '../utils/mockData';

export const SessionResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessions, currentSession, setCurrentDocId, addToast } = useApp();

  const session = sessions.find((s) => s.id === id) || currentSession || DEMO_SESSION;
  const targetDocId = '01-photosynthesis';

  const handleSaveToVault = () => {
    addToast('Saved to Vault', 'All generated sections and wikilinks synced to Biology.', 'success');
    navigate('/vault');
  };

  return (
    <div className="workspace">
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      <main className="main session-result-main">
        <TopHeader
          breadcrumbs={['SESSIONS', session.folder.toUpperCase(), session.id.toUpperCase()]}
          title="Session Result"
        />

        <div className="session-result-page-content">
          {/* PRIMARY SESSION SUMMARY PANEL */}
          <div className="session-summary-primary-card">
            <div className="session-processed-badge">
              <CheckCircle2 size={14} />
              <span>VOICE SESSION PROCESSED</span>
            </div>

            <h1 className="session-complete-heading">Session complete.</h1>

            {/* METADATA GRID */}
            <div className="session-metadata-grid-clean">
              <div className="meta-cell">
                <span className="meta-cell-label">Duration</span>
                <strong className="meta-cell-value">{session.duration} ({session.durationSeconds}s)</strong>
              </div>

              <div className="meta-cell">
                <span className="meta-cell-label">Date</span>
                <strong className="meta-cell-value">{session.date}</strong>
              </div>

              <div className="meta-cell">
                <span className="meta-cell-label">Topic</span>
                <strong className="meta-cell-value">{session.folder}</strong>
              </div>

              <div className="meta-cell">
                <span className="meta-cell-label">Word Count</span>
                <strong className="meta-cell-value">68 words</strong>
              </div>

              <div className="meta-cell highlight-cell">
                <span className="meta-cell-label">Whisper ASR</span>
                <strong className="meta-cell-value">{session.confidence}% confidence</strong>
              </div>
            </div>

            {/* ACTION BUTTONS WRAPPER */}
            <div className="session-action-buttons-flex">
              <button
                className="session-primary-btn"
                onClick={() => {
                  setCurrentDocId(targetDocId);
                  navigate(`/document/${targetDocId}`);
                }}
              >
                <BookOpen size={15} />
                <span>View Knowledge</span>
              </button>

              <button
                className="session-secondary-btn"
                onClick={() => {
                  setCurrentDocId(targetDocId);
                  navigate(`/document/${targetDocId}/edit`);
                }}
              >
                <Edit3 size={15} />
                <span>Edit Knowledge</span>
              </button>

              <button
                className="session-secondary-btn"
                onClick={handleSaveToVault}
              >
                <Bookmark size={15} />
                <span>Save to Vault</span>
              </button>

              <button
                className="session-secondary-btn"
                onClick={() => navigate(`/summary/${targetDocId}`)}
              >
                <Sparkles size={14} />
                <span>Summarize</span>
              </button>

              <button
                className="session-secondary-btn"
                onClick={() => navigate(`/connections/${targetDocId}`)}
              >
                <Network size={14} />
                <span>Find Connections</span>
              </button>

              <button
                className="session-secondary-btn"
                onClick={() => navigate('/diagram')}
              >
                <Image size={14} />
                <span>Create Diagram</span>
              </button>

              <button
                className="session-secondary-btn"
                onClick={() => navigate('/quiz')}
              >
                <HelpCircle size={14} />
                <span>Generate Quiz</span>
              </button>

              <button
                className="session-secondary-btn continue-speaking-btn"
                onClick={() => navigate('/speak')}
              >
                <Mic size={14} />
                <span>Continue Speaking</span>
              </button>
            </div>
          </div>

          {/* 2-COLUMN MAIN CONTENT LAYOUT */}
          <div className="session-columns-grid">
            {/* LEFT COLUMN: TRANSCRIPT & GENERATED KNOWLEDGE */}
            <div className="session-left-column">
              {/* TRANSCRIPT PANEL */}
              <div className="panel session-result-panel">
                <div className="panelhead">
                  <span>
                    <Mic size={14} /> AUDIO TRANSCRIPT
                  </span>
                  <small>Full verified speech transcript</small>
                </div>
                <div className="session-transcript-body">
                  <p className="session-transcript-quote">
                    “{session.transcript}”
                  </p>
                </div>
              </div>

              {/* GENERATED KNOWLEDGE MARKDOWN PANEL */}
              <div className="panel session-result-panel">
                <div className="panelhead">
                  <span>
                    <FileText size={14} /> GENERATED KNOWLEDGE MARKDOWN
                  </span>
                  <small>Auto-structured markdown</small>
                </div>
                <div className="session-knowledge-rendered-body">
                  <h3># Photosynthesis</h3>
                  <h4>Key Concepts</h4>
                  <ul>
                    <li>Converts light energy into chemical energy</li>
                    <li>Uses chlorophyll to absorb light</li>
                    <li>Light-dependent reactions + Calvin cycle</li>
                  </ul>

                  <h4>C3 vs C4 Plants</h4>
                  <div className="table-wrapper">
                    <table className="knowledge-comparison-table">
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

                  <div className="session-wikilinks-tray">
                    <span className="tray-label">Connected Concepts:</span>
                    <button
                      className="wikilink-pill"
                      onClick={() => navigate('/connections/Chlorophyll')}
                    >
                      [[Chlorophyll]]
                    </button>
                    <button
                      className="wikilink-pill"
                      onClick={() => navigate('/connections/Calvin%20Cycle')}
                    >
                      [[Calvin Cycle]]
                    </button>
                    <button
                      className="wikilink-pill"
                      onClick={() => navigate('/connections/C3%20Plants')}
                    >
                      [[C3 Plants]]
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: KEY CONCEPTS & CONNECTIONS */}
            <div className="session-right-column">
              {/* EXTRACTED KEY CONCEPTS */}
              <div className="panel session-result-panel">
                <div className="panelhead">
                  <span>
                    <Layers size={14} /> EXTRACTED KEY CONCEPTS
                  </span>
                  <small>3 items discovered</small>
                </div>
                <div className="session-concepts-stack">
                  {session.keyConcepts.map((concept, idx) => (
                    <div key={idx} className="session-concept-card">
                      <div className="session-concept-top">
                        <span className="concept-cat-badge">{concept.category}</span>
                        <span className="concept-conf-badge">{concept.confidence}%</span>
                      </div>
                      <h4>{concept.title}</h4>
                      <p>{concept.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONCEPT CONNECTIONS */}
              <div className="panel session-result-panel">
                <div className="panelhead">
                  <span>
                    <Share2 size={14} /> CONCEPT CONNECTIONS
                  </span>
                  <button className="link-arrow-btn" onClick={() => navigate('/graph')}>
                    <span>Open Graph</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="session-connections-stack">
                  {session.connections.map((conn, idx) => (
                    <div
                      key={idx}
                      className="connection-item-pill-row"
                      onClick={() => navigate(`/connections/${encodeURIComponent(conn.source)}`)}
                    >
                      <div className="node-badge source-node">{conn.source}</div>
                      <div className="conn-arrow-center">
                        <span className="conn-verb-text">{conn.relation}</span>
                        <div className="conn-line-indicator">
                          <span className="dot" />
                          <ArrowRight size={12} />
                        </div>
                      </div>
                      <div className="node-badge target-node">{conn.target}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
