import React, { useState } from 'react';
import { Share2, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { InteractiveGraph } from '../components/graph/InteractiveGraph';
import { GraphNode } from '../types';
import { GRAPH_NODES } from '../utils/mockData';

export const KnowledgeGraphPage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<GraphNode>(GRAPH_NODES[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="workspace">
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <main className="main graph-page-main">
        <TopHeader
          breadcrumbs={['KNOWLEDGE VAULT', 'INTERACTIVE GRAPH']}
          title="Knowledge Graph"
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="graph-page-container">
          {/* HEADER HERO */}
          <div className="graph-page-header">
            <div>
              <span className="eyebrow-tag">VISUAL ONTOLOGY & WIKILINKS</span>
              <h1 className="graph-heading">Knowledge Graph</h1>
              <p className="graph-subtitle">See how your ideas connect across all spoken sessions and documents.</p>
            </div>

            <div className="graph-stats-pills">
              <div className="stat-pill">
                <strong>{GRAPH_NODES.length}</strong>
                <span>Concepts</span>
              </div>
              <div className="stat-pill">
                <strong>17</strong>
                <span>Bidirectional Edges</span>
              </div>
              <div className="stat-pill">
                <strong>100%</strong>
                <span>Local Vector Index</span>
              </div>
            </div>
          </div>

          {/* GRAPH CANVAS & SIDEBAR */}
          <div className="graph-canvas-frame">
            <InteractiveGraph
              selectedNodeId={selectedNode.id}
              onSelectNode={(node) => setSelectedNode(node)}
              height="calc(100vh - 270px)"
              showSidebar={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
