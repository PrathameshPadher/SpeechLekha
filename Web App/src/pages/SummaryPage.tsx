import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Bookmark,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Share2,
  ListOrdered,
  Layers,
  Network
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { useApp } from '../context/AppContext';

export const SummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, setCurrentDocId, addToast } = useApp();

  const doc = documents.find((d) => d.id === id) || documents[0];

  const handleSaveSummary = () => {
    addToast('Summary Saved', `Generated summary appended to ${doc.folder} vault.`, 'success');
  };

  const handleOpenDoc = () => {
    setCurrentDocId(doc.id);
    navigate(`/document/${doc.id}`);
  };

  return (
    <div className="workspace">
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      <main className="main summary-page-main">
        <TopHeader
          breadcrumbs={['KNOWLEDGE VAULT', 'AI SUMMARY', doc.title.toUpperCase()]}
          title="Executive AI Summary"
        />

        <div className="summary-page-container">
          {/* TOP SUMMARY HERO */}
          <div className="summary-hero-card">
            <div className="summary-status-pill">
              <Sparkles size={14} />
              <span>SYNTHESIZED FROM {doc.filename}</span>
            </div>

            <h1 className="summary-title">Summary: {doc.title}</h1>

            <p className="summary-tldr-box">
              <strong>TL;DR:</strong> Photosynthesis converts solar irradiance into ATP/NADPH (light reactions)
              and fixes CO2 into carbohydrates via Rubisco (Calvin cycle). C4 evolutionary adaptations circumvent
              energetic photorespiration losses through spatial Kranz anatomy compartmentalization.
            </p>

            <div className="summary-actions-bar">
              <button className="primary-action-btn" onClick={handleOpenDoc}>
                <FileText size={15} />
                <span>Open Full Document</span>
              </button>

              <button className="secondary-action-btn" onClick={handleSaveSummary}>
                <Bookmark size={15} />
                <span>Save Summary to Vault</span>
              </button>

              <button
                className="ghost-action-btn"
                onClick={() => navigate(`/connections/${doc.id}`)}
              >
                <Network size={15} />
                <span>View Connections</span>
              </button>
            </div>
          </div>

          {/* STRUCTURED SUMMARY SECTIONS */}
          <div className="summary-sections-grid">
            {/* 1. KEY POINTS */}
            <div className="panel summary-panel">
              <div className="panelhead">
                <span>
                  <ListOrdered size={14} /> 1. CORE TAKEAWAYS
                </span>
                <small>4 key points</small>
              </div>
              <div className="panel-inner-content">
                <ul className="summary-bullet-list">
                  <li>
                    <strong>Dual Photochemical Stages:</strong> Thylakoid light-dependent electron flux powers ATP synthase; stroma Calvin cycle fixes CO2.
                  </li>
                  <li>
                    <strong>Pigment Absorption Peaks:</strong> Chlorophyll pigments absorb primarily blue (430 nm) and red (660 nm) photon wavelengths.
                  </li>
                  <li>
                    <strong>C4 Efficiency Advantages:</strong> PEP carboxylase operates without oxygenase reactivity, concentrating CO2 inside bundle-sheath cells.
                  </li>
                  <li>
                    <strong>Ecological Significance:</strong> Primary driver of biospheric carbon capture, water-use efficiency, and atmospheric oxygenation.
                  </li>
                </ul>
              </div>
            </div>

            {/* 2. IMPORTANT CONCEPTS */}
            <div className="panel summary-panel">
              <div className="panelhead">
                <span>
                  <Layers size={14} /> 2. IMPORTANT CONCEPTS
                </span>
                <small>Extracted entities</small>
              </div>
              <div className="panel-inner-content">
                <div className="concepts-chips-grid">
                  {doc.linkedConcepts.map((concept) => (
                    <button
                      key={concept}
                      className="concept-link-btn"
                      onClick={() => navigate(`/connections/${encodeURIComponent(concept)}`)}
                    >
                      <span>[[{concept}]]</span>
                      <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. ACTION ITEMS & FOLLOW-UPS */}
            <div className="panel summary-panel">
              <div className="panelhead">
                <span>
                  <CheckCircle2 size={14} /> 3. RECOMMENDED FOLLOW-UPS & EXPERIMENTS
                </span>
                <small>Autonomous recommendations</small>
              </div>
              <div className="panel-inner-content">
                <ul className="summary-bullet-list">
                  <li>
                    <strong>Generate Quiz:</strong> Test comprehension on Rubisco oxygenation kinetics vs PEP carboxylase.
                    <button className="mini-action-inline" onClick={() => navigate('/quiz')}>Take Quiz →</button>
                  </li>
                  <li>
                    <strong>Diagram Z-Scheme:</strong> Visual rendering of non-cyclic electron transport from PSII to PSI.
                    <button className="mini-action-inline" onClick={() => navigate('/diagram')}>Render Diagram →</button>
                  </li>
                  <li>
                    <strong>Link Cellular Respiration:</strong> Formulate reciprocal equation balance with mitochondrial glycolysis.
                  </li>
                </ul>
              </div>
            </div>

            {/* 4. RELATED KNOWLEDGE */}
            <div className="panel summary-panel">
              <div className="panelhead">
                <span>
                  <Network size={14} /> 4. RELATED VAULT KNOWLEDGE
                </span>
                <small>Cross-vault links</small>
              </div>
              <div className="panel-inner-content">
                <div className="related-vault-links">
                  <div className="related-link-item" onClick={() => navigate('/document/02-c3-vs-c4')}>
                    <FileText size={14} />
                    <span>02-c3-vs-c4.md — Kranz anatomy and photorespiratory bypasses</span>
                    <ArrowRight size={12} />
                  </div>
                  <div className="related-link-item" onClick={() => navigate('/document/key-terms')}>
                    <FileText size={14} />
                    <span>key-terms.md — Glossary of biochemical terminology</span>
                    <ArrowRight size={12} />
                  </div>
                  <div className="related-link-item" onClick={() => navigate('/diagram')}>
                    <FileText size={14} />
                    <span>diagrams.md — Z-scheme flowchart and electron transport</span>
                    <ArrowRight size={12} />
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
