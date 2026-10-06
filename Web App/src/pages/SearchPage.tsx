import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, ArrowUpRight, Folder, Clock, Share2, Sparkles, X } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { documents, setCurrentDocId } = useApp();

  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const recentSearches = [
    'Photosynthesis',
    'Calvin cycle',
    'C4 plants',
    'PEP carboxylase',
    'Whisper ASR',
    'Thylakoid'
  ];

  const handleOpenDoc = (id: string) => {
    setCurrentDocId(id);
    navigate(`/document/${id}`);
  };

  // Search logic across documents & transcripts
  const searchResults = useMemo(() => {
    if (!query.trim() && !selectedTag) {
      return [];
    }

    const q = query.toLowerCase().trim();

    return documents
      .map((doc) => {
        let score = 0;
        let matchSentence = '';

        if (selectedTag && !doc.linkedConcepts.some((c) => c.toLowerCase() === selectedTag.toLowerCase())) {
          return null;
        }

        if (doc.title.toLowerCase().includes(q)) score += 10;
        if (doc.filename.toLowerCase().includes(q)) score += 8;

        // Find matching sentence in content
        const sentences = doc.content.split(/[.\n]/).map((s) => s.trim()).filter(Boolean);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(q)) {
            matchSentence = sentence;
            score += 5;
            break;
          }
        }

        if (!matchSentence) {
          matchSentence = doc.preview;
        }

        if (doc.linkedConcepts.some((c) => c.toLowerCase().includes(q))) score += 4;

        if (score > 0 || selectedTag) {
          return {
            doc,
            score,
            matchSentence
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.score - a.score);
  }, [documents, query, selectedTag]);

  // Helper to highlight matching text
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="workspace">
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="main search-page-main">
        <TopHeader
          breadcrumbs={['KNOWLEDGE VAULT', 'GLOBAL SEARCH']}
          title="Search Knowledge"
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="search-page-container">
          {/* SEARCH HERO */}
          <div className="search-hero-section">
            <span className="eyebrow-tag">SEMANTIC & ACOUSTIC SEARCH</span>
            <h1 className="search-hero-heading">Find anything you’ve ever said.</h1>
            <p className="search-hero-sub">
              Instant keyword and concept retrieval across your entire spoken knowledge base.
            </p>

            {/* LARGE CENTERED SEARCH INPUT */}
            <div className="large-search-box">
              <Search size={20} className="large-search-icon" />
              <input
                type="text"
                placeholder="Search your knowledge (e.g. Calvin Cycle, PEP Carboxylase, Thermodynamics)..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedTag(null);
                }}
                autoFocus
              />
              {query && (
                <button className="search-clear-btn" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* RECENT SEARCHES CHIPS */}
            <div className="recent-searches-row">
              <span className="recent-label">RECENT SEARCHES:</span>
              <div className="chips-wrap">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    className={`recent-chip ${query === term ? 'active' : ''}`}
                    onClick={() => {
                      setQuery(term);
                      setSelectedTag(null);
                    }}
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SEARCH RESULTS FEED */}
          <div className="search-results-section">
            {query.trim() || selectedTag ? (
              searchResults.length === 0 ? (
                <div className="search-empty-state">
                  <div className="empty-icon-wrap">
                    <Search size={32} />
                  </div>
                  <h3>Nothing found.</h3>
                  <p>Try searching for a concept, phrase, or topic.</p>
                </div>
              ) : (
                <div className="results-feed">
                  <div className="results-counter-bar">
                    <span>
                      Found <strong>{searchResults.length}</strong> matching results for "{query || selectedTag}"
                    </span>
                  </div>

                  {searchResults.map(({ doc, matchSentence }) => (
                    <div
                      key={doc.id}
                      className="search-result-card"
                      onClick={() => handleOpenDoc(doc.id)}
                    >
                      <div className="result-top">
                        <div className="result-title-group">
                          <FileText size={16} className="file-icon" />
                          <h3 className="result-title">
                            {renderHighlightedText(doc.title, query)}
                          </h3>
                        </div>
                        <div className="result-meta-tags">
                          <span className="folder-pill">
                            <Folder size={12} /> {doc.folder}
                          </span>
                          <span className="time-pill">
                            <Clock size={12} /> {doc.updatedAt}
                          </span>
                        </div>
                      </div>

                      <p className="result-matching-sentence">
                        {renderHighlightedText(matchSentence, query)}
                      </p>

                      <div className="result-footer">
                        <div className="concept-tags-row">
                          <Share2 size={12} className="link-icon" />
                          {doc.linkedConcepts.map((concept) => (
                            <span
                              key={concept}
                              className={`concept-pill ${
                                query.toLowerCase() === concept.toLowerCase() ? 'matched' : ''
                              }`}
                            >
                              [[{concept}]]
                            </span>
                          ))}
                        </div>

                        <span className="open-link-hint">
                          <span>Open Document</span>
                          <ArrowUpRight size={13} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="search-pre-prompt">
                <Sparkles size={24} />
                <p>Type a word or select a recent search to scan through your transcripts and documents.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
