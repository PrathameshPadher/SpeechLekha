import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  Bookmark,
  ArrowLeft,
  FileText,
  Copy,
  Layers,
  ArrowRight,
  Zap,
  Cpu
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';

export const DiagramPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  const presets = [
    {
      id: 'z-scheme',
      name: 'Light-Dependent Reactions (Z-Scheme)',
      prompt: 'Create a diagram showing the light-dependent reactions and non-cyclic electron transport.',
      diagramType: 'Flowchart',
      renderType: 'z-scheme'
    },
    {
      id: 'calvin-cycle',
      name: 'Calvin Cycle 3-Stage Mechanism',
      prompt: 'Create a circular metabolic diagram showing carbon fixation, reduction, and RuBP regeneration.',
      diagramType: 'Cycle Graph',
      renderType: 'calvin'
    },
    {
      id: 'c4-anatomy',
      name: 'C3 vs C4 Kranz Leaf Anatomy',
      prompt: 'Create a cross-sectional diagram comparing mesophyll and bundle sheath compartmentalization.',
      diagramType: 'Spatial Map',
      renderType: 'c4'
    }
  ];

  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [customPrompt, setCustomPrompt] = useState(presets[0].prompt);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedPreset(p);
    setCustomPrompt(p.prompt);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      addToast('Diagram Rendered', 'Updated pathway nodes and electron carriers.', 'success');
    }, 500);
  };

  const handleSaveToKnowledge = () => {
    addToast('Saved to Diagrams Vault', 'Appended schematic to Biology/diagrams.md', 'success');
  };

  return (
    <div className="workspace">
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      <main className="main diagram-page-main">
        <TopHeader
          breadcrumbs={['KNOWLEDGE VAULT', 'DIAGRAM GENERATOR']}
          title="Pathway Diagram Generator"
        />

        <div className="diagram-page-container">
          {/* HEADER HERO */}
          <div className="diagram-header-bar">
            <div>
              <span className="eyebrow-tag">VISUAL SCHEMATIC ENGINE</span>
              <h1 className="vault-main-heading">Biological Diagram Generator</h1>
              <p className="vault-subtitle">
                Synthesize scientific flowcharts, Z-schemes, and metabolic cycles directly from speech concepts.
              </p>
            </div>

            <div className="header-action-group">
              <button className="secondary-action-btn" onClick={() => navigate('/document/01-photosynthesis')}>
                <ArrowLeft size={15} />
                <span>Back to Document</span>
              </button>
            </div>
          </div>

          {/* 2-COLUMN SPLIT LAYOUT */}
          <div className="diagram-layout-grid">
            {/* LEFT INPUT & PRESETS */}
            <div className="diagram-controls-pane">
              <div className="panel diagram-panel">
                <div className="panelhead">
                  <span>
                    <Sparkles size={14} /> DIAGRAM PROMPT & PRESETS
                  </span>
                  <small>Agent Visual Synthesizer</small>
                </div>

                <div className="panel-inner-content">
                  <label className="input-label">SELECT TOPIC PRESET</label>
                  <div className="preset-buttons-list">
                    {presets.map((p) => (
                      <button
                        key={p.id}
                        className={`preset-btn ${selectedPreset.id === p.id ? 'active' : ''}`}
                        onClick={() => handleSelectPreset(p)}
                      >
                        <Zap size={14} />
                        <div className="preset-text">
                          <strong>{p.name}</strong>
                          <small>{p.diagramType}</small>
                        </div>
                      </button>
                    ))}
                  </div>

                  <label className="input-label" style={{ marginTop: '20px' }}>PROMPT SPECIFICATION</label>
                  <textarea
                    className="diagram-prompt-input"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={4}
                  />

                  <div className="diagram-btn-row">
                    <button
                      className="primary-action-btn"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                    >
                      <RefreshCw size={14} className={isGenerating ? 'spin' : ''} />
                      <span>{isGenerating ? 'Synthesizing...' : 'Regenerate Diagram'}</span>
                    </button>
                    <button className="secondary-action-btn" onClick={handleSaveToKnowledge}>
                      <Bookmark size={14} />
                      <span>Save to Vault</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT RENDERED PREVIEW */}
            <div className="diagram-preview-pane">
              <div className="panel diagram-panel">
                <div className="panelhead">
                  <span>
                    <Cpu size={14} /> SCHEMATIC PREVIEW ({selectedPreset.diagramType})
                  </span>
                  <span className="badge-tag">Mermaid & Vector Stream</span>
                </div>

                <div className="diagram-render-canvas">
                  {selectedPreset.renderType === 'z-scheme' && (
                    <div className="visual-diagram-card">
                      <div className="diagram-title-tag">Figure 1.1: Non-Cyclic Z-Scheme Electron Flow</div>
                      
                      <div className="z-scheme-flow-grid">
                        <div className="node-block ps2">
                          <span className="node-label">Photosystem II</span>
                          <strong>P680 (680 nm)</strong>
                          <small>Photolysis: 2H2O → O2 + 4H+ + 4e-</small>
                        </div>

                        <div className="flow-arrow-h">
                          <span>e- flux</span>
                          ➔
                        </div>

                        <div className="node-block cyt">
                          <span className="node-label">Carrier Complex</span>
                          <strong>Cytochrome b6f</strong>
                          <small>Proton Motive Force (H+ Gradient)</small>
                        </div>

                        <div className="flow-arrow-h">
                          <span>e- flux</span>
                          ➔
                        </div>

                        <div className="node-block ps1">
                          <span className="node-label">Photosystem I</span>
                          <strong>P700 (700 nm)</strong>
                          <small>NADP+ Reductase → NADPH</small>
                        </div>
                      </div>

                      <div className="atp-synthase-coupling-box">
                        <Zap size={16} />
                        <div>
                          <strong>Trans-Thylakoid Chemiosmosis Coupling</strong>
                          <p>H+ electrochemical lumen gradient ($pH \\approx 4.5$) powers ATP Synthase rotary rotor.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPreset.renderType === 'calvin' && (
                    <div className="visual-diagram-card">
                      <div className="diagram-title-tag">Figure 1.2: Tri-Phasic Calvin Cycle Carbon Fixation</div>
                      
                      <div className="calvin-cycle-grid">
                        <div className="cycle-stage-card">
                          <span className="stage-num">1</span>
                          <strong>Carboxylation</strong>
                          <p>RuBisCO fixes 3 CO2 onto 3 RuBP yielding 6 molecules of 3-PGA.</p>
                        </div>
                        <div className="cycle-stage-card">
                          <span className="stage-num">2</span>
                          <strong>Reduction</strong>
                          <p>6 ATP + 6 NADPH convert 3-PGA into 6 G3P (1 net sugar export).</p>
                        </div>
                        <div className="cycle-stage-card">
                          <span className="stage-num">3</span>
                          <strong>Regeneration</strong>
                          <p>3 ATP phosphorylate remaining 5 G3P back into 3 RuBP acceptors.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPreset.renderType === 'c4' && (
                    <div className="visual-diagram-card">
                      <div className="diagram-title-tag">Figure 1.3: Kranz Anatomy Spatial Compartmentalization</div>
                      
                      <div className="c4-compartment-grid">
                        <div className="compartment-cell mesophyll">
                          <h4>Mesophyll Cell (Outer)</h4>
                          <p>• Ambient CO2 captured by <strong>PEP Carboxylase</strong></p>
                          <p>• Zero affinity for Oxygen (No Photorespiration)</p>
                          <p>• Synthesizes 4-Carbon Malate</p>
                        </div>

                        <div className="plasmodesmata-divider">
                          <span>Plasmodesmata Malate Shunt ➔</span>
                        </div>

                        <div className="compartment-cell bundle-sheath">
                          <h4>Bundle Sheath Cell (Inner)</h4>
                          <p>• Malate decarboxylated releasing concentrated CO2</p>
                          <p>• <strong>Rubisco</strong> operates at saturated CO2 environment</p>
                          <p>• Normal Calvin Cycle produces glucose with 99% efficiency</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CODE SNIPPET AT BOTTOM */}
                  <div className="schematic-code-snippet">
                    <pre>
                      <code>{`graph LR
  H2O[2 H2O] -->|Photolysis| PS2[PS II P680]
  PS2 -->|Plastoquinone| Cyt[Cyt b6f Complex]
  Cyt -->|Proton Gradient| ATP[ATP Synthase]
  Cyt -->|Plastocyanin| PS1[PS I P700]
  PS1 -->|Ferredoxin| NADPH[NADP+ Reductase]`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
