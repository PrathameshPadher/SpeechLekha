import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MessageSquareText,
  Brain,
  FileCode,
  Share2,
  HardDrive,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Workflow
} from 'lucide-react';
import { MarketingPageLayout } from '../components/layout/MarketingPageLayout';

export const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();

  const phases = [
    {
      num: '01',
      title: 'SPEAK',
      headline: 'Just talk. No formatting required.',
      body: 'Whether attending an advanced biology lecture, thinking out loud about system architectures, or debating a strategy, simply click record and speak naturally. SpeechLekha captures your raw acoustic train of thought without requiring structured syntax.',
      icon: Mic,
      features: [
        'Voice Activity Detection (VAD)',
        'Automatic silence trimming',
        'Background noise filtering'
      ]
    },
    {
      num: '02',
      title: 'TRANSCRIBE',
      headline: 'Your voice becomes accurate text.',
      body: 'Speech frames stream directly into an on-device Whisper model. Words are transcribed with sub-second latency and acoustic confidence scoring, accurately recognizing technical terms, biological taxa, and mathematical notations.',
      icon: MessageSquareText,
      features: [
        'Whisper Large-v3 architecture',
        '99.4% average precision',
        'Local streaming tokenization'
      ]
    },
    {
      num: '03',
      title: 'UNDERSTAND',
      headline: 'The agent identifies concepts, entities and intent.',
      body: 'SpeechLekha does not just capture words; it parses meaning. The autonomous agent detects core scientific themes, taxonomy, definitions, and taxonomic hierarchies, extracting key concepts in real time.',
      icon: Brain,
      features: [
        'Named Entity Recognition (NER)',
        'Ontological concept classification',
        'Context-aware disambiguation'
      ]
    },
    {
      num: '04',
      title: 'STRUCTURE',
      headline: 'Speech becomes clean Markdown knowledge.',
      body: 'Unstructured spoken sentences are automatically synthesized into pristine Markdown with clean hierarchy, bulleted takeaways, LaTeX formulas, and comparison tables for immediate reading clarity.',
      icon: FileCode,
      features: [
        'Automatic headings & subheadings',
        'LaTeX equation formatting',
        'Dynamic 3x3 comparison tables'
      ]
    },
    {
      num: '05',
      title: 'CONNECT',
      headline: 'Related ideas become linked automatically.',
      body: 'As entities are discovered, SpeechLekha cross-references your entire knowledge vault. It synthesizes bidirectional [[wikilinks]], weaving new insights into an organic 3D knowledge graph.',
      icon: Share2,
      features: [
        'Bidirectional [[wikilink]] generation',
        'Knowledge graph edge calculation',
        'Concept clustering algorithms'
      ]
    },
    {
      num: '06',
      title: 'SAVE',
      headline: 'Everything becomes part of your knowledge base.',
      body: 'Every session is immediately committed to your self-hosted vault as plain Markdown files. You own 100% of your data, accessible offline and compatible with Obsidian, VS Code, and any text editor.',
      icon: HardDrive,
      features: [
        'Plain text .md persistence',
        'Zero proprietary database lock-in',
        '100% Offline & Self-hosted'
      ]
    }
  ];

  return (
    <MarketingPageLayout pageClass="how-it-works-page">
      {/* HERO SECTION */}
      <section className="marketing-hero-section">
        <div className="marketing-eyebrow-pill">
          <Workflow size={13} className="eyebrow-icon" />
          <span>HOW SPEECHLEKHA WORKS</span>
        </div>

        <h1 className="marketing-editorial-title">
          From voice to<br />
          <em>structured knowledge.</em>
        </h1>

        <p className="marketing-lead-text">
          Discover the six continuous stages that turn spontaneous human speech into an organized,
          permanent personal knowledge base.
        </p>

        <div className="marketing-hero-cta-group">
          <button className="marketing-btn-primary" onClick={() => navigate('/speak')}>
            <Mic size={18} />
            <span>Try Live Speaking</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 6 CHRONOLOGICAL STORYTELLING PHASES */}
      <section className="marketing-section marketing-timeline-section">
        <div className="marketing-section-header">
          <span className="marketing-section-tag">STEP-BY-STEP BREAKDOWN</span>
          <h2 className="marketing-section-title">The Six Phases of Synthesis</h2>
          <p className="marketing-section-subtitle">
            A real-time cognitive pipeline converting voice acoustics into permanent structured intellect.
          </p>
        </div>

        <div className="marketing-timeline-container">
          <div className="marketing-timeline-track" aria-hidden="true" />

          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <div key={phase.num} className="marketing-phase-row">
                {/* Left Indicator Column */}
                <div className="phase-indicator-col">
                  <div className="phase-badge-node">
                    <Icon size={18} className="phase-node-icon" />
                    <span className="phase-node-num">{phase.num}</span>
                  </div>
                  {index < phases.length - 1 && (
                    <div className="phase-connector-line" aria-hidden="true" />
                  )}
                </div>

                {/* Right Phase Card */}
                <div className="marketing-phase-card">
                  <div className="phase-card-header">
                    <span className="phase-tag">PHASE {phase.num} — {phase.title}</span>
                    <h3 className="phase-headline">{phase.headline}</h3>
                  </div>

                  <p className="phase-body-text">{phase.body}</p>

                  <div className="phase-features-block">
                    <h4 className="phase-features-title">Core Capabilities:</h4>
                    <ul className="phase-features-vertical-list">
                      {phase.features.map((feature) => (
                        <li key={feature} className="phase-feature-item">
                          <div className="check-icon-circle">
                            <CheckCircle2 size={15} />
                          </div>
                          <span className="phase-feature-text">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="marketing-section marketing-cta-banner-section">
        <div className="marketing-cta-banner-box">
          <div className="cta-banner-content">
            <h2 className="cta-banner-title">Experience the entire pipeline in 45 seconds.</h2>
            <p className="cta-banner-subtitle">
              Start a recording session and watch your knowledge structure itself live.
            </p>
            <button className="marketing-btn-primary cta-banner-btn" onClick={() => navigate('/speak')}>
              <Mic size={18} />
              <span>Start Speaking</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
};
