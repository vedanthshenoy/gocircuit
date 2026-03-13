import React, { useCallback, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  ReactFlowProvider,
  type NodeTypes,
  MiniMap,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCircuit } from '../../store/circuit-store';
import ComponentNode from './ComponentNode';
import { type ComponentType } from '../../types/circuit';

const nodeTypes: NodeTypes = {
  circuitComponent: ComponentNode,
};

const CanvasContent: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addComponent,
    setSelectedId
  } = useCircuit();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as ComponentType;
      if (!type) return;

      const reactFlowBounds = wrapperRef.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addComponent(type, position);
    },
    [addComponent, project]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: { nodes: any[], edges: any[] }) => {
    if (selectedNodes.length > 0) {
      setSelectedId(selectedNodes[0].id);
    } else if (selectedEdges.length > 0) {
      setSelectedId(selectedEdges[0].id);
    } else {
      setSelectedId(null);
    }
  }, [setSelectedId]);

  return (
    <div className="flex-1 h-full bg-slate-950 relative" ref={wrapperRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onSelectionChange={onSelectionChange}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'smoothstep', 
          style: { strokeWidth: 2, stroke: '#94a3b8' },
          animated: false,
        }}
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="!bg-slate-800 !border-slate-700 !text-slate-200" />
        <MiniMap 
          className="!bg-slate-900 !border-slate-700"
          maskColor="rgba(30, 41, 59, 0.6)"
          nodeColor="#60a5fa"
        />
      </ReactFlow>
    </div>
  );
};

const CircuitCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
};

export default CircuitCanvas;
