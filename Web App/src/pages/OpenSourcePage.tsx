import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  HardDrive,
  FileCode,
  Layers,
  Cloud,
  Github,
  ExternalLink,
  Mic,
  ArrowRight,
  Terminal,
  Copy,
  Check,
  Code2,
  Lock,
  Cpu
} from 'lucide-react';
import { MarketingPageLayout } from '../components/layout/MarketingPageLayout';

export const OpenSourcePage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const pillars = [
    {
      num: '01',
      title: 'Self-Hosted & Private',
      icon: ShieldCheck,
      description: 'Run the entire Whisper ASR pipeline and knowledge graph engine on your own localhost or home server. Zero third-party telemetry.'
    },
    {
      num: '02',
      title: 'Plain Markdown Storage',
      icon: FileCode,
      description: 'All notes are stored as standard UTF-8 .md files with YAML frontmatter. Open them in Obsidian, Logseq, VS Code, or Git.'
    },
    {
      num: '03',
      title: 'Open Architecture',
      icon: Layers,
      description: 'Modular speech pipelines with pluggable ASR decoders (Whisper, Vosk, Kaldi) and structured LLM extraction runtimes.'
    },
    {
      num: '04',
      title: 'AWS & Cloud Ready',
      icon: Cloud,
      description: 'Deployable as an on-premise container or inside your private AWS VPC using Terraform and Docker Compose.'
    },
    {
      num: '05',
      title: 'Your Knowledge Stays Yours',
      icon: HardDrive,
      description: 'No vendor lock-in, no proprietary binary databases, and no monthly cloud subscriptions required to access your own thoughts.'
    },
    {
      num: '06',
      title: 'Open Source',
      icon: Code2,
      description: 'Apache 2.0 licensed. Fully extensible, community audited, and built on transparent open-source foundations.'
    }
  ];

  const quickstartCode = `# 1. Clone repository
git clone https://github.com/speechlekha/speechlekha.git
cd speechlekha

# 2. Install dependencies & launch local engine
npm install
npm run dev

# SpeechLekha daemon running at http://localhost:5173
# 100% offline knowledge vault initialized at ~/SpeechLekha/Vault`;

  const handleCopy = () => {
    navigator.clipboard.writeText(quickstartCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MarketingPageLayout pageClass="open-source-page">
      {/* HERO SECTION */}
      <section className="marketing-hero-section">
        <div className="marketing-eyebrow-pill">
          <Lock size={13} className="eyebrow-icon" />
          <span>OPEN SOURCE / PRIVATE BY DESIGN</span>
        </div>

        <h1 className="marketing-editorial-title">
          Open source.<br />
          <em>Your knowledge stays yours.</em>
        </h1>

        <p className="marketing-lead-text">
          SpeechLekha is built on the belief that personal thoughts, voice recordings, and knowledge bases
          belong entirely to the creator. Designed for local execution, self-hosting, and complete privacy.
        </p>

        <div className="marketing-hero-cta-group">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="marketing-btn-secondary github-cta-btn"
          >
            <Github size={18} />
            <span>View Source on GitHub</span>
            <ExternalLink size={14} />
          </a>

          <button className="marketing-btn-primary" onClick={() => navigate('/speak')}>
            <Mic size={18} />
            <span>Start Speaking</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 6 FEATURE PILLARS GRID */}
      <section className="marketing-section">
        <div className="marketing-section-header">
          <span className="marketing-section-tag">PHILOSOPHICAL FOUNDATIONS</span>
          <h2 className="marketing-section-title">Built on open standards & privacy</h2>
          <p className="marketing-section-subtitle">
            Designed from the metal up for true digital sovereignty and zero vendor lock-in.
          </p>
        </div>

        <div className="marketing-pipeline-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.num} className="marketing-pipeline-card open-source-pillar-card">
                <div className="pipeline-card-top">
                  <span className="pipeline-card-number">{pillar.num}</span>
                  <div className="pipeline-card-icon-wrap">
                    <Icon size={18} />
                  </div>
                </div>

                <h3 className="pipeline-card-title">{pillar.title}</h3>
                <p className="pipeline-card-desc">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* QUICKSTART TERMINAL CODE BLOCK */}
      <section className="marketing-section marketing-terminal-section">
        <div className="marketing-section-header">
          <span className="marketing-section-tag">DEVELOPER QUICKSTART</span>
          <h2 className="marketing-section-title">Run locally in under two minutes</h2>
          <p className="marketing-section-subtitle">
            Zero cloud configuration. Works out of the box with Node.js and modern Web Audio APIs.
          </p>
        </div>

        <div className="marketing-terminal-card">
          <div className="terminal-header-bar">
            <div className="terminal-controls">
              <span className="term-dot term-dot-red" />
              <span className="term-dot term-dot-yellow" />
              <span className="term-dot term-dot-green" />
            </div>

            <div className="terminal-title">
              <Terminal size={14} />
              <span>bash — speechlekha-quickstart</span>
            </div>

            <button
              className="terminal-copy-btn"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check size={14} className="copied-icon" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="terminal-code-body">
            <code>{quickstartCode}</code>
          </pre>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="marketing-section marketing-cta-banner-section">
        <div className="marketing-cta-banner-box">
          <div className="cta-banner-content">
            <h2 className="cta-banner-title">Start your local knowledge vault today.</h2>
            <p className="cta-banner-subtitle">
              No account required. Runs entirely on your machine with 100% data sovereignty.
            </p>
            <button className="marketing-btn-primary cta-banner-btn" onClick={() => navigate('/speak')}>
              <Mic size={18} />
              <span>Launch SpeechLekha</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
};
