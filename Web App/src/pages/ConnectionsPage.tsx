import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Network,
  Share2,
  ArrowRight,
  FileText,
  Sparkles,
  ArrowUpRight,
  Folder,
  Layers,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';
import { GRAPH_NODES, GRAPH_LINKS } from '../utils/mockData';

export const ConnectionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, setCurrentDocId } = useApp();

  // Find matching concept or document
  const conceptName = decodeURIComponent(id || 'Photosynthesis');

  const selectedNode =
    GRAPH_NODES.find(
      (n) =>
        n.label.toLowerCase() === conceptName.toLowerCase() ||
        n.id.toLowerCase() === conceptName.toLowerCase() ||
        n.docId === conceptName
    ) || GRAPH_NODES[0];

  const relatedLinks = GRAPH_LINKS.filter(
    (l) => l.source === selectedNode.id || l.target === selectedNode.id
  );

  const relatedDocs = documents.filter(
    (d) =>
      d.id === selectedNode.docId ||
      d.linkedConcepts.some((c) => c.toLowerCase() === selectedNode.label.toLowerCase())
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="workspace">
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="main connections-page-main">
        <TopHeader
          breadcrumbs={['KNOWLEDGE VAULT', 'CONNECTIONS', selectedNode.label.toUpperCase()]}
          title="Concept Connections"
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="connections-container">
          {/* HEADER HERO */}
          <div className="connections-hero">
            <div className="hero-eyebrow">
              <Network size={15} />
              <span>SEMANTIC ONTOLOGY EXPLORER</span>
            </div>

            <h1 className="connections-main-heading">
              How <em>{selectedNode.label}</em> connects.
            </h1>

            <p className="connections-sub">
              {selectedNode.description}
            </p>

            <div className="connections-action-bar">
              <button
                className="primary-action-btn"
                onClick={() => navigate('/graph')}
              >
                <Share2 size={15} />
                <span>Open in 3D Knowledge Graph</span>
              </button>

              {selectedNode.docId && (
                <button
                  className="secondary-action-btn"
                  onClick={() => {
                    setCurrentDocId(selectedNode.docId!);
                    navigate(`/document/${selectedNode.docId}`);
                  }}
                >
                  <FileText size={15} />
                  <span>Open Source Document</span>
                </button>
              )}
            </div>
          </div>

          {/* 2-COLUMN CONNECTIONS GRID */}
          <div className="connections-grid-layout">
            {/* COLUMN 1: RELATED CONCEPTS & EDGES */}
            <div className="panel connections-panel">
              <div className="panelhead">
                <span>
                  <Network size={14} /> CONNECTED CONCEPTS ({relatedLinks.length} relations)
                </span>
                <small>Ranked by semantic affinity</small>
              </div>

              <div className="relations-list-body">
                {relatedLinks.map((link, idx) => {
                  const otherNodeId = link.source === selectedNode.id ? link.target : link.source;
                  const otherNode = GRAPH_NODES.find((n) => n.id === otherNodeId);
                  const isSource = link.source === selectedNode.id;
                  const label = otherNode ? otherNode.label : otherNodeId;
                  const strength = 85 + (idx % 3) * 6;

                  return (
                    <div
                      key={idx}
                      className="relation-item-card"
                      onClick={() => navigate(`/connections/${encodeURIComponent(label)}`)}
                    >
                      <div className="relation-header-row">
                        <div className="relation-tag-pills">
                          <span className="source-pill">{selectedNode.label}</span>
                          <span className="relation-verb-badge">{link.label || 'connected to'}</span>
                          <span className="target-pill">{label}</span>
                        </div>
                        <span className="strength-badge">{strength}% affinity</span>
                      </div>

                      <p className="relation-detail-text">
                        {otherNode ? otherNode.description : 'Directly linked concept in biology ontology.'}
                      </p>

                      <div className="relation-footer-row">
                        <span className="affinity-bar-wrap">
                          <span className="affinity-bar-fill" style={{ width: `${strength}%` }} />
                        </span>
                        <span className="explore-hint">
                          <span>Explore {label}</span>
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: RELATED DOCUMENTS IN VAULT */}
            <div className="panel connections-panel">
              <div className="panelhead">
                <span>
                  <FileText size={14} /> REFERENCED DOCUMENTS ({relatedDocs.length} files)
                </span>
                <small>Vault cross-references</small>
              </div>

              <div className="connected-docs-list">
                {relatedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="connected-doc-row"
                    onClick={() => {
                      setCurrentDocId(doc.id);
                      navigate(`/document/${doc.id}`);
                    }}
                  >
                    <div className="doc-icon-wrap">
                      <FileText size={16} />
                    </div>

                    <div className="doc-details-block">
                      <div className="doc-name-row">
                        <strong>{doc.title}</strong>
                        <span className="folder-tag">{doc.folder}</span>
                      </div>
                      <p className="doc-preview-snippet">{doc.preview.slice(0, 110)}...</p>
                      <div className="doc-meta-tags">
                        <span className="links-count">{doc.linksCount} total links</span>
                        <span className="updated-tag">{doc.updatedAt}</span>
                      </div>
                    </div>

                    <div className="open-arrow-wrap">
                      <ArrowUpRight size={15} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
