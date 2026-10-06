import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, RotateCcw, FileText, ArrowUpRight } from 'lucide-react';
import { GraphNode, GraphLink } from '../../types';
import { GRAPH_NODES, GRAPH_LINKS } from '../../utils/mockData';

interface InteractiveGraphProps {
  selectedNodeId?: string;
  onSelectNode?: (node: GraphNode) => void;
  height?: number | string;
  showSidebar?: boolean;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  selectedNodeId = 'photosynthesis',
  onSelectNode,
  height = '620px',
  showSidebar = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<GraphNode[]>(() => {
    // Distribute initial positions nicely around center
    const count = GRAPH_NODES.length;
    return GRAPH_NODES.map((node, i) => {
      const angle = (i / count) * 2 * Math.PI;
      const radius = node.id === 'photosynthesis' ? 0 : 180 + (i % 3) * 45;
      return {
        ...node,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });
  });

  const [activeNode, setActiveNode] = useState<GraphNode>(() => {
    return GRAPH_NODES.find((n) => n.id === selectedNodeId) || GRAPH_NODES[0];
  });

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Update activeNode if selectedNodeId prop changes
  useEffect(() => {
    if (selectedNodeId) {
      const found = nodes.find((n) => n.id === selectedNodeId);
      if (found) {
        setActiveNode(found);
      }
    }
  }, [selectedNodeId, nodes]);

  // Physics simulation step
  useEffect(() => {
    let animId: number;

    const tick = () => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) => ({ ...n }));
        const nodeMap = new Map(nextNodes.map((n) => [n.id, n]));

        // Repulsion between all nodes
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n1 = nextNodes[i];
            const n2 = nextNodes[j];
            const dx = (n2.x || 0) - (n1.x || 0);
            const dy = (n2.y || 0) - (n1.y || 0);
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            if (dist < 320) {
              const force = (320 - dist) / dist * 0.08;
              if (n1 !== draggedNode) {
                n1.x = (n1.x || 0) - dx * force * 0.5;
                n1.y = (n1.y || 0) - dy * force * 0.5;
              }
              if (n2 !== draggedNode) {
                n2.x = (n2.x || 0) + dx * force * 0.5;
                n2.y = (n2.y || 0) + dy * force * 0.5;
              }
            }
          }
        }

        // Attraction along links
        GRAPH_LINKS.forEach((link) => {
          const src = nodeMap.get(link.source);
          const tgt = nodeMap.get(link.target);
          if (src && tgt) {
            const dx = (tgt.x || 0) - (src.x || 0);
            const dy = (tgt.y || 0) - (src.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = 130;
            const force = (dist - targetDist) * 0.008;

            if (src !== draggedNode) {
              src.x = (src.x || 0) + dx * force;
              src.y = (src.y || 0) + dy * force;
            }
            if (tgt !== draggedNode) {
              tgt.x = (tgt.x || 0) - dx * force;
              tgt.y = (tgt.y || 0) - dy * force;
            }
          }
        });

        // Gentle pull towards center
        const centerX = 400;
        const centerY = 300;
        nextNodes.forEach((n) => {
          if (n !== draggedNode) {
            n.x = (n.x || 0) + (centerX - (n.x || 0)) * 0.003;
            n.y = (n.y || 0) + (centerY - (n.y || 0)) * 0.003;
          }
        });

        return nextNodes;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [draggedNode]);

  // Render network on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const heightPx = rect.height;

    ctx.clearRect(0, 0, width, heightPx);

    ctx.save();
    ctx.translate(pan.x + width / 2, pan.y + heightPx / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-400, -300);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Draw Links
    GRAPH_LINKS.forEach((link) => {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (!src || !tgt) return;

      const isConnectedToActive = activeNode && (link.source === activeNode.id || link.target === activeNode.id);
      const isConnectedToHovered = hoveredNode && (link.source === hoveredNode.id || link.target === hoveredNode.id);

      ctx.beginPath();
      ctx.moveTo(src.x || 0, src.y || 0);
      ctx.lineTo(tgt.x || 0, tgt.y || 0);

      if (isConnectedToActive || isConnectedToHovered) {
        ctx.strokeStyle = '#4faccc';
        ctx.lineWidth = 1.8;
      } else {
        ctx.strokeStyle = 'rgba(46, 68, 77, 0.45)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // Draw subtle relation text for active connections
      if (isConnectedToActive && link.label) {
        const midX = ((src.x || 0) + (tgt.x || 0)) / 2;
        const midY = ((src.y || 0) + (tgt.y || 0)) / 2;
        ctx.font = '9px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#78a6b5';
        ctx.textAlign = 'center';
        ctx.fillText(link.label, midX, midY - 4);
      }
    });

    // Draw Nodes
    nodes.forEach((node) => {
      const isSelected = activeNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const radius = node.val * 0.75 + (isSelected ? 4 : isHovered ? 2 : 0);

      const x = node.x || 0;
      const y = node.y || 0;

      // Glow effect for selected / hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(x, y, radius, x, y, radius + 12);
        glow.addColorStop(0, isSelected ? 'rgba(84, 182, 214, 0.4)' : 'rgba(56, 158, 188, 0.25)');
        glow.addColorStop(1, 'rgba(56, 158, 188, 0)');
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Node base circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      if (isSelected) {
        ctx.fillStyle = '#216a8a';
        ctx.strokeStyle = '#a5e4f3';
        ctx.lineWidth = 2;
      } else if (isHovered) {
        ctx.fillStyle = '#1b4b5e';
        ctx.strokeStyle = '#6fafc4';
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = node.group === 'core' ? '#183a48' : '#14252d';
        ctx.strokeStyle = node.group === 'core' ? '#3d6778' : '#293d47';
        ctx.lineWidth = 1;
      }
      ctx.fill();
      ctx.stroke();

      // Node label
      ctx.font = `${isSelected ? '600 12px' : '500 11px'} "Space Grotesk", sans-serif`;
      ctx.fillStyle = isSelected ? '#ffffff' : isHovered ? '#ddf2f7' : '#9bb0b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, x, y + radius + 14);
    });

    ctx.restore();
  }, [nodes, activeNode, hoveredNode, zoom, pan]);

  // Pointer interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert to world coordinates
    const worldX = (clientX - (pan.x + rect.width / 2)) / zoom + 400;
    const worldY = (clientY - (pan.y + rect.height / 2)) / zoom + 300;

    // Find clicked node
    const clicked = nodes.find((n) => {
      const dx = (n.x || 0) - worldX;
      const dy = (n.y || 0) - worldY;
      const radius = (n.val * 0.75) + 6;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });

    if (clicked) {
      setDraggedNode(clicked);
      setActiveNode(clicked);
      if (onSelectNode) onSelectNode(clicked);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (draggedNode) {
      const worldX = (clientX - (pan.x + rect.width / 2)) / zoom + 400;
      const worldY = (clientY - (pan.y + rect.height / 2)) / zoom + 300;
      setNodes((prev) =>
        prev.map((n) => (n.id === draggedNode.id ? { ...n, x: worldX, y: worldY } : n))
      );
    } else if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      // Hover detection
      const worldX = (clientX - (pan.x + rect.width / 2)) / zoom + 400;
      const worldY = (clientY - (pan.y + rect.height / 2)) / zoom + 300;

      const hovered = nodes.find((n) => {
        const dx = (n.x || 0) - worldX;
        const dy = (n.y || 0) - worldY;
        const radius = (n.val * 0.75) + 6;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });

      setHoveredNode(hovered || null);
    }
  };

  const handlePointerUp = () => {
    setDraggedNode(null);
    setIsDraggingCanvas(false);
  };

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`knowledge-graph-container ${showSidebar ? 'with-sidebar' : ''}`}
      style={{ height }}
    >
      <div className="graph-viewport">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ cursor: draggedNode ? 'grabbing' : hoveredNode ? 'pointer' : 'grab' }}
        />

        <div className="graph-controls">
          <button onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))} title="Zoom In">
            <ZoomIn size={15} />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))} title="Zoom Out">
            <ZoomOut size={15} />
          </button>
          <button onClick={resetView} title="Reset View">
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="graph-legend">
          <span className="legend-item"><i style={{ background: '#216a8a' }} /> Core Topic</span>
          <span className="legend-item"><i style={{ background: '#389ebc' }} /> Biochemical Pathway</span>
          <span className="legend-item"><i style={{ background: '#2e4e5b' }} /> Biological Entity</span>
        </div>
      </div>

      {showSidebar && activeNode && (
        <aside className="graph-node-sidebar">
          <div className="node-sidebar-header">
            <span className="eyebrow-tag">SELECTED CONCEPT</span>
            <h3>{activeNode.label}</h3>
          </div>

          <p className="node-description">{activeNode.description}</p>

          <div className="node-metrics-grid">
            <div className="metric-box">
              <strong>{activeNode.connectionsCount}</strong>
              <small>connections</small>
            </div>
            <div className="metric-box">
              <strong>3</strong>
              <small>documents</small>
            </div>
            <div className="metric-box">
              <strong>{activeNode.mentionsCount}</strong>
              <small>mentions</small>
            </div>
          </div>

          <div className="node-related-section">
            <label>RELATED CONCEPTS</label>
            <div className="tags-cloud">
              {activeNode.relatedConcepts.map((concept) => {
                const targetNode = nodes.find(
                  (n) => n.label.toLowerCase() === concept.toLowerCase()
                );
                return (
                  <button
                    key={concept}
                    className="tag-btn"
                    onClick={() => {
                      if (targetNode) {
                        setActiveNode(targetNode);
                        if (onSelectNode) onSelectNode(targetNode);
                      }
                    }}
                  >
                    {concept}
                  </button>
                );
              })}
            </div>
          </div>

          {activeNode.docId && (
            <div className="node-doc-link-section">
              <label>SOURCE DOCUMENT</label>
              <button
                className="jump-to-doc-btn"
                onClick={() => navigate(`/document/${activeNode.docId}`)}
              >
                <FileText size={14} />
                <span>{activeNode.docId}.md</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  );
};
