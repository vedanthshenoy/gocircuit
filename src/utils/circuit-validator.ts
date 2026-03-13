import { type Node, type Edge } from 'reactflow';
import { type CircuitComponent } from '../types/circuit';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCircuit(
  nodes: Node[],
  edges: Edge[],
  components: Record<string, CircuitComponent>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check for Ground
  const hasGround = Object.values(components).some(c => c.type === 'Ground');
  if (!hasGround) {
    errors.push("Missing Ground reference. Every circuit needs at least one Ground node.");
  }

  // 2. Check for Voltage Source
  const hasSource = Object.values(components).some(c => c.type === 'VoltageSource');
  if (!hasSource) {
    warnings.push("No Voltage Source detected. The circuit might be passive or powered by an external source.");
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
        errors.push(`Ground node (${comp.label}) is not connected to anything.`);
      }
    } else if (comp.type === 'VoltageSource' || comp.type === 'Resistor' || comp.type === 'Capacitor' || comp.type === 'Inductor' || comp.type === 'Diode') {
      // These usually have two pins: 'a' and 'b'
      if (!connectedPins.has('a')) {
        errors.push(`${comp.type} ${comp.label} (ID: ${id}) pin 'a' is not connected.`);
      }
      if (!connectedPins.has('b')) {
        errors.push(`${comp.type} ${comp.label} (ID: ${id}) pin 'b' is not connected.`);
      }
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
      const otherHandle = isSourceV ? edge.targetHandle : isTargetV ? edge.sourceHandle : null;

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
