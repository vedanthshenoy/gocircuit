export type ComponentType = 'Resistor' | 'Capacitor' | 'Inductor' | 'Diode' | 'VoltageSource' | 'Ground';

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  label: string;
  value: number; // For R, L, C, V
  unit: string;
  rotation: number; // 0, 1, 2, 3 (multipled by 90 degrees)
  position: { x: number; y: number };
}

export interface Wire {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface SimulationResult {
  time: number[];
  voltages: Record<string, number[]>; // Node voltages over time
  currents: Record<string, number[]>; // Component currents over time
}

export interface InputWaveform {
  type: 'Sine' | 'Square' | 'Triangle' | 'DC';
  amplitude: number;
  frequency: number;
  offset: number;
  phase: number;
}
