import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { 
  type Node, 
  type Edge, 
  type OnNodesChange, 
  type OnEdgesChange, 
  type OnConnect, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  type Connection,
  type EdgeChange,
  type NodeChange
} from 'reactflow';
import { type CircuitComponent, type SimulationResult, type InputWaveform } from '../types/circuit';

interface CircuitContextType {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  components: Record<string, CircuitComponent>;
  addComponent: (type: CircuitComponent['type'], position: { x: number, y: number }) => void;
  updateComponent: (id: string, updates: Partial<CircuitComponent>) => void;
  removeComponent: (id: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  simulationResult: SimulationResult | null;
  runSimulation: () => void;
  inputWaveform: InputWaveform;
  setInputWaveform: (wave: InputWaveform) => void;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setComponents: React.Dispatch<React.SetStateAction<Record<string, CircuitComponent>>>;
}

const CircuitContext = createContext<CircuitContextType | undefined>(undefined);

export const useCircuit = () => {
  const context = useContext(CircuitContext);
  if (!context) {
    throw new Error('useCircuit must be used within a CircuitProvider');
  }
  return context;
};

export const CircuitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [components, setComponents] = useState<Record<string, CircuitComponent>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [inputWaveform, setInputWaveform] = useState<InputWaveform>({
    type: 'Sine',
    amplitude: 50,
    frequency: 50,
    offset: 0,
    phase: 0
  });

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      
      // Sync components state if nodes are removed
      changes.forEach(change => {
        if (change.type === 'remove') {
          setComponents(prev => {
            const next = { ...prev };
            delete next[change.id];
            return next;
          });
          if (selectedId === change.id) setSelectedId(null);
        }
      });
    },
    [selectedId]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target) return;
      
      setEdges((eds) => {
        // Prevent duplicate connections between same handles
        const exists = eds.find(e => 
          e.source === params.source && 
          e.target === params.target && 
          e.sourceHandle === params.sourceHandle && 
          e.targetHandle === params.targetHandle
        );
        if (exists) return eds;
        return addEdge(params, eds);
      });
    },
    []
  );

  const addComponent = useCallback((type: CircuitComponent['type'], position: { x: number, y: number }) => {
    const id = crypto.randomUUID();
    const newComponent: CircuitComponent = {
      id,
      type,
      label: type,
      value: type === 'Resistor' ? 1000 : type === 'Capacitor' ? 1e-6 : type === 'Inductor' ? 1e-3 : 0,
      unit: type === 'Resistor' ? 'Ω' : type === 'Capacitor' ? 'F' : type === 'Inductor' ? 'H' : 'V',
      rotation: 0,
      position
    };

    setComponents(prev => ({ ...prev, [id]: newComponent }));
    
    setNodes(prev => [
      ...prev,
      {
        id,
        type: 'circuitComponent', // Custom node type
        position,
        data: { ...newComponent },
      }
    ]);
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<CircuitComponent>) => {
    setComponents(prev => {
      const updated = { ...prev[id], ...updates };
      return { ...prev, [id]: updated };
    });
    
    setNodes(prev => prev.map(node => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, ...updates } };
      }
      return node;
    }));
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.id !== id && e.source !== id && e.target !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const runSimulation = useCallback(() => {
    console.log('Running simulation...');
    
    const dt = 0.00001; // 10us steps
    const steps = 5000; // 50ms total
    const time = Array.from({ length: steps }, (_, i) => i * dt);
    
    // Default input voltage
    const vin = time.map(t => {
      const phase = (inputWaveform.phase * Math.PI) / 180;
      const omega = 2 * Math.PI * inputWaveform.frequency;
      let val = 0;
      
      switch (inputWaveform.type) {
        case 'Sine':
          val = inputWaveform.amplitude * Math.sin(omega * t + phase);
          break;
        case 'Square':
          val = Math.sin(omega * t + phase) >= 0 ? inputWaveform.amplitude : -inputWaveform.amplitude;
          break;
        case 'Triangle':
          val = (2 * inputWaveform.amplitude / Math.PI) * Math.asin(Math.sin(omega * t + phase));
          break;
        case 'DC':
          val = inputWaveform.amplitude;
          break;
      }
      return val + inputWaveform.offset;
    });

    // Simple RC Filter or Rectifier Detection
    const resistors = Object.values(components).filter(c => c.type === 'Resistor');
    const capacitors = Object.values(components).filter(c => c.type === 'Capacitor');
    const diodes = Object.values(components).filter(c => c.type === 'Diode');
    
    let vout = [...vin];
    let simulated = false;
    const componentVoltages: Record<string, number[]> = {};

    // Helper: are these two connected?
    const isConnected = (id1: string, id2: string) => edges.some(e => 
      (e.source === id1 && e.target === id2) || (e.source === id2 && e.target === id1)
    );

    // Initialize all components with 0 voltage
    Object.keys(components).forEach(id => {
      componentVoltages[id] = new Array(time.length).fill(0);
    });

    // 1. Check for Filtered Rectifier (Resistor <-> Diode <-> Capacitor)
    for (const r of resistors) {
      for (const d of diodes) {
        for (const c of capacitors) {
          if (isConnected(r.id, d.id) && isConnected(d.id, c.id)) {
            const tau = (r.value || 1000) * (c.value || 1e-6);
            const rectified = vin.map(v => Math.max(0, v - 0.7));
            vout = new Array(time.length).fill(0);
            let currentVout = 0;
            for (let i = 0; i < time.length; i++) {
              if (rectified[i] > currentVout) {
                // Charge through R
                const dv = (rectified[i] - currentVout) / tau;
                currentVout += dv * dt;
              } else {
                // Discharge (assume R_load approx 5*R_series)
                const dv = -currentVout / (tau * 5);
                currentVout += dv * dt;
              }
              vout[i] = currentVout;
            }
            
            // Assign voltages
            componentVoltages[r.id] = vin.map((v, i) => v - rectified[i]);
            componentVoltages[d.id] = vin.map((v) => Math.min(v, 0.7)); // Simplified
            componentVoltages[c.id] = [...vout];
            
            simulated = true;
            break;
          }
        }
        if (simulated) break;
      }
      if (simulated) break;
    }

    // 2. Check for RC Filter (if not already simulated)
    if (!simulated) {
      for (const r of resistors) {
        for (const c of capacitors) {
          if (isConnected(r.id, c.id)) {
            const tau = (r.value || 1000) * (c.value || 1e-6);
            vout = new Array(time.length).fill(0);
            let currentVout = 0;
            for (let i = 0; i < time.length; i++) {
              const dv = (vin[i] - currentVout) / tau;
              currentVout += dv * dt;
              vout[i] = currentVout;
            }
            
            // Assign voltages
            componentVoltages[r.id] = vin.map((v, i) => v - vout[i]);
            componentVoltages[c.id] = [...vout];
            
            simulated = true;
            break;
          }
        }
        if (simulated) break;
      }
    }

    // 3. Check for Rectifier (if not already simulated)
    if (!simulated) {
      for (const r of resistors) {
        for (const d of diodes) {
          if (isConnected(r.id, d.id)) {
            vout = vin.map(v => Math.max(0, v - 0.7));
            
            // Assign voltages
            componentVoltages[d.id] = vin.map(v => Math.min(v, 0.7));
            componentVoltages[r.id] = [...vout];
            
            simulated = true;
            break;
          }
        }
        if (simulated) break;
      }
    }

    // Default for VoltageSource
    Object.values(components).forEach(c => {
      if (c.type === 'VoltageSource') {
        componentVoltages[c.id] = [...vin];
      }
    });
    
    setSimulationResult({
      time,
      voltages: { 
        'In': vin,
        'Out': vout,
        ...componentVoltages
      },
      currents: {}
    });
  }, [inputWaveform, components, nodes, edges]);

  return (
    <CircuitContext.Provider value={{
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      components,
      addComponent,
      updateComponent,
      removeComponent,
      selectedId,
      setSelectedId,
      simulationResult,
      runSimulation,
      inputWaveform,
      setInputWaveform,
      setNodes,
      setEdges,
      setComponents
    }}>
      {children}
    </CircuitContext.Provider>
  );
};
