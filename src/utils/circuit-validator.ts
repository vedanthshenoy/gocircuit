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

  // 1. Check for Ground
  const groundNodes = Object.keys(components).filter(id => components[id].type === 'Ground');
  const hasGround = groundNodes.length > 0;
  if (!hasGround) {
    errors.push("Missing Ground reference. Every circuit needs at least one Ground node.");
  } else if (groundNodes.length > 1) {
    warnings.push("Multiple Ground nodes detected. Ensure they are all electrically connected to the same reference point.");
  }

  // 2. Check for Voltage Source
  const hasSource = Object.values(components).some(c => c.type === 'VoltageSource');
  if (!hasSource) {
    warnings.push("No Voltage Source detected. The circuit might be passive or powered by an external source.");
  }

  // 3. Check for Floating Nodes / Dangling Pins (Closed Circuit Check)
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
        errors.push(`Ground node (${comp.label}) is not connected. Open ends are not allowed.`);
      }
    } else {
      // These usually have two pins: 'a' and 'b'
      if (!connectedPins.has('a')) {
        errors.push(`${comp.type} ${comp.label} (ID: ${id}) pin 'a' is not connected. All circuits must be closed.`);
      }
      if (!connectedPins.has('b')) {
        errors.push(`${comp.type} ${comp.label} (ID: ${id}) pin 'b' is not connected. All circuits must be closed.`);
      }
    }
  });

  // 4. Neatness Check
  const GRID_SIZE = 20;
  const MIN_SPACING = 100;
  const componentList = Object.values(components);

  componentList.forEach((comp, i) => {
    // 4.1 Grid Alignment
    if (comp.position.x % GRID_SIZE !== 0 || comp.position.y % GRID_SIZE !== 0) {
      warnings.push(`Component ${comp.label} is not aligned to the ${GRID_SIZE}px grid.`);
    }

    // 4.2 Overlap / Crowding Check
    for (let j = i + 1; j < componentList.length; j++) {
      const other = componentList[j];
      const dx = comp.position.x - other.position.x;
      const dy = comp.position.y - other.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MIN_SPACING) {
        errors.push(`Components ${comp.label} and ${other.label} are too close or overlapping. Increase spacing for a neat circuit.`);
      }
    }
  });

  // 5. Check for Rotation Alignment (Nodes must be symbol ends)
  Object.entries(components).forEach(([id, comp]) => {
    const connectedEdges = edges.filter(e => e.source === id || e.target === id);
    if (connectedEdges.length === 0) return;

    // Check if the majority of connections align with the component's current rotation
    // This is a heuristic: if connections are mostly vertical but component is horizontal, warn.
    let verticalCount = 0;
    let horizontalCount = 0;

    connectedEdges.forEach(edge => {
      const otherId = edge.source === id ? edge.target : edge.source;
      const otherComp = components[otherId];
      if (!otherComp) return;

      const dx = Math.abs(comp.position.x - otherComp.position.x);
      const dy = Math.abs(comp.position.y - otherComp.position.y);

      if (dy > dx * 1.5) verticalCount++;
      else if (dx > dy * 1.5) horizontalCount++;
    });

    const isCurrentlyVertical = (comp.rotation % 2 === 1) || (comp.type === 'VoltageSource' || comp.type === 'Ground' ? comp.rotation % 2 === 0 : false);
    
    if (horizontalCount > verticalCount && isCurrentlyVertical) {
      warnings.push(`Component ${comp.label} should probably be rotated to align with horizontal connections.`);
    }
    });

    // 6. Connectivity Check (Path to Ground)
    // Ensure every component has a path to a Ground node
    if (groundNodes.length > 0) {
    const visited = new Set<string>();
    const queue = [...groundNodes];
    groundNodes.forEach(id => visited.add(id));

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      edges.forEach(edge => {
        let neighborId: string | null = null;
        if (edge.source === currentId) neighborId = edge.target;
        else if (edge.target === currentId) neighborId = edge.source;

        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      });
    }

    Object.keys(components).forEach(id => {
      if (!visited.has(id)) {
        errors.push(`Component ${components[id].label} (ID: ${id}) is not connected to Ground. The circuit is open.`);
      }
    });
    }

    // 7. Wire Neatness Check (Component Overlap)
    // Basic check: Are wires passing through components?
    edges.forEach(edge => {
    const sourceComp = components[edge.source];
    const targetComp = components[edge.target];
    if (!sourceComp || !targetComp) return;

    Object.entries(components).forEach(([id, comp]) => {
      if (id === edge.source || id === edge.target) return;

      // Check if component 'comp' is on the line between source and target
      // This is a simplified check for orthogonal wires (typical in our layout)
      const minX = Math.min(sourceComp.position.x, targetComp.position.x);
      const maxX = Math.max(sourceComp.position.x, targetComp.position.x);
      const minY = Math.min(sourceComp.position.y, targetComp.position.y);
      const maxY = Math.max(sourceComp.position.y, targetComp.position.y);

      if (comp.position.x >= minX && comp.position.x <= maxX &&
          comp.position.y >= minY && comp.position.y <= maxY) {
        // If it's on the same X or Y (likely wire path)
        if (sourceComp.position.x === targetComp.position.x && comp.position.x === sourceComp.position.x) {
          warnings.push(`Wire between ${sourceComp.label} and ${targetComp.label} passes through ${comp.label}. Move components for a neater layout.`);
        } else if (sourceComp.position.y === targetComp.position.y && comp.position.y === sourceComp.position.y) {
           warnings.push(`Wire between ${sourceComp.label} and ${targetComp.label} passes through ${comp.label}. Move components for a neater layout.`);
        }
      }
    });
    });

    // 8. Check for Shorts (Voltage Source shorted to itself or both pins to Ground)

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
