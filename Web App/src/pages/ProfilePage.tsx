import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Activity,
  HardDrive,
  Share2,
  FileText,
  Mic,
  Calendar,
  Sparkles,
  Server,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  X,
  Save
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { documents, sessions, setCurrentDocId, addToast } = useApp();

  // Persisted user profile state from localStorage
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('speechlekha_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Dr. Evelyn Reed',
      title: 'Principal Bioenergetics Researcher',
      email: 'evelyn.reed@local.node',
      avatarInitials: 'ER',
      bio: 'Investigating photosynthetic quantum efficiency and C4 carbon-fixation evolutionary genetics.',
      nodeUrl: 'http://localhost:7447'
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(tempProfile);
    localStorage.setItem('speechlekha_profile', JSON.stringify(tempProfile));
    setIsEditing(false);
    addToast('Profile Updated', 'User profile information saved locally.', 'success');
  };

  const activityFeed = [
    {
      id: 1,
      type: 'voice',
      title: 'Photosynthesis lecture recorded & transcribed',
      time: '10 minutes ago',
      docId: '01-photosynthesis',
      details: '42s audio · 3 knowledge blocks created'
    },
    {
      id: 2,
      type: 'link',
      title: 'Discovered bidirectional link: [[Chlorophyll]] ➔ [[ATP Synthase]]',
      time: '1 hour ago',
      docId: '01-photosynthesis',
      details: 'Ontology confidence 99.4%'
    },
    {
      id: 3,
      type: 'vault',
      title: 'Local vault auto-synced with Biology/02-c3-vs-c4.md',
      time: 'Yesterday at 4:32 PM',
      docId: '02-c3-vs-c4',
      details: '1.2 KB markdown written'
    },
    {
      id: 4,
      type: 'session',
      title: 'Team meeting voice synthesis completed',
      time: '2 days ago',
      docId: '00-index',
      details: 'Action items extracted to personal vault'
    }
  ];

  return (
    <div className="workspace">
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="main profile-page-main">
        <TopHeader
          breadcrumbs={['SPEECHLEKHA', 'ACCOUNT & NODE']}
          title="Your SpeechLekha"
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="profile-container">
          {/* PROFILE CARD */}
          <div className="profile-header-card">
            <div className="profile-identity">
              <div className="profile-avatar">
                <span>{profile.avatarInitials}</span>
              </div>

              <div className="profile-info">
                <h2>{profile.name}</h2>
                <p className="email-text">{profile.title} · {profile.email}</p>
                <div className="profile-badges">
                  <span className="node-badge">
                    <Server size={12} /> Node: {profile.nodeUrl}
                  </span>
                  <span className="privacy-badge">
                    <ShieldCheck size={12} /> 100% On-Device Sovereignty
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-actions-row">
              <button
                className="secondary-action-btn"
                onClick={() => {
                  setTempProfile(profile);
                  setIsEditing(true);
                }}
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>

              <button className="primary-action-btn" onClick={() => navigate('/speak')}>
                <Mic size={15} />
                <span>Start Speaking</span>
              </button>
            </div>
          </div>

          {/* EDIT PROFILE MODAL */}
          {isEditing && (
            <div className="cmd-palette-backdrop" onClick={() => setIsEditing(false)}>
              <div className="cmd-palette-modal edit-profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cmd-search-box">
                  <User size={18} className="search-icon" />
                  <strong style={{ color: '#fff', fontSize: '15px' }}>Edit Researcher Profile</strong>
                  <button className="cmd-close" onClick={() => setIsEditing(false)}>
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="edit-profile-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Professional Title</label>
                    <input
                      type="text"
                      value={tempProfile.title}
                      onChange={(e) => setTempProfile({ ...tempProfile, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={tempProfile.email}
                      onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Avatar Initials (1-2 chars)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={tempProfile.avatarInitials}
                      onChange={(e) => setTempProfile({ ...tempProfile, avatarInitials: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="modal-actions-row">
                    <button type="button" className="ghost-btn" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-action-btn">
                      <Save size={14} />
                      <span>Save Profile</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* USAGE METRICS GRID */}
          <div className="usage-stats-grid">
            <div className="stat-card" onClick={() => navigate('/sessions')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon-wrap">
                <Mic size={18} />
              </div>
              <div className="stat-value">48</div>
              <div className="stat-label">Voice Sessions</div>
              <small>Click to view history →</small>
            </div>

            <div className="stat-card" onClick={() => navigate('/vault')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon-wrap">
                <Sparkles size={18} />
              </div>
              <div className="stat-value">312</div>
              <div className="stat-label">Knowledge Blocks</div>
              <small>Structured tables & concepts</small>
            </div>

            <div className="stat-card" onClick={() => navigate('/vault')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon-wrap">
                <FileText size={18} />
              </div>
              <div className="stat-value">{documents.length}</div>
              <div className="stat-label">Vault Documents</div>
              <small>Markdown notes & glossaries</small>
            </div>

            <div className="stat-card" onClick={() => navigate('/graph')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon-wrap">
                <Share2 size={18} />
              </div>
              <div className="stat-value">186</div>
              <div className="stat-label">Connected Links</div>
              <small>Bidirectional [[wikilinks]]</small>
            </div>
          </div>

          {/* RECENT ACTIVITY TIMELINE */}
          <div className="panel profile-activity-panel">
            <div className="panelhead">
              <span>
                <Activity size={14} /> RECENT KNOWLEDGE ACTIVITY
              </span>
              <small>Live event stream</small>
            </div>

            <div className="activity-timeline-list">
              {activityFeed.map((item) => (
                <div
                  key={item.id}
                  className="activity-item-row"
                  onClick={() => {
                    setCurrentDocId(item.docId);
                    navigate(`/document/${item.docId}`);
                  }}
                >
                  <div className="activity-dot-line">
                    <div className="activity-dot">
                      <CheckCircle2 size={12} />
                    </div>
                    <div className="line" />
                  </div>

                  <div className="activity-content">
                    <div className="activity-top">
                      <strong>{item.title}</strong>
                      <span className="activity-time">{item.time}</span>
                    </div>
                    <p className="activity-details">{item.details}</p>
                  </div>

                  <div className="activity-action-arrow">
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
