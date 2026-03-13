import { describe, it, expect } from 'vitest';
import { validateCircuit } from './circuit-validator';
import { type Node, type Edge } from 'reactflow';
import { type CircuitComponent } from '../types/circuit';

describe('CircuitValidator', () => {
  const baseComponents: Record<string, CircuitComponent> = {
    'v1': { id: 'v1', type: 'VoltageSource', label: 'V1', value: 5, unit: 'V', position: { x: 0, y: 0 }, rotation: 0 },
    'g1': { id: 'g1', type: 'Ground', label: 'GND', value: 0, unit: '', position: { x: 0, y: 100 }, rotation: 0 },
    'r1': { id: 'r1', type: 'Resistor', label: 'R1', value: 1000, unit: 'Ω', position: { x: 100, y: 0 }, rotation: 0 },
  };

  const nodes: Node[] = Object.values(baseComponents).map(c => ({
    id: c.id,
    type: 'circuitComponent',
    position: c.position,
    data: c
  }));

  it('should NOT flag a direct source pin to ground connection as a short', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'v1', sourceHandle: 'b', target: 'g1', targetHandle: 'a' },
      { id: 'e2', source: 'v1', sourceHandle: 'a', target: 'r1', targetHandle: 'a' },
      { id: 'e3', source: 'r1', sourceHandle: 'b', target: 'g1', targetHandle: 'a' },
    ];

    const result = validateCircuit(nodes, edges, baseComponents);
    expect(result.errors).not.toContain("Short circuit detected: Voltage Source connected directly to Ground.");
    expect(result.isValid).toBe(true);
  });

  it('should flag a source as shorted if BOTH pins are connected to Ground', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'v1', sourceHandle: 'a', target: 'g1', targetHandle: 'a' },
      { id: 'e2', source: 'v1', sourceHandle: 'b', target: 'g1', targetHandle: 'a' },
    ];

    const result = validateCircuit(nodes, edges, baseComponents);
    expect(result.errors).toContain("Short circuit detected: Voltage Source V1 (ID: v1) both pins are connected to Ground.");
    expect(result.isValid).toBe(false);
  });

  it('should flag a source as shorted if pins a and b are connected together', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'v1', sourceHandle: 'a', target: 'v1', targetHandle: 'b' },
    ];

    const result = validateCircuit(nodes, edges, baseComponents);
    expect(result.errors).toContain("Short circuit detected: Voltage Source V1 (ID: v1) pins 'a' and 'b' are connected together.");
  });
});
