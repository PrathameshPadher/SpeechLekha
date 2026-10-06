import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Share2,
  Sparkles,
  Network,
  Calendar,
  Folder,
  Layers,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';

export const DocumentViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, addToast } = useApp();

  const doc = documents.find((d) => d.id === id) || documents[0];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('Link Copied', `Copied link to ${doc.title} to clipboard.`, 'info');
  };

  const handleConceptClick = (concept: string) => {
    navigate(`/connections/${encodeURIComponent(concept)}`);
  };

  // Render markdown elements with styled links
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const rows = tableRows.slice(1);
        elements.push(
          <div key={`table-${elements.length}`} className="editor-rendered-table-wrap">
            <table className="editor-table">
              <thead>
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx}>{renderInline(col.trim())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{renderInline(cell.trim())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }
      inTable = false;
    };

    const renderInline = (str: string) => {
      const parts = str.split(/(\[\[.*?\]\]|\*\*.*?\*\*|\$.*?\$)/g);
      return parts.map((part, i) => {
        if (part.startsWith('[[') && part.endsWith(']]')) {
          const concept = part.slice(2, -2);
          return (
            <button
              key={i}
              type="button"
              className="editor-wikilink"
              onClick={() => handleConceptClick(concept)}
            >
              [[{concept}]]
            </button>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <code key={i} className="math-pill">{part.slice(1, -1)}</code>;
        }
        return part;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        const cells = line.trim().slice(1, -1).split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        flushTable();
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="editor-h1">{renderInline(line.slice(2))}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="editor-h2">{renderInline(line.slice(3))}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="editor-h3">{renderInline(line.slice(4))}</h3>);
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        elements.push(<li key={i} className="editor-li">{renderInline(line.slice(2))}</li>);
      } else if (line.startsWith('```')) {
        const codeLines: string[] = [];
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('```')) {
          codeLines.push(lines[j]);
          j++;
        }
        i = j;
        elements.push(
          <pre key={`code-${i}`} className="editor-codeblock">
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
      } else if (line.trim().length > 0) {
        elements.push(<p key={i} className="editor-p">{renderInline(line)}</p>);
      }
    }

    if (inTable) flushTable();
    return elements;
  };

  return (
    <div className="workspace">
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      <main className="main document-viewer-main">
        {/* TOP BAR */}
        <header className="document-viewer-topbar">
          <div className="viewer-top-left">
            <Link to="/vault" className="back-link">
              <ArrowLeft size={16} />
              <span>Knowledge Vault</span>
            </Link>
            <span className="doc-path-badge">
              <Folder size={12} /> {doc.folder} / {doc.filename}
            </span>
          </div>

          <div className="viewer-top-right">
            <button
              className="action-pill-btn"
              onClick={() => navigate(`/summary/${doc.id}`)}
              title="Generate AI Summary"
            >
              <Sparkles size={14} />
              <span>AI Summary</span>
            </button>

            <button
              className="action-pill-btn"
              onClick={() => navigate(`/connections/${doc.id}`)}
              title="Explore Concept Connections"
            >
              <Network size={14} />
              <span>Connections</span>
            </button>

            <button
              className="action-pill-btn"
              onClick={handleShare}
              title="Copy share link"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>

            <button
              className="primary-action-btn edit-doc-btn"
              onClick={() => navigate(`/document/${doc.id}/edit`)}
            >
              <Edit3 size={14} />
              <span>Edit Document</span>
            </button>
          </div>
        </header>

        {/* DOCUMENT ARTICLE BODY */}
        <div className="document-reading-canvas">
          <div className="doc-header-metadata">
            <div className="metadata-tags">
              <span className="vault-tag">{doc.folder}</span>
              <span className="time-tag">{doc.updatedAt}</span>
              <span className="links-tag">{doc.linksCount} linked concepts</span>
            </div>
          </div>

          <article className="markdown-rendered-view">
            {renderMarkdown(doc.content)}
          </article>

          {/* BOTTOM LINKED CONCEPTS TRAY */}
          <div className="linked-concepts-tray">
            <label>CONNECTED CONCEPTS IN THIS DOCUMENT:</label>
            <div className="tray-pills">
              {doc.linkedConcepts.map((concept) => (
                <button
                  key={concept}
                  className="concept-tray-pill"
                  onClick={() => handleConceptClick(concept)}
                >
                  <span>[[{concept}]]</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
