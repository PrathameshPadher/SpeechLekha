import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  Plus,
  LayoutGrid,
  List,
  Clock,
  Share2,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';
import { FOLDER_TREE } from '../utils/mockData';

export const KnowledgeVault: React.FC = () => {
  const navigate = useNavigate();
  const {
    documents,
    setCurrentDocId,
    createNewDocument,
    selectedVaultFolder,
    setSelectedVaultFolder,
    addToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'links'>('updated');
  const [folders, setFolders] = useState(FOLDER_TREE);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleFolder = (folderName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.name === folderName ? { ...f, isOpen: !f.isOpen } : f))
    );
  };

  const handleCreateNewNote = () => {
    const newId = createNewDocument(selectedVaultFolder, 'New Voice Note');
    navigate(`/document/${newId}`);
  };

  const handleOpenDoc = (id: string) => {
    setCurrentDocId(id);
    navigate(`/document/${id}`);
  };

  // Filter & sort documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.linkedConcepts.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFolder = selectedVaultFolder === 'All' || doc.folder === selectedVaultFolder;
    return matchesSearch && matchesFolder;
  });

  const sortedDocs = [...filteredDocs].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'links') return b.linksCount - a.linksCount;
    return 0; // default order
  });

  const recentlyUpdated = [...documents].slice(0, 3);

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
          breadcrumbs={['KNOWLEDGE VAULT', selectedVaultFolder.toUpperCase()]}
          title="Knowledge Vault"
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="vault-page-container">
          {/* VAULT BANNER */}
          <div className="vault-banner">
            <div>
              <span className="eyebrow-tag">CENTRAL KNOWLEDGE BASE</span>
              <h1 className="vault-main-heading">Knowledge Vault</h1>
              <p className="vault-subtitle">
                Everything you've spoken, understood, and connected.
              </p>
            </div>

            <div className="vault-banner-actions">
              <button className="new-btn" onClick={handleCreateNewNote}>
                <Plus size={16} />
                <span>New document</span>
              </button>
              <button
                className="ghost-outline-btn"
                onClick={() => navigate('/graph')}
              >
                <Share2 size={15} />
                <span>Explore Graph</span>
              </button>
            </div>
          </div>

          {/* TOP CONTROLS */}
          <div className="vault-controls-bar">
            <div className="vault-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search knowledge documents, entities, wikilinks..."
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
                <ArrowUpDown size={14} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'updated' | 'title' | 'links')}
                >
                  <option value="updated">Sort by: Recently Updated</option>
                  <option value="title">Sort by: Title (A-Z)</option>
                  <option value="links">Sort by: Connected Links</option>
                </select>
              </div>

              <div className="view-toggle">
                <button
                  className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* MAIN BROWSER SPLIT */}
          <div className="vault-browser-layout">
            {/* LEFT FOLDER TREE */}
            <aside className="vault-folder-tree">
              <div className="folder-tree-header">
                <label>FOLDERS</label>
                <button
                  className="icon-add-folder"
                  onClick={() => addToast('Folder Added', 'Created new folder in root vault.', 'info')}
                  title="New Folder"
                >
                  <Plus size={13} />
                </button>
              </div>

              <button
                type="button"
                className={`folder-item root-folder ${selectedVaultFolder === 'All' ? 'selected' : ''}`}
                onClick={() => setSelectedVaultFolder('All')}
              >
                <FolderOpen size={15} />
                <span>All Documents</span>
                <span className="counter">{documents.length}</span>
              </button>

              {folders.map((folder) => {
                const isSelected = selectedVaultFolder === folder.name;
                const docCount = documents.filter((d) => d.folder === folder.name).length;

                return (
                  <div key={folder.name} className="folder-branch">
                    <div
                      className={`folder-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedVaultFolder(folder.name)}
                    >
                      <button
                        type="button"
                        className="toggle-expand"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFolder(folder.name);
                        }}
                      >
                        {folder.isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>

                      {folder.isOpen ? <FolderOpen size={15} /> : <Folder size={15} />}
                      <span className="folder-name">{folder.name}</span>
                      <span className="counter">{docCount}</span>
                    </div>

                    {folder.isOpen && folder.subfolders && folder.subfolders.length > 0 && (
                      <div className="subfolder-group">
                        {folder.subfolders.map((sub) => (
                          <div
                            key={sub.name}
                            className="subfolder-item"
                            onClick={() => setSelectedVaultFolder(folder.name)}
                          >
                            <span className="sub-line" />
                            <FileText size={13} />
                            <span>{sub.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </aside>

            {/* RIGHT FILE GRID / LIST */}
            <div className="vault-files-column">
              {/* RECENTLY UPDATED SECTION */}
              <div className="recently-updated-section">
                <div className="section-title">
                  <Clock size={14} />
                  <span>Recently updated</span>
                </div>
                <div className="recent-pills-row">
                  {recentlyUpdated.map((doc) => (
                    <button
                      key={doc.id}
                      className="recent-pill-card"
                      onClick={() => handleOpenDoc(doc.id)}
                    >
                      <div className="pill-top">
                        <FileText size={14} />
                        <span className="pill-title">{doc.title}</span>
                      </div>
                      <div className="pill-meta">
                        <small>{doc.folder}</small>
                        <small>· {doc.linksCount} links</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* FILES COLLECTION */}
              <div className="files-collection-header">
                <span className="count-label">
                  Showing <strong>{sortedDocs.length}</strong> knowledge files
                </span>
              </div>

              {sortedDocs.length === 0 ? (
                <div className="vault-empty-state">
                  <FolderOpen size={36} />
                  <h3>No knowledge documents found</h3>
                  <p>Try searching for a different phrase or create a new note.</p>
                  <button className="new-btn" onClick={handleCreateNewNote}>
                    <Plus size={15} /> Create Note
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="vault-grid">
                  {sortedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="doc-card"
                      onClick={() => handleOpenDoc(doc.id)}
                    >
                      <div className="doc-card-top">
                        <div className="doc-card-icon">
                          <FileText size={16} />
                        </div>
                        <span className="doc-folder-badge">{doc.folder}</span>
                        <ArrowUpRight size={14} className="hover-arrow" />
                      </div>

                      <h3 className="doc-card-title">{doc.title}</h3>
                      <span className="doc-filename">{doc.filename}</span>

                      <p className="doc-card-preview">{doc.preview}</p>

                      <div className="doc-card-footer">
                        <span className="doc-updated">{doc.updatedAt}</span>
                        <span className="doc-links-count">
                          <Share2 size={11} /> {doc.linksCount} linked concepts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vault-list-table">
                  <div className="table-row-header">
                    <span>NAME</span>
                    <span>FOLDER</span>
                    <span>LINKS</span>
                    <span>LAST UPDATED</span>
                  </div>
                  {sortedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="table-row"
                      onClick={() => handleOpenDoc(doc.id)}
                    >
                      <div className="name-cell">
                        <FileText size={15} />
                        <div>
                          <strong>{doc.title}</strong>
                          <small>{doc.filename}</small>
                        </div>
                      </div>
                      <div className="folder-cell">
                        <span className="folder-tag">{doc.folder}</span>
                      </div>
                      <div className="links-cell">
                        <Share2 size={12} /> {doc.linksCount}
                      </div>
                      <div className="updated-cell">
                        {doc.updatedAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
