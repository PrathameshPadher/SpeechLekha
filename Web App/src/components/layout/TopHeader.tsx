import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, MoreHorizontal, Menu, Share2, Download, ExternalLink, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TopHeaderProps {
  breadcrumbs?: string[];
  title: string;
  onToggleMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  breadcrumbs = ['KNOWLEDGE VAULT', 'BIOLOGY'],
  title,
  onToggleMobileMenu
}) => {
  const navigate = useNavigate();
  const { isListening, setIsCommandPaletteOpen, addToast } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = () => {
    addToast('Vault Exported', 'Downloaded markdown bundle to local downloads.', 'success');
    setShowDropdown(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('Link Copied', 'Document reference copied to clipboard.', 'info');
    setShowDropdown(false);
  };

  return (
    <header className="app-topheader">
      <div className="header-left">
        {onToggleMobileMenu && (
          <button className="mobile-menu-btn" onClick={onToggleMobileMenu} title="Toggle menu">
            <Menu size={18} />
          </button>
        )}
        <div>
          <div className="crumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span>{crumb}</span>
                {idx < breadcrumbs.length - 1 && <ChevronRight size={12} />}
              </React.Fragment>
            ))}
          </div>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="headright">
        <span className={`status ${isListening ? 'live' : ''}`}>
          <i /> {isListening ? 'Listening' : 'Ready'}
        </span>

        <button
          className="icon-btn search-trigger"
          onClick={() => setIsCommandPaletteOpen(true)}
          title="Search knowledge (Cmd+K)"
        >
          <Search size={16} />
          <span className="kbd-shortcut">⌘K</span>
        </button>

        <div className="dropdown-wrapper">
          <button
            className="icon-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            title="More actions"
          >
            <MoreHorizontal size={17} />
          </button>

          {showDropdown && (
            <>
              <div className="dropdown-backdrop" onClick={() => setShowDropdown(false)} />
              <div className="header-dropdown-menu">
                <button onClick={() => { navigate('/graph'); setShowDropdown(false); }}>
                  <Share2 size={14} />
                  <span>View in Graph</span>
                </button>
                <button onClick={() => { navigate('/speak'); setShowDropdown(false); }}>
                  <Sparkles size={14} />
                  <span>Start Voice Capture</span>
                </button>
                <button onClick={handleCopyLink}>
                  <ExternalLink size={14} />
                  <span>Copy Vault Link</span>
                </button>
                <button onClick={handleExport}>
                  <Download size={14} />
                  <span>Export Document</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
