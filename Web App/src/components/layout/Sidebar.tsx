import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  FolderOpen,
  Settings,
  Share2,
  Search,
  Plus,
  ArrowLeft,
  User,
  Radio,
  Clock,
  HelpCircle,
  Image
} from 'lucide-react';
import { Brand } from '../Brand';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  collapsed?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentDocId } = useApp();

  const handleNewSession = () => {
    navigate('/speak');
    if (onCloseMobile) onCloseMobile();
  };

  const handleOpenDoc = (docId: string) => {
    setCurrentDocId(docId);
    navigate(`/document/${docId}`);
    if (onCloseMobile) onCloseMobile();
  };

  const isCurrentSessionActive = location.pathname === '/app';
  const isVaultActive = location.pathname === '/vault' || location.pathname.startsWith('/document');
  const isSessionsActive = location.pathname === '/sessions';
  const isGraphActive = location.pathname === '/graph';
  const isSearchActive = location.pathname === '/search';
  const isSpeakActive = location.pathname === '/speak';
  const isSettingsActive = location.pathname === '/settings';
  const isProfileActive = location.pathname === '/profile';

  return (
    <aside className="sidebar">
      <div className="sidehead">
        <Link to="/" className="back" title="Back to Landing Page">
          <ArrowLeft size={16} />
        </Link>
        <Brand dark onClick={() => navigate('/')} />
      </div>

      <button className="new" onClick={handleNewSession}>
        <Plus size={16} />
        <span>New Session</span>
      </button>

      <label>WORKSPACE</label>
      <Link
        to="/app"
        className={`side ${isCurrentSessionActive ? 'active' : ''}`}
        onClick={onCloseMobile}
      >
        <FileText size={15} />
        <span>Current Session</span>
      </Link>

      <Link
        to="/vault"
        className={`side ${isVaultActive ? 'active' : ''}`}
        onClick={onCloseMobile}
      >
        <FolderOpen size={15} />
        <span>Knowledge Vault</span>
      </Link>

      <Link
        to="/sessions"
        className={`side ${isSessionsActive ? 'active' : ''}`}
        onClick={onCloseMobile}
      >
        <Clock size={15} />
        <span>Recent Sessions</span>
      </Link>

      <Link
        to="/graph"
        className={`side ${isGraphActive ? 'active' : ''}`}
        onClick={onCloseMobile}
      >
        <Share2 size={15} />
        <span>Knowledge Graph</span>
      </Link>

      <Link
        to="/search"
        className={`side ${isSearchActive ? 'active' : ''}`}
        onClick={onCloseMobile}
      >
        <Search size={15} />
        <span>Search</span>
      </Link>

      <label style={{ marginTop: '16px' }}>TOOLS</label>
      <Link
        to="/diagram"
        className={`side ${location.pathname === '/diagram' ? 'active' : ''}`}
        onClick={onCloseMobile}
      >
        <Image size={15} />
        <span>Diagram Generator</span>
      </Link>

      <Link
        to="/quiz"
        className={`side ${location.pathname === '/quiz' ? 'active' : ''}`}
        onClick={onCloseMobile}
      >
        <HelpCircle size={15} />
        <span>Knowledge Quiz</span>
      </Link>

      <label style={{ marginTop: '16px' }}>RECENT SESSIONS</label>
      <Link
        to="/session/demo"
        className={`side recent-link ${location.pathname === '/session/demo' ? 'active' : ''}`}
        onClick={onCloseMobile}
      >
        <span className="dot" />
        <span className="truncate">Photosynthesis lecture</span>
      </Link>

      <button
        type="button"
        className={`side recent-link ${location.pathname === '/document/neural-asr-architecture' ? 'active' : ''}`}
        onClick={() => handleOpenDoc('neural-asr-architecture')}
      >
        <span className="dot" />
        <span className="truncate">Research notes</span>
      </button>

      <Link
        to="/session/demo"
        className="side recent-link"
        onClick={onCloseMobile}
      >
        <span className="dot" />
        <span className="truncate">Team meeting</span>
      </Link>

      <div className="bottom">
        <Link
          to="/profile"
          className={`side ${isProfileActive ? 'active' : ''}`}
          onClick={onCloseMobile}
        >
          <User size={15} />
          <span>Profile</span>
        </Link>
        <Link
          to="/settings"
          className={`side ${isSettingsActive ? 'active' : ''}`}
          onClick={onCloseMobile}
        >
          <Settings size={15} />
          <span>Settings</span>
        </Link>
        <small>Self-hosted · Your data stays yours</small>
      </div>
    </aside>
  );
};
