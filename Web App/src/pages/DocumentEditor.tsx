import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Share2,
  MoreHorizontal,
  Sparkles,
  Send,
  FileText,
  Copy,
  PlusCircle,
  Eye,
  Edit3,
  Bot,
  UserCheck,
  HelpCircle,
  Network
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { useApp } from '../context/AppContext';

export const DocumentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, saveDocument, addToast, setCurrentDocId } = useApp();

  const currentDoc = documents.find((d) => d.id === id) || documents[0];
  const [content, setContent] = useState(currentDoc ? currentDoc.content : '');
  const [title, setTitle] = useState(currentDoc ? currentDoc.title : 'Photosynthesis');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; actionData?: string }>>([
    {
      sender: 'agent',
      text: 'I am ready to analyze and enrich this knowledge document. Ask questions, generate diagrams, or explore linked concepts.'
    }
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentDoc) {
      setContent(currentDoc.content);
      setTitle(currentDoc.title);
      setCurrentDocId(currentDoc.id);
    }
  }, [id, currentDoc]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      saveDocument(currentDoc.id, content, title);
      setIsSaving(false);
    }, 400);
  };

  const handleActionClick = (actionName: string) => {
    let responseText = '';
    let actionData = '';

    if (actionName === 'Summarize') {
      responseText = `### 📋 Document Summary\n\n• **Core Theme**: Bioenergetics of light conversion and dark carbon fixation.\n• **Key Findings**: C4 plants utilize spatial separation (Kranz anatomy) and PEP carboxylase to completely evade photorespiratory yield degradation.\n• **Vault Impact**: Connects 12 primary concepts across Botany and Cellular Biology.`;
    } else if (actionName === 'Find connections') {
      responseText = `### 🔗 Discovered Bidirectional Connections\n\n1. **[[ATP Synthase]]** ➔ Coupled with proton motive force in thylakoid lumen.\n2. **[[Cellular Respiration]]** ➔ Reciprocal stoichiometric pathway (glucose oxidation vs glucose reduction).\n3. **[[Rubisco Kinetics]]** ➔ Critical affinity threshold for $CO_2/O_2$ partition.`;
    } else if (actionName === 'Create diagram') {
      responseText = `### 📊 Z-Scheme Flowchart\n\n\`\`\`mermaid\ngraph LR\n  PS2[Photosystem II 680nm] -->|Photolysis| PQ[Plastoquinone]\n  PQ --> Cyt[Cytochrome b6f]\n  Cyt -->|H+ Gradient| ATP[ATP Synthase]\n  Cyt --> PC[Plastocyanin]\n  PC --> PS1[Photosystem I 700nm]\n  PS1 --> Fd[Ferredoxin] --> NADPH\n\`\`\``;
      actionData = responseText;
    } else if (actionName === 'Explain simply') {
      responseText = `### 💡 Simple Analogy\n\nThink of photosynthesis as a solar-powered rechargeable battery factory. \n\n1. **Solar Panels (Chlorophyll)** catch sunlight and charge tiny batteries (**ATP** and **NADPH**).\n2. **Sugar Kitchen (Calvin Cycle)** uses that battery power to assemble sugar bricks from carbon dioxide in the air.\n3. **C4 Plants** are like a sealed, pressurized room that ensures no bad air enters the sugar kitchen.`;
    } else if (actionName === 'Generate quiz') {
      responseText = `### 🧠 Knowledge Quiz\n\n1. **What is the primary enzyme responsible for initial $CO_2$ capture in C4 mesophyll cells?**\n   *(Answer: PEP Carboxylase)*\n2. **Why does photorespiration consume ATP without generating sugars?**\n   *(Answer: Rubisco binds oxygen, generating toxic 2-phosphoglycolate)*`;
    }

    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: actionName },
      { sender: 'agent', text: responseText, actionData }
    ]);
  };

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim() || isAiResponding) return;

    const userText = aiPrompt.trim();
    setAiPrompt('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsAiResponding(true);

    setTimeout(() => {
      let reply = `Based on **${currentDoc.title}**, `;
      if (userText.toLowerCase().includes('chlorophyll')) {
        reply += `[[Chlorophyll]] pigments are arranged in light-harvesting antenna complexes within the thylakoid membrane, tuned to peak photon absorption in blue (430nm) and red (660nm) wavelengths.`;
      } else if (userText.toLowerCase().includes('c4') || userText.toLowerCase().includes('c3')) {
        reply += `C4 plants eliminate the oxygenation reaction of Rubisco by pre-concentrating $CO_2$ inside bundle sheath cells using PEP carboxylase.`;
      } else {
        reply += `I analyzed your query across your 12 connected knowledge nodes. This concept is directly linked to [[Calvin Cycle]], [[Rubisco]], and [[Light Reaction]].`;
      }

      setChatMessages((prev) => [...prev, { sender: 'agent', text: reply }]);
      setIsAiResponding(false);
    }, 600);
  };

  const insertTextAtCursor = (textToInsert: string) => {
    setContent((prev) => prev + '\n\n' + textToInsert);
    addToast('Inserted to Document', 'Content appended to your markdown note.', 'success');
  };

  // Render markdown with styled wikilinks and table
  const renderRichMarkdown = (raw: string) => {
    const lines = raw.split('\n');
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
                    <th key={idx}>{renderInlineLinks(col.trim())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{renderInlineLinks(cell.trim())}</td>
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

    const renderInlineLinks = (str: string) => {
      const parts = str.split(/(\[\[.*?\]\]|\*\*.*?\*\*|\$.*?\$)/g);
      return parts.map((part, i) => {
        if (part.startsWith('[[') && part.endsWith(']]')) {
          const concept = part.slice(2, -2);
          return (
            <button
              key={i}
              type="button"
              className="editor-wikilink"
              onClick={() => {
                addToast('Knowledge Link', `Opening ${concept} in graph`, 'info');
                navigate('/graph');
              }}
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

      // Table line detection
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        const cells = line
          .trim()
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        // Ignore separator row (e.g. |---|---|)
        if (!cells.every((c) => /^:?-+:?$/.test(c))) {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        flushTable();
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="editor-h1">
            {renderInlineLinks(line.slice(2))}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="editor-h2">
            {renderInlineLinks(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="editor-h3">
            {renderInlineLinks(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        elements.push(
          <li key={i} className="editor-li">
            {renderInlineLinks(line.slice(2))}
          </li>
        );
      } else if (line.startsWith('```')) {
        // Collect code block
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
        elements.push(
          <p key={i} className="editor-p">
            {renderInlineLinks(line)}
          </p>
        );
      }
    }

    if (inTable) flushTable();

    return elements;
  };

  return (
    <div className="workspace">
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="main editor-main">
        {/* TOP BAR */}
        <header className="editor-topbar">
          <div className="topbar-left">
            <Link to="/vault" className="back-link">
              <ArrowLeft size={16} />
              <span>Back to Knowledge Vault</span>
            </Link>
            <span className="file-pill">
              <FileText size={13} />
              <span>{currentDoc.filename}</span>
            </span>
          </div>

          <div className="topbar-right">
            <div className="view-mode-tabs">
              <button
                className={`tab-btn ${!isEditingMode ? 'active' : ''}`}
                onClick={() => setIsEditingMode(false)}
              >
                <Eye size={13} />
                <span>Reading</span>
              </button>
              <button
                className={`tab-btn ${isEditingMode ? 'active' : ''}`}
                onClick={() => setIsEditingMode(true)}
              >
                <Edit3 size={13} />
                <span>Source</span>
              </button>
            </div>

            <button
              className={`save-btn ${isSaving ? 'saving' : ''}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            <button
              className="icon-btn"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                addToast('Share Link Copied', 'Copied URL to clipboard.', 'info');
              }}
              title="Share Document"
            >
              <Share2 size={16} />
            </button>

            <button
              className="icon-btn"
              onClick={() => navigate('/graph')}
              title="View in Knowledge Graph"
            >
              <Network size={16} />
            </button>
          </div>
        </header>

        {/* EDITOR 2-COLUMN LAYOUT */}
        <div className="editor-layout">
          {/* LEFT: DOCUMENT CONTENT */}
          <div className="editor-canvas">
            <div className="editor-doc-header">
              <span className="folder-crumb">{currentDoc.folder} / {currentDoc.filename}</span>
              <div className="meta-tags">
                {currentDoc.tags.map((tag) => (
                  <span key={tag} className="tag-chip">#{tag}</span>
                ))}
              </div>
            </div>

            {isEditingMode ? (
              <textarea
                className="markdown-raw-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type or paste markdown content with [[wikilinks]]..."
                spellCheck={false}
              />
            ) : (
              <div className="markdown-rendered-view">
                {renderRichMarkdown(content)}
              </div>
            )}
          </div>

          {/* RIGHT: AI AGENT PANEL ("Ask SpeechLekha") */}
          <aside className="editor-agent-sidebar">
            <div className="agent-sidebar-header">
              <div className="title-group">
                <Sparkles size={16} className="agent-sparkle" />
                <h3>Ask SpeechLekha</h3>
              </div>
              <span className="model-badge">Whisper + Neural Graph</span>
            </div>

            {/* SUGGESTED ACTIONS */}
            <div className="suggested-actions-container">
              <label>SUGGESTED ACTIONS</label>
              <div className="actions-chip-grid">
                {['Summarize', 'Find connections', 'Create diagram', 'Explain simply', 'Generate quiz'].map((act) => (
                  <button
                    key={act}
                    className="action-chip-btn"
                    onClick={() => handleActionClick(act)}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            {/* CHAT THREAD */}
            <div className="agent-chat-thread">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.sender}`}>
                  <div className="bubble-header">
                    {msg.sender === 'agent' ? <Bot size={13} /> : <UserCheck size={13} />}
                    <span>{msg.sender === 'agent' ? 'SpeechLekha Agent' : 'You'}</span>
                  </div>
                  <div className="bubble-content">
                    {msg.text.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>

                  {msg.actionData && (
                    <div className="bubble-actions">
                      <button
                        className="insert-btn"
                        onClick={() => insertTextAtCursor(msg.actionData!)}
                      >
                        <PlusCircle size={13} />
                        <span>Insert into Note</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {isAiResponding && (
                <div className="chat-bubble agent loading">
                  <div className="bubble-header">
                    <Bot size={13} />
                    <span>Analyzing document graph...</span>
                  </div>
                  <div className="loading-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            {/* PROMPT INPUT */}
            <form className="agent-input-form" onSubmit={handleSendPrompt}>
              <input
                type="text"
                placeholder="Ask anything about this document..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={!aiPrompt.trim() || isAiResponding}
                title="Send to SpeechLekha Agent"
              >
                <Send size={14} />
              </button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
};
