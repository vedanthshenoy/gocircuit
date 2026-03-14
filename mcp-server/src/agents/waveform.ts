import { LlmAgent } from '@google/adk';
import { GoogleGenAiModel } from '@google/adk'; // Assuming this is exported from root or subpath
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { run_simulation, ROOT_DIR } from '../tools/index.js';

// Define tools manually if 'tool' helper is not available, or assume a structure
// Based on search, ADK uses standard function calling or tools array.
// I will create a helper for defining tools if needed, but for now I'll use a compatible structure.

const readProjectFileTool = {
  name: 'read_project_file',
  description: 'Read the content of a file in the project root (e.g., waveform_scratchpad.txt, circuit.md).',
  parameters: {
    type: 'OBJECT',
    properties: {
      filename: { type: 'STRING', description: 'The name of the file to read.' },
    },
    required: ['filename'],
  },
  function: async ({ filename }: { filename: string }) => {
    const filePath = path.join(ROOT_DIR, filename);
    try {
      if (!fs.existsSync(filePath)) return `File not found: ${filename}`;
      return fs.readFileSync(filePath, 'utf-8');
    } catch (e: any) {
      return `Error reading file: ${e.message}`;
    }
  },
};

const runSimulationTool = {
  name: 'run_simulation',
  description: 'Run the circuit simulation and get data points.',
  parameters: {
    type: 'OBJECT',
    properties: {},
  },
  function: async () => {
    return run_simulation();
  },
};

const INSTRUCTIONS = `
# Waveform Generator Agent

## Purpose
You are the Waveform Generator Subagent. Your goal is to manage the simulation of the designed circuit and the generation/visualization of input and output waveforms.

## Workflow
1.  **State Synchronization**:
    *   **Always read 'waveform_scratchpad.txt' first** using 'read_project_file' to identify the latest changes and current circuit state.
    *   Verify consistency with 'circuit.md' (read it if needed).
    *   Extract components, their values, connections, and input waveform parameters.
2.  **Mathematical Modeling**:
    *   Derive the circuit's transfer function H(s) or differential equations.
    *   Identify the circuit type (e.g., RC Low-pass).
    *   Calculate key parameters (cutoff frequency, time constant, etc.).
3.  **Simulation & Computation**:
    *   Use 'run_simulation()' to get empirical data points.
    *   If needed, perform theoretical calculations.
4.  **Output Generation**:
    *   Generate a structured representation of the output waveform.
    *   Provide the mathematical equation for the output.
    *   Format data for visualization.

## Essential Math
- Ohm's Law: V = I * R
- Capacitor Impedance: Zc = 1/(j*w*C)
- Inductor Impedance: Zl = j*w*L
- Voltage Divider: Vout = Vin * Z2 / (Z1 + Z2)
`;

export const waveformAgent = new LlmAgent({
  name: 'waveform_agent',
  description: 'Expert in electronic circuit simulation and waveform analysis.',
  model: new GoogleGenAiModel({
    modelName: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  }),
  instructions: INSTRUCTIONS,
  tools: [readProjectFileTool, runSimulationTool],
});
