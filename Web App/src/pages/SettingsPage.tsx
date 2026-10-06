import React, { useState } from 'react';
import {
  Sliders,
  Mic,
  Sparkles,
  FolderOpen,
  Shield,
  Info,
  Check,
  HardDrive,
  Github,
  Save,
  Download,
  Trash2
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, addToast } = useApp();
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeSection, setActiveSection] = useState<'general' | 'voice' | 'ai' | 'knowledge' | 'privacy' | 'about'>('general');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggle = (category: keyof typeof settings, field: string) => {
    const currentCategory = localSettings[category] as Record<string, any>;
    const updatedCategory = {
      ...currentCategory,
      [field]: !currentCategory[field]
    };
    const updated = {
      ...localSettings,
      [category]: updatedCategory
    };
    setLocalSettings(updated);
    updateSettings(updated);
  };

  const handleSelectChange = (category: keyof typeof settings, field: string, value: any) => {
    const currentCategory = localSettings[category] as Record<string, any>;
    const updatedCategory = {
      ...currentCategory,
      [field]: value
    };
    const updated = {
      ...localSettings,
      [category]: updatedCategory
    };
    setLocalSettings(updated);
    updateSettings(updated);
  };

  const handleBackupVault = () => {
    addToast('Vault Backed Up', 'Exported full encrypted vault backup archive.', 'success');
  };

  return (
    <div className="workspace">
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="main settings-page-main">
        <TopHeader
          breadcrumbs={['SYSTEM', 'PREFERENCES']}
          title="Settings"
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="settings-container">
          {/* SETTINGS NAV TABS */}
          <div className="settings-nav-tabs">
            <button
              className={`settings-tab-btn ${activeSection === 'general' ? 'active' : ''}`}
              onClick={() => setActiveSection('general')}
            >
              <Sliders size={14} />
              <span>General</span>
            </button>
            <button
              className={`settings-tab-btn ${activeSection === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveSection('voice')}
            >
              <Mic size={14} />
              <span>Voice</span>
            </button>
            <button
              className={`settings-tab-btn ${activeSection === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveSection('ai')}
            >
              <Sparkles size={14} />
              <span>AI & Agent</span>
            </button>
            <button
              className={`settings-tab-btn ${activeSection === 'knowledge' ? 'active' : ''}`}
              onClick={() => setActiveSection('knowledge')}
            >
              <FolderOpen size={14} />
              <span>Knowledge</span>
            </button>
            <button
              className={`settings-tab-btn ${activeSection === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveSection('privacy')}
            >
              <Shield size={14} />
              <span>Privacy</span>
            </button>
            <button
              className={`settings-tab-btn ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => setActiveSection('about')}
            >
              <Info size={14} />
              <span>About</span>
            </button>
          </div>

          {/* SETTINGS CONTENT BODY */}
          <div className="settings-body-card">
            {/* GENERAL SECTION */}
            {activeSection === 'general' && (
              <div className="settings-section">
                <div className="section-head">
                  <h2>General Preferences</h2>
                  <p>Customize user interface themes, typography, and interaction modes.</p>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Appearance Theme</strong>
                    <small>Select the dark visual aesthetic for your workspace</small>
                  </div>
                  <select
                    value={localSettings.general.appearance}
                    onChange={(e) => handleSelectChange('general', 'appearance', e.target.value)}
                  >
                    <option value="cinematic">Cinematic Deep Navy (Default)</option>
                    <option value="obsidian">Obsidian Pitch Dark</option>
                    <option value="midnight">Midnight Cyan</option>
                  </select>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Interface Language</strong>
                    <small>Language for system menus, commands, and headers</small>
                  </div>
                  <select
                    value={localSettings.general.language}
                    onChange={(e) => handleSelectChange('general', 'language', e.target.value)}
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="Hindi (हिंदी)">Hindi (हिंदी)</option>
                    <option value="Sanskrit (संस्कृतम्)">Sanskrit (संस्कृतम्)</option>
                    <option value="German (Deutsch)">German (Deutsch)</option>
                  </select>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Keyboard Shortcuts</strong>
                    <small>Enable ⌘K command palette, Esc to close, and quick voice hotkeys</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={localSettings.general.keyboardShortcuts}
                      onChange={() => handleToggle('general', 'keyboardShortcuts')}
                    />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
            )}

            {/* VOICE SECTION */}
            {activeSection === 'voice' && (
              <div className="settings-section">
                <div className="section-head">
                  <h2>Voice & ASR Engine</h2>
                  <p>Configure speech-to-text models, microphone hardware, and noise gates.</p>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Microphone Device</strong>
                    <small>Selected hardware audio capture interface</small>
                  </div>
                  <select
                    value={localSettings.voice.microphone}
                    onChange={(e) => handleSelectChange('voice', 'microphone', e.target.value)}
                  >
                    <option value="Default - Internal High Definition Microphone">Default - Internal High Definition Microphone</option>
                    <option value="External USB Condenser Microphone">External USB Condenser Microphone</option>
                    <option value="Bluetooth Headset Array">Bluetooth Headset Array</option>
                  </select>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Speech Recognition Model</strong>
                    <small>On-device quantized transformer model for speech transcription</small>
                  </div>
                  <select
                    value={localSettings.voice.speechModel}
                    onChange={(e) => handleSelectChange('voice', 'speechModel', e.target.value)}
                  >
                    <option value="Whisper Large-v3 (Local Quantized)">Whisper Large-v3 (Local Quantized · 99.4% conf)</option>
                    <option value="Whisper Medium.en (Fast)">Whisper Medium.en (Fast · Low Latency)</option>
                    <option value="SpeechLekha Neural Stream ASR">SpeechLekha Neural Stream ASR (Multilingual)</option>
                  </select>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Hardware Noise Suppression</strong>
                    <small>Filter background keyboard typing, room reverb, and hum</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={localSettings.voice.noiseSuppression}
                      onChange={() => handleToggle('voice', 'noiseSuppression')}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Auto-Detect Language</strong>
                    <small>Automatically detect spoken language transitions in real time</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={localSettings.voice.autoDetectLanguage}
                      onChange={() => handleToggle('voice', 'autoDetectLanguage')}
                    />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
            )}

            {/* AI & AGENT SECTION */}
            {activeSection === 'ai' && (
              <div className="settings-section">
                <div className="section-head">
                  <h2>AI & Autonomous Agent</h2>
                  <p>Control knowledge structuring behavior, entity extraction, and linking.</p>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Auto-Organize Spoken Knowledge</strong>
                    <small>Structure continuous speech into formatted headings, bullet points, and tables</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={localSettings.ai.autoOrganize}
                      onChange={() => handleToggle('ai', 'autoOrganize')}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Create [[Wikilinks]] Automatically</strong>
                    <small>Detect concept entities and synthesize bidirectional vault links</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={localSettings.ai.autoWikilinks}
                      onChange={() => handleToggle('ai', 'autoWikilinks')}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Generate Diagrams Automatically</strong>
                    <small>Render ASCII & Mermaid pathway graphs when scientific sequences are spoken</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={localSettings.ai.autoDiagrams}
                      onChange={() => handleToggle('ai', 'autoDiagrams')}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Agent Proactive Structuring</strong>
                    <small>Continuously update live output before the recording finishes</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={localSettings.ai.proactiveStructuring}
                      onChange={() => handleToggle('ai', 'proactiveStructuring')}
                    />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
            )}

            {/* KNOWLEDGE SECTION */}
            {activeSection === 'knowledge' && (
              <div className="settings-section">
                <div className="section-head">
                  <h2>Knowledge Vault & Storage</h2>
                  <p>Manage file paths, markdown formatting standards, and auto-backup schedules.</p>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Default Vault Location</strong>
                    <small>Local directory where all .md files and indexes are written</small>
                  </div>
                  <input
                    type="text"
                    className="path-input"
                    value={localSettings.knowledge.defaultVault}
                    onChange={(e) => handleSelectChange('knowledge', 'defaultVault', e.target.value)}
                  />
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Markdown Format</strong>
                    <small>Choose compatibility flavor for external editors</small>
                  </div>
                  <select
                    value={localSettings.knowledge.markdownFormat}
                    onChange={(e) => handleSelectChange('knowledge', 'markdownFormat', e.target.value)}
                  >
                    <option value="obsidian">Obsidian-compatible ([[wikilinks]] + YAML frontmatter)</option>
                    <option value="standard">Standard GitHub Flavored Markdown</option>
                    <option value="extended">Extended LaTeX & Mermaid Markdown</option>
                  </select>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Backup & Export</strong>
                    <small>Create an offline snapshot of your complete vault and concept graphs</small>
                  </div>
                  <button className="secondary-action-btn" onClick={handleBackupVault}>
                    <Download size={14} />
                    <span>Backup Vault</span>
                  </button>
                </div>
              </div>
            )}

            {/* PRIVACY SECTION */}
            {activeSection === 'privacy' && (
              <div className="settings-section">
                <div className="section-head">
                  <h2>Privacy & Self-Hosting</h2>
                  <p>100% data sovereignty. All voice recognition and knowledge processing runs on your device.</p>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Local Processing Mode</strong>
                    <small>Enforce zero outbound cloud telemetry or audio transmission</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={localSettings.privacy.localProcessing}
                      onChange={() => handleToggle('privacy', 'localProcessing')}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Self-Hosted Daemon Mode</strong>
                    <small>Connect to local SpeechLekha background daemon (localhost:7447)</small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={localSettings.privacy.selfHostedMode}
                      onChange={() => handleToggle('privacy', 'selfHostedMode')}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="setting-row">
                  <div>
                    <strong>Data Retention</strong>
                    <small>Audio recordings are processed in RAM and automatically purged upon session save</small>
                  </div>
                  <span className="status-badge-inline">Ephemeral (Zero-Retention)</span>
                </div>
              </div>
            )}

            {/* ABOUT SECTION */}
            {activeSection === 'about' && (
              <div className="settings-section about-section">
                <div className="about-brand-box">
                  <div className="about-logo">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3>SpeechLekha</h3>
                    <p>Voice-to-Knowledge Platform · Intelligent Self-Hosted Vault</p>
                  </div>
                </div>

                <div className="about-meta-grid">
                  <div className="about-meta-item">
                    <label>VERSION</label>
                    <strong>v1.4.2 (Stable)</strong>
                  </div>
                  <div className="about-meta-item">
                    <label>ARCHITECTURE</label>
                    <strong>React + Vite + Whisper Neural ASR</strong>
                  </div>
                  <div className="about-meta-item">
                    <label>LICENSE</label>
                    <strong>Apache 2.0 Open Source</strong>
                  </div>
                  <div className="about-meta-item">
                    <label>NODE STATUS</label>
                    <strong className="status-online">● Localhost:7447 Online</strong>
                  </div>
                </div>

                <div className="about-actions-row">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="ghost-btn"
                  >
                    <Github size={14} />
                    <span>View GitHub Repository</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
