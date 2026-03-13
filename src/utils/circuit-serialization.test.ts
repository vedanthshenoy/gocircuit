import { describe, it, expect } from 'vitest';
import { serializeCircuitToMarkdown, deserializeMarkdownToCircuit } from './circuit-serialization';
import { type Node, type Edge } from 'reactflow';
import { type CircuitComponent, type InputWaveform } from '../types/circuit';

describe('CircuitSerialization', () => {
  it('should round-trip a complex circuit', () => {
    const nodes: Node[] = [
      {
        id: 'r1',
        type: 'circuitComponent',
        position: { x: 100, y: 150 },
        data: { id: 'r1', type: 'Resistor', label: 'Resistor', value: 1000, unit: 'Ω', position: { x: 100, y: 150 }, rotation: 0 }
      },
      {
        id: 'c1',
        type: 'circuitComponent',
        position: { x: 200, y: 250 },
        data: { id: 'c1', type: 'Capacitor', label: 'Capacitor', value: 0.000001, unit: 'F', position: { x: 200, y: 250 }, rotation: 0 }
      }
    ];

    const edges: Edge[] = [
      { id: 'er1-c1-right-left', source: 'r1', sourceHandle: 'right', target: 'c1', targetHandle: 'left' }
    ];

    const inputWaveform: InputWaveform = {
      type: 'Square',
      amplitude: 12,
      frequency: 60,
      offset: 1,
      phase: 90
    };

    const markdown = serializeCircuitToMarkdown(nodes, edges, inputWaveform);
    const deserialized = deserializeMarkdownToCircuit(markdown);

    expect(deserialized.nodes.length).toBe(2);
    expect(deserialized.nodes[0].id).toBe('r1');
    expect(deserialized.nodes[0].data.value).toBe(1000);
    expect(deserialized.nodes[1].data.value).toBe(0.000001);
    expect(deserialized.edges.length).toBe(1);
    expect(deserialized.edges[0].source).toBe('r1');
    expect(deserialized.edges[0].targetHandle).toBe('left');
    expect(deserialized.inputWaveform.type).toBe('Square');
    expect(deserialized.inputWaveform.amplitude).toBe(12);
  });
  it('should serialize a basic circuit with components and connections', () => {
    const nodes: Node[] = [
      {
        id: '1',
        type: 'circuitComponent',
        position: { x: 10, y: 20 },
        data: {
          id: '1',
          type: 'Resistor',
          label: 'R1',
          value: 1000,
          unit: 'Ω',
        } as CircuitComponent
      }
    ];

    const edges: Edge[] = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        sourceHandle: 'right',
        targetHandle: 'left'
      }
    ];

    const inputWaveform: InputWaveform = {
      type: 'Sine',
      amplitude: 5,
      frequency: 1000,
      offset: 0,
      phase: 0
    };

    const markdown = serializeCircuitToMarkdown(nodes, edges, inputWaveform);

    expect(markdown).toContain('## Components');
    expect(markdown).toContain('- **1**: Resistor (1000Ω) @ (10, 20)');
    expect(markdown).toContain('## Connections');
    expect(markdown).toContain('- **1**(right) -> **2**(left)');
    expect(markdown).toContain('## Input Waveform');
    expect(markdown).toContain('- **Type**: Sine');
  });

  it('should handle empty circuits', () => {
    const markdown = serializeCircuitToMarkdown([], [], {
      type: 'DC',
      amplitude: 10,
      frequency: 0,
      offset: 0,
      phase: 0
    });

    expect(markdown).toContain('(No components)');
    expect(markdown).toContain('(No connections)');
  });
});
