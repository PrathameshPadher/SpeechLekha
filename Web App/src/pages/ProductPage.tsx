import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  AudioWaveform,
  Cpu,
  Layers,
  Network,
  Database,
  ArrowRight,
  CheckCircle2,
  FileText,
  Sparkles,
  Zap,
  Lock,
  Compass
} from 'lucide-react';
import { MarketingPageLayout } from '../components/layout/MarketingPageLayout';

export const ProductPage: React.FC = () => {
  const navigate = useNavigate();

  const pipelineCards = [
    {
      num: '01',
      title: 'VOICE',
      category: 'Raw Audio Capture',
      icon: Mic,
      description: 'Speak freely and conversationally. No formatting commands, structured syntax, or punctuation cues needed.'
    },
    {
      num: '02',
      title: 'TRANSCRIPTION',
      category: 'Whisper Large-v3 ASR',
      icon: AudioWaveform,
      description: 'Streaming 16kHz audio decoded with sub-second latency, recognizing complex jargon and multi-language terms.'
    },
    {
      num: '03',
      title: 'UNDERSTANDING',
      category: 'Semantic Entity Extraction',
      icon: Cpu,
      description: 'Autonomous agent parses scientific concepts, entity relationships, and categorical hierarchies in real time.'
    },
    {
      num: '04',
      title: 'STRUCTURE',
      category: 'Hierarchical Markdown',
      icon: Layers,
      description: 'Generates clean headers, bulleted takeaways, LaTeX formulas, and comparison matrices without manual formatting.'
    },
    {
      num: '05',
      title: 'CONNECTIONS',
      category: 'Bidirectional [[Wikilinks]]',
      icon: Network,
      description: 'Cross-links newly spoken topics with existing concepts across your personal knowledge vault graph.'
    },
    {
      num: '06',
      title: 'KNOWLEDGE',
      category: 'Self-Hosted Vault',
      icon: Database,
      description: 'Persists atomic, Obsidian-compatible Markdown files directly to your private local drive with 100% data sovereignty.'
    }
  ];

  return (
    <MarketingPageLayout pageClass="product-page">
      {/* HERO SECTION */}
      <section className="marketing-hero-section">
        <div className="marketing-eyebrow-pill">
          <Sparkles size={13} className="eyebrow-icon" />
          <span>VOICE-DRIVEN KNOWLEDGE OS</span>
        </div>

        <h1 className="marketing-editorial-title">
          Your voice becomes<br />
          <em>structured knowledge.</em>
        </h1>

        <p className="marketing-lead-text">
          Speak naturally during lectures, research sessions, or team discussions. SpeechLekha listens,
          understands your concepts, structures the information, connects related ideas, and updates your
          personal knowledge base in real time.
        </p>

        <div className="marketing-hero-cta-group">
          <button className="marketing-btn-primary" onClick={() => navigate('/speak')}>
            <Mic size={18} />
            <span>Start Speaking</span>
            <ArrowRight size={16} />
          </button>
          <button className="marketing-btn-secondary" onClick={() => navigate('/app')}>
            <Compass size={16} />
            <span>Explore Workspace</span>
          </button>
        </div>
      </section>

      {/* 6 PIPELINE CARDS GRID */}
      <section className="marketing-section">
        <div className="marketing-section-header">
          <span className="marketing-section-tag">THE ARCHITECTURAL PIPELINE</span>
          <h2 className="marketing-section-title">How voice transforms into thought</h2>
          <p className="marketing-section-subtitle">
            From acoustic vibrations to an interconnected semantic knowledge graph.
          </p>
        </div>

        <div className="marketing-pipeline-grid">
          {pipelineCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.num} className="marketing-pipeline-card">
                <div className="pipeline-card-top">
                  <span className="pipeline-card-number">{card.num}</span>
                  <div className="pipeline-card-icon-wrap">
                    <Icon size={18} />
                  </div>
                </div>

                <span className="pipeline-card-category">{card.category}</span>
                <h3 className="pipeline-card-title">{card.title}</h3>
                <p className="pipeline-card-desc">{card.description}</p>

                <div className="pipeline-card-arrow-row">
                  <span className="pipeline-card-arrow-text">Phase {card.num}</span>
                  <ArrowRight size={14} className="pipeline-card-arrow-icon" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTINUOUS ADAPTATION SHOWCASE */}
      <section className="marketing-section marketing-feature-showcase-section">
        <div className="marketing-showcase-grid">
          {/* Left Text Block */}
          <div className="marketing-showcase-text">
            <span className="marketing-section-tag">CONTINUOUS ADAPTATION</span>
            <h2 className="marketing-showcase-heading">No note-taking friction. Ever.</h2>
            <p className="marketing-showcase-p">
              Traditional note-taking forces you to choose between actively listening and typing. SpeechLekha runs in
              the background, synthesizing comprehensive Markdown notes with key concepts, data tables, and
              diagrams while your hands stay completely free.
            </p>

            <ul className="marketing-check-list">
              <li className="marketing-check-item">
                <div className="check-icon-circle">
                  <CheckCircle2 size={16} />
                </div>
                <span>100% On-device Whisper neural transcription</span>
              </li>
              <li className="marketing-check-item">
                <div className="check-icon-circle">
                  <CheckCircle2 size={16} />
                </div>
                <span>Dynamic Markdown table & equation synthesis</span>
              </li>
              <li className="marketing-check-item">
                <div className="check-icon-circle">
                  <CheckCircle2 size={16} />
                </div>
                <span>Zero manual tag management or file naming</span>
              </li>
            </ul>
          </div>

          {/* Right Preview Card */}
          <div className="marketing-showcase-preview">
            <div className="marketing-doc-mockup-panel">
              <div className="doc-mockup-header">
                <div className="doc-mockup-file-info">
                  <FileText size={15} />
                  <span>01-photosynthesis.md</span>
                </div>
                <span className="doc-mockup-badge">
                  <span className="doc-live-dot" />
                  Live Synced
                </span>
              </div>

              <div className="doc-mockup-body">
                <h4 className="doc-mockup-title"># Photosynthesis & C4 Bioenergetics</h4>
                <p className="doc-mockup-excerpt">
                  Synthesized from 42s of spoken explanation into 3 core concept nodes with chemical reaction notation:
                </p>

                <div className="doc-mockup-table">
                  <div className="mock-tr mock-th">
                    <span>Phase</span>
                    <span>Location</span>
                    <span>Energy Yield</span>
                  </div>
                  <div className="mock-tr">
                    <span>Light Reactions</span>
                    <span>Thylakoid</span>
                    <span>ATP + NADPH</span>
                  </div>
                  <div className="mock-tr">
                    <span>Calvin Cycle</span>
                    <span>Stroma</span>
                    <span>G3P / Glucose</span>
                  </div>
                </div>

                <div className="doc-mockup-wikilinks">
                  <span className="mockup-link-pill">[[Chlorophyll]]</span>
                  <span className="mockup-link-pill">[[Calvin Cycle]]</span>
                  <span className="mockup-link-pill">[[C3 Plants]]</span>
                  <span className="mockup-link-pill">[[Rubisco]]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="marketing-section marketing-cta-banner-section">
        <div className="marketing-cta-banner-box">
          <div className="cta-banner-content">
            <h2 className="cta-banner-title">Ready to transform how you learn and think?</h2>
            <p className="cta-banner-subtitle">
              Experience voice-to-knowledge with zero cloud telemetry and 100% private data storage.
            </p>
            <button className="marketing-btn-primary cta-banner-btn" onClick={() => navigate('/speak')}>
              <Mic size={18} />
              <span>Start Speaking Now</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
};
