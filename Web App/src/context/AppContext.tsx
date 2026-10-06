import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { KnowledgeDocument, VoiceSession, AgentTask, UserSettings, ToastMessage } from '../types';
import { INITIAL_DOCUMENTS, DEMO_SESSION, DEFAULT_SETTINGS } from '../utils/mockData';
import { initAudioCapture, stopAudioCapture, AudioVisualizerState, TRANSCRIPT_CHUNKS } from '../utils/audio';

const AGENT_TASKS_INITIAL: AgentTask[] = [
  { id: '1', name: 'transcribing audio stream', description: 'Whisper Large-v3 streaming 16kHz audio frames', status: 'pending' },
  { id: '2', name: 'extracting concepts & entities', description: 'Discovered [[Chlorophyll]], [[Calvin Cycle]], [[C3 Plants]]', status: 'pending' },
  { id: '3', name: 'creating markdown section', description: 'Formatted ## Key Concepts & ## C3 vs C4 comparison table', status: 'pending' },
  { id: '4', name: 'connecting ideas & wikilinks', description: 'Synthesized 12 bidirectional node relations', status: 'pending' },
  { id: '5', name: 'updating knowledge vault', description: 'Persisted to Biology/01-photosynthesis.md with timestamp', status: 'pending' }
];

interface AppContextType {
  documents: KnowledgeDocument[];
  currentDocId: string;
  setCurrentDocId: (id: string) => void;
  currentDocument: KnowledgeDocument | undefined;
  saveDocument: (id: string, content: string, title?: string) => void;
  createNewDocument: (folder?: string, title?: string) => string;
  
  // Voice Recording
  isListening: boolean;
  isPaused: boolean;
  recordingSeconds: number;
  speechPhase: 'LISTENING' | 'UNDERSTANDING' | 'STRUCTURING' | 'SAVING';
  liveTranscript: string;
  agentTasks: AgentTask[];
  audioState: AudioVisualizerState | null;
  startSpeaking: (suppressToast?: boolean) => Promise<void>;
  stopSpeaking: () => VoiceSession;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  cancelSpeaking: () => void;
  
  // Sessions
  sessions: VoiceSession[];
  currentSession: VoiceSession | null;
  
  // Settings & Toasts
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: 'info' | 'success' | 'warning') => void;
  removeToast: (id: string) => void;
  
  // Search & Command palette
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  selectedVaultFolder: string;
  setSelectedVaultFolder: (folder: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load documents from localStorage or fallback to INITIAL_DOCUMENTS
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => {
    try {
      const saved = localStorage.getItem('speechlekha_documents');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DOCUMENTS;
  });

  const [currentDocId, setCurrentDocId] = useState<string>('01-photosynthesis');

  // Load sessions from localStorage
  const [sessions, setSessions] = useState<VoiceSession[]>(() => {
    try {
      const saved = localStorage.getItem('speechlekha_sessions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [DEMO_SESSION];
  });

  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(DEMO_SESSION);

  // Load settings from localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('speechlekha_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedVaultFolder, setSelectedVaultFolder] = useState<string>('Biology');

  // Voice session states
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechPhase, setSpeechPhase] = useState<'LISTENING' | 'UNDERSTANDING' | 'STRUCTURING' | 'SAVING'>('LISTENING');
  const [liveTranscript, setLiveTranscript] = useState(TRANSCRIPT_CHUNKS[0]);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>(AGENT_TASKS_INITIAL);
  const [audioState, setAudioState] = useState<AudioVisualizerState | null>(null);

  const addToast = useCallback((title: string, description?: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Timer & Transcription progression during recording
  useEffect(() => {
    if (!isListening || isPaused) return;

    const timer = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isListening, isPaused]);

  // Phase and task transitions during recording
  useEffect(() => {
    if (!isListening || isPaused) return;

    const sec = recordingSeconds;
    
    // Chunk progression
    const chunkIdx = Math.min(TRANSCRIPT_CHUNKS.length - 1, Math.floor(sec / 3));
    setLiveTranscript(TRANSCRIPT_CHUNKS.slice(0, chunkIdx + 1).join(' '));

    // Phase management
    if (sec < 4) {
      setSpeechPhase('LISTENING');
    } else if (sec < 9) {
      setSpeechPhase('UNDERSTANDING');
    } else if (sec < 14) {
      setSpeechPhase('STRUCTURING');
    } else {
      setSpeechPhase('SAVING');
    }

    // Task progression
    const activeTaskIndex = Math.min(agentTasks.length - 1, Math.floor(sec / 2.5));
    setAgentTasks(prev => prev.map((t, i) => {
      if (i < activeTaskIndex) return { ...t, status: 'done' };
      if (i === activeTaskIndex) return { ...t, status: 'running' };
      return { ...t, status: 'pending' };
    }));
  }, [recordingSeconds, isListening, isPaused]);

  const startSpeaking = async (suppressToast: boolean = false) => {
    try {
      const audio = await initAudioCapture();
      setAudioState(audio);
      setRecordingSeconds(0);
      setIsListening(true);
      setIsPaused(false);
      setSpeechPhase('LISTENING');
      setLiveTranscript(TRANSCRIPT_CHUNKS[0]);
      setAgentTasks(AGENT_TASKS_INITIAL.map((t, idx) => idx === 0 ? { ...t, status: 'running' } : { ...t, status: 'pending' }));
      if (!suppressToast) {
        addToast('Microphone Active', 'SpeechLekha is transcribing and organizing your thoughts.', 'info');
      }
    } catch (e) {
      console.error('Failed to start speaking', e);
      if (!suppressToast) {
        addToast('Microphone Ready', 'Running in local streaming synthesis mode.', 'info');
      }
      setIsListening(true);
    }
  };

  const stopSpeaking = (): VoiceSession => {
    stopAudioCapture(audioState);
    setAudioState(null);
    setIsListening(false);
    setIsPaused(false);
    setAgentTasks(prev => prev.map(t => ({ ...t, status: 'done' })));
    setSpeechPhase('SAVING');

    const durationStr = `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`;
    const newSession: VoiceSession = {
      ...DEMO_SESSION,
      id: `session-${Date.now()}`,
      duration: durationStr === '00:00' ? '00:42' : durationStr,
      durationSeconds: recordingSeconds || 42,
      transcript: liveTranscript || DEMO_SESSION.transcript,
      date: 'Today · Just now'
    };

    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem('speechlekha_sessions', JSON.stringify(updated));
      return updated;
    });
    setCurrentSession(newSession);
    addToast('Session Saved', `${newSession.durationSeconds}s of speech converted to structured knowledge.`, 'success');
    return newSession;
  };

  const pauseSpeaking = () => {
    setIsPaused(true);
    addToast('Session Paused', 'Audio stream paused.', 'info');
  };

  const resumeSpeaking = () => {
    setIsPaused(false);
    addToast('Session Resumed', 'Listening to voice stream.', 'info');
  };

  const cancelSpeaking = () => {
    stopAudioCapture(audioState);
    setAudioState(null);
    setIsListening(false);
    setIsPaused(false);
    setRecordingSeconds(0);
    addToast('Session Cancelled', 'Voice session was discarded.', 'warning');
  };

  const saveDocument = (id: string, content: string, title?: string) => {
    setDocuments((prev) => {
      const updated = prev.map((doc) => {
        if (doc.id === id) {
          const firstHeader = content.match(/^#\s+(.+)$/m);
          const computedTitle = title || (firstHeader ? firstHeader[1] : doc.title);
          return {
            ...doc,
            content,
            title: computedTitle,
            updatedAt: 'Saved just now',
            preview: content.replace(/[#*`_\[\]]/g, '').slice(0, 160) + '...'
          };
        }
        return doc;
      });
      localStorage.setItem('speechlekha_documents', JSON.stringify(updated));
      return updated;
    });
    addToast('Document Saved', `Changes written to ${id}.md`, 'success');
  };

  const createNewDocument = (folder: string = 'Biology', title: string = 'Untitled Note'): string => {
    const newId = `note-${Date.now().toString(36)}`;
    const newDoc: KnowledgeDocument = {
      id: newId,
      filename: `${newId}.md`,
      title,
      folder,
      updatedAt: 'Created just now',
      linksCount: 0,
      linkedConcepts: [],
      tags: ['draft'],
      preview: 'Start speaking or typing to expand your knowledge vault...',
      content: `# ${title}\n\n*Created on ${new Date().toLocaleDateString()}*\n\nStart speaking or writing here...\n\n## Key Ideas\n- \n\n## Wikilinks\n[[Knowledge Vault]]`
    };
    setDocuments(prev => {
      const updated = [newDoc, ...prev];
      localStorage.setItem('speechlekha_documents', JSON.stringify(updated));
      return updated;
    });
    setCurrentDocId(newId);
    addToast('New Note Created', `Saved in ${folder}`, 'success');
    return newId;
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('speechlekha_settings', JSON.stringify(updated));
      return updated;
    });
    addToast('Settings Saved', 'Preferences have been updated locally.', 'success');
  };

  // Keyboard shortcut listener for Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentDocument = documents.find((d) => d.id === currentDocId) || documents[0];

  return (
    <AppContext.Provider
      value={{
        documents,
        currentDocId,
        setCurrentDocId,
        currentDocument,
        saveDocument,
        createNewDocument,
        isListening,
        isPaused,
        recordingSeconds,
        speechPhase,
        liveTranscript,
        agentTasks,
        audioState,
        startSpeaking,
        stopSpeaking,
        pauseSpeaking,
        resumeSpeaking,
        cancelSpeaking,
        sessions,
        currentSession,
        settings,
        updateSettings,
        toasts,
        addToast,
        removeToast,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        selectedVaultFolder,
        setSelectedVaultFolder
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
