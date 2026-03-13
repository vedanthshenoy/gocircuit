import { type Node, type Edge } from 'reactflow';
import { type CircuitComponent } from '../types/circuit';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCircuit(
  _nodes: Node[],
  edges: Edge[],
  components: Record<string, CircuitComponent>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check for Ground (Optional if only logic gates)
  const hasGround = Object.values(components).some(c => c.type === 'Ground');
  const hasAnalog = Object.values(components).some(c => 
    ['Resistor', 'Capacitor', 'Inductor', 'Diode', 'VoltageSource'].includes(c.type)
  );
  if (hasAnalog && !hasGround) {
    errors.push("Missing Ground reference. Analog circuits need at least one Ground node.");
  }

  // 2. Check for Voltage Source
  const hasSource = Object.values(components).some(c => c.type === 'VoltageSource');
  const hasLogic = Object.values(components).some(c => 
    ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'NOT', 'Buffer'].includes(c.type)
  );
  if (!hasSource && !hasLogic) {
    warnings.push("No Power Source or Logic Gates detected. The circuit might be passive.");
  }

  // 3. Check for Floating Nodes / Dangling Pins
  const pinConnections: Record<string, Set<string>> = {};
  
  // Initialize pin connection tracking for each component
  Object.keys(components).forEach(id => {
    pinConnections[id] = new Set();
  });

  edges.forEach(edge => {
    if (edge.source && pinConnections[edge.source]) {
      pinConnections[edge.source].add(edge.sourceHandle || 'unknown');
    }
    if (edge.target && pinConnections[edge.target]) {
      pinConnections[edge.target].add(edge.targetHandle || 'unknown');
    }
  });

  Object.entries(components).forEach(([id, comp]) => {
    const connectedPins = pinConnections[id];
    
    if (comp.type === 'Ground') {
      if (connectedPins.size === 0) {
        errors.push(`Ground node (${comp.label}) is not connected.`);
      }
    } else if (['Resistor', 'Capacitor', 'Inductor', 'Diode', 'VoltageSource'].includes(comp.type)) {
      if (!connectedPins.has('a')) errors.push(`${comp.type} ${comp.label} pin 'a' is not connected.`);
      if (!connectedPins.has('b')) errors.push(`${comp.type} ${comp.label} pin 'b' is not connected.`);
    } else if (['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(comp.type)) {
      if (!connectedPins.has('in1')) errors.push(`${comp.type} ${comp.label} input 'in1' is not connected.`);
      if (!connectedPins.has('in2')) errors.push(`${comp.type} ${comp.label} input 'in2' is not connected.`);
      if (!connectedPins.has('out')) warnings.push(`${comp.type} ${comp.label} output 'out' is floating.`);
    } else if (['NOT', 'Buffer'].includes(comp.type)) {
      if (!connectedPins.has('a')) errors.push(`${comp.type} ${comp.label} input 'a' is not connected.`);
      if (!connectedPins.has('out')) warnings.push(`${comp.type} ${comp.label} output 'out' is floating.`);
    }
  });

  // 4. Check for Shorts (Voltage Source shorted to itself or both pins to Ground)
  const sources = Object.entries(components).filter(([_, comp]) => comp.type === 'VoltageSource');
  
  sources.forEach(([id, comp]) => {
    let pinAConnectedToGround = false;
    let pinBConnectedToGround = false;
    let pinsShorted = false;

    edges.forEach(edge => {
      const isSourceV = edge.source === id;
      const isTargetV = edge.target === id;
      
      const otherId = isSourceV ? edge.target : isTargetV ? edge.source : null;
      const otherComp = otherId ? components[otherId] : null;
      const vHandle = isSourceV ? edge.sourceHandle : isTargetV ? edge.targetHandle : null;

      if (isSourceV && isTargetV) {
        if ((edge.sourceHandle === 'a' && edge.targetHandle === 'b') || 
            (edge.sourceHandle === 'b' && edge.targetHandle === 'a')) {
          pinsShorted = true;
        }
      }

      if (otherComp?.type === 'Ground') {
        if (vHandle === 'a') pinAConnectedToGround = true;
        if (vHandle === 'b') pinBConnectedToGround = true;
      }
    });

    if (pinsShorted) {
      errors.push(`Short circuit detected: Voltage Source ${comp.label} (ID: ${id}) pins 'a' and 'b' are connected together.`);
    }
    if (pinAConnectedToGround && pinBConnectedToGround) {
      errors.push(`Short circuit detected: Voltage Source ${comp.label} (ID: ${id}) both pins are connected to Ground.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
