export interface KnowledgeDocument {
  id: string;
  filename: string;
  title: string;
  folder: string;
  content: string;
  updatedAt: string;
  linksCount: number;
  linkedConcepts: string[];
  tags: string[];
  preview: string;
}

export interface VoiceSession {
  id: string;
  title: string;
  folder: string;
  date: string;
  duration: string;
  durationSeconds: number;
  transcript: string;
  confidence: number;
  keyConcepts: {
    title: string;
    description: string;
    category: string;
    confidence: number;
  }[];
  connections: {
    source: string;
    target: string;
    relation: string;
  }[];
  generatedMarkdown: string;
}

export interface AgentTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'done';
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  val: number;
  docId?: string;
  description: string;
  connectionsCount: number;
  mentionsCount: number;
  relatedConcepts: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
  strength?: number;
}

export interface UserSettings {
  general: {
    appearance: 'cinematic' | 'obsidian' | 'midnight';
    language: string;
    fontSize: 'compact' | 'standard' | 'large';
    keyboardShortcuts: boolean;
  };
  voice: {
    microphone: string;
    speechModel: string;
    noiseSuppression: boolean;
    autoDetectLanguage: boolean;
    confidenceThreshold: number;
  };
  ai: {
    proactiveStructuring: boolean;
    autoWikilinks: boolean;
    autoDiagrams: boolean;
    autoOrganize: boolean;
    summaryDetail: 'concise' | 'balanced' | 'comprehensive';
  };
  knowledge: {
    defaultVault: string;
    markdownFormat: 'obsidian' | 'standard' | 'extended';
    autoSaveInterval: number;
    bidirectionalLinks: boolean;
  };
  privacy: {
    localProcessing: boolean;
    selfHostedMode: boolean;
    telemetry: boolean;
    dataRetentionDays: number;
  };
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning';
}
