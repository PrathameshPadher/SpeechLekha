import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  Folder,
  Search,
  Plus,
  ArrowRight,
  Filter,
  ArrowUpDown,
  Mic,
  Sparkles,
  FileText,
  Share2
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';

export const RecentSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, setCurrentDocId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'duration'>('date');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extended mock sessions for rich history
  const allSessions = [
    ...sessions,
    {
      id: 'session-research-notes',
      title: 'Neural ASR & Knowledge Extraction Notes',
      folder: 'Research',
      date: 'Yesterday · 4:15 PM',
      duration: '03:12',
      durationSeconds: 192,
      confidence: 99.1,
      transcript: 'Exploring end-to-end local streaming voice processing. Audio capture via Web Audio API, feeding Whisper transformer decoders to generate structured entities.',
      keyConcepts: [
        { title: 'Local Streaming ASR', description: 'Quantized Whisper model execution in RAM.', category: 'Architecture', confidence: 99.4 },
        { title: 'Dynamic Entity Graph', description: 'Real-time JSON token classification.', category: 'Ontology', confidence: 98.7 }
      ],
      connections: [{ source: 'Neural ASR', target: 'Whisper ASR', relation: 'implements' }],
      generatedMarkdown: '# Neural ASR & Real-Time Knowledge Extraction\n\n## Summary\nArchitecture notes on streaming voice extraction.'
    },
    {
      id: 'session-team-sync',
      title: 'Weekly Bioenergetics Research Sync',
      folder: 'Work',
      date: 'Sep 30 · 11:00 AM',
      duration: '18:45',
      durationSeconds: 1125,
      confidence: 98.8,
      transcript: 'Reviewed Rubisco catalytic turnover rates in C3 versus C4 plants. Agreed to finalize the comparison matrix and link metabolic pathways to the main index.',
      keyConcepts: [
        { title: 'Rubisco Kinetics', description: 'CO2 versus O2 substrate competition.', category: 'Enzymology', confidence: 98.9 },
        { title: 'Vault Milestone', description: 'Finalized 02-c3-vs-c4.md and key-terms.md notes.', category: 'Milestone', confidence: 99.0 }
      ],
      connections: [{ source: 'Rubisco', target: 'Photorespiration', relation: 'rate limiting' }],
      generatedMarkdown: '# Weekly Sync Notes\n\n## Action Items\n- Update 02-c3-vs-c4.md\n- Sync wikilinks'
    }
  ];

  const filteredSessions = allSessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.folder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.transcript.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'All' || s.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="workspace">
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="main">
        <TopHeader
          breadcrumbs={['WORKSPACE', 'RECENT SESSIONS']}
          title="Recent Sessions"
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="sessions-page-container">
          {/* HEADER HERO */}
          <div className="sessions-page-header">
            <div>
              <span className="eyebrow-tag">AUDIO RECORDING ARCHIVE</span>
              <h1 className="vault-main-heading">Voice Sessions</h1>
              <p className="vault-subtitle">
                Review, analyze, and expand past spoken notes and generated knowledge.
              </p>
            </div>

            <button className="primary-action-btn" onClick={() => navigate('/speak')}>
              <Mic size={16} />
              <span>Record New Session</span>
            </button>
          </div>

          {/* CONTROLS BAR */}
          <div className="vault-controls-bar">
            <div className="vault-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search sessions by topic, transcript, or folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-btn" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>

            <div className="vault-actions-group">
              <div className="sort-dropdown">
                <Filter size={14} />
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                >
                  <option value="All">All Folders</option>
                  <option value="Biology">Biology</option>
                  <option value="Research">Research</option>
                  <option value="Work">Work</option>
                </select>
              </div>

              <div className="sort-dropdown">
                <ArrowUpDown size={14} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'duration')}
                >
                  <option value="date">Sort by: Date</option>
                  <option value="duration">Sort by: Duration</option>
                </select>
              </div>
            </div>
          </div>

          {/* SESSIONS LIST */}
          <div className="sessions-feed-list">
            {filteredSessions.length === 0 ? (
              <div className="vault-empty-state">
                <Mic size={36} />
                <h3>No recorded sessions found</h3>
                <p>Try searching for a different keyword or start speaking now.</p>
                <button className="new-btn" onClick={() => navigate('/speak')}>
                  <Mic size={15} /> Start Speaking
                </button>
              </div>
            ) : (
              filteredSessions.map((sessionItem) => (
                <div
                  key={sessionItem.id}
                  className="session-feed-card"
                  onClick={() => navigate(`/session/${sessionItem.id === 'demo' ? 'demo' : sessionItem.id}`)}
                >
                  <div className="session-card-left">
                    <div className="session-icon-badge">
                      <Mic size={16} />
                    </div>

                    <div className="session-info-main">
                      <div className="session-title-row">
                        <h3>{sessionItem.title}</h3>
                        <span className="folder-badge">{sessionItem.folder}</span>
                      </div>
                      <p className="session-transcript-preview">
                        “{sessionItem.transcript.slice(0, 140)}...”
                      </p>
                    </div>
                  </div>

                  <div className="session-card-right">
                    <div className="session-stats-group">
                      <div className="stat-item">
                        <Clock size={12} />
                        <span>{sessionItem.duration}</span>
                      </div>
                      <div className="stat-item">
                        <Calendar size={12} />
                        <span>{sessionItem.date}</span>
                      </div>
                      <div className="stat-item conf-item">
                        <Sparkles size={12} />
                        <span>{sessionItem.confidence}% conf</span>
                      </div>
                    </div>

                    <div className="session-arrow-wrap">
                      <span>View Analysis</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
