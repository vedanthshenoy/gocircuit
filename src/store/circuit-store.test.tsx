import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CircuitProvider, useCircuit } from './circuit-store';
import { applyNodeChanges } from 'reactflow';

// Mock crypto.randomUUID
if (!globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substring(2, 9)),
    configurable: true
  });
}

// Mock ReactFlow components and hooks
vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow');
  return {
    ...actual as any,
    applyNodeChanges: vi.fn((_changes, nodes) => nodes),
    applyEdgeChanges: vi.fn((_changes, edges) => edges),
    addEdge: vi.fn((connection, edges) => [...edges, connection]),
  };
});

describe('CircuitStore', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CircuitProvider>{children}</CircuitProvider>
  );

  it('should add a component and sync nodes/components', async () => {
    const { result } = renderHook(() => useCircuit(), { wrapper });

    act(() => {
      result.current.addComponent('Resistor', { x: 100, y: 100 });
    });

    const componentIds = Object.keys(result.current.components);
    expect(componentIds.length).toBe(1);
    const id = componentIds[0];
    expect(result.current.components[id].type).toBe('Resistor');
    expect(result.current.nodes.length).toBe(1);
    expect(result.current.nodes[0].id).toBe(id);
    expect(result.current.nodes[0].position).toEqual({ x: 100, y: 100 });
  });

  it('should update a component in both states', () => {
    const { result } = renderHook(() => useCircuit(), { wrapper });

    act(() => {
      result.current.addComponent('Capacitor', { x: 0, y: 0 });
    });

    const id = Object.keys(result.current.components)[0];
    
    act(() => {
      result.current.updateComponent(id, { value: 0.0002, label: 'C1' });
    });

    expect(result.current.components[id].value).toBe(0.0002);
    expect(result.current.components[id].label).toBe('C1');
    
    const node = result.current.nodes.find(n => n.id === id);
    expect(node?.data.value).toBe(0.0002);
    expect(node?.data.label).toBe('C1');
  });

  it('should remove a component and cleanup edges', () => {
    const { result } = renderHook(() => useCircuit(), { wrapper });

    act(() => {
      result.current.addComponent('Resistor', { x: 0, y: 0 });
      result.current.addComponent('Inductor', { x: 100, y: 100 });
    });

    const ids = Object.keys(result.current.components);
    const idToRemove = ids[0];

    act(() => {
      result.current.removeComponent(idToRemove);
    });

    expect(result.current.components[idToRemove]).toBeUndefined();
    expect(result.current.nodes.length).toBe(1);
    expect(result.current.nodes[0].id).toBe(ids[1]);
  });

  it('should run simulation and update results', () => {
    const { result } = renderHook(() => useCircuit(), { wrapper });

    act(() => {
      result.current.runSimulation();
    });

    expect(result.current.simulationResult).not.toBeNull();
    expect(result.current.simulationResult?.voltages['In']).toBeDefined();
    expect(result.current.simulationResult?.time.length).toBe(5000);
    });

    it('should accurately simulate an RC low-pass filter', () => {
    const { result } = renderHook(() => useCircuit(), { wrapper });

    act(() => {
      result.current.addComponent('Resistor', { x: 0, y: 0 });
      result.current.addComponent('Capacitor', { x: 100, y: 100 });
    });

    const ids = Object.keys(result.current.components);
    const rId = ids.find(id => result.current.components[id].type === 'Resistor')!;
    const cId = ids.find(id => result.current.components[id].type === 'Capacitor')!;

    act(() => {
      // Set values: R = 1k, C = 1uF => Cutoff = 159Hz
      result.current.updateComponent(rId, { value: 1000 });
      result.current.updateComponent(cId, { value: 0.000001 });

      // Connect them
      result.current.onConnect({
        source: rId,
        target: cId,
        sourceHandle: 'right',
        targetHandle: 'left'
      });

      // Set input: 1000Hz (well above cutoff)
      result.current.setInputWaveform({
        type: 'Sine',
        amplitude: 10,
        frequency: 1000,
        offset: 0,
        phase: 0
      });
    });

    act(() => {
      result.current.runSimulation();
    });

    const res = result.current.simulationResult!;
    expect(res.voltages['Out']).toBeDefined();

    // Check attenuation (Input is 10V, Output should be much less)
    const maxVin = Math.max(...res.voltages['In']);
    const maxVout = Math.max(...res.voltages['Out']);

    expect(maxVin).toBeCloseTo(10, 1);
    expect(maxVout).toBeLessThan(3); // Significant attenuation at 1kHz
  });

  it('should sync components when nodes are removed via onNodesChange', () => {
    const { result } = renderHook(() => useCircuit(), { wrapper });

    act(() => {
      result.current.addComponent('Resistor', { x: 0, y: 0 });
    });

    const id = Object.keys(result.current.components)[0];

    // Mock the behavior of applyNodeChanges for removal
    vi.mocked(applyNodeChanges).mockReturnValueOnce([]);

    act(() => {
      result.current.onNodesChange([{ id, type: 'remove' } as any]);
    });

    expect(result.current.nodes.length).toBe(0);
    // This is expected to FAIL if the bug exists
    expect(result.current.components[id]).toBeUndefined();
  });

  it('should prevent self-connection', () => {
    const { result } = renderHook(() => useCircuit(), { wrapper });

    act(() => {
      result.current.addComponent('Resistor', { x: 0, y: 0 });
    });

    const id = Object.keys(result.current.components)[0];

    act(() => {
      result.current.onConnect({
        source: id,
        target: id,
        sourceHandle: 'left',
        targetHandle: 'right'
      });
    });

    // It should probably NOT add the edge
    expect(result.current.edges.length).toBe(0);
  });

  it('should prevent redundant connections between same handles', () => {
    const { result } = renderHook(() => useCircuit(), { wrapper });

    act(() => {
      result.current.addComponent('Resistor', { x: 0, y: 0 });
      result.current.addComponent('Capacitor', { x: 100, y: 100 });
    });

    const ids = Object.keys(result.current.components);

    act(() => {
      result.current.onConnect({
        source: ids[0],
        target: ids[1],
        sourceHandle: 'right',
        targetHandle: 'left'
      });
    });

    expect(result.current.edges.length).toBe(1);

    act(() => {
      result.current.onConnect({
        source: ids[0],
        target: ids[1],
        sourceHandle: 'right',
        targetHandle: 'left'
      });
    });

    expect(result.current.edges.length).toBe(1); // Still 1
  });
});
