export type ComponentType = 
  | 'Resistor' | 'Capacitor' | 'Inductor' | 'Diode' | 'VoltageSource' | 'Ground'
  | 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'NOT' | 'Buffer';

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  label: string;
  value: number; // For R, L, C, V, or logic levels
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
  truthTable?: {
    headers: string[];
    rows: (number | string)[][];
  };
}

export interface InputWaveform {
  type: 'Sine' | 'Square' | 'Triangle' | 'DC' | 'Step';
  amplitude: number; // Also used as stepSize for 'Step'
  frequency: number; // Also used as numSteps for 'Step'
  offset: number;
  phase: number;
}
