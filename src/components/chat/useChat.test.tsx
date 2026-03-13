import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CircuitProvider, useCircuit } from '../../store/circuit-store';
import { useChat } from './useChat';

// Mock the Gemini SDK
const mockSendMessage = vi.fn();
const mockStartChat = vi.fn().mockImplementation(() => ({
  sendMessage: mockSendMessage,
}));

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(function() {
      return {
        getGenerativeModel: vi.fn().mockImplementation(() => ({
          startChat: mockStartChat,
        })),
      };
    }),
  };
});

describe('useChat hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CircuitProvider>{children}</CircuitProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (import.meta as any).env = { VITE_GEMINI_API_KEY: 'test-key' };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should change output waveform when circuit is modified via chat', async () => {
    const useTestHook = () => {
      const chat = useChat();
      const circuit = useCircuit();
      return { chat, circuit };
    };

    const { result } = renderHook(() => useTestHook(), { wrapper });

    // --- PHASE 1: Build RC Filter ---
    // R = 1k, C = 1uF, 1000Hz Input
    const mockDesign1 = {
      components: [
        { id: "v1", type: "VoltageSource", label: "V1", value: 10, position: { x: 0, y: 0 }, rotation: 0 },
        { id: "r1", type: "Resistor", label: "R1", value: 1000, position: { x: 100, y: 0 }, rotation: 0 },
        { id: "c1", type: "Capacitor", label: "C1", value: 0.000001, position: { x: 200, y: 0 }, rotation: 0 },
        { id: "g1", type: "Ground", label: "G1", value: 0, position: { x: 100, y: 100 }, rotation: 0 }
      ],
      connections: [
        { source: "r1", sourceHandle: "b", target: "c1", targetHandle: "a" } // Connection needed for filter
      ],
      inputWaveform: { type: "Sine", amplitude: 10, frequency: 1000, offset: 0, phase: 0 },
      explanation: "RC low-pass filter."
    };

    // Skip chat details for brevity, go straight to design
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => "What voltage?" } });
    await act(async () => { await result.current.chat.sendMessage("RC Filter"); });
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => "RC Filter. OK?" } });
    await act(async () => { await result.current.chat.sendMessage("Yes"); });
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => JSON.stringify(mockDesign1) } });
    await act(async () => { await result.current.chat.sendMessage("Yes"); });
    await act(async () => { vi.runAllTimers(); });

    // Run simulation
    act(() => { result.current.circuit.runSimulation(); });
    const res1 = result.current.circuit.simulationResult!;
    expect(res1.voltages['Out']).toBeDefined();
    const maxVout1 = Math.max(...res1.voltages['Out']);

    // --- PHASE 2: Modify Resistor (Change cutoff) ---
    // R = 10k => Cutoff is much lower, attenuation higher
    const mockDesign2 = {
      ...mockDesign1,
      components: [
        { ...mockDesign1.components[0] },
        { ...mockDesign1.components[1], value: 10000 },
        { ...mockDesign1.components[2] },
        { ...mockDesign1.components[3] }
      ],
      explanation: "Increased resistance to 10k."
    };

    mockSendMessage.mockResolvedValueOnce({ response: { text: () => "Change R?" } });
    await act(async () => { await result.current.chat.sendMessage("Change R1 to 10k"); });
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => "OK?" } });
    await act(async () => { await result.current.chat.sendMessage("Yes"); });
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => JSON.stringify(mockDesign2) } });
    await act(async () => { await result.current.chat.sendMessage("Yes"); });
    await act(async () => { vi.runAllTimers(); });

    // Run simulation again
    act(() => { result.current.circuit.runSimulation(); });
    const res2 = result.current.circuit.simulationResult!;
    const maxVout2 = Math.max(...res2.voltages['Out']);

    console.log(`Max Vout 1 (1k): ${maxVout1}, Max Vout 2 (10k): ${maxVout2}`);
    expect(maxVout2).toBeLessThan(maxVout1);
  });
});
