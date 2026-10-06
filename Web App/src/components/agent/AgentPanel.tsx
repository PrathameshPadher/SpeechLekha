import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FolderOpen, Folder, FileText, Check, LoaderCircle, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AgentPanelProps {
  onSelectFile?: (filename: string) => void;
  selectedFile?: string;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  onSelectFile,
  selectedFile = '01-photosynthesis.md'
}) => {
  const navigate = useNavigate();
  const { agentTasks, isListening, documents, setCurrentDocId } = useApp();

  const handleFileClick = (filename: string) => {
    if (filename === 'Biology') return;
    if (onSelectFile) {
      onSelectFile(filename);
    }
    const doc = documents.find(d => d.filename === filename);
    if (doc) {
      setCurrentDocId(doc.id);
    }
  };

  const handleFileDoubleClick = (filename: string) => {
    const doc = documents.find(d => d.filename === filename);
    if (doc) {
      navigate(`/document/${doc.id}`);
    }
  };

  return (
    <aside className="right">
      <div className="panel agent">
        <div className="panelhead">
          <span>
            <Sparkles size={14} /> SPEECHLEKHA AGENT
          </span>
          <i className={isListening ? 'active-pulse' : ''} />
        </div>

        <div className="under">
          <span className="dot-pulse" /> UNDERSTANDING
        </div>

        <div className="agent-tasks-list">
          {agentTasks.map((task) => {
            const isDone = task.status === 'done';
            const isRunning = task.status === 'running';

            return (
              <div
                className={`action ${isDone ? 'done' : ''} ${isRunning ? 'running' : ''}`}
                key={task.id}
              >
                <div className="action-header">
                  {isDone ? (
                    <Check size={13} className="check-icon" />
                  ) : isRunning ? (
                    <LoaderCircle size={13} className="spin" />
                  ) : (
                    <span className="empty" />
                  )}
                  <b>{task.name}</b>
                  {isRunning && <em>EXECUTING</em>}
                </div>
                <small>{task.description}</small>
              </div>
            );
          })}
        </div>

        <footer>
          <span>Agent tools: active</span>
          <span className="badge-tag">Markdown Engine</span>
        </footer>
      </div>

      <div className="panel files">
        <div className="panelhead">
          <span>
            <FolderOpen size={14} /> KNOWLEDGE FILES
          </span>
          <small>Biology/</small>
        </div>

        <div className="files-list">
          {['Biology', '00-index.md', '01-photosynthesis.md', '02-c3-vs-c4.md', 'key-terms.md', 'diagrams.md'].map(
            (filename) => {
              const isFolder = filename === 'Biology';
              const isSelected = selectedFile === filename;

              return (
                <button
                  key={filename}
                  type="button"
                  onClick={() => handleFileClick(filename)}
                  onDoubleClick={() => handleFileDoubleClick(filename)}
                  className={`file-row ${isSelected ? 'selected' : ''} ${isFolder ? 'folder-row' : ''}`}
                  title={isFolder ? 'Folder: Biology' : `Click to select, double click to open ${filename}`}
                >
                  {isFolder ? <Folder size={14} /> : <FileText size={14} />}
                  <span>{filename}</span>
                  {!isFolder && (
                    <ChevronRight size={12} className="row-arrow" />
                  )}
                </button>
              );
            }
          )}
        </div>
      </div>
    </aside>
  );
};
