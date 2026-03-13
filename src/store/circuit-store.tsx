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

  const getWaveformValue = useCallback((t: number, totalTime: number) => {
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
      case 'Step':
        const numSteps = Math.max(1, inputWaveform.frequency);
        const stepSize = inputWaveform.amplitude;
        const stepDuration = totalTime / (numSteps + 1);
        const currentStep = Math.floor(t / stepDuration);
        val = Math.min(numSteps, currentStep) * stepSize;
        break;
    }
    return val + inputWaveform.offset;
  }, [inputWaveform]);

  const simulateLogicCircuit = useCallback(() => {
    const logicGates = Object.values(components).filter(c => 
      ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'NOT', 'Buffer'].includes(c.type)
    );

    // 1. Identify Inputs (gates or nodes with no incoming logic edges)
    const hasInputEdge = new Set(edges.map(e => e.target));
    const inputGateIds = Object.keys(components).filter(id => {
      const comp = components[id];
      const isLogic = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'NOT', 'Buffer'].includes(comp.type);
      return isLogic && !hasInputEdge.has(id);
    });
    
    // 2. Identify Outputs (logic gates with no outgoing edges)
    const hasOutputEdge = new Set(edges.map(e => e.source));
    const outputGateIds = Object.keys(components).filter(id => {
      const comp = components[id];
      const isLogic = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'NOT', 'Buffer'].includes(comp.type);
      return isLogic && !hasOutputEdge.has(id);
    });

    if (inputGateIds.length === 0 && logicGates.length > 0) {
      inputGateIds.push(logicGates[0].id);
    }

    const headers = [...inputGateIds.map(id => components[id].label), ...outputGateIds.map(id => components[id].label)];
    const rows: (number | string)[][] = [];

    // Truth Table Generation
    const numInputs = inputGateIds.length;
    const numCombinations = Math.pow(2, numInputs);
    for (let i = 0; i < numCombinations; i++) {
      const inputValues: Record<string, number> = {};
      const row: number[] = [];
      for (let j = 0; j < numInputs; j++) {
        const val = (i >> (numInputs - 1 - j)) & 1;
        inputValues[inputGateIds[j]] = val;
        row.push(val);
      }

      const state = { ...inputValues };
      let changed = true;
      let iterations = 0;
      while (changed && iterations < 100) {
        changed = false;
        iterations++;
        for (const gate of logicGates) {
          const inputs = edges
            .filter(e => e.target === gate.id)
            .map(e => state[e.source] ?? 0);
          
          let out = 0;
          const a = inputs[0] ?? 0;
          const b = inputs[1] ?? 0;

          switch (gate.type) {
            case 'AND': out = (a > 0.5 && b > 0.5) ? 1 : 0; break;
            case 'OR': out = (a > 0.5 || b > 0.5) ? 1 : 0; break;
            case 'NAND': out = !(a > 0.5 && b > 0.5) ? 1 : 0; break;
            case 'NOR': out = !(a > 0.5 || b > 0.5) ? 1 : 0; break;
            case 'XOR': out = (a > 0.5) !== (b > 0.5) ? 1 : 0; break;
            case 'XNOR': out = (a > 0.5) === (b > 0.5) ? 1 : 0; break;
            case 'NOT': out = a > 0.5 ? 0 : 1; break;
            case 'Buffer': out = a > 0.5 ? 1 : 0; break;
          }

          if (state[gate.id] !== out) {
            state[gate.id] = out;
            changed = true;
          }
        }
      }

      for (const outId of outputGateIds) {
        row.push(state[outId] ?? 0);
      }
      rows.push(row);
    }

    // Waveform Generation
    const dt = 0.001;
    const steps = 1000;
    const totalTime = dt * steps;
    const time = Array.from({ length: steps }, (_, i) => i * dt);
    const voltages: Record<string, number[]> = {};
    headers.forEach(h => voltages[h] = new Array(steps).fill(0));

    if (inputWaveform.type === 'DC' || inputGateIds.length > 1) {
      // Use Truth Table sequence for voltages if DC or multiple inputs
      const timePerCombination = steps / numCombinations;
      for (let i = 0; i < numCombinations; i++) {
        for (let s = 0; s < timePerCombination; s++) {
          const idx = Math.floor(i * timePerCombination + s);
          if (idx < steps) {
            headers.forEach((h, hIdx) => {
              voltages[h][idx] = (rows[i][hIdx] as number) * 5; 
            });
          }
        }
      }
    } else {
      // Use actual Input Waveform for the single input gate
      for (let i = 0; i < steps; i++) {
        const t = time[i];
        const vin = getWaveformValue(t, totalTime);
        const logicIn = vin > 2.5 ? 1 : 0;
        
        const state: Record<string, number> = { [inputGateIds[0]]: logicIn };
        let changed = true;
        let iterations = 0;
        while (changed && iterations < 100) {
          changed = false;
          iterations++;
          for (const gate of logicGates) {
            const inputs = edges
              .filter(e => e.target === gate.id)
              .map(e => state[e.source] ?? 0);
            
            let out = 0;
            const a = inputs[0] ?? 0;
            const b = inputs[1] ?? 0;

            switch (gate.type) {
              case 'AND': out = (a > 0.5 && b > 0.5) ? 1 : 0; break;
              case 'OR': out = (a > 0.5 || b > 0.5) ? 1 : 0; break;
              case 'NAND': out = !(a > 0.5 && b > 0.5) ? 1 : 0; break;
              case 'NOR': out = !(a > 0.5 || b > 0.5) ? 1 : 0; break;
              case 'XOR': out = (a > 0.5) !== (b > 0.5) ? 1 : 0; break;
              case 'XNOR': out = (a > 0.5) === (b > 0.5) ? 1 : 0; break;
              case 'NOT': out = a > 0.5 ? 0 : 1; break;
              case 'Buffer': out = a > 0.5 ? 1 : 0; break;
            }

            if (state[gate.id] !== out) {
              state[gate.id] = out;
              changed = true;
            }
          }
        }

        voltages[components[inputGateIds[0]].label][i] = vin;
        outputGateIds.forEach(id => {
          voltages[components[id].label][i] = (state[id] ?? 0) * 5;
        });
      }
    }

    setSimulationResult({
      time,
      voltages,
      currents: {},
      truthTable: { headers, rows }
    });
  }, [components, edges, inputWaveform, getWaveformValue]);

  const runSimulation = useCallback(() => {
    console.log('Running simulation...');
    
    // Check if we have logic gates
    const logicGates = Object.values(components).filter(c => 
      ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'NOT', 'Buffer'].includes(c.type)
    );

    if (logicGates.length > 0) {
      simulateLogicCircuit();
      return;
    }

    const dt = 0.00001; // 10us steps
    const steps = 5000; // 50ms total
    const totalTime = dt * steps;
    const time = Array.from({ length: steps }, (_, i) => i * dt);
    
    // Default input voltage
    const vin = time.map(t => getWaveformValue(t, totalTime));

    // Simple RC Filter or Rectifier Detection
    const resistors = Object.values(components).filter(c => c.type === 'Resistor');
    const capacitors = Object.values(components).filter(c => c.type === 'Capacitor');
    const diodes = Object.values(components).filter(c => c.type === 'Diode');
    
    let vout = [...vin];
    let simulated = false;

    // Helper: are these two connected?
    const isConnected = (id1: string, id2: string) => edges.some(e => 
      (e.source === id1 && e.target === id2) || (e.source === id2 && e.target === id1)
    );

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
            simulated = true;
            break;
          }
        }
        if (simulated) break;
      }
    }
    
    setSimulationResult({
      time,
      voltages: { 
        'In': vin,
        'Out': vout // Always include Out for feedback
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
