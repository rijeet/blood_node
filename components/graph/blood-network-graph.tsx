'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

// Mock data structure - in production this would come from API
interface GraphNode {
  id: string;
  label: string;
  bloodGroup?: string;
  relation?: string;
  isUser?: boolean;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

interface BloodNetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  onInviteClick?: () => void;
}

export function BloodNetworkGraph({ 
  nodes = [], 
  edges = [], 
  onNodeClick,
  onInviteClick 
}: BloodNetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

  // Simple force-directed layout simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Initialize node positions if not set
    const layoutNodes = nodes.map((node, index) => ({
      ...node,
      x: node.x || width / 2 + (Math.random() - 0.5) * 200,
      y: node.y || height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0
    }));

    // Simple physics simulation
    const simulate = () => {
      const alpha = 0.1;
      
      // Apply forces
      for (let i = 0; i < layoutNodes.length; i++) {
        const nodeA = layoutNodes[i];
        
        // Repulsion between nodes
        for (let j = i + 1; j < layoutNodes.length; j++) {
          const nodeB = layoutNodes[j];
          const dx = nodeB.x! - nodeA.x!;
          const dy = nodeB.y! - nodeA.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1000 / (distance * distance);
          
          nodeA.vx -= (dx / distance) * force * alpha;
          nodeA.vy -= (dy / distance) * force * alpha;
          nodeB.vx += (dx / distance) * force * alpha;
          nodeB.vy += (dy / distance) * force * alpha;
        }
        
        // Attraction for connected nodes
        edges.forEach(edge => {
          if (edge.source === nodeA.id) {
            const nodeB = layoutNodes.find(n => n.id === edge.target);
            if (nodeB) {
              const dx = nodeB.x! - nodeA.x!;
              const dy = nodeB.y! - nodeA.y!;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = distance * 0.01;
              
              nodeA.vx += (dx / distance) * force * alpha;
              nodeA.vy += (dy / distance) * force * alpha;
            }
          }
        });
        
        // Apply velocity and damping
        nodeA.x! += nodeA.vx;
        nodeA.y! += nodeA.vy;
        nodeA.vx *= 0.9;
        nodeA.vy *= 0.9;
        
        // Keep nodes in bounds
        nodeA.x! = Math.max(30, Math.min(width - 30, nodeA.x!));
        nodeA.y! = Math.max(30, Math.min(height - 30, nodeA.y!));
      }
    };

    // Render function
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw edges
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      edges.forEach(edge => {
        const sourceNode = layoutNodes.find(n => n.id === edge.source);
        const targetNode = layoutNodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x!, sourceNode.y!);
          ctx.lineTo(targetNode.x!, targetNode.y!);
          ctx.stroke();
          
          // Draw edge label
          const midX = (sourceNode.x! + targetNode.x!) / 2;
          const midY = (sourceNode.y! + targetNode.y!) / 2;
          ctx.fillStyle = '#d1d5db';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(edge.label, midX, midY);
        }
      });
      
      // Draw nodes
      layoutNodes.forEach(node => {
        const x = node.x!;
        const y = node.y!;
        
        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        
        if (node.isUser) {
          ctx.fillStyle = '#3b82f6';
        } else {
          ctx.fillStyle = '#10b981';
        }
        
        if (selectedNode?.id === node.id) {
          ctx.fillStyle = '#f59e0b';
        }
        
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Blood group badge
        if (node.bloodGroup) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x - 10, y - 30, 20, 15);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.bloodGroup, x, y - 20);
        }
        
        // Node label
        ctx.fillStyle = '#f3f4f6';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y + 40);
      });
    };

    // Animation loop
    let animationId: number;
    const animate = () => {
      simulate();
      render();
      animationId = requestAnimationFrame(animate);
    };
    
    animate();

    // Handle canvas clicks
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const clickedNode = layoutNodes.find(node => {
        const dx = x - node.x!;
        const dy = y - node.y!;
        return Math.sqrt(dx * dx + dy * dy) < 25;
      });
      
      if (clickedNode) {
        setSelectedNode(clickedNode);
        onNodeClick?.(clickedNode);
      } else {
        setSelectedNode(null);
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('click', handleClick);
    };
  }, [nodes, edges, onNodeClick, selectedNode]);

  if (viewMode === 'table') {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Family Network</h2>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setViewMode('graph')}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Graph View
            </Button>
            <Button onClick={onInviteClick} className="bg-blue-600 hover:bg-blue-700 text-white">
              Invite Family Member
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-900 border border-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Relation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Blood Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {nodes.map(node => (
                <tr key={node.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {node.label}
                    {node.isUser && <span className="ml-2 text-blue-400">(You)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {node.relation || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {node.bloodGroup && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                        {node.bloodGroup}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      onClick={() => onNodeClick?.(node)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Family Network Graph</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setViewMode('table')}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Table View
          </Button>
          <Button onClick={onInviteClick} className="bg-blue-600 hover:bg-blue-700 text-white">
            Invite Family Member
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-600 rounded-lg bg-gray-900 cursor-pointer"
        />
        
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-600 max-w-xs">
            <h3 className="font-bold text-lg text-white">{selectedNode.label}</h3>
            {selectedNode.relation && (
              <p className="text-sm text-gray-300">Relation: {selectedNode.relation}</p>
            )}
            {selectedNode.bloodGroup && (
              <p className="text-sm text-gray-300">Blood Group: {selectedNode.bloodGroup}</p>
            )}
            {selectedNode.isUser && (
              <p className="text-sm text-blue-400 font-medium">This is you</p>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-300">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          You
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          Family Members
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-amber-500 rounded-full mr-2"></div>
          Selected
        </div>
      </div>
    </div>
  );
}
