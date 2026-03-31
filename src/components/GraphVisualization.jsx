import { useEffect, useRef, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

export default function GraphVisualization({ nodes, edges, onNodeSelect, selectedNode, height = '450px' }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  const initNetwork = useCallback(() => {
    if (!containerRef.current || !nodes || nodes.length === 0) return;

    const nodeDataSet = new DataSet(nodes);
    const edgeDataSet = new DataSet(edges);

    const options = {
      nodes: {
        font: { color: '#e2e8f0', size: 11, face: 'Inter' },
        borderWidth: 2,
        shadow: { enabled: true, color: 'rgba(0,0,0,0.3)', size: 8 },
      },
      edges: {
        font: { color: '#94a3b8', size: 9, face: 'Inter', strokeWidth: 0 },
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        smooth: { type: 'curvedCW', roundness: 0.15 },
        shadow: false,
      },
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -40,
          centralGravity: 0.005,
          springLength: 180,
          springConstant: 0.04,
          damping: 0.09,
        },
        solver: 'forceAtlas2Based',
        stabilization: { iterations: 120, fit: true },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
      layout: { improvedLayout: true },
    };

    const network = new Network(containerRef.current, { nodes: nodeDataSet, edges: edgeDataSet }, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0 && onNodeSelect) {
        onNodeSelect(params.nodes[0]);
      }
    });

    if (selectedNode) {
      network.once('stabilizationIterationsDone', () => {
        network.selectNodes([selectedNode]);
        network.focus(selectedNode, { scale: 1.2, animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
      });
    }

    return () => network.destroy();
  }, [nodes, edges, selectedNode, onNodeSelect]);

  useEffect(() => {
    const cleanup = initNetwork();
    return () => { if (cleanup) cleanup(); };
  }, [initNetwork]);

  return (
    <div className="graph-container" style={{ height }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="graph-legend">
        <div className="graph-legend-item">
          <div className="graph-legend-dot" style={{ background: '#22c55e' }} />
          Low Risk
        </div>
        <div className="graph-legend-item">
          <div className="graph-legend-dot" style={{ background: '#f59e0b' }} />
          Medium Risk
        </div>
        <div className="graph-legend-item">
          <div className="graph-legend-dot" style={{ background: '#ef4444' }} />
          High Risk
        </div>
        <div className="graph-legend-item">
          <div className="graph-legend-dot" style={{ background: '#64748b', borderRadius: '2px' }} />
          Frozen
        </div>
      </div>
    </div>
  );
}
