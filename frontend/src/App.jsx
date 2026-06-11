import React, { useState } from 'react';
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react'; 
import '@xyflow/react/dist/style.css';
import './App.css';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Default path initialized for your test repo environment
  const [repoPath, setRepoPath] = useState("D:/projects/gdsc_projecct_webd/repo-visualizer/test_repo");

  // Robust layout calculation algorithm to ensure perfect readability
  const applyForceLayout = (rawNodes, rawEdges) => {
    const nodeMap = {};
    
    // Step 1: Initialize coordinates. Linear horizontal spacing guarantees clear separation for small repos.
    rawNodes.forEach((node, i) => {
      nodeMap[node.path] = {
        ...node,
        x: i * 400 + 80, // Generous spacing ensures zero clipping for arrow tips
        y: 250
      };
    });

    // Step 2: Trigger the adaptive physics engine loop ONLY for larger projects (3+ files)
    if (rawNodes.length > 2) {
      for (let step = 0; step < 50; step++) {
        
        // Force A: Anti-overlapping node repulsion
        rawNodes.forEach((n1) => {
          rawNodes.forEach((n2) => {
            if (n1.path === n2.path) return;
            const dx = nodeMap[n1.path].x - nodeMap[n2.path].x;
            const dy = nodeMap[n1.path].y - nodeMap[n2.path].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            if (distance < 360) {
              const force = (360 - distance) * 0.2;
              nodeMap[n1.path].x += (dx / distance) * force;
              nodeMap[n1.path].y += (dy / distance) * force;
            }
          });
        });

        // Force B: Pull dependent code modules closer together while preserving left-to-right flow
        rawEdges.forEach((edge) => {
          const sourceNode = nodeMap[edge.source];
          const targetNode = nodeMap[edge.target];
          if (sourceNode && targetNode) {
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const targetXDist = dx - 380; 
            
            sourceNode.x += targetXDist * 0.05;
            sourceNode.y += dy * 0.05;
            targetNode.x -= targetXDist * 0.05;
            targetNode.y -= targetXDist * 0.05;
          }
        });
      }
    }

    // Step 3: Format configurations explicitly into clean React Flow node primitives
    return rawNodes.map((file) => ({
      id: file.path,
      position: { x: nodeMap[file.path].x, y: nodeMap[file.path].y },
      data: { 
        filename: file.filename,
        path: file.path,
        loc: file.loc,
        complexity: file.complexity,
        imports: file.imports
      },
      style: {
        background: '#151824', // Premium deep navy background
        color: '#f3f4f6',      // White main text
        border: '1px solid #2e344e', // Fine modern separator line
        borderRadius: '8px',
        padding: '16px 12px',
        fontSize: '13px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.35)', // High-end dark shadow drop
        cursor: 'pointer',
        width: 240, 
        textAlign: 'center'
      },
    }));
  };

  const handleAnalyze = () => {
    if (!repoPath.trim()) return;
    
    setLoading(true);
    setError(null);
    setSelectedNode(null); 

    // Pointed directly to your live production Render API backend gateway instance
    fetch(`https://repo-visualizer-2vds.onrender.com/analyze?path=${encodeURIComponent(repoPath.trim())}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch repository data. Make sure the folder path exists.');
        }
        return response.json();
      })
      .then((data) => {
        // Enforce the neon electric blue color theme onto our edge connectors on the fly
        const coloredEdges = data.edges.map(edge => ({
          ...edge,
          markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        }));

        const computedNodes = applyForceLayout(data.nodes, coloredEdges);
        setNodes(computedNodes);
        setEdges(coloredEdges);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  const onNodeClick = (event, node) => {
    setSelectedNode(node.data);
    setSummaryLoading(true);
    setAiSummary(""); 

    // Pointed directly to your live production Render API summary microservice instance
    fetch(`https://repo-visualizer-2vds.onrender.com/summary?path=${encodeURIComponent(node.data.path)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to get summary");
        return res.json();
      })
      .then((summaryData) => {
        setAiSummary(summaryData.summary);
        setSummaryLoading(false);
      })
      .catch((err) => {
        setAiSummary("Could not load AI breakdown. Make sure your API Key is correct!");
        setSummaryLoading(false);
      });
  };

  return (
    <div className="app-container">
      
      {/* Search Header Input bar */}
      <div className="search-header">
        <input 
          type="text" 
          className="search-input"
          placeholder="Enter local absolute folder path..."
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
        />
        <button className="search-btn" onClick={handleAnalyze}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* Draggable Infinite Canvas */}
      <div className="graph-container">
        {error && (
          <div style={{ position: 'absolute', top: '85px', left: '20px', color: '#ef4444', zIndex: 100, background: '#1e1b1b', padding: '10px 14px', borderRadius: '6px', border: '1px solid #ef4444', fontSize: '13px' }}>
            🛑 Error: {error}
          </div>
        )}
        
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodeClick={onNodeClick} 
          fitView
          nodeTypes={{
            default: ({ data }) => (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Target Dot Handle (Left Side) */}
                <Handle type="target" position={Position.Left} style={{ background: '#3b82f6', width: 8, height: 8, border: 'none' }} />
                
                <div>
                  <strong style={{ fontSize: '15px', color: '#ffffff', letterSpacing: '-0.3px' }}>{data.filename}</strong>
                  <div style={{ marginTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-around', gap: '4px' }}>
                    <span style={{ color: '#10b981', fontWeight: '500', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>📊 {data.loc} lines</span>
                    <span style={{ color: '#f59e0b', fontWeight: '500', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px' }}>⚡ Complex: {data.complexity}</span>
                  </div>
                </div>
                
                {/* Source Dot Handle (Right Side) */}
                <Handle type="source" position={Position.Right} style={{ background: '#3b82f6', width: 8, height: 8, border: 'none' }} />
              </div>
            )
          }}
        >
          <Background color="#1e2235" gap={24} size={1.5} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Slide-out Analysis Metadata Panel */}
      {selectedNode && (
        <div className="side-panel">
          <button className="close-btn" onClick={() => setSelectedNode(null)}>Close ✕</button>
          
          <h2>{selectedNode.filename}</h2>
          <p style={{ marginBottom: '24px' }}><strong>Full Path:</strong> <span style={{ fontSize: '11px', color: '#9ca3af', wordBreak: 'break-all', fontFamily: 'monospace' }}>{selectedNode.path}</span></p>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid #2e344e', marginBottom: '25px' }}>
            <p style={{ margin: '6px 0' }}>Lines of Code: <span style={{ color: '#10b981', fontWeight: '600', float: 'right' }}>{selectedNode.loc}</span></p>
            <p style={{ margin: '6px 0' }}>Complexity Index: <span style={{ color: '#f59e0b', fontWeight: '600', float: 'right' }}>{selectedNode.complexity}</span></p>
            <p style={{ margin: '6px 0' }}>Detected Modules: <span style={{ color: '#3b82f6', fontWeight: '500', float: 'right', fontSize: '13px' }}>{selectedNode.imports.length > 0 ? selectedNode.imports.join(', ') : 'None'}</span></p>
          </div>
          
          <h3 style={{ fontSize: '15px', color: '#ffffff', marginBottom: '12px', fontWeight: '600' }}>AI Explanation (3 Simple Sentences)</h3>
          <div className="ai-bubble">
            {summaryLoading ? (
              <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>Gemini is scanning code structure...</span>
            ) : (
              aiSummary
            )}
          </div>
        </div>
      )}
    </div>
  );
}