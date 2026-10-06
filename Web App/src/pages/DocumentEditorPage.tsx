import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Share2,
  FileText,
  Eye,
  CheckCircle2,
  Bot,
  Send,
  PlusCircle,
  HelpCircle,
  Network,
  Image,
  BookOpen
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { useApp } from '../context/AppContext';

export const DocumentEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, saveDocument, addToast } = useApp();

  const currentDoc = documents.find((d) => d.id === id) || documents[0];
  const [content, setContent] = useState(currentDoc ? currentDoc.content : '');
  const [title, setTitle] = useState(currentDoc ? currentDoc.title : '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentChat, setAgentChat] = useState<Array<{ sender: 'user' | 'agent'; text: string; actionData?: string }>>([
    {
      sender: 'agent',
      text: 'SpeechLekha Agent active. I can summarize, create diagrams, discover cross-links, or generate quizzes for this note.'
    }
  ]);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (currentDoc) {
      setContent(currentDoc.content);
      setTitle(currentDoc.title);
    }
  }, [id, currentDoc]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      saveDocument(currentDoc.id, content, title);
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }, 300);
  };

  const handleActionClick = (actionName: string) => {
    if (actionName === 'Summarize') {
      navigate(`/summary/${currentDoc.id}`);
      return;
    }
    if (actionName === 'Find Connections') {
      navigate(`/connections/${currentDoc.id}`);
      return;
    }
    if (actionName === 'Create Diagram') {
      navigate('/diagram');
      return;
    }
    if (actionName === 'Generate Quiz') {
      navigate('/quiz');
      return;
    }

    if (actionName === 'Explain Simply') {
      const explainText = `### 💡 Plain English Breakdown\n\n• **Solar Panels (Chlorophyll)** harvest light energy and store it in temporary chemical batteries (ATP/NADPH).\n• **Carbon Assembly (Calvin Cycle)** uses those batteries to assemble CO2 into sugar.\n• **C4 Plants** are like a sealed workspace that keeps unwanted oxygen away from Rubisco.`;
      setAgentChat((prev) => [
        ...prev,
        { sender: 'user', text: 'Explain this document simply' },
        { sender: 'agent', text: explainText, actionData: explainText }
      ]);
    }
  };

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!agentPrompt.trim() || isResponding) return;

    const userQuery = agentPrompt.trim();
    setAgentPrompt('');
    setAgentChat((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setIsResponding(true);

    setTimeout(() => {
      let reply = `Analyzed **${currentDoc.title}** regarding "${userQuery}": `;
      if (userQuery.toLowerCase().includes('chlorophyll')) {
        reply += `Chlorophyll $a$ and $b$ absorb blue and red light while transmitting green wavelengths, triggering Photosystem II photolysis.`;
      } else if (userQuery.toLowerCase().includes('c4') || userQuery.toLowerCase().includes('c3')) {
        reply += `C4 plants utilize spatial compartmentalization (Kranz anatomy) to maintain a high internal $CO_2$ pressure around Rubisco, reducing photorespiration to near zero.`;
      } else {
        reply += `Connected with 12 ontology nodes. Key linked concepts include [[Calvin Cycle]], [[Rubisco]], and [[Light Reaction]].`;
      }
      setAgentChat((prev) => [...prev, { sender: 'agent', text: reply }]);
      setIsResponding(false);
    }, 500);
  };

  const insertText = (snippet: string) => {
    setContent((prev) => prev + '\n\n' + snippet);
    addToast('Content Inserted', 'Appended agent response to markdown editor.', 'success');
  };

  return (
    <div className="workspace">
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      <main className="main editor-main">
        {/* TOP BAR */}
        <header className="editor-topbar">
          <div className="topbar-left">
            <Link to={`/document/${currentDoc.id}`} className="back-link">
              <ArrowLeft size={16} />
              <span>Back to Reader</span>
            </Link>
            <span className="file-pill">
              <FileText size={13} />
              <span>{currentDoc.filename} (Editing)</span>
            </span>
          </div>

          <div className="topbar-right">
            <button
              className={`save-btn ${savedSuccess ? 'saved-success' : ''}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              {savedSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
              <span>{isSaving ? 'Saving...' : savedSuccess ? 'Saved to Vault' : 'Save Changes'}</span>
            </button>
          </div>
        </header>

        {/* 3-COLUMN SPLIT EDITOR LAYOUT */}
        <div className="three-column-editor-layout">
          {/* COLUMN 1: RAW MARKDOWN SOURCE */}
          <div className="editor-pane source-pane">
            <div className="pane-header">
              <label>MARKDOWN SOURCE</label>
              <small>UTF-8 Text</small>
            </div>
            <textarea
              className="markdown-source-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write markdown here with [[wikilinks]]..."
              spellCheck={false}
            />
          </div>

          {/* COLUMN 2: RENDERED PREVIEW */}
          <div className="editor-pane preview-pane">
            <div className="pane-header">
              <label>LIVE RENDERED PREVIEW</label>
              <Eye size={13} />
            </div>
            <div className="rendered-preview-scroll">
              <article className="rendered-markdown-simple">
                {content.split('\n').map((line, idx) => {
                  if (line.startsWith('# ')) return <h1 key={idx}>{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={idx}>{line.slice(3)}</h2>;
                  if (line.startsWith('### ')) return <h3 key={idx}>{line.slice(4)}</h3>;
                  if (line.startsWith('• ') || line.startsWith('- ')) return <li key={idx}>{line.slice(2)}</li>;
                  if (line.trim().length > 0) return <p key={idx}>{line}</p>;
                  return <br key={idx} />;
                })}
              </article>
            </div>
          </div>

          {/* COLUMN 3: SPEECHLEKHA AGENT */}
          <aside className="editor-pane agent-pane">
            <div className="pane-header">
              <div className="title-group">
                <Sparkles size={14} className="agent-sparkle" />
                <label>SPEECHLEKHA AGENT</label>
              </div>
              <span className="badge-tag">Active</span>
            </div>

            {/* QUICK ACTIONS */}
            <div className="agent-quick-actions-box">
              <span className="action-box-label">AGENT ACTIONS</span>
              <div className="agent-buttons-grid">
                <button className="agent-btn" onClick={() => handleActionClick('Summarize')}>
                  <BookOpen size={13} />
                  <span>Summarize</span>
                </button>
                <button className="agent-btn" onClick={() => handleActionClick('Find Connections')}>
                  <Network size={13} />
                  <span>Connections</span>
                </button>
                <button className="agent-btn" onClick={() => handleActionClick('Create Diagram')}>
                  <Image size={13} />
                  <span>Diagram</span>
                </button>
                <button className="agent-btn" onClick={() => handleActionClick('Generate Quiz')}>
                  <HelpCircle size={13} />
                  <span>Quiz</span>
                </button>
                <button className="agent-btn" onClick={() => handleActionClick('Explain Simply')}>
                  <Sparkles size={13} />
                  <span>Explain Simply</span>
                </button>
              </div>
            </div>

            {/* CHAT LOG */}
            <div className="agent-chat-feed">
              {agentChat.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.sender}`}>
                  <div className="bubble-header">
                    {msg.sender === 'agent' ? <Bot size={12} /> : <FileText size={12} />}
                    <span>{msg.sender === 'agent' ? 'Agent' : 'You'}</span>
                  </div>
                  <div className="bubble-content">
                    {msg.text.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>
                  {msg.actionData && (
                    <button className="insert-btn" onClick={() => insertText(msg.actionData!)}>
                      <PlusCircle size={12} />
                      <span>Insert into editor</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* INPUT FORM */}
            <form className="agent-input-form" onSubmit={handleSendPrompt}>
              <input
                type="text"
                placeholder="Ask agent about this document..."
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
              />
              <button type="submit" className="send-btn" disabled={!agentPrompt.trim() || isResponding}>
                <Send size={13} />
              </button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
};
