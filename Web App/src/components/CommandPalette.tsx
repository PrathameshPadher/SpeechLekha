import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Share2, Radio, Settings, User, ArrowRight, CornerDownLeft, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, documents, setCurrentDocId } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Static quick actions
  const actions = [
    { id: 'speak', title: 'Start Live Speaking Mode', subtitle: 'Open dedicated voice recording screen', icon: Radio, path: '/speak' },
    { id: 'app', title: 'Open Current Workspace', subtitle: 'Main knowledge session and live output', icon: Sparkles, path: '/app' },
    { id: 'vault', title: 'Browse Knowledge Vault', subtitle: 'All folders, files and notes', icon: FileText, path: '/vault' },
    { id: 'graph', title: 'View Knowledge Graph', subtitle: 'Explore 3D concept connection network', icon: Share2, path: '/graph' },
    { id: 'profile', title: 'Profile & Local Node Status', subtitle: 'Storage, metrics and node settings', icon: User, path: '/profile' },
    { id: 'settings', title: 'Application Settings', subtitle: 'ASR models, AI behavior, markdown vaults', icon: Settings, path: '/settings' }
  ];

  // Filter matching documents and actions
  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(query.toLowerCase()) ||
    doc.filename.toLowerCase().includes(query.toLowerCase()) ||
    doc.folder.toLowerCase().includes(query.toLowerCase()) ||
    doc.linkedConcepts.some(c => c.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredActions = actions.filter((act) =>
    act.title.toLowerCase().includes(query.toLowerCase()) ||
    act.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const allResults = [
    ...filteredDocs.map((doc) => ({ type: 'doc' as const, doc })),
    ...filteredActions.map((act) => ({ type: 'action' as const, act }))
  ];

  const handleSelect = (index: number) => {
    const item = allResults[index];
    if (!item) return;

    if (item.type === 'doc') {
      setCurrentDocId(item.doc.id);
      navigate(`/document/${item.doc.id}`);
    } else if (item.type === 'action') {
      navigate(item.act.path);
    }
    setIsCommandPaletteOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    } else if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    }
  };

  return (
    <div className="cmd-palette-backdrop" onClick={() => setIsCommandPaletteOpen(false)}>
      <div className="cmd-palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-search-box">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents, concepts, actions (e.g. Photosynthesis, Graph, Settings)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <button className="cmd-close" onClick={() => setIsCommandPaletteOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="cmd-results-list">
          {allResults.length === 0 ? (
            <div className="cmd-empty">
              <span>No matching documents or commands found</span>
            </div>
          ) : (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              if (item.type === 'doc') {
                return (
                  <div
                    key={item.doc.id}
                    className={`cmd-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="cmd-item-icon">
                      <FileText size={15} />
                    </div>
                    <div className="cmd-item-info">
                      <div className="cmd-item-title">
                        <span>{item.doc.title}</span>
                        <small>{item.doc.folder} / {item.doc.filename}</small>
                      </div>
                      <span className="cmd-item-sub">{item.doc.preview.slice(0, 75)}...</span>
                    </div>
                    <div className="cmd-item-badge">
                      <span>Document</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.act.id}
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-item-icon action-icon">
                    <item.act.icon size={15} />
                  </div>
                  <div className="cmd-item-info">
                    <div className="cmd-item-title">
                      <span>{item.act.title}</span>
                    </div>
                    <span className="cmd-item-sub">{item.act.subtitle}</span>
                  </div>
                  <div className="cmd-item-badge action-badge">
                    <span>Jump to</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-palette-footer">
          <div className="cmd-key-hints">
            <span><CornerDownLeft size={11} /> to select</span>
            <span>↑↓ to navigate</span>
            <span>esc to close</span>
          </div>
          <small>SpeechLekha Quick Command</small>
        </div>
      </div>
    </div>
  );
};
